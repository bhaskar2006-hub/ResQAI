import { Router } from 'express';
import * as shelterController from '../controllers/shelter.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createShelterSchema, updateShelterSchema } from '../validators/shelter.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /shelters:
 *   get:
 *     summary: Retrieve list of all shelters
 *     tags: [Shelters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of shelters
 *   post:
 *     summary: Register a new shelter
 *     tags: [Shelters]
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
 *               - occupancy
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *                 example: Eastside Refugee Camp
 *               latitude:
 *                 type: number
 *                 example: 37.7892
 *               longitude:
 *                 type: number
 *                 example: -122.4012
 *               address:
 *                 type: string
 *                 example: 456 Broadway, SF
 *               capacity:
 *                 type: integer
 *                 example: 300
 *               occupancy:
 *                 type: integer
 *                 example: 120
 *               contact:
 *                 type: string
 *                 example: "+1-555-5678"
 *     responses:
 *       201:
 *         description: Shelter created successfully
 *       403:
 *         description: Forbidden
 */
router
  .route('/')
  .get(shelterController.getAllShelters)
  .post(restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), validate(createShelterSchema), shelterController.createShelter);

/**
 * @openapi
 * /shelters/{id}:
 *   get:
 *     summary: Get shelter details by ID
 *     tags: [Shelters]
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
 *         description: Shelter details
 *       404:
 *         description: Shelter not found
 *   patch:
 *     summary: Update shelter details
 *     tags: [Shelters]
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
 *               occupancy:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *               contact:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shelter updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shelter not found
 *   delete:
 *     summary: Delete a shelter record
 *     tags: [Shelters]
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
 *         description: Shelter deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shelter not found
 */
router
  .route('/:id')
  .get(shelterController.getShelterById)
  .patch(restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), validate(updateShelterSchema), shelterController.updateShelter)
  .delete(restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), shelterController.deleteShelter);

export default router;
