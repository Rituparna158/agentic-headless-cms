/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media asset management
 */

/**
 * @swagger
 * /media:
 *   post:
 *     summary: Upload a new media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "med_123"
 *                 url: "/api/v1/media/file/hero-image.png"
 *                 key: "hero-image.png"
 *                 mimeType: "image/png"
 *                 size: 102400
 */

/**
 * @swagger
 * /media:
 *   get:
 *     summary: List all media assets
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of media files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "med_123"
 *                   url: "/api/v1/media/file/hero-image.png"
 *                   key: "hero-image.png"
 *                   mimeType: "image/png"
 *                   size: 102400
 */

/**
 * @swagger
 * /media/file/{key}:
 *   get:
 *     summary: Serve a media file (Public)
 *     tags: [Media]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "hero-image.png"
 *       - in: query
 *         name: w
 *         schema:
 *           type: integer
 *         description: Optional target width for image resize
 *       - in: query
 *         name: h
 *         schema:
 *           type: integer
 *         description: Optional target height for image resize
 *       - in: query
 *         name: q
 *         schema:
 *           type: integer
 *         description: Optional image quality (1-100)
 *     responses:
 *       200:
 *         description: Media file content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /media/bulk-delete:
 *   post:
 *     summary: Bulk delete media assets
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               ids: ["med_123", "med_456"]
 *     responses:
 *       200:
 *         description: Media assets deleted
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
 *                   example: "2 media asset(s) deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 2
 */

/**
 * @swagger
 * /media/{id}:
 *   get:
 *     summary: Get media metadata
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "med_123"
 *     responses:
 *       200:
 *         description: Media metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "med_123"
 *                 url: "/api/v1/media/file/hero-image.png"
 *                 key: "hero-image.png"
 *                 mimeType: "image/png"
 *                 size: 102400
 */

/**
 * @swagger
 * /media/{id}:
 *   delete:
 *     summary: Delete a media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "med_123"
 *     responses:
 *       204:
 *         description: Media deleted
 */
