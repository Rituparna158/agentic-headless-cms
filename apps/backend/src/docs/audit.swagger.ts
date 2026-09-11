/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: System audit trail and activity logs
 */

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: List audit logs
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (e.g. content.create, content.publish)
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type (e.g. content, schema, media)
 *       - in: query
 *         name: actorUserId
 *         schema:
 *           type: string
 *         description: Filter by actor user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start timestamp (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end timestamp (ISO 8601)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term matching details or metadata
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Audit logs retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */

/**
 * @swagger
 * /audit-logs/{id}:
 *   get:
 *     summary: Get single audit log entry
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "aud_123"
 *     responses:
 *       200:
 *         description: Audit log detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Audit log retrieved successfully"
 *                 data:
 *                   type: object
 *                   example:
 *                     id: "aud_123"
 *                     action: "content.publish"
 *                     resourceType: "content"
 *                     resourceId: "ent_456"
 *                     actorUserId: "usr_789"
 *                     createdAt: "2026-09-10T12:00:00Z"
 *       404:
 *         description: Audit log not found
 */
