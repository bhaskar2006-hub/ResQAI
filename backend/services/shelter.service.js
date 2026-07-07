import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';
import { broadcastEvent } from '../socket/socket.service.js';

export const getAllShelters = async () => {
  return await prisma.shelter.findMany();
};

export const getShelterById = async (id) => {
  const shelter = await prisma.shelter.findUnique({
    where: { id },
  });
  if (!shelter) {
    throw new AppError('Shelter not found', 404);
  }
  return shelter;
};

export const createShelter = async (data) => {
  const shelter = await prisma.shelter.create({
    data,
  });
  broadcastEvent('shelterUpdated', shelter);
  return shelter;
};

export const updateShelter = async (id, data) => {
  const shelter = await prisma.shelter.update({
    where: { id },
    data,
  });
  broadcastEvent('shelterUpdated', shelter);
  return shelter;
};

export const deleteShelter = async (id) => {
  await prisma.shelter.delete({
    where: { id },
  });
  return true;
};
