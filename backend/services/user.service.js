import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';
import { hashPassword } from './auth.service.js';

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const updateUser = async (id, data) => {
  // If data includes password, hash it
  const updateData = { ...data };
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

export const deleteUser = async (id) => {
  await prisma.user.delete({
    where: { id },
  });
  return true;
};
