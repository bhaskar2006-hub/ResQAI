import { Router } from 'express';
import * as agentController from '../controllers/agent.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerAgentSchema, proposeActionSchema } from '../validators/agent.validator.js';

const router = Router();

router.use(protect);

/**
 * @openapi
 * /agents:
 *   get:
 *     summary: Retrieve list of all registered AI agents
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of agents
 *       403:
 *         description: Forbidden
 */
router.get('/', restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), agentController.getAgents);

/**
 * @openapi
 * /agents/register:
 *   post:
 *     summary: Register or heartbeat an AI agent status
 *     tags: [AI Agents]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dispatcher-Agent-Alpha
 *               type:
 *                 type: string
 *                 enum: [ALLOCATOR, TRANSLATOR, FORECASTER, SEARCH_AND_RESCUE]
 *                 example: ALLOCATOR
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["dispatch_resource", "route_optimization"]
 *               endpointUrl:
 *                 type: string
 *                 example: http://localhost:8000/webhook
 *     responses:
 *       200:
 *         description: Agent registered/updated successfully
 */
router.post('/register', restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), validate(registerAgentSchema), agentController.registerAgent);

/**
 * @openapi
 * /agents/actions/pending:
 *   get:
 *     summary: Retrieve pending agent actions awaiting human approval
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending actions
 */
router.get('/actions/pending', restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), agentController.getPendingAgentActions);

/**
 * @openapi
 * /agents/{id}/propose:
 *   post:
 *     summary: Propose a dispatch or rescue action (by AI Agent)
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registered Agent UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionType
 *               - details
 *             properties:
 *               actionType:
 *                 type: string
 *                 example: DISPATCH_RESOURCE
 *               targetId:
 *                 type: string
 *                 example: b80191ca-1452-4ea3-934e-ee7cbf86d757
 *               details:
 *                 type: object
 *                 example: { "resourceId": "resource-uuid-here", "sosId": "sos-uuid-here", "reason": "Closest available ambulance." }
 *     responses:
 *       201:
 *         description: Action proposed and queued
 */
router.post('/:id/propose', restrictTo('ADMIN', 'GOVERNMENT', 'NGO'), validate(proposeActionSchema), agentController.proposeAgentAction);

/**
 * @openapi
 * /agents/actions/{id}/approve:
 *   post:
 *     summary: Approve and execute a proposed agent action (HITL)
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Action UUID
 *     responses:
 *       200:
 *         description: Action executed successfully
 *       400:
 *         description: Action already processed or invalid details
 */
router.post('/actions/:id/approve', restrictTo('ADMIN', 'GOVERNMENT'), agentController.approveAgentAction);

/**
 * @openapi
 * /agents/actions/{id}/reject:
 *   post:
 *     summary: Reject a proposed agent action
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Action UUID
 *     responses:
 *       200:
 *         description: Action rejected successfully
 */
router.post('/actions/:id/reject', restrictTo('ADMIN', 'GOVERNMENT'), agentController.rejectAgentAction);

export default router;
