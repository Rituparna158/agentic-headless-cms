import { cac } from 'cac';
import {
  applications,
  users,
  roles,
  userRoles,
  permissions,
  userApplications,
} from '@repo/shared-db';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { logger } from '@repo/logger';
import { input, password } from '@inquirer/prompts';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
async function startMfaVerificationServer(
  email: string,
  secret: string,
): Promise<void> {
  const express = (await import('express')).default;
  const open = (await import('open')).default;
  const { authenticator: otp } = await import('otplib');
  return new Promise((resolve) => {
    void (async () => {
      const app = express();
      app.use(express.urlencoded({ extended: true }));
      const url = otp.keyuri(email, 'Agentic Headless CMS', secret);
      const qrDataUrl = await QRCode.toDataURL(url);
      app.get('/', (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>MFA Setup</title>
            <style>
              body { font-family: sans-serif; text-align: center; margin-top: 50px; background: #f5f5f5; }
              .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; }
              img { margin: 1rem 0; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
              input { padding: 10px; font-size: 16px; width: 150px; text-align: center; margin-bottom: 1rem; }
              button { padding: 10px 20px; font-size: 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
              button:hover { background: #0052a3; }
              .error { color: red; margin-bottom: 1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Scan this QR Code</h2>
              <p>Open your Authenticator app and scan the code below:</p>
              <img src="${qrDataUrl}" alt="QR Code" />
              <p style="color: #666; font-size: 14px;">Manual entry key: <br><b>${secret}</b></p>
              
              <form method="POST">
                <h3>Enter 6-digit code to verify</h3>
                ${req.query.error ? '<p class="error">Invalid code, please try again.</p>' : ''}
                <input type="text" name="code" placeholder="123456" required autocomplete="off" />
                <br>
                <button type="submit">Verify & Complete Setup</button>
              </form>
            </div>
          </body>
          </html>
        `);
      });
      const server = app.listen(9091, () => {
        logger.info('Opening MFA verification in your web browser...');
        open('http://localhost:9091').catch((err: unknown) => {
          logger.error({ err }, 'Failed to open browser automatically');
        });
      });
      app.post('/', (req, res) => {
        const code = (req.body as { code: string }).code;
        const isValid = otp.verify({ token: code, secret });
        if (isValid) {
          res.send(`
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
              <h2 style="color: green;">Setup Verified!</h2>
              <p>You can close this window and return to your terminal.</p>
              <script>setTimeout(() => window.close(), 3000);</script>
            </body>
            </html>
          `);
          setTimeout(() => {
            if (server) server.close();
            resolve();
          }, 500);
        } else {
          res.redirect('/?error=1');
        }
      });
    })();
  });
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const cli = cac('agentic-cms-cli');

cli
  .command('setup', 'Interactive wizard to set up the CMS')
  .option('--auto', 'Run in non-interactive mode')
  .option('--app-name <name>', 'Application name for non-interactive mode')
  .option('--email <email>', 'Admin email for non-interactive mode')
  .option('--password <password>', 'Admin password for non-interactive mode')
  .action(
    async (options: {
      auto?: boolean;
      appName?: string;
      email?: string;
      password?: string;
    }) => {
      try {
        let setups: { appName: string; email: string; password: string }[] = [];

        if (!options.auto) {
          const appName = await input({
            message: 'What application do you want to build?',
            default: 'HEADLESS_CMS',
          });
          const adminEmail = await input({ message: 'Enter the admin email:' });
          const adminPassword = await password({
            message: 'Enter the admin password:',
          });
          setups = [{ appName, email: adminEmail, password: adminPassword }];
        } else {
          if (options.appName || options.email || options.password) {
            setups = [
              {
                appName: options.appName || 'HEADLESS_CMS',
                email: options.email || 'admin@agentic-cms.com',
                password: options.password || 'admin',
              },
            ];
          } else {
            setups = [
              {
                appName: 'CMS_UI',
                email: 'cmsui-admin@agentic-cms.com',
                password: 'admin',
              },
              {
                appName: 'HEADLESS_CMS',
                email: 'headless-admin@agentic-cms.com',
                password: 'admin',
              },
            ];
          }
        }

        logger.info('--- Setup Starting ---');
        for (const setup of setups) {
          const { appName, email: adminEmail, password: adminPassword } = setup;
          logger.info(`\n========================================`);
          logger.info(`Setting up application: ${appName}`);
          logger.info(`Admin Email: ${adminEmail}`);
          logger.info(`========================================`);

          // 1. Create admin user
          let userId: string;
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, adminEmail))
            .limit(1);

          if (existingUser.length > 0) {
            userId = existingUser[0]!.id;
            logger.info(
              `User with email ${adminEmail} already exists. Linking to Admin roles...`,
            );
            if (!existingUser[0]!.mfaEnabled && !options.auto) {
              const secret = authenticator.generateSecret();
              await db
                .update(users)
                .set({ mfaEnabled: true, mfaSecret: secret })
                .where(eq(users.id, userId));
              await startMfaVerificationServer(adminEmail, secret);
            }
          } else {
            const passwordHash = await bcrypt.hash(adminPassword, 10);
            const secret = authenticator.generateSecret();
            const newUser = await db
              .insert(users)
              .values({
                email: adminEmail,
                firstName: 'Admin',
                lastName: 'User',
                passwordHash,
                status: 'active',
                mfaEnabled: !options.auto,
                mfaSecret: secret,
              })
              .returning({ id: users.id });
            userId = newUser[0]!.id;
            logger.info(`Created new Admin user: ${adminEmail}`);
            if (!options.auto) {
              await startMfaVerificationServer(adminEmail, secret);
            }
          }

          // 2. Create Application
          let appId: string;
          const existingApp = await db
            .select()
            .from(applications)
            .where(eq(applications.name, appName))
            .limit(1);

          const apiKey = crypto.randomBytes(32).toString('hex');
          const apiKeyHash = await bcrypt.hash(apiKey, 10);

          if (existingApp.length > 0) {
            appId = existingApp[0]!.id;
            logger.info(
              `Application ${appName} already exists. Updating API key...`,
            );
            await db
              .update(applications)
              .set({ apiKeyHash })
              .where(eq(applications.id, appId));
          } else {
            const newApp = await db
              .insert(applications)
              .values({ name: appName, apiKeyHash })
              .returning({ id: applications.id });
            appId = newApp[0]!.id;
            logger.info(`Created application: ${appName}`);
          }

          // 3. Create admin role
          let roleId: string;
          const existingRole = await db
            .select()
            .from(roles)
            .where(and(eq(roles.name, 'admin'), eq(roles.applicationId, appId)))
            .limit(1);

          if (existingRole.length > 0) {
            roleId = existingRole[0]!.id;
            logger.info('Admin role already exists.');
          } else {
            const newRole = await db
              .insert(roles)
              .values({
                name: 'admin',
                applicationId: appId,
                description: 'Super administrator with full access',
              })
              .returning({ id: roles.id });
            roleId = newRole[0]!.id;
            await db.insert(permissions).values({
              roleId,
              applicationId: appId,
              action: '*',
              effect: 'allow',
            });
            logger.info('Created admin role with wildcard (*) permissions.');
          }

          // 4. Link user to application
          let userAppId: string;
          const existingUserApp = await db
            .select()
            .from(userApplications)
            .where(
              and(
                eq(userApplications.userId, userId),
                eq(userApplications.applicationId, appId),
              ),
            )
            .limit(1);

          if (existingUserApp.length > 0) {
            userAppId = existingUserApp[0]!.id;
          } else {
            const newUserApp = await db
              .insert(userApplications)
              .values({
                userId,
                applicationId: appId,
                status: 'active',
              })
              .returning({ id: userApplications.id });
            userAppId = newUserApp[0]!.id;
          }

          // 5. Link user application to role
          const existingUserRole = await db
            .select()
            .from(userRoles)
            .where(eq(userRoles.userApplicationId, userAppId))
            .limit(1);

          if (existingUserRole.length === 0) {
            await db.insert(userRoles).values({
              userApplicationId: userAppId,
              roleId,
            });
          }

          logger.info(`API Key for ${appName}: ${apiKey}`);
          if (appName === 'CMS_UI') {
            logger.info(`VITE_APP_ID=CMS_UI (For your CMS UI .env)`);
          }
        }

        logger.info(
          `\nWARNING: Store these API Keys safely. They will not be shown again.`,
        );
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Failed during setup wizard');
        process.exit(1);
      }
    },
  );
cli
  .command(
    'create-app <name>',
    'Create a new application and generate an API key',
  )
  .action(async (name: string) => {
    try {
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiKeyHash = await bcrypt.hash(apiKey, 10);
      const [newApp] = await db
        .insert(applications)
        .values({ name, apiKeyHash })
        .returning();
      logger.info(`Successfully created application: ${newApp?.name}`);
      logger.info(`App ID: ${newApp?.id}`);
      logger.info(`API Key: ${apiKey}`);
      logger.info(
        `WARNING: Store this API Key safely. It will not be shown again.`,
      );
      logger.info(
        `\nTo use this app, add the following to your client .env file:`,
      );
      logger.info(`VITE_API_KEY=${apiKey}\n`);
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Failed to create application');
      process.exit(1);
    }
  });
cli
  .command(
    'roll-key <appId>',
    'Rolls (regenerates) the API key for an application',
  )
  .action(async (appId: string) => {
    try {
      const existing = await db
        .select()
        .from(applications)
        .where(eq(applications.id, appId))
        .limit(1);
      if (existing.length === 0) {
        logger.error(`Application with ID ${appId} not found.`);
        process.exit(1);
      }
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiKeyHash = await bcrypt.hash(apiKey, 10);
      await db
        .update(applications)
        .set({ apiKeyHash, updatedAt: new Date() })
        .where(eq(applications.id, appId));
      logger.info(
        `Successfully rolled API key for application: ${existing[0]?.name}`,
      );
      logger.info(`New API Key: ${apiKey}`);
      logger.info(
        `WARNING: Store this new API Key safely. It will not be shown again.`,
      );
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Failed to roll API key');
      process.exit(1);
    }
  });
cli
  .command('delete-app <appId>', 'Deletes an application')
  .action(async (appId: string) => {
    try {
      const existing = await db
        .select()
        .from(applications)
        .where(eq(applications.id, appId))
        .limit(1);
      if (existing.length === 0) {
        logger.error(`Application with ID ${appId} not found.`);
        process.exit(1);
      }
      await db.delete(applications).where(eq(applications.id, appId));
      logger.info(`Successfully deleted application: ${existing[0]?.name}`);
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Failed to delete application');
      process.exit(1);
    }
  });
cli
  .command('reset-mfa <email>', 'Resets (disables) MFA for a given user email')
  .action(async (email: string) => {
    try {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing.length === 0) {
        logger.error(`User with email ${email} not found.`);
        process.exit(1);
      }
      await db
        .update(users)
        .set({ mfaEnabled: false, mfaSecret: null, updatedAt: new Date() })
        .where(eq(users.id, existing[0]!.id));
      logger.info(`Successfully reset MFA for user: ${email}`);
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Failed to reset MFA');
      process.exit(1);
    }
  });
cli
  .command(
    'serve-ui',
    'Starts a local web UI to manage applications and API keys',
  )
  .option('-p, --port <port>', 'Port to run on', { default: '9090' })
  .action(async (options: { port: string }) => {
    try {
      const express = (await import('express')).default;
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const { authenticator } = await import('otplib');
      const dirname = path.dirname(fileURLToPath(import.meta.url));
      const app = express();
      app.use(express.json());
      async function validateAdminMfa(email: string, code: string) {
        if (!email || !code) return false;
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (existingUser.length === 0) return false;
        const user = existingUser[0]!;
        if (!user.mfaEnabled || !user.mfaSecret) return false;
        const apps = await db
          .select()
          .from(applications)
          .where(eq(applications.name, 'HEADLESS_CMS'))
          .limit(1);
        if (apps.length === 0) return false;
        const adminRole = await db
          .select()
          .from(roles)
          .where(
            and(eq(roles.name, 'admin'), eq(roles.applicationId, apps[0]!.id)),
          )
          .limit(1);
        if (adminRole.length === 0) return false;
        const userApp = await db
          .select()
          .from(userApplications)
          .where(
            and(
              eq(userApplications.userId, user.id),
              eq(userApplications.applicationId, apps[0]!.id),
            ),
          )
          .limit(1);
        if (userApp.length === 0) return false;
        const hasRole = await db
          .select()
          .from(userRoles)
          .where(
            and(
              eq(userRoles.userApplicationId, userApp[0]!.id),
              eq(userRoles.roleId, adminRole[0]!.id),
            ),
          )
          .limit(1);
        if (hasRole.length === 0) return false;
        return authenticator.verify({ token: code, secret: user.mfaSecret });
      }
      app.get('/', (req, res) => {
        res.sendFile(path.join(dirname, 'cli-ui.html'));
      });
      app.get('/api/apps', async (req, res) => {
        const appsData = await db
          .select({ id: applications.id, name: applications.name })
          .from(applications);
        res.json(appsData);
      });
      app.post('/api/apps', async (req, res) => {
        const { name, adminEmail, mfaCode } = req.body as {
          name: string;
          adminEmail: string;
          mfaCode: string;
        };
        const isValid = await validateAdminMfa(adminEmail, mfaCode);
        if (!isValid) {
          res
            .status(403)
            .json({ error: 'Invalid admin credentials or MFA code' });
          return;
        }
        const apiKey = crypto.randomBytes(32).toString('hex');
        const apiKeyHash = await bcrypt.hash(apiKey, 10);
        const [newApp] = await db
          .insert(applications)
          .values({ name, apiKeyHash })
          .returning();
        res.json({ app: newApp, apiKey });
      });
      app.post('/api/apps/:id/roll', async (req, res) => {
        const { id } = req.params;
        const { adminEmail, mfaCode } = req.body as {
          adminEmail: string;
          mfaCode: string;
        };
        const isValid = await validateAdminMfa(adminEmail, mfaCode);
        if (!isValid) {
          res
            .status(403)
            .json({ error: 'Invalid admin credentials or MFA code' });
          return;
        }
        const apiKey = crypto.randomBytes(32).toString('hex');
        const apiKeyHash = await bcrypt.hash(apiKey, 10);
        await db
          .update(applications)
          .set({ apiKeyHash, updatedAt: new Date() })
          .where(eq(applications.id, id));
        res.json({ apiKey });
      });
      app.delete('/api/apps/:id', async (req, res) => {
        const { id } = req.params;
        const { adminEmail, mfaCode } = req.body as {
          adminEmail: string;
          mfaCode: string;
        };
        const isValid = await validateAdminMfa(adminEmail, mfaCode);
        if (!isValid) {
          res
            .status(403)
            .json({ error: 'Invalid admin credentials or MFA code' });
          return;
        }
        await db.delete(applications).where(eq(applications.id, id));
        res.json({ success: true });
      });
      app.listen(options.port, () => {
        logger.info(
          `CLI Management UI running at http://localhost:${options.port}`,
        );
        logger.info('Press Ctrl+C to stop.');
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to start UI');
      process.exit(1);
    }
  });
cli.help();
cli.version('1.0.0');
cli.parse();
