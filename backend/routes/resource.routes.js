import { Router } from 'express';
import * as resourceController from '../controllers/resource.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createResourceSchema, updateResourceSchema } from '../validators/resource.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /resources:
 *   get:
 *     summary: Retrieve list of all emergency response resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [AMBULANCE, FIRE_TRUCK, BOAT, VOLUNTEER]
 *         description: Filter by resource type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, ASSIGNED, MAINTENANCE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Array of resources
 *   post:
 *     summary: Register a new resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - identifier
 *               - latitude
 *               - longitude
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [AMBULANCE, FIRE_TRUCK, BOAT, VOLUNTEER]
 *                 example: AMBULANCE
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ASSIGNED, MAINTENANCE]
 *                 default: AVAILABLE
 *               identifier:
 *                 type: string
 *                 example: AMB-042
 *               latitude:
 *                 type: number
 *                 example: 37.7749
 *               longitude:
 *                 type: number
 *                 example: -122.4194
 *     responses:
 *       201:
 *         description: Resource registered successfully
 *       403:
 *         description: Forbidden
 */
router
  .route('/')
  .get(resourceController.getAllResources)
  .post(restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), validate(createResourceSchema), resourceController.createResource);

/**
 * @openapi
 * /resources/{id}:
 *   get:
 *     summary: Get resource details by ID
 *     tags: [Resources]
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
 *         description: Resource details
 *       404:
 *         description: Resource not found
 *   patch:
 *     summary: Update resource details or assign to SOS
 *     tags: [Resources]
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
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ASSIGNED, MAINTENANCE]
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               assignedToSosId:
 *                 type: string
 *                 description: ID of the SOS emergency report to assign this resource to
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 *   delete:
 *     summary: Delete/unregister a resource
 *     tags: [Resources]
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
 *         description: Resource deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 */
router
  .route('/:id')
  .get(resourceController.getResourceById)
  .patch(restrictTo('ADMIN', 'GOVERNMENT', 'NGO', 'VOLUNTEER'), validate(updateResourceSchema), resourceController.updateResource)
  .delete(restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), resourceController.deleteResource);

export default router;
