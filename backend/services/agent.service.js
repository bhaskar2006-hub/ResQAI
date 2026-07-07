import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';
import { updateResource } from './resource.service.js';
import { updateSosReport } from './sos.service.js';
import { broadcastEvent } from '../socket/socket.service.js';

export const getAllAgents = async () => {
  return await prisma.agent.findMany({
    orderBy: { updatedAt: 'desc' },
  });
};

export const registerOrUpdateAgent = async (data) => {
  const agent = await prisma.agent.upsert({
    where: { name: data.name },
    update: {
      type: data.type,
      status: 'ACTIVE',
      endpointUrl: data.endpointUrl,
      capabilities: data.capabilities,
      updatedAt: new Date(),
    },
    create: {
      name: data.name,
      type: data.type,
      status: 'ACTIVE',
      endpointUrl: data.endpointUrl,
      capabilities: data.capabilities,
    },
  });

  // Broadcast agent status update
  broadcastEvent('agentStatusUpdated', agent);

  return agent;
};

export const proposeAction = async (agentId, actionData) => {
  const action = await prisma.agentAction.create({
    data: {
      agentId,
      actionType: actionData.actionType,
      targetId: actionData.targetId,
      details: actionData.details,
      status: 'PENDING_APPROVAL',
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  // Broadcast action proposition to responder dashboards
  broadcastEvent('actionProposed', action);

  return action;
};

export const getPendingActions = async () => {
  return await prisma.agentAction.findMany({
    where: { status: 'PENDING_APPROVAL' },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getActionById = async (id) => {
  const action = await prisma.agentAction.findUnique({
    where: { id },
    include: {
      agent: true,
    },
  });
  if (!action) {
    throw new AppError('Agent action not found', 404);
  }
  return action;
};

export const approveAction = async (id) => {
  const action = await getActionById(id);

  if (action.status !== 'PENDING_APPROVAL') {
    throw new AppError(`Action is already in status: ${action.status}`, 400);
  }

  // Execute actual dispatch logic for DISPATCH_RESOURCE
  if (action.actionType === 'DISPATCH_RESOURCE') {
    const { resourceId, sosId } = action.details;

    if (!resourceId || !sosId) {
      throw new AppError('Invalid details for resource dispatch. Required: resourceId, sosId', 400);
    }

    // 1) Assign resource to SOS
    await updateResource(resourceId, {
      assignedToSosId: sosId,
      status: 'ASSIGNED',
    });

    // 2) Update SOS Status to ASSIGNED
    await updateSosReport(sosId, {
      status: 'ASSIGNED',
    });
    
    console.log(`[Agent Dispatch Execution] Resource ${resourceId} assigned to SOS ${sosId}`);
  }

  // Update Action record
  const approvedAction = await prisma.agentAction.update({
    where: { id },
    data: {
      status: 'APPROVED',
    },
    include: {
      agent: true,
    },
  });

  broadcastEvent('actionApproved', approvedAction);

  return approvedAction;
};

export const rejectAction = async (id) => {
  const action = await getActionById(id);

  if (action.status !== 'PENDING_APPROVAL') {
    throw new AppError(`Action is already in status: ${action.status}`, 400);
  }

  const rejectedAction = await prisma.agentAction.update({
    where: { id },
    data: {
      status: 'REJECTED',
    },
    include: {
      agent: true,
    },
  });

  broadcastEvent('actionRejected', rejectedAction);

  return rejectedAction;
};
