import * as agentService from '../services/agent.service.js';
import AppError from '../utils/appError.js';

export const getAgents = async (req, res, next) => {
  try {
    const agents = await agentService.getAllAgents();
    res.status(200).json({
      success: true,
      results: agents.length,
      data: {
        agents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerAgent = async (req, res, next) => {
  try {
    const agent = await agentService.registerOrUpdateAgent(req.body);
    res.status(200).json({
      success: true,
      message: 'Agent registered/heartbeat successfully',
      data: {
        agent,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const proposeAgentAction = async (req, res, next) => {
  try {
    const { id } = req.params; // Agent ID
    const action = await agentService.proposeAction(id, req.body);
    res.status(201).json({
      success: true,
      message: 'Action proposed successfully and queued for responder approval',
      data: {
        action,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingAgentActions = async (req, res, next) => {
  try {
    const actions = await agentService.getPendingActions();
    res.status(200).json({
      success: true,
      results: actions.length,
      data: {
        actions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveAgentAction = async (req, res, next) => {
  try {
    const { id } = req.params; // Action ID
    const action = await agentService.approveAction(id);
    res.status(200).json({
      success: true,
      message: 'Agent action approved and executed successfully',
      data: {
        action,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectAgentAction = async (req, res, next) => {
  try {
    const { id } = req.params; // Action ID
    const action = await agentService.rejectAction(id);
    res.status(200).json({
      success: true,
      message: 'Agent action rejected successfully',
      data: {
        action,
      },
    });
  } catch (error) {
    next(error);
  }
};
