import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';
import { broadcastEvent } from '../socket/socket.service.js';

export const getAllResources = async (filters = {}) => {
  return await prisma.resource.findMany({
    where: filters,
    include: {
      assignedToSos: {
        select: {
          id: true,
          description: true,
          status: true,
        },
      },
    },
  });
};

export const getResourceById = async (id) => {
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      assignedToSos: true,
    },
  });
  if (!resource) {
    throw new AppError('Resource not found', 404);
  }
  return resource;
};

export const createResource = async (data) => {
  return await prisma.resource.create({
    data,
  });
};

export const updateResource = async (id, data) => {
  const resource = await prisma.resource.update({
    where: { id },
    data,
  });
  if (data.assignedToSosId || data.status === 'ASSIGNED') {
    broadcastEvent('resourceAssigned', resource);
  }
  return resource;
};

export const deleteResource = async (id) => {
  await prisma.resource.delete({
    where: { id },
  });
  return true;
};
