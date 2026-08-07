/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Content management operations
 */

/**
 * @swagger
 * /content/{schemaSlug}:
 *   get:
 *     summary: List content entries
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *     responses:
 *       200:
 *         description: List of entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "ent_123"
 *                   schemaSlug: "blog-post"
 *                   data: { "title": "My first blog post" }
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}:
 *   get:
 *     summary: Get a single content entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ent_123"
 *     responses:
 *       200:
 *         description: Content entry details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "ent_123"
 *                 schemaSlug: "blog-post"
 *                 data: { "title": "My first blog post" }
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/versions:
 *   get:
 *     summary: List entry versions
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ent_123"
 *     responses:
 *       200:
 *         description: List of entry versions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - versionId: "ver_1"
 *                   data: { "title": "Draft 1" }
 *                 - versionId: "ver_2"
 *                   data: { "title": "Draft 2" }
 */

/**
 * @swagger
 * /content/{schemaSlug}:
 *   post:
 *     summary: Create a new draft entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "New draft post"
 *     responses:
 *       201:
 *         description: Draft created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "ent_456"
 *                 status: "draft"
 *                 data: { "title": "New draft post" }
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}:
 *   put:
 *     summary: Update an existing draft
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ent_456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "Updated draft title"
 *     responses:
 *       200:
 *         description: Draft updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "ent_456"
 *                 status: "draft"
 *                 data: { "title": "Updated draft title" }
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/publish:
 *   post:
 *     summary: Publish a draft entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ent_456"
 *     responses:
 *       200:
 *         description: Entry published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "ent_456"
 *                 status: "published"
 *                 data: { "title": "Updated draft title" }
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/revert:
 *   post:
 *     summary: Revert to a previous version
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ent_456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               versionId:
 *                 type: string
 *             example:
 *               versionId: "ver_1"
 *     responses:
 *       200:
 *         description: Entry reverted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "ent_456"
 *                 data: { "title": "Reverted title" }
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}:
 *   delete:
 *     summary: Delete a content entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ent_456"
 *     responses:
 *       204:
 *         description: Entry deleted
 */
