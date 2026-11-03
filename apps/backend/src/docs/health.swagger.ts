/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health checks for the API
 */

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is live
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 status: "ok"
 */

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is ready to accept requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 status: "ok"
 *                 db: "connected"
 *                 redis: "connected"
 */
