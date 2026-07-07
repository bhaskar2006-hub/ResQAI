import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';
import { broadcastEvent } from '../socket/socket.service.js';

export const getAllHospitals = async () => {
  return await prisma.hospital.findMany();
};

export const getHospitalById = async (id) => {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
  });
  if (!hospital) {
    throw new AppError('Hospital not found', 404);
  }
  return hospital;
};

export const createHospital = async (data) => {
  const hospital = await prisma.hospital.create({
    data,
  });
  broadcastEvent('hospitalUpdated', hospital);
  return hospital;
};

export const updateHospital = async (id, data) => {
  const hospital = await prisma.hospital.update({
    where: { id },
    data,
  });
  broadcastEvent('hospitalUpdated', hospital);
  return hospital;
};

export const deleteHospital = async (id) => {
  await prisma.hospital.delete({
    where: { id },
  });
  return true;
};
