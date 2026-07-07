import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateUserSchema } from '../validators/user.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Retrieve list of all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin / Government only)
 */
router.get('/', restrictTo('ADMIN', 'GOVERNMENT'), userController.getAllUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Can only read own profile unless admin)
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CITIZEN, GOVERNMENT, NGO, ADMIN]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Forbidden (Cannot update other users or modify role unless admin)
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden (Cannot delete other profiles unless admin)
 */
router
  .route('/:id')
  .get(userController.getUserById)
  .patch(validate(updateUserSchema), userController.updateUser)
  .delete(userController.deleteUser);

export default router;
