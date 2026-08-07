/**
 * @swagger
 * tags:
 *   name: Access
 *   description: Role-based access control and users
 */

/**
 * @swagger
 * /access/roles:
 *   get:
 *     summary: List all roles
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "role_123"
 *                   name: "Admin"
 *                   permissions: ["create", "read", "update", "delete"]
 */

/**
 * @swagger
 * /access/roles:
 *   post:
 *     summary: Create a role
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               name: "Editor"
 *               permissions: ["read", "create", "update"]
 *     responses:
 *       201:
 *         description: Role created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "role_456"
 *                 name: "Editor"
 *                 permissions: ["read", "create", "update"]
 */

/**
 * @swagger
 * /access/roles/{id}:
 *   get:
 *     summary: Get a role
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "role_123"
 *     responses:
 *       200:
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "role_123"
 *                 name: "Admin"
 *                 permissions: ["create", "read", "update", "delete"]
 */

/**
 * @swagger
 * /access/roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "role_456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               name: "Super Editor"
 *               permissions: ["read", "create", "update", "publish"]
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "role_456"
 *                 name: "Super Editor"
 *                 permissions: ["read", "create", "update", "publish"]
 */

/**
 * @swagger
 * /access/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "role_456"
 *     responses:
 *       204:
 *         description: Role deleted
 */

/**
 * @swagger
 * /access/users:
 *   get:
 *     summary: List all users
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "usr_123"
 *                   email: "admin@example.com"
 *                   roles: ["role_123"]
 */

/**
 * @swagger
 * /access/users/invite:
 *   post:
 *     summary: Invite a new user
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               email: "newuser@example.com"
 *               roleIds: ["role_456"]
 *     responses:
 *       200:
 *         description: User invited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 inviteToken: "inv_abc123"
 */

/**
 * @swagger
 * /access/tokens:
 *   get:
 *     summary: List all tokens
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "tok_123"
 *                   name: "CI/CD Token"
 *                   expiresAt: "2027-01-01T00:00:00Z"
 */

/**
 * @swagger
 * /access/tokens:
 *   post:
 *     summary: Create a token
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               expiresIn:
 *                 type: string
 *             example:
 *               name: "CI/CD Token"
 *               expiresIn: "30d"
 *     responses:
 *       201:
 *         description: Token created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "tok_123"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 name: "CI/CD Token"
 */

/**
 * @swagger
 * /access/tokens/{id}:
 *   delete:
 *     summary: Revoke a token
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "tok_123"
 *     responses:
 *       204:
 *         description: Token revoked
 */
