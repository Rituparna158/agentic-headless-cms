import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { authRepository } from './auth.repository.js';
import type { LoginInput } from '@repo/shared-types';
import { UnauthorizedError } from '../../common/errors/http-error.js';

export class AuthService {
  async login(input: LoginInput) {
    const user = await authRepository.getUserByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const roles = await authRepository.getUserRoles(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
      user: payload,
      token,
    };
  }

  async getUserPermissions(userId: string) {
    return authRepository.getUserPermissions(userId);
  }
}

export const authService = new AuthService();
