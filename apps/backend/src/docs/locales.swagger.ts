/**
 * @swagger
 * tags:
 *   name: Locales
 *   description: Locale management
 */

/**
 * @swagger
 * /locales:
 *   get:
 *     summary: Get all locales
 *     tags: [Locales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of locales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "loc_123"
 *                   code: "en-US"
 *                   name: "English (US)"
 *                   isDefault: true
 */

/**
 * @swagger
 * /locales:
 *   post:
 *     summary: Create a new locale
 *     tags: [Locales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *             example:
 *               code: "fr-FR"
 *               name: "French (France)"
 *               isDefault: false
 *     responses:
 *       201:
 *         description: Locale created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "loc_456"
 *                 code: "fr-FR"
 *                 name: "French (France)"
 *                 isDefault: false
 */

/**
 * @swagger
 * /locales/{id}:
 *   delete:
 *     summary: Delete a locale
 *     tags: [Locales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "loc_456"
 *     responses:
 *       204:
 *         description: Locale deleted
 */
