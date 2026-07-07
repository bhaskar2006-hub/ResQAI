import prisma from './prisma.service.js';

export const getAllReports = async () => {
  return await prisma.report.findMany({
    include: {
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const createReport = async (data) => {
  return await prisma.report.create({
    data,
    include: {
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
};
