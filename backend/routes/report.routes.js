import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReportSchema } from '../validators/report.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /reports:
 *   get:
 *     summary: Retrieve list of all general disaster reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of reports
 *   post:
 *     summary: Submit a new hazard/disaster report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - title
 *               - description
 *               - type
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 37.7749
 *               longitude:
 *                 type: number
 *                 example: -122.4194
 *               title:
 *                 type: string
 *                 example: Forest fire flareup
 *               description:
 *                 type: string
 *                 example: Small fire spotted spreading near Highway 1.
 *               type:
 *                 type: string
 *                 enum: [WEATHER, FIRE, FLOOD, EARTHQUAKE, OTHER]
 *                 example: FIRE
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["http://localhost:5000/storage/images/fire.jpg"]
 *     responses:
 *       201:
 *         description: Report submitted successfully
 */
router
  .route('/')
  .get(reportController.getAllReports)
  .post(validate(createReportSchema), reportController.createReport);

export default router;
