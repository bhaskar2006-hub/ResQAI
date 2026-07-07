import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1) Cleanup existing records
  console.log('Cleaning up database...');
  await prisma.user.deleteMany({});
  await prisma.agentAction.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.sosReport.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.disaster.deleteMany({});
  await prisma.agent.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.shelter.deleteMany({});
  console.log('Cleanup completed.');

  // 2) Seed AI Agents
  const agents = [
    { name: 'AI Orchestrator', type: 'ALLOCATOR', status: 'ACTIVE', capabilities: ['coordinate_agents', 'delegate_tasks', 'summarize_case'] },
    { name: 'Prediction Agent', type: 'FORECASTER', status: 'ACTIVE', capabilities: ['fetch_weather', 'analyze_disaster_risk'] },
    { name: 'SOS Agent', type: 'TRANSLATOR', status: 'ACTIVE', capabilities: ['translate_text', 'categorize_incident', 'determine_severity'] },
    { name: 'Resource Agent', type: 'ALLOCATOR', status: 'ACTIVE', capabilities: ['find_closest_resource', 'allocate_resource'] },
    { name: 'Hospital Agent', type: 'SEARCH_AND_RESCUE', status: 'ACTIVE', capabilities: ['find_nearest_hospital', 'check_hospital_beds'] },
    { name: 'Shelter Agent', type: 'SEARCH_AND_RESCUE', status: 'ACTIVE', capabilities: ['find_nearest_shelter', 'check_shelter_capacity'] },
    { name: 'Report Agent', type: 'TRANSLATOR', status: 'ACTIVE', capabilities: ['generate_situation_report', 'compile_brief'] },
  ];

  for (const a of agents) {
    await prisma.agent.create({ data: a });
  }
  console.log(`Seeded ${agents.length} AI Agents successfully.`);

  // 3) Seed Hospitals
  const hospitals = [
    { name: 'General Hospital', latitude: 17.385, longitude: 78.4867, address: 'Koti, Hyderabad', capacity: 500, availableBeds: 120, contact: '+91 40-1234-5678' },
    { name: 'City Trauma Center', latitude: 17.3616, longitude: 78.4747, address: 'Charminar, Hyderabad', capacity: 300, availableBeds: 45, contact: '+91 40-8765-4321' },
    { name: 'Metropolitan Medical Hub', latitude: 17.4085, longitude: 78.4378, address: 'Banjara Hills, Hyderabad', capacity: 800, availableBeds: 210, contact: '+91 40-5555-1212' },
  ];

  const createdHospitals = [];
  for (const h of hospitals) {
    const created = await prisma.hospital.create({ data: h });
    createdHospitals.push(created);
  }
  console.log(`Seeded ${hospitals.length} hospitals successfully.`);

  // 4) Seed Shelters
  const shelters = [
    { name: 'Shelter Hub A (Gymnasium)', latitude: 17.4156, longitude: 78.4747, address: 'Secunderabad Sports Center', capacity: 500, occupancy: 350, contact: '+91 90111-22222' },
    { name: 'Shelter Hub B (Stadium)', latitude: 17.3984, longitude: 78.5020, address: 'L.B. Stadium, Hyderabad', capacity: 1200, occupancy: 920, contact: '+91 90333-44444' },
    { name: 'Emergency Center C', latitude: 17.3685, longitude: 78.4520, address: 'Bahadurpura Community Hall', capacity: 250, occupancy: 50, contact: '+91 90555-66666' },
  ];

  for (const s of shelters) {
    await prisma.shelter.create({ data: s });
  }
  console.log(`Seeded ${shelters.length} shelters successfully.`);

  // 5) Seed Resources
  const resources = [
    { identifier: 'AMB-01', type: 'AMBULANCE', status: 'AVAILABLE', latitude: 17.3890, longitude: 78.4900 },
    { identifier: 'AMB-02', type: 'AMBULANCE', status: 'AVAILABLE', latitude: 17.3710, longitude: 78.4601 },
    { identifier: 'FT-01', type: 'FIRE_TRUCK', status: 'AVAILABLE', latitude: 17.4012, longitude: 78.4641 },
    { identifier: 'RB-01', type: 'BOAT', status: 'AVAILABLE', latitude: 17.3580, longitude: 78.4716 },
    { identifier: 'VOL-01', type: 'VOLUNTEER', status: 'AVAILABLE', latitude: 17.4101, longitude: 78.4950 },
  ];

  const createdResources = [];
  for (const r of resources) {
    const created = await prisma.resource.create({ data: r });
    createdResources.push(created);
  }
  console.log(`Seeded ${resources.length} active response resources successfully.`);

  // 6) Seed Users (including new Hospital and Volunteer roles, coordinates set for Hyderabad)
  const hashedPassword = await bcrypt.hash('password123', 12);

  const generalHospital = createdHospitals[0];
  const volunteerResource = createdResources.find(r => r.identifier === 'VOL-01');

  const users = [
    { email: 'citizen@resqai.com', name: 'John Doe', password: hashedPassword, role: 'CITIZEN' },
    { email: 'gov@resqai.com', name: 'Gov Command', password: hashedPassword, role: 'GOVERNMENT' },
    { email: 'ngo@resqai.com', name: 'NGO Helper', password: hashedPassword, role: 'NGO' },
    { email: 'admin@resqai.com', name: 'Admin Operator', password: hashedPassword, role: 'ADMIN' },
    { 
      email: 'hospital@resqai.com', 
      name: 'General Hospital Admin', 
      password: hashedPassword, 
      role: 'HOSPITAL',
      hospitalId: generalHospital.id
    },
    { 
      email: 'volunteer@resqai.com', 
      name: 'Volunteer Responder', 
      password: hashedPassword, 
      role: 'VOLUNTEER',
      resourceId: volunteerResource ? volunteerResource.id : null
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log(`Seeded ${users.length} users successfully.`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
