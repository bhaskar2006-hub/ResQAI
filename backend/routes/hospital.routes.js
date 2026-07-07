import { Router } from 'express';
import * as hospitalController from '../controllers/hospital.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createHospitalSchema, updateHospitalSchema } from '../validators/hospital.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /hospitals:
 *   get:
 *     summary: Retrieve list of all hospitals
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of hospitals
 *   post:
 *     summary: Register a new hospital
 *     tags: [Hospitals]
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
 *               - latitude
 *               - longitude
 *               - address
 *               - capacity
 *               - availableBeds
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *                 example: Central Hospital
 *               latitude:
 *                 type: number
 *                 example: 37.7749
 *               longitude:
 *                 type: number
 *                 example: -122.4194
 *               address:
 *                 type: string
 *                 example: 100 Main St, SF
 *               capacity:
 *                 type: integer
 *                 example: 150
 *               availableBeds:
 *                 type: integer
 *                 example: 25
 *               contact:
 *                 type: string
 *                 example: "+1-555-1234"
 *     responses:
 *       201:
 *         description: Hospital created successfully
 *       403:
 *         description: Forbidden (Only responders/admins)
 */
router
  .route('/')
  .get(hospitalController.getAllHospitals)
  .post(restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), validate(createHospitalSchema), hospitalController.createHospital);

/**
 * @openapi
 * /hospitals/{id}:
 *   get:
 *     summary: Get hospital details by ID
 *     tags: [Hospitals]
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
 *         description: Hospital details
 *       404:
 *         description: Hospital not found
 *   patch:
 *     summary: Update hospital details
 *     tags: [Hospitals]
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
 *               availableBeds:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *               contact:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 *       403:
 *         description: Forbidden (Only responders/admins)
 *       404:
 *         description: Hospital not found
 *   delete:
 *     summary: Delete a hospital record
 *     tags: [Hospitals]
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
 *         description: Hospital deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hospital not found
 */
router
  .route('/:id')
  .get(hospitalController.getHospitalById)
  .patch(restrictTo('ADMIN', 'GOVERNMENT', 'NGO', 'HOSPITAL'), validate(updateHospitalSchema), hospitalController.updateHospital)
  .delete(restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), hospitalController.deleteHospital);

export default router;
