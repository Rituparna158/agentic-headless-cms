import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EMAIL_TEMPLATES,
  ERROR_MESSAGES,
  EVENT_NAMES,
  AUDIT_ACTIONS,
} from '@repo/constants';
import nodemailer from 'nodemailer';

import { env } from '@repo/config';
import {
  CreateRoleInput,
  CreateTokenInput,
  UpdateRoleInput,
} from '@repo/types';
import { AccessRepository, authRepository } from '@repo/repository';
import { BadRequestError, InternalServerError, ApiError } from '@repo/utils';
import { logger } from '@repo/logger';
import { eventBus } from '@repo/events';
import { getAuditContext } from '../../utils/audit.js';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AccessService {
  constructor(
    private readonly repository: AccessRepository = new AccessRepository(),
  ) {}

  async listRoles() {
    try {
      logger.info('AccessService: listRoles start');
      const result = await this.repository.listRoles();
      logger.debug('AccessService: listRoles end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in listRoles:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_ROLES_FAILED);
    }
  }

  async getRole(id: string) {
    try {
      logger.info({ id }, 'AccessService: getRole start');
      const result = await this.repository.getRoleById(id);
      logger.debug({ id }, 'AccessService: getRole end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in getRole:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_ROLES_FAILED);
    }
  }

  async createRole(data: CreateRoleInput) {
    try {
      const { name, application, description, isSystem, permissions } = data;
      logger.info({ name }, 'AccessService: createRole start');
      const result = await this.repository.createRole(
        { name, application, description, isSystem },
        permissions || [],
      );

      logger.debug(
        { id: result.id },
        'AccessService: createRole success, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'role',
        resourceId: result.id,
        actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: result,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in createRole:');
      throw new ApiError(500, SERVICE_ERRORS.CREATE_ROLE_FAILED);
    }
  }

  async updateRole(id: string, data: UpdateRoleInput) {
    try {
      const { name, description, permissions } = data;
      logger.info({ id }, 'AccessService: updateRole start');

      // Get before state
      const beforeState = await this.repository.getRoleById(id);

      const result = await this.repository.updateRole(
        id,
        { name, description },
        permissions,
      );

      logger.debug(
        { id },
        'AccessService: updateRole success, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.UPDATE,
        resourceType: 'role',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: result,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in updateRole:');
      throw new ApiError(500, SERVICE_ERRORS.UPDATE_ROLE_FAILED);
    }
  }

  async deleteRole(id: string) {
    try {
      logger.info({ id }, 'AccessService: deleteRole start');
      const beforeState = await this.repository.getRoleById(id);

      const result = await this.repository.deleteRole(id);

      logger.debug(
        { id },
        'AccessService: deleteRole success, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'role',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: null,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in deleteRole:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_ROLE_FAILED);
    }
  }

  async listUsers() {
    try {
      logger.info('AccessService: listUsers start');
      const result = await this.repository.listUsers();
      logger.debug('AccessService: listUsers end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in listUsers:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_ROLES_FAILED);
    }
  }

  async deleteUser(id: string) {
    try {
      logger.info({ id }, 'AccessService: deleteUser start');
      const result = await this.repository.deleteUser(id);
      logger.debug(
        { id },
        'AccessService: deleteUser success, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'user',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: { id },
        afterState: null,
        context,
      });
      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in deleteUser:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_ROLE_FAILED);
    }
  }

  async updateUserRole(userId: string, roleId: string) {
    try {
      logger.info({ userId, roleId }, 'AccessService: updateUserRole start');
      await this.repository.updateUserRole(userId, roleId);
      logger.debug({ userId, roleId }, 'AccessService: updateUserRole success');
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in updateUserRole:');
      throw new ApiError(500, SERVICE_ERRORS.UPDATE_ROLE_FAILED);
    }
  }

  async inviteUser(
    email: string,
    firstName?: string,
    lastName?: string,
    roleId?: string,
  ) {
    try {
      logger.info({ email, roleId }, 'AccessService: inviteUser start');
      const existingUser = await this.repository.getUserByEmail(email);
      if (existingUser) {
        logger.warn(
          { email },
          'AccessService: inviteUser failed, user already exists',
        );
        throw new BadRequestError(ERROR_MESSAGES.ACCESS.USER_ALREADY_EXISTS);
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const inviteExpiresAt = new Date();
      inviteExpiresAt.setHours(inviteExpiresAt.getHours() + 48);

      logger.debug({ email }, 'AccessService: creating user invite record');
      const user = await this.repository.createUser({
        email,
        firstName,
        lastName,
        status: 'invited',
        inviteTokenHash,
        inviteExpiresAt,
      });

      if (!user) {
        logger.error(
          { email },
          'AccessService: inviteUser failed to create user in DB',
        );
        throw new InternalServerError(
          ERROR_MESSAGES.ACCESS.FAILED_TO_INVITE_USER,
        );
      }

      if (roleId) {
        logger.debug(
          { userId: user.id, roleId },
          'AccessService: assigning role to user',
        );
        await this.repository.assignUserRole(user.id, roleId);
      }

      const appUrl = env.APP_URL;
      const inviteUrl = `${appUrl}/accept-invite?token=${rawToken}`;

      if (env.SMTP_HOST) {
        logger.debug({ email }, 'AccessService: sending invite email');
        const transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465, // Set secure flag
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });

        const htmlTemplatePath = path.join(
          __dirname,
          'templates',
          'invite-email.liquid',
        );
        const textTemplatePath = path.join(
          __dirname,
          'templates',
          'invite-email.txt',
        );

        let htmlContent = '';
        let textContent = '';

        try {
          htmlContent = await fs.readFile(htmlTemplatePath, 'utf8');
          textContent = await fs.readFile(textTemplatePath, 'utf8');
        } catch (err) {
          logger.warn(
            { err },
            'AccessService: failed to read liquid email templates, using fallback templates',
          );
          htmlContent = EMAIL_TEMPLATES.INVITE.HTML;
          textContent = EMAIL_TEMPLATES.INVITE.TEXT;
        }

        htmlContent = htmlContent
          .replace(/\{\{firstName\}\}/g, firstName || '')
          .replace(/\{\{inviteUrl\}\}/g, inviteUrl);
        textContent = textContent
          .replace(/\{\{firstName\}\}/g, firstName || '')
          .replace(/\{\{inviteUrl\}\}/g, inviteUrl);

        await transporter.sendMail({
          from: env.EMAIL_FROM,
          to: email,
          subject: EMAIL_TEMPLATES.INVITE.SUBJECT,
          text: textContent,
          html: htmlContent,
        });
        logger.debug({ email }, 'AccessService: invite email sent');
      } else {
        console.log(
          `\n=========================================\n[Dev Mode] Invitation Link for ${email}:\n${inviteUrl}\n=========================================\n`,
        );
      }

      logger.debug(
        { userId: user.id },
        'AccessService: inviteUser complete, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'user',
        resourceId: user.id,
        actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: {
          id: user.id,
          email: user.email,
          status: user.status,
        },
        context,
      });

      return { inviteUrl, user };
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in inviteUser:');
      if (
        error instanceof BadRequestError ||
        error instanceof InternalServerError
      )
        throw error;
      throw new ApiError(500, SERVICE_ERRORS.FETCH_ROLES_FAILED);
    }
  }

  async listTokens() {
    try {
      logger.info('AccessService: listTokens start');
      const result = await this.repository.listTokens();
      logger.debug('AccessService: listTokens end');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in listTokens:');
      throw new ApiError(500, SERVICE_ERRORS.FETCH_ROLES_FAILED);
    }
  }

  async createToken(data: CreateTokenInput, userId: string) {
    try {
      logger.info(
        { name: data.name, userId },
        'AccessService: createToken start',
      );
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const token = await this.repository.createToken({
        name: data.name,
        type: data.type || 'user',
        tokenHash,
        roleId: data.roleId,
        createdBy: userId,
        scopes: data.scopes || [],
      });

      logger.debug(
        { tokenId: token!.id },
        'AccessService: createToken complete, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.CREATE,
        resourceType: 'token',
        resourceId: token!.id,
        actorUserId,
        actorAgentId,
        beforeState: null,
        afterState: {
          id: token!.id,
          name: token!.name,
          type: token!.type,
        },
        context,
      });

      return { ...token, rawToken };
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in createToken:');
      throw new ApiError(500, SERVICE_ERRORS.CREATE_ROLE_FAILED);
    }
  }

  async revokeToken(id: string) {
    try {
      logger.info({ id }, 'AccessService: revokeToken start');
      const beforeState = await this.repository.getTokenById(id);

      const result = await this.repository.revokeToken(id);

      logger.debug(
        { id },
        'AccessService: revokeToken complete, emitting audit log',
      );
      const { actorUserId, actorAgentId, context } = getAuditContext();
      eventBus.emit(EVENT_NAMES.AUDIT_LOG, {
        action: AUDIT_ACTIONS.DELETE,
        resourceType: 'token',
        resourceId: id,
        actorUserId,
        actorAgentId,
        beforeState: beforeState,
        afterState: null,
        context,
      });

      return result;
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in revokeToken:');
      throw new ApiError(500, SERVICE_ERRORS.DELETE_ROLE_FAILED);
    }
  }

  async listMfaRequests(status?: string) {
    try {
      logger.info('AccessService: listMfaRequests start');
      const requests = await authRepository.getAllMfaResetRequests(status);

      // We explicitly map the data structure to match the frontend expectations.
      return requests.map((req) => ({
        id: req.id,
        userId: req.userId,
        status: req.status,
        createdAt: req.createdAt,
        user: req.user
          ? {
              email: req.user.email,
              firstName: req.user.firstName,
              lastName: req.user.lastName,
            }
          : undefined,
        admin: req.admin
          ? {
              email: req.admin.email,
              firstName: req.admin.firstName,
              lastName: req.admin.lastName,
            }
          : undefined,
      }));
    } catch (error) {
      logger.error({ err: error }, 'AccessService Error in listMfaRequests:');
      throw new ApiError(500, 'Failed to fetch MFA requests');
    }
  }

  async approveMfaResetRequest(requestId: string, adminId: string) {
    try {
      logger.info(
        { requestId, adminId },
        'AccessService: approveMfaResetRequest start',
      );
      const request = await authRepository.getMfaResetRequestById(requestId);

      if (!request || request.status !== 'pending') {
        throw new BadRequestError('Request not found or not in pending state');
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await authRepository.updateMfaResetRequest(requestId, {
        status: 'approved',
        adminId,
        tokenHash,
        expiresAt,
      });

      const user = await authRepository.getUserById(request.userId);

      if (user && env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });

        const appUrl = env.APP_URL;
        const resetUrl = `${appUrl}/mfa-reset-complete?token=${rawToken}`;

        const htmlTemplatePath = path.join(
          __dirname,
          'templates',
          'mfa-reset-user-approved.liquid',
        );
        let htmlContent = '';
        try {
          htmlContent = await fs.readFile(htmlTemplatePath, 'utf8');
          htmlContent = htmlContent.replace(/\{\{resetUrl\}\}/g, resetUrl);
        } catch {
          htmlContent = `<p>Your MFA reset request has been approved. Please click the link below to complete the process.</p><a href="${resetUrl}">Complete Reset</a>`;
        }

        await transporter.sendMail({
          from: env.EMAIL_FROM,
          to: user.email,
          subject: 'MFA Reset Request Approved',
          html: htmlContent,
        });
      }

      return { success: true };
    } catch (error) {
      logger.error(
        { err: error },
        'AccessService Error in approveMfaResetRequest:',
      );
      if (error instanceof BadRequestError) throw error;
      throw new ApiError(500, 'Failed to approve MFA reset request');
    }
  }

  async rejectMfaResetRequest(requestId: string, adminId: string) {
    try {
      logger.info(
        { requestId, adminId },
        'AccessService: rejectMfaResetRequest start',
      );
      const request = await authRepository.getMfaResetRequestById(requestId);

      if (!request || request.status !== 'pending') {
        throw new BadRequestError('Request not found or not in pending state');
      }

      await authRepository.updateMfaResetRequest(requestId, {
        status: 'rejected',
        adminId,
      });

      const user = await authRepository.getUserById(request.userId);

      if (user && env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });

        const htmlTemplatePath = path.join(
          __dirname,
          'templates',
          'mfa-reset-user-rejected.liquid',
        );
        let htmlContent = '';
        try {
          htmlContent = await fs.readFile(htmlTemplatePath, 'utf8');
        } catch {
          htmlContent = `<p>Your MFA reset request has been rejected by an administrator.</p>`;
        }

        await transporter.sendMail({
          from: env.EMAIL_FROM,
          to: user.email,
          subject: 'MFA Reset Request Rejected',
          html: htmlContent,
        });
      }

      return { success: true };
    } catch (error) {
      logger.error(
        { err: error },
        'AccessService Error in rejectMfaResetRequest:',
      );
      if (error instanceof BadRequestError) throw error;
      throw new ApiError(500, 'Failed to reject MFA reset request');
    }
  }
}
