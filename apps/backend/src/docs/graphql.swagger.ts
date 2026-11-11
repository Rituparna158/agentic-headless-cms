/**
 * @swagger
 * tags:
 *   name: GraphQL
 *   description: Dynamically generated tenant-scoped GraphQL API
 */

/**
 * @swagger
 * /graphql:
 *   post:
 *     summary: Execute a GraphQL query or mutation
 *     tags: [GraphQL]
 *     servers:
 *       - url: /
 *         description: Root
 *     security:
 *       - bearerAuth: []
 *         appIdAuth: []
 *       - apiKeyAuth: []
 *         appIdAuth: []
 *     parameters:
 *       - in: header
 *         name: x-app-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant application ID header
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               operationName:
 *                 type: string
 *               variables:
 *                 type: object
 *             example:
 *               query: "{ __schema { queryType { name } } }"
 *     responses:
 *       200:
 *         description: GraphQL execution result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   nullable: true
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - valid authentication token required
 */
