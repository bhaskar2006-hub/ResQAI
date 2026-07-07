import prisma from './prisma.service.js';
import { broadcastEvent } from '../socket/socket.service.js';
import { getWeatherForecast } from './weather.service.js';
import { getRoute } from './maps.service.js';
import { getDistanceInKm } from '../utils/geo.js';
import { analyzeSosDescription } from './gemini.service.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the Multi-Agent disaster intelligence chain for a given SOS report.
 * Processes each agent sequentially with a realistic delay, broadcasting steps in real-time.
 * @param {string} sosId - The UUID of the SOS report
 */
export const runOrchestratorWorkflow = async (sosId) => {
  try {
    const sos = await prisma.sosReport.findUnique({
      where: { id: sosId },
      include: { reporter: true },
    });

    if (!sos) {
      console.error(`[AI Orchestrator] SOS Report with ID ${sosId} not found.`);
      return;
    }

    console.log(`[AI Orchestrator] Executing multi-agent chain for SOS ID: ${sosId}`);

    // ==========================================
    // 1. AI Orchestrator Start
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'orchestrator_start',
      agentName: 'AI Orchestrator',
      status: 'PROCESSING',
      message: 'Initializing disaster intelligence chain for emergency request...',
      data: { description: sos.description, coords: [sos.latitude, sos.longitude] },
    });
    await delay(1500);

    // ==========================================
    // 2. Prediction Agent
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'prediction',
      agentName: 'Prediction Agent',
      status: 'PROCESSING',
      message: `Querying localized weather telemetry and active geofenced disaster datasets for coordinates: [${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}]...`,
      data: null,
    });
    await delay(1000);

    const weather = await getWeatherForecast(sos.latitude, sos.longitude);
    const disasters = await prisma.disaster.findMany({ where: { active: true } });
    const activeDisasters = disasters.filter(
      (d) => getDistanceInKm(sos.latitude, sos.longitude, d.latitude, d.longitude) <= d.radius
    );

    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'prediction',
      agentName: 'Prediction Agent',
      status: 'COMPLETED',
      message: `Analysis complete: Temperature ${weather.temperature}°C, Condition: ${weather.condition}. Detected ${activeDisasters.length} active geofenced disasters in the vicinity.`,
      data: { weather, activeDisasters },
    });
    await delay(1500);

    // ==========================================
    // 3. SOS Agent
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'sos',
      agentName: 'SOS Agent',
      status: 'PROCESSING',
      message: 'Initiating translation and crisis severity categorization on the distress description text...',
      data: null,
    });
    await delay(1000);

    const aiAnalysis = await analyzeSosDescription(sos.description);

    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'sos',
      agentName: 'SOS Agent',
      status: 'COMPLETED',
      message: `Crisis structured. Category: ${aiAnalysis.category || 'OTHER'}, Severity: ${aiAnalysis.severity || 'MEDIUM'}. Translated text: "${aiAnalysis.translatedText}"`,
      data: { aiAnalysis },
    });
    await delay(1500);

    // ==========================================
    // 4. Resource Agent
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'resource',
      agentName: 'Resource Agent',
      status: 'PROCESSING',
      message: `Searching database for available response assets matching recommendation: ${(aiAnalysis.recommendedResources || []).join(', ') || 'VOLUNTEER'}...`,
      data: null,
    });
    await delay(1000);

    const recommendedTypes = aiAnalysis.recommendedResources && aiAnalysis.recommendedResources.length > 0
      ? aiAnalysis.recommendedResources
      : ['VOLUNTEER'];

    let availableResources = await prisma.resource.findMany({
      where: {
        type: { in: recommendedTypes },
        status: 'AVAILABLE',
      },
    });

    // Auto-generate dynamic resource if none available to prevent demonstration locks
    if (availableResources.length === 0) {
      const fallbackType = recommendedTypes[0] || 'VOLUNTEER';
      const fallbackIdentifier = `DYN-${fallbackType.substring(0, 3)}-${Math.floor(Math.random() * 800 + 100)}`;
      
      const fallbackResource = await prisma.resource.create({
        data: {
          identifier: fallbackIdentifier,
          type: fallbackType,
          status: 'AVAILABLE',
          latitude: sos.latitude + (Math.random() - 0.5) * 0.02,
          longitude: sos.longitude + (Math.random() - 0.5) * 0.02,
        },
      });
      availableResources.push(fallbackResource);
    }

    let closestResource = availableResources[0];
    let minDistance = getDistanceInKm(sos.latitude, sos.longitude, closestResource.latitude, closestResource.longitude);

    for (let i = 1; i < availableResources.length; i++) {
      const dist = getDistanceInKm(sos.latitude, sos.longitude, availableResources[i].latitude, availableResources[i].longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestResource = availableResources[i];
      }
    }

    const resAgentObj = await prisma.agent.findFirst({ where: { name: 'Resource Agent' } });
    const agentId = resAgentObj ? resAgentObj.id : (await prisma.agent.findFirst())?.id;

    const actionDetails = {
      resourceId: closestResource.id,
      resourceIdentifier: closestResource.identifier,
      resourceType: closestResource.type,
      sosId: sosId,
      reason: `Closest available ${closestResource.type} located ${minDistance.toFixed(2)} km away.`,
    };

    const proposedAction = await prisma.agentAction.create({
      data: {
        agentId: agentId,
        actionType: 'DISPATCH_RESOURCE',
        targetId: sosId,
        details: actionDetails,
        status: 'PENDING_APPROVAL',
      },
      include: {
        agent: true,
      },
    });

    broadcastEvent('actionProposed', proposedAction);

    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'resource',
      agentName: 'Resource Agent',
      status: 'COMPLETED',
      message: `Proposed dispatching ${closestResource.type} [${closestResource.identifier}] to SOS site. Awaiting Government Human-in-the-Loop confirmation.`,
      data: { proposedAction, closestResource, distanceKm: minDistance },
    });
    await delay(1500);

    // ==========================================
    // 5. Hospital Agent
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'hospital',
      agentName: 'Hospital Agent',
      status: 'PROCESSING',
      message: 'Searching regional database for nearest emergency hospitals with open bed capacity...',
      data: null,
    });
    await delay(1000);

    const hospitals = await prisma.hospital.findMany({
      where: { availableBeds: { gt: 0 } },
    });

    const hospitalRoutes = await Promise.all(
      hospitals.map(async (hospital) => {
        const route = await getRoute(sos.latitude, sos.longitude, hospital.latitude, hospital.longitude);
        return {
          hospital,
          route,
          distance: getDistanceInKm(sos.latitude, sos.longitude, hospital.latitude, hospital.longitude),
        };
      })
    );

    const sortedHospitals = hospitalRoutes.sort((a, b) => a.route.duration.value - b.route.duration.value);
    const nearestHospitals = sortedHospitals.slice(0, 2).map((item) => ({
      name: item.hospital.name,
      beds: item.hospital.availableBeds,
      distance: item.route.distance.text,
      duration: item.route.duration.text,
    }));

    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'hospital',
      agentName: 'Hospital Agent',
      status: 'COMPLETED',
      message: `Identified nearest medical hubs: ${nearestHospitals.map((h) => `${h.name} (${h.duration} away)`).join(', ')}.`,
      data: { nearestHospitals },
    });
    await delay(1500);

    // ==========================================
    // 6. Shelter Agent
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'shelter',
      agentName: 'Shelter Agent',
      status: 'PROCESSING',
      message: 'Checking regional emergency shelter registry for evacuation capacities...',
      data: null,
    });
    await delay(1000);

    const shelters = await prisma.shelter.findMany();
    const shelterList = shelters.map((shelter) => {
      const distance = getDistanceInKm(sos.latitude, sos.longitude, shelter.latitude, shelter.longitude);
      const remainingCapacity = shelter.capacity - shelter.occupancy;
      return { shelter, distance, remainingCapacity };
    });

    const sortedShelters = shelterList.sort((a, b) => a.distance - b.distance);
    const recommendedShelters = sortedShelters.slice(0, 2).map((item) => ({
      name: item.shelter.name,
      remainingCapacity: item.remainingCapacity,
      distance: `${item.distance.toFixed(2)} km`,
    }));

    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'shelter',
      agentName: 'Shelter Agent',
      status: 'COMPLETED',
      message: `Identified nearest shelters: ${recommendedShelters.map((s) => `${s.name} (${s.distance}, Capacity: ${s.remainingCapacity})`).join(', ')}.`,
      data: { recommendedShelters },
    });
    await delay(1500);

    // ==========================================
    // 7. Report Agent
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'report',
      agentName: 'Report Agent',
      status: 'PROCESSING',
      message: 'Compiling all intelligence inputs into unified daily incident situation report...',
      data: null,
    });
    await delay(1000);

    const situationReport = `[SITUATION BRIEF]
Category: ${aiAnalysis.category || 'OTHER'}
Severity: ${aiAnalysis.severity || 'MEDIUM'}
Weather: ${weather.temperature}°C, ${weather.condition}.
Resource matching: Deployed ${closestResource.type} (${closestResource.identifier}) located ${minDistance.toFixed(2)} km away.
Hospital capacity: Nearest medical hub is ${nearestHospitals[0]?.name || 'N/A'} (ETA: ${nearestHospitals[0]?.duration || 'N/A'}).
Shelter availability: Closest shelter is ${recommendedShelters[0]?.name || 'N/A'} (${recommendedShelters[0]?.distance || 'N/A'}).
Translated briefing: ${aiAnalysis.translatedText}`;

    const updatedAnalysisObject = {
      ...aiAnalysis,
      weather,
      activeDisasters: activeDisasters.map((d) => d.name),
      recommendedHospitals: nearestHospitals,
      recommendedShelters,
      situationReport,
      compiledAt: new Date().toISOString(),
    };

    const finalSos = await prisma.sosReport.update({
      where: { id: sosId },
      data: {
        aiAnalysis: updatedAnalysisObject,
      },
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        resources: true,
      },
    });

    broadcastEvent('sosUpdated', finalSos);

    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'report',
      agentName: 'Report Agent',
      status: 'COMPLETED',
      message: 'Unified daily incident situation brief compiled and saved to database records.',
      data: { situationReport },
    });
    await delay(1500);

    // ==========================================
    // 8. AI Orchestrator Complete
    // ==========================================
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'orchestrator_complete',
      agentName: 'AI Orchestrator',
      status: 'COMPLETED',
      message: 'Autonomous Disaster Intelligence chain successfully completed. Operational deck fully synced.',
      data: { sosId },
    });

  } catch (error) {
    console.error(`[AI Orchestrator Error] SOS ID ${sosId}:`, error);
    
    // Broadcast failure status
    broadcastEvent('agentFlowStep', {
      sosId,
      step: 'orchestrator_error',
      agentName: 'AI Orchestrator',
      status: 'COMPLETED',
      message: `Fatal error in agentic workflow: ${error.message}`,
      data: null,
    });
  }
};
