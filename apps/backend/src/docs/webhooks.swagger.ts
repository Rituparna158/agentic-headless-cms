/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook management
 */

/**
 * @swagger
 * /webhooks:
 *   get:
 *     summary: Get all webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "whk_123"
 *                   name: "Build Trigger"
 *                   url: "https://api.vercel.com/v1/integrations/deploy/..."
 *                   events: ["content.published"]
 */

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Create a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               name: "Production Build"
 *               url: "https://api.example.com/deploy"
 *               events: ["content.published", "content.deleted"]
 *     responses:
 *       201:
 *         description: Webhook created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "whk_456"
 *                 name: "Production Build"
 *                 url: "https://api.example.com/deploy"
 *                 events: ["content.published", "content.deleted"]
 */

/**
 * @swagger
 * /webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "whk_456"
 *     responses:
 *       204:
 *         description: Webhook deleted
 */
