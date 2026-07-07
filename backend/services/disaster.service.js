import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';
import { isWithinRadius } from '../utils/geo.js';
import { broadcastEvent } from '../socket/socket.service.js';

export const getAllDisasters = async (filters = {}) => {
  return await prisma.disaster.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
  });
};

export const getDisasterById = async (id) => {
  const disaster = await prisma.disaster.findUnique({
    where: { id },
  });
  if (!disaster) {
    throw new AppError('Disaster event not found', 404);
  }
  return disaster;
};

export const createDisaster = async (data) => {
  const disaster = await prisma.disaster.create({
    data,
  });

  // Broadcast alert to everyone in real-time
  broadcastEvent('alertCreated', {
    title: `New Disaster Declared: ${disaster.name}`,
    message: disaster.description,
    severity: disaster.severity,
    targetId: disaster.id,
    timestamp: new Date().toISOString(),
  });

  return disaster;
};

export const updateDisaster = async (id, data) => {
  const disaster = await prisma.disaster.update({
    where: { id },
    data,
  });

  // Broadcast update
  broadcastEvent('alertCreated', {
    title: `Disaster Updated: ${disaster.name}`,
    message: `Status: ${disaster.active ? 'Active' : 'Inactive'}. Severity: ${disaster.severity}. Description: ${disaster.description}`,
    severity: disaster.severity,
    targetId: disaster.id,
    timestamp: new Date().toISOString(),
  });

  return disaster;
};

export const deleteDisaster = async (id) => {
  await prisma.disaster.delete({
    where: { id },
  });
  return true;
};

/**
 * Checks all active disasters to determine which ones affect a given coordinate.
 * @param {number} lat - Latitude of query location
 * @param {number} lon - Longitude of query location
 * @returns {Promise<Array>} - List of active disasters affecting this location
 */
export const checkActiveDisastersForLocation = async (lat, lon) => {
  const activeDisasters = await prisma.disaster.findMany({
    where: { active: true },
  });

  // Filter disasters by Haversine geofence check
  return activeDisasters.filter((disaster) =>
    isWithinRadius(lat, lon, disaster.latitude, disaster.longitude, disaster.radius)
  );
};
