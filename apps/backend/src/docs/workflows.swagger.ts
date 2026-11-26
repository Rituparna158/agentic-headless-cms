/**
 * @swagger
 * tags:
 *   name: Workflows
 *   description: Content workflow definitions, stage transitions, and schema associations
 */

/**
 * @swagger
 * /workflows/pending-reviews:
 *   get:
 *     summary: List pending content reviews for the reviewer inbox
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of pending items to return
 *     responses:
 *       200:
 *         description: List of pending content items awaiting review
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /workflows:
 *   get:
 *     summary: List all workflows
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of workflows
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /workflows:
 *   post:
 *     summary: Create a new workflow definition
 *     tags: [Workflows]
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
 *               - stages
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Editorial Review"
 *               description:
 *                 type: string
 *                 example: "Standard two-step review workflow"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *               stages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - slug
 *                     - order
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     color:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     isInitial:
 *                       type: boolean
 *                     isFinal:
 *                       type: boolean
 *               transitions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - fromStage
 *                     - toStage
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     fromStage:
 *                       type: string
 *                     toStage:
 *                       type: string
 *                     requiredRoleIds:
 *                       type: array
 *                       items:
 *                         type: string
 *               schemaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Workflow created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden (Admin only)
 */

/**
 * @swagger
 * /workflows/{id}:
 *   get:
 *     summary: Get workflow by ID
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow details
 *       404:
 *         description: Workflow not found
 */

/**
 * @swagger
 * /workflows/{id}:
 *   put:
 *     summary: Update an existing workflow
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workflow not found
 */

/**
 * @swagger
 * /workflows/{id}:
 *   delete:
 *     summary: Delete a workflow definition
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workflow not found
 */

/**
 * @swagger
 * /workflows/schema/{schemaId}:
 *   get:
 *     summary: Get active workflow for a content schema
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow details for schema
 *       404:
 *         description: No workflow found
 */

/**
 * @swagger
 * /workflows/{id}/schemas/{schemaId}:
 *   post:
 *     summary: Assign a workflow to a content schema
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: schemaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow assigned to schema successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Workflow or Schema not found
 */

/**
 * @swagger
 * /workflows/{id}/schemas/{schemaId}:
 *   delete:
 *     summary: Remove a workflow assignment from a content schema
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: schemaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow assignment removed successfully
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/workflow-state:
 *   get:
 *     summary: Get current workflow state and available transitions for a content entry
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the schema
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the content entry
 *     responses:
 *       200:
 *         description: Entry workflow state retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schema or Entry not found
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/transition:
 *   post:
 *     summary: Transition a content entry to a new workflow stage
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toStage
 *             properties:
 *               toStage:
 *                 type: string
 *                 example: "in-review"
 *               comment:
 *                 type: string
 *                 example: "Ready for editor review"
 *     responses:
 *       200:
 *         description: Workflow transition executed successfully
 *       400:
 *         description: Invalid target stage or transition not allowed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have permission for this transition
 *       404:
 *         description: Schema or entry not found
 */

/**
 * @swagger
 * /content/{schemaSlug}/{entryId}/workflow-history:
 *   get:
 *     summary: Get stage transition history for a content entry
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schemaSlug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schema or entry not found
 */
