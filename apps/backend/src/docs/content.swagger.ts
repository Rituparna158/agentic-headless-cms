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
 *       - apiKeyAuth: []
 *       - appIdAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of entries per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by entry publication status
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Locale code to retrieve localized content
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching entry content
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field name to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order direction
 *     responses:
 *       200:
 *         description: List of entries
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
 *                   example: "Entries listed successfully"
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
 *                     pageSize:
 *                       type: integer
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}:
 *   get:
 *     summary: Get a single content entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Locale code to retrieve localized content
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
 *                 status: "published"
 *                 data: { "title": "My first blog post" }
 *       404:
 *         description: Entry not found
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/versions:
 *   get:
 *     summary: List entry versions
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Filter versions by locale
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
 *                 - versionNo: 1
 *                   data: { "title": "Draft 1" }
 *                 - versionNo: 2
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
 *       - apiKeyAuth: []
 *       - appIdAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         example: "blog-post"
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Target locale for initial content
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
 *     summary: Update an existing draft entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Target locale for update
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
 * /content/{schemaSlug}/{entryId}:
 *   patch:
 *     summary: Partially update an existing entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Target locale for partial update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "Partially updated title"
 *     responses:
 *       200:
 *         description: Entry partially updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "ent_456"
 *                 status: "draft"
 *                 data: { "title": "Partially updated title" }
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/publish:
 *   post:
 *     summary: Publish a draft entry
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Target locale to publish
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
 * /content/{schemaSlug}/{entryId}/unpublish:
 *   post:
 *     summary: Unpublish an entry back to draft
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Target locale to unpublish
 *     responses:
 *       200:
 *         description: Entry unpublished successfully
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
 * /content/{schemaSlug}/{entryId}/revert:
 *   post:
 *     summary: Revert to a previous version
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Target locale for reversion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - versionNo
 *             properties:
 *               versionNo:
 *                 type: integer
 *                 example: 2
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
 *       - apiKeyAuth: []
 *       - appIdAuth: []
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
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *         example: "en"
 *         description: Specific locale to delete (or entire entry if omitted)
 *     responses:
 *       204:
 *         description: Entry deleted
 */
