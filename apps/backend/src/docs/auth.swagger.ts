/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               email: "admin@example.com"
 *               password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 user:
 *                   id: "usr_123"
 *                   email: "admin@example.com"
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Logged out successfully"
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "usr_123"
 *                 email: "admin@example.com"
 */

/**
 * @swagger
 * /auth/accept-invite:
 *   post:
 *     summary: Accept a user invitation
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               token: "inv_abc123"
 *               password: "newpassword123"
 *     responses:
 *       200:
 *         description: Invitation accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 user:
 *                   id: "usr_456"
 *                   email: "invited@example.com"
 */

/**
 * @swagger
 * /auth/sso:
 *   get:
 *     summary: Initiate SSO login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to IdP
 */

/**
 * @swagger
 * /auth/sso/callback:
 *   get:
 *     summary: SSO callback URL
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: SSO login successful
 */

/**
 * @swagger
 * /auth/mfa/enroll:
 *   post:
 *     summary: Enroll in MFA
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA enrollment started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 secret: "JBSWY3DPEHPK3PXP"
 *                 qrCode: "data:image/png;base64,..."
 */

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Verify MFA setup
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *             example:
 *               token: "123456"
 *     responses:
 *       200:
 *         description: MFA verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 */

/**
 * @swagger
 * /auth/mfa/challenge:
 *   post:
 *     summary: Respond to MFA challenge during login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               token:
 *                 type: string
 *             example:
 *               userId: "usr_123"
 *               token: "123456"
 *     responses:
 *       200:
 *         description: Login completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 user:
 *                   id: "usr_123"
 *                   email: "admin@example.com"
 */

/**
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     summary: Disable MFA
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA disabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 */

/**
 * @swagger
 * /auth/mfa/reset-request:
 *   post:
 *     summary: Request MFA reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: "user@example.com"
 *     responses:
 *       200:
 *         description: Reset request sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "If the email exists, a request has been sent to the admins."
 */

/**
 * @swagger
 * /auth/mfa/reset-complete:
 *   post:
 *     summary: Complete MFA reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *             example:
 *               token: "abcdef123456"
 *     responses:
 *       200:
 *         description: MFA reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "MFA disabled successfully."
 */
