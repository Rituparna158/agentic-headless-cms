import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@repo/config';
import { authRepository, AccessRepository } from '@repo/repository';
import type { LoginInput } from '@repo/types';
import { Issuer, Client, generators } from 'openid-client';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = { window: 1 };

const accessRepository = new AccessRepository();
import { UnauthorizedError, ApiError, BadRequestError } from '@repo/utils';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { EVENT_NAMES, AUDIT_ACTIONS } from '@repo/constants';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

export class AuthService {
  private oidcClient: Client | null = null;

  private async getOidcClient(): Promise<Client> {
    if (this.oidcClient) return this.oidcClient;
    if (
      !env.OIDC_ISSUER_URL ||
      !env.OIDC_CLIENT_ID ||
      !env.OIDC_CLIENT_SECRET
    ) {
      throw new ApiError(500, 'OIDC is not configured');
    }
    const issuer = await Issuer.discover(env.OIDC_ISSUER_URL);
    this.oidcClient = new issuer.Client({
      client_id: env.OIDC_CLIENT_ID,
      client_secret: env.OIDC_CLIENT_SECRET,
      redirect_uris: [env.OIDC_REDIRECT_URI!],
      response_types: ['code'],
    });
    return this.oidcClient;
  }

  async getOidcAuthorizationUrl() {
    try {
      const client = await this.getOidcClient();
      const state = generators.state();
      const nonce = generators.nonce();
      const code_verifier = generators.codeVerifier();
      const code_challenge = generators.codeChallenge(code_verifier);

      const url = client.authorizationUrl({
        scope: 'openid email profile',
        state,
        nonce,
        code_challenge,
        code_challenge_method: 'S256',
      });

      return { url, state, nonce, codeVerifier: code_verifier };
    } catch (error) {
      logger.error(
        { err: error },
        'AuthService Error in getOidcAuthorizationUrl:',
      );
      throw new ApiError(500, 'Failed to initialize OIDC login');
    }
  }

  async ssoCallback(
    reqUrl: string,
    state: string,
    nonce: string,
    codeVerifier: string,
  ) {
    try {
      const client = await this.getOidcClient();
      const params = client.callbackParams(reqUrl);
      const tokenSet = await client.callback(env.OIDC_REDIRECT_URI, params, {
        state,
        nonce,
        code_verifier: codeVerifier,
      });

      if (!tokenSet.access_token) {
        throw new UnauthorizedError(
          'OIDC provider did not return an access token',
        );
      }

      const userInfo = await client.userinfo(tokenSet.access_token);
      if (!userInfo.email) {
        throw new UnauthorizedError('OIDC provider did not return an email');
      }

      let user = await authRepository.getUserByEmail(userInfo.email);
      let isNewUser = false;
      if (!user) {
        logger.info(
          { email: userInfo.email },
          'AuthService: Creating new user from SSO',
        );
        const newUser = await accessRepository.createUser({
          email: userInfo.email,
          firstName: userInfo.given_name || '',
          lastName: userInfo.family_name || '',
          status: 'active',
        });
        if (!newUser) throw new ApiError(500, 'Failed to create user from SSO');
        user = newUser;
        isNewUser = true;
      } else if (user.status !== 'active') {
        // Activate user if they log in via SSO and were in invited state
        if (user.status === 'invited') {
          await authRepository.activateUser(
            user.id,
            user.passwordHash || 'sso-user',
          );
          user.status = 'active';
        } else {
          throw new UnauthorizedError('User account is suspended');
        }
      }

      const roles = await authRepository.getUserRoles(user.id);

      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        mfaEnabled: user.mfaEnabled,
      };

      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      const { context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.LOGIN,
        resourceType: 'user',
        resourceId: user.id,
        actorUserId: user.id,
        actorAgentId: undefined,
        beforeState: null,
        afterState: { email: user.email, sso: true, isNewUser },
        context,
      });

