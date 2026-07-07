import { Router } from 'express';
import * as sosController from '../controllers/sos.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSosSchema, updateSosSchema } from '../validators/sos.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /sos:
 *   get:
 *     summary: Retrieve list of all SOS emergency reports
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     description: Citizens only retrieve their own SOS reports. Responders/Admins see all reports.
 *     responses:
 *       200:
 *         description: Array of SOS reports
 *   post:
 *     summary: Submit a new SOS emergency report
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     description: Submits emergency location and description. Automatically broadcasts to all connected responder clients.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - description
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 37.7749
 *               longitude:
 *                 type: number
 *                 example: -122.4194
 *               description:
 *                 type: string
 *                 example: Immediate evacuation needed, fire in upper floor.
 *               imageUrl:
 *                 type: string
 *                 example: http://localhost:5000/storage/images/image.jpg
 *     responses:
 *       201:
 *         description: SOS created and broadcast successfully
 */
router
  .route('/')
  .get(sosController.getAllSos)
  .post(validate(createSosSchema), sosController.createSos);

/**
 * @openapi
 * /sos/{id}/intelligence:
 *   get:
 *     summary: Fetch automated decision intelligence for an SOS
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     description: Resolves the local weather condition and routing times to the top 3 nearest hospitals.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weather and hospital routing details returned successfully
 *       403:
 *         description: Forbidden (Only responders)
 *       404:
 *         description: SOS not found
 */
router.get('/:id/intelligence', restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), sosController.getSosIntelligence);

/**
 * @openapi
 * /sos/{id}:
 *   get:
 *     summary: Get details of a single SOS report by ID
 *     tags: [SOS]
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
 *         description: SOS details
 *       403:
 *         description: Forbidden (Cannot view others' SOS if citizen)
 *       404:
 *         description: SOS not found
 *   patch:
 *     summary: Update SOS status or description
 *     tags: [SOS]
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
 *                 enum: [PENDING, ASSIGNED, RESOLVED]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: SOS updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: SOS not found
 *   delete:
 *     summary: Cancel or delete an SOS report
 *     tags: [SOS]
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
 *         description: SOS deleted successfully
 *       403:
 *         description: Forbidden
 */
router
  .route('/:id')
  .get(sosController.getSosById)
  .patch(validate(updateSosSchema), sosController.updateSos)
  .delete(sosController.deleteSos);

export default router;
