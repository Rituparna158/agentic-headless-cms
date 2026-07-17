import { AccessRepository } from './access.repository.js';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CreateRoleInput,
  UpdateRoleInput,
  CreateTokenInput,
} from '../../types/access.types.js';
import { ERROR_MESSAGES, EMAIL_TEMPLATES } from '@repo/shared-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AccessService {
  constructor(
    private readonly repository: AccessRepository = new AccessRepository(),
  ) {}

  async listRoles() {
    return this.repository.listRoles();
  }

  async getRole(id: string) {
    return this.repository.getRoleById(id);
  }

  async createRole(data: CreateRoleInput) {
    const { name, description, isSystem, permissions } = data;
    return this.repository.createRole(
      { name, description, isSystem },
      permissions || [],
    );
  }

  async updateRole(id: string, data: UpdateRoleInput) {
    const { name, description, permissions } = data;
    return this.repository.updateRole(id, { name, description }, permissions);
  }

  async deleteRole(id: string) {
    return this.repository.deleteRole(id);
  }

  async listUsers() {
    return this.repository.listUsers();
  }

  async inviteUser(
    email: string,
    firstName?: string,
    lastName?: string,
    roleId?: string,
  ) {
    // 1. Check if user already exists
    const existingUser = await this.repository.getUserByEmail(email);
    if (existingUser) {
      throw new Error(ERROR_MESSAGES.ACCESS.USER_ALREADY_EXISTS);
    }

    // 2. Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // 3. Set expiry to 48 hours from now
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setHours(inviteExpiresAt.getHours() + 48);

    // 4. Create user
    const user = await this.repository.createUser({
      email,
      firstName,
      lastName,
      status: 'invited',
      inviteTokenHash,
      inviteExpiresAt,
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.ACCESS.FAILED_TO_INVITE_USER);
    }

    // 5. Assign role
    if (roleId) {
      await this.repository.assignUserRole(user.id, roleId);
    }

    // 6. Generate invite URL
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const inviteUrl = `${appUrl}/accept-invite?token=${rawToken}`;

    // 7. Send Email
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Read templates
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
        console.error(
          'Failed to read email templates, falling back to default',
          err,
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
        from:
          process.env.EMAIL_FROM || '"Agentic CMS" <noreply@agentic-cms.com>',
        to: email,
        subject: EMAIL_TEMPLATES.INVITE.SUBJECT,
        text: textContent,
        html: htmlContent,
      });
    } else {
      console.log(
        `\n=========================================\n[Dev Mode] Invitation Link for ${email}:\n${inviteUrl}\n=========================================\n`,
      );
    }

    return { inviteUrl, user };
  }

  async listTokens() {
    return this.repository.listTokens();
  }

  async createToken(data: CreateTokenInput, userId: string) {
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

    return { ...token, rawToken };
  }

  async revokeToken(id: string) {
    return this.repository.revokeToken(id);
  }
}