      return {
        user: payload,
        token,
      };
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in ssoCallback:');
      if (error instanceof UnauthorizedError) throw error;
      throw new ApiError(500, 'SSO Callback failed');
    }
  }
  async login(input: LoginInput) {
    try {
      logger.info({ email: input.email }, 'AuthService: login start');
      const user = await authRepository.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        logger.warn(
          { email: input.email },
          'AuthService: user not found or has no password',
        );
        throw new UnauthorizedError('Invalid email or password');
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        logger.warn({ email: input.email }, 'AuthService: password mismatch');
        throw new UnauthorizedError('Invalid email or password');
      }

      logger.debug(
        { userId: user.id },
        'AuthService: fetching user roles with MFA info',
      );
      const userRolesWithMfa = await authRepository.getUserRolesWithMfaInfo(
        user.id,
      );
      const roles = userRolesWithMfa.map((r) => r.name);

      // 1. If user has MFA enabled, return challenge state instead of session token
      if (user.mfaEnabled) {
        logger.info(
          { userId: user.id },
          'AuthService: user has MFA enabled, issuing challenge token',
        );
        const mfaToken = jwt.sign(
          { userId: user.id, isMfaChallenge: true },
          env.JWT_SECRET,
          { expiresIn: '5m' },
        );
        return {
          mfaRequired: true,
          mfaToken,
        };
      }

      // 2. If user does NOT have MFA enabled, but has a role requiring MFA, block login
      const requiresMfa = userRolesWithMfa.some((r) => r.mfaRequired);
      if (requiresMfa) {
        logger.warn(
          { userId: user.id },
          'AuthService: user role requires MFA but user is not enrolled',
        );
        throw new UnauthorizedError(
          'Multi-factor authentication is required for your role but has not been set up. Please contact your administrator.',
        );
      }

      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        mfaEnabled: user.mfaEnabled,
      };

      logger.debug({ userId: user.id }, 'AuthService: signing JWT token');
      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      logger.debug(
        { userId: user.id },
        'AuthService: login successful, emitting audit log',
      );
      const { context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.LOGIN,
        resourceType: 'user',
        resourceId: user.id,
        actorUserId: user.id,
        actorAgentId: undefined,
        beforeState: null,
        afterState: { email: user.email },
        context,
      });

      return {
        user: payload,
        token,
      };
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in login:');
      if (error instanceof UnauthorizedError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.LOGIN_FAILED);
    }
  }

  async getUserPermissions(userId: string) {
    try {
      logger.info({ userId }, 'AuthService: getUserPermissions start');
      const result = await authRepository.getUserPermissions(userId);
      logger.debug({ userId }, 'AuthService: getUserPermissions end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in getUserPermissions:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_USER_PROFILE_FAILED);
    }
  }

  async acceptInvite(rawToken: string, newPassword: string) {
    try {
      logger.info('AuthService: acceptInvite start');
      const inviteTokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      logger.debug('AuthService: fetching user by invite token hash');
      const user =
        await authRepository.getUserByInviteTokenHash(inviteTokenHash);

      if (!user) {
        logger.warn('AuthService: user not found by token hash');
        throw new UnauthorizedError('Invalid or expired invitation token');
      }

      if (user.status !== 'invited') {
        logger.warn({ userId: user.id }, 'AuthService: user already active');
        throw new UnauthorizedError('User is already active');
      }

      if (user.inviteExpiresAt && new Date() > user.inviteExpiresAt) {
        logger.warn(
          { userId: user.id },
          'AuthService: invitation token expired',
        );
        throw new UnauthorizedError('Invitation token has expired');
      }

      logger.debug({ userId: user.id }, 'AuthService: hashing new password');
      const passwordHash = await bcrypt.hash(newPassword, 10);

      logger.debug({ userId: user.id }, 'AuthService: activating user');
      await authRepository.activateUser(user.id, passwordHash);

      logger.debug(
        { userId: user.id },
        'AuthService: acceptInvite successful, emitting audit log',
      );
      const { context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'user',
        resourceId: user.id,
        actorUserId: user.id,
        actorAgentId: undefined,
        beforeState: { status: 'invited' },
        afterState: { status: 'active' },
        context,
      });
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in acceptInvite:');
      if (error instanceof UnauthorizedError) throw error;
      throw new ApiError(500, SERVICE_ERRORS.ACTIVATE_ACCOUNT_FAILED);
    }
  }

  async enrollMfa(userId: string) {
    try {
      logger.info({ userId }, 'AuthService: enrollMfa start');
      const user = await authRepository.getUserById(userId);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      const secret = authenticator.generateSecret();
      const keyuri = authenticator.keyuri(user.email, 'Agentic CMS', secret);
      const qrCode = await QRCode.toDataURL(keyuri);

      await authRepository.updateMfaSecret(userId, secret);
      logger.info(
        { userId },
        'AuthService: enrollMfa secret generated successfully',
      );

      return {
        secret,
        qrCode,
      };
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in enrollMfa:');
      if (error instanceof BadRequestError) throw error;
      throw new ApiError(500, 'Failed to enroll in MFA');
    }
  }

  async verifyMfa(userId: string, code: string) {
    try {
      logger.info({ userId }, 'AuthService: verifyMfa start');
      const user = await authRepository.getUserById(userId);
      if (!user || !user.mfaSecret) {
        throw new BadRequestError('MFA enrollment has not been started');
      }

      const isValid = authenticator.verify({
        token: code,
        secret: user.mfaSecret,
      });
      if (!isValid) {
        throw new BadRequestError('Invalid verification code');
      }

      await authRepository.enableMfa(userId);
      logger.info(
        { userId },
        'AuthService: verifyMfa successfully verified and enabled',
      );

      const roles = await authRepository.getUserRoles(userId);
      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        mfaEnabled: true,
      };

      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      return { user: payload, token };
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in verifyMfa:');
      if (error instanceof BadRequestError) throw error;
      throw new ApiError(500, 'Failed to verify MFA');
    }
  }

  async disableMfa(userId: string) {
    try {
      logger.info({ userId }, 'AuthService: disableMfa start');
      const user = await authRepository.getUserById(userId);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      await authRepository.disableMfa(userId);
      logger.info({ userId }, 'AuthService: disableMfa successfully disabled');

      const roles = await authRepository.getUserRoles(userId);
      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        mfaEnabled: false,
      };

      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      return { user: payload, token };
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in disableMfa:');
      if (error instanceof BadRequestError) throw error;
      throw new ApiError(500, 'Failed to disable MFA');
    }
  }

  async verifyMfaChallenge(mfaToken: string, code: string) {
    try {
      logger.info('AuthService: verifyMfaChallenge start');
      let decoded: { userId: string; isMfaChallenge?: boolean };
      try {
        decoded = jwt.verify(mfaToken, env.JWT_SECRET) as {
          userId: string;
          isMfaChallenge?: boolean;
        };
      } catch {
        logger.warn('AuthService: verifyMfaChallenge invalid token');
        throw new UnauthorizedError('Invalid or expired MFA session');
      }

      if (!decoded.isMfaChallenge || !decoded.userId) {
        logger.warn('AuthService: verifyMfaChallenge missing challenge claims');
        throw new UnauthorizedError('Invalid or expired MFA session');
      }

      const user = await authRepository.getUserById(decoded.userId);
      if (!user || !user.mfaSecret || !user.mfaEnabled) {
        logger.warn(
          { userId: decoded.userId },
          'AuthService: verifyMfaChallenge user not found or MFA not enabled',
        );
        throw new UnauthorizedError('Invalid or expired MFA session');
      }

      const isValid = authenticator.verify({
        token: code,
        secret: user.mfaSecret,
      });
      if (!isValid) {
        logger.warn(
          { userId: user.id },
          'AuthService: verifyMfaChallenge incorrect code',
        );
        throw new UnauthorizedError('Invalid or expired MFA session');
      }

      logger.debug({ userId: user.id }, 'AuthService: fetching user roles');
      const roles = await authRepository.getUserRoles(user.id);

      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        mfaEnabled: true,
      };

      logger.debug({ userId: user.id }, 'AuthService: signing session JWT');
      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      // Emit login event since the challenge is now complete
      const { context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.LOGIN,
        resourceType: 'user',
        resourceId: user.id,
        actorUserId: user.id,
        actorAgentId: undefined,
        beforeState: null,
        afterState: { email: user.email, mfaCompleted: true },
        context,
      });

      return {
        user: payload,
        token,
      };
    } catch (error) {
      logger.error({ err: error }, 'AuthService Error in verifyMfaChallenge:');
      if (error instanceof UnauthorizedError) throw error;
      throw new ApiError(500, 'Failed to complete MFA challenge');
    }
  }
}

export const authService = new AuthService();
