/**
 * @swagger
 * tags:
 *   name: Schemas
 *   description: Content schema management
 */

/**
 * @swagger
 * /schemas:
 *   post:
 *     summary: Create a new schema
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *             example:
 *               name: "Blog Post"
 *               slug: "blog-post"
 *               description: "A standard blog post schema"
 *               fields: [{ "name": "title", "type": "string" }, { "name": "body", "type": "richtext" }]
 *     responses:
 *       201:
 *         description: Schema created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "sch_123"
 *                 name: "Blog Post"
 *                 slug: "blog-post"
 *                 createdAt: "2026-08-07T12:00:00Z"
 */

/**
 * @swagger
 * /schemas:
 *   get:
 *     summary: Get all schemas
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schemas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "sch_123"
 *                   name: "Blog Post"
 *                   slug: "blog-post"
 */

/**
 * @swagger
 * /schemas/{id}:
 *   put:
 *     summary: Update a schema
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "sch_123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *             example:
 *               name: "Updated Blog Post"
 *               description: "Updated description"
 *               fields: [{ "name": "title", "type": "string" }, { "name": "body", "type": "richtext" }]
 *     responses:
 *       200:
 *         description: Schema updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "sch_123"
 *                 name: "Updated Blog Post"
 *                 slug: "blog-post"
 *                 updatedAt: "2026-08-07T12:05:00Z"
 */

/**
 * @swagger
 * /schemas/{id}:
 *   delete:
 *     summary: Delete a schema
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "sch_123"
 *     responses:
 *       204:
 *         description: Schema deleted
 */
