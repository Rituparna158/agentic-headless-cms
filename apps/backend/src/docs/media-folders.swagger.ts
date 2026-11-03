/**
 * @swagger
 * tags:
 *   name: Media Folders
 *   description: Media folders management
 */

/**
 * @swagger
 * /media-folders:
 *   post:
 *     summary: Create a media folder
 *     tags: [Media Folders]
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
 *               parentId:
 *                 type: string
 *             example:
 *               name: "Hero Images"
 *               parentId: "fld_root"
 *     responses:
 *       201:
 *         description: Folder created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "fld_123"
 *                 name: "Hero Images"
 *                 parentId: "fld_root"
 */

/**
 * @swagger
 * /media-folders:
 *   get:
 *     summary: List media folders
 *     tags: [Media Folders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of folders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *               example:
 *                 - id: "fld_123"
 *                   name: "Hero Images"
 *                   parentId: "fld_root"
 */

/**
 * @swagger
 * /media-folders/{id}:
 *   delete:
 *     summary: Delete a media folder
 *     tags: [Media Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "fld_123"
 *     responses:
 *       204:
 *         description: Folder deleted
 */
