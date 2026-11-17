/**
 * @swagger
 * tags:
 *   name: Observability
 *   description: Prometheus metrics and Core Web Vitals telemetry endpoints
 */

/**
 * @swagger
 * /telemetry/vitals:
 *   post:
 *     summary: Record Core Web Vitals telemetry beacon (API v1)
 *     tags: [Observability]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/WebVitalEvent'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/WebVitalEvent'
 *             example:
 *               name: "LCP"
 *               value: 1.42
 *               rating: "good"
 *               pathname: "/content"
 *     responses:
 *       200:
 *         description: Web vitals telemetry recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Export Prometheus metrics
 *     tags: [Observability]
 *     servers:
 *       - url: /
 *         description: Root
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-metrics-token
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional metrics token when METRICS_TOKEN is configured (also accepts Bearer token)
 *     responses:
 *       200:
 *         description: Prometheus plain-text metrics payload
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized - invalid or missing metrics token
 *       403:
 *         description: Forbidden - METRICS_TOKEN is not configured in production
 */

/**
 * @swagger
 * /metrics/vitals:
 *   post:
 *     summary: Record Core Web Vitals telemetry beacon (root metrics endpoint)
 *     tags: [Observability]
 *     servers:
 *       - url: /
 *         description: Root
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/WebVitalEvent'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/WebVitalEvent'
 *     responses:
 *       200:
 *         description: Web vitals telemetry recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WebVitalEvent:
 *       type: object
 *       required:
 *         - name
 *         - value
 *       properties:
 *         name:
 *           type: string
 *           example: "LCP"
 *         value:
 *           type: number
 *           example: 1.42
 *         rating:
 *           type: string
 *           example: "good"
 *         pathname:
 *           type: string
 *           example: "/content"
 *         id:
 *           type: string
 *         navigationType:
 *           type: string
 */
