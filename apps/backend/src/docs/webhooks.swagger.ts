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

/**
 * @swagger
 * /webhooks/{id}/test:
 *   post:
 *     summary: Trigger a test ping for a webhook
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
 *       200:
 *         description: Webhook test execution result
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
 *                   example: "Webhook test executed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     statusCode:
 *                       type: integer
 *                       example: 200
 *                     responseTimeMs:
 *                       type: integer
 *                       example: 142
 *       404:
 *         description: Webhook not found
 */

/**
 * @swagger
 * /webhooks/{id}/deliveries:
 *   get:
 *     summary: List delivery history logs for a webhook
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
 *       200:
 *         description: Webhook delivery history
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
 *                   example: "Webhook deliveries fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       webhookId:
 *                         type: string
 *                       event:
 *                         type: string
 *                       statusCode:
 *                         type: integer
 *                       durationMs:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */

/**
 * @swagger
 * /webhooks/{id}/dlq:
 *   get:
 *     summary: List dead-letter queue (exhausted retries) deliveries for a webhook
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
 *       200:
 *         description: Webhook dead-letter deliveries
 *       404:
 *         description: Webhook not found
 */

/**
 * @swagger
 * /webhooks/{id}/deliveries/{deliveryId}/retry:
 *   post:
 *     summary: Manually retry a webhook delivery
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery retry initiated
 *       404:
 *         description: Delivery not found
 */

/**
 * @swagger
 * /webhooks/{id}/deliveries/{deliveryId}/replay:
 *   post:
 *     summary: Replay a dead-letter delivery from the beginning
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery replay queued
 *       404:
 *         description: Delivery not found
 */

/**
 * @swagger
 * /webhooks/retries/process:
 *   post:
 *     summary: Trigger an immediate retry processing cycle for all pending webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retry processing cycle completed
 */
