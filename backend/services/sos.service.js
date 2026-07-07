import prisma from './prisma.service.js';
import AppError from '../utils/appError.js';
import { broadcastEvent } from '../socket/socket.service.js';
import { getWeatherForecast } from './weather.service.js';
import { getRoute } from './maps.service.js';
import { getAllHospitals } from './hospital.service.js';
import { checkActiveDisastersForLocation } from './disaster.service.js';
import { analyzeSosDescription } from './gemini.service.js';
import { runOrchestratorWorkflow } from './orchestrator.service.js';

export const getAllSosReports = async (filters = {}) => {
  return await prisma.sosReport.findMany({
    where: filters,
    include: {
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      resources: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getSosReportById = async (id) => {
  const sos = await prisma.sosReport.findUnique({
    where: { id },
    include: {
      reporter: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      resources: true,
    },
  });
  if (!sos) {
    throw new AppError('SOS report not found', 404);
  }
  return sos;
};

export const createSosReport = async (data) => {
  const sos = await prisma.sosReport.create({
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

  // Broadcast event in real-time
  broadcastEvent('newSOS', sos);

  // Trigger background analysis via Gemini
  analyzeSosReportInBackground(sos.id).catch((err) => {
    console.error(`[Background AI Analysis Error] SOS ID ${sos.id}:`, err.message);
  });

  return sos;
};

export const analyzeSosReportInBackground = async (sosId) => {
  return await runOrchestratorWorkflow(sosId);
};


export const updateSosReport = async (id, data) => {
  const sos = await prisma.sosReport.update({
    where: { id },
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
      resources: true,
    },
  });

  // Broadcast updates
  broadcastEvent('sosUpdated', sos);

  return sos;
};

export const deleteSosReport = async (id) => {
  await prisma.sosReport.delete({
    where: { id },
  });
  return true;
};

export const getSosIntelligence = async (id) => {
  const sos = await getSosReportById(id);

  // 1) Fetch weather forecast
  const weather = await getWeatherForecast(sos.latitude, sos.longitude);

  // 2) Check active geofenced disasters affecting this SOS coordinates
  const activeDisasters = await checkActiveDisastersForLocation(sos.latitude, sos.longitude);

  // 3) Find nearest hospitals
  const hospitals = await getAllHospitals();
  
  // Calculate routes to all hospitals
  const hospitalRoutes = await Promise.all(
    hospitals.map(async (hospital) => {
      try {
        const route = await getRoute(sos.latitude, sos.longitude, hospital.latitude, hospital.longitude);
        return {
          hospital: {
            id: hospital.id,
            name: hospital.name,
            availableBeds: hospital.availableBeds,
            contact: hospital.contact,
            latitude: hospital.latitude,
            longitude: hospital.longitude,
          },
          route,
        };
      } catch (err) {
        console.error(`Failed to calculate route to hospital ${hospital.name}:`, err.message);
        return null;
      }
    })
  );

  // Filter out any route calculations that failed and sort by duration
  const sortedHospitalRoutes = hospitalRoutes
    .filter(Boolean)
    .sort((a, b) => a.route.duration.value - b.route.duration.value);

  return {
    sosId: sos.id,
    location: {
      latitude: sos.latitude,
      longitude: sos.longitude,
    },
    weather,
    activeDisasters: activeDisasters.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      severity: d.severity,
      radius: `${d.radius} km`,
    })),
    recommendedHospitals: sortedHospitalRoutes.slice(0, 3),
  };
};
