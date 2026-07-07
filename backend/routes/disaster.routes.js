import { Router } from 'express';
import * as disasterController from '../controllers/disaster.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createDisasterSchema, updateDisasterSchema } from '../validators/disaster.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /disasters:
 *   get:
 *     summary: Retrieve list of all disaster events
 *     tags: [Disasters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Array of disasters
 *   post:
 *     summary: Declare a new disaster event (Emergency status)
 *     tags: [Disasters]
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
 *               - type
 *               - severity
 *               - latitude
 *               - longitude
 *               - radius
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: San Francisco Wildfire
 *               type:
 *                 type: string
 *                 enum: [WEATHER, FIRE, FLOOD, EARTHQUAKE, OTHER]
 *                 example: FIRE
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 example: CRITICAL
 *               latitude:
 *                 type: number
 *                 example: 37.7749
 *               longitude:
 *                 type: number
 *                 example: -122.4194
 *               radius:
 *                 type: number
 *                 description: Impact radius in kilometers
 *                 example: 10
 *               description:
 *                 type: string
 *                 example: Major brushfire spreading near downtown area. Evacuate immediately.
 *     responses:
 *       201:
 *         description: Disaster event registered and alerts broadcasted
 *       403:
 *         description: Forbidden (Only Admins/Government)
 */
router
  .route('/')
  .get(disasterController.getAllDisasters)
  .post(restrictTo('ADMIN', 'GOVERNMENT'), validate(createDisasterSchema), disasterController.createDisaster);

/**
 * @openapi
 * /disasters/{id}:
 *   get:
 *     summary: Get details of a single disaster by ID
 *     tags: [Disasters]
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
 *         description: Disaster details
 *       404:
 *         description: Disaster not found
 *   patch:
 *     summary: Update disaster details or boundary
 *     tags: [Disasters]
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
 *             properties:
 *               name:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               radius:
 *                 type: number
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Disaster updated successfully
 *       403:
 *         description: Forbidden
 *   delete:
 *     summary: Remove a disaster event record
 *     tags: [Disasters]
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
 *         description: Disaster deleted successfully
 *       403:
 *         description: Forbidden
 */
router
  .route('/:id')
  .get(disasterController.getDisasterById)
  .patch(restrictTo('ADMIN', 'GOVERNMENT'), validate(updateDisasterSchema), disasterController.updateDisaster)
  .delete(restrictTo('ADMIN', 'GOVERNMENT'), disasterController.deleteDisaster);

export default router;
