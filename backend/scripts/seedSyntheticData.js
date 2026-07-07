import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const CSV_DIR = path.resolve(__dirname, '../../storage/ResQAI_Synthetic_Dataset 2');

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = raw.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    result.push(row);
  }
  return result;
}

async function seedHospitals() {
  const rows = parseCSV(path.join(CSV_DIR, 'hospitals.csv'));
  const hospitals = rows.map(r => ({
    name: r.name,
    state: r.state || '',
    district: r.district || '',
    latitude: parseFloat(r.lat) || 0,
    longitude: parseFloat(r.lon) || 0,
    address: `${r.district || ''}, ${r.state || ''}`,
    icuBeds: parseInt(r.icu_beds) || 0,
    generalBeds: parseInt(r.general_beds) || 0,
    capacity: (parseInt(r.icu_beds) || 0) + (parseInt(r.general_beds) || 0),
    availableBeds: r.status === 'Available' ? (parseInt(r.icu_beds) || 0) + (parseInt(r.general_beds) || 0) : Math.floor((parseInt(r.general_beds) || 0) * 0.3),
    ambulances: parseInt(r.ambulances) || 0,
    status: r.status || 'Available',
    contact: `${r.district}@health.gov.in`,
  }));

  for (const h of hospitals) {
    await prisma.hospital.create({ data: h });
  }
  console.log(`Seeded ${hospitals.length} hospitals`);
}

async function seedShelters() {
  const rows = parseCSV(path.join(CSV_DIR, 'shelters.csv'));
  for (const r of rows) {
    const lat = 12.9 + Math.random() * 5;
    const lon = 77.2 + Math.random() * 3;
    await prisma.shelter.create({
      data: {
        name: r.name,
        district: r.district || '',
        latitude: lat,
        longitude: lon,
        address: r.district || '',
        capacity: parseInt(r.capacity) || 100,
        occupancy: parseInt(r.occupied) || 0,
        contact: `${(r.district || 'shelter').toLowerCase()}@relief.gov.in`,
      },
    });
  }
  console.log(`Seeded ${rows.length} shelters`);
}

async function seedNGOs() {
  const rows = parseCSV(path.join(CSV_DIR, 'ngos.csv'));
  for (const r of rows) {
    await prisma.nGO.create({
      data: {
        name: r.name,
        state: r.state || '',
        district: r.district || '',
        focus: r.focus || '',
        volunteers: parseInt(r.volunteers) || 0,
        status: r.status || 'Active',
      },
    });
  }
  console.log(`Seeded ${rows.length} NGOs`);
}

async function seedWarehouses() {
  const rows = parseCSV(path.join(CSV_DIR, 'warehouses.csv'));
  for (const r of rows) {
    await prisma.warehouse.create({
      data: {
        district: r.district || '',
        foodKits: parseInt(r.food_kits) || 0,
        water: parseInt(r.water) || 0,
        medicine: parseInt(r.medicine) || 0,
      },
    });
  }
  console.log(`Seeded ${rows.length} warehouses`);
}

async function seedGovernmentOffices() {
  const rows = parseCSV(path.join(CSV_DIR, 'government_offices.csv'));
  for (const r of rows) {
    await prisma.governmentOffice.create({
      data: {
        department: r.department || '',
        district: r.district || '',
        officer: r.officer || '',
      },
    });
  }
  console.log(`Seeded ${rows.length} government offices`);
}

async function seedFireStations() {
  const rows = parseCSV(path.join(CSV_DIR, 'fire_stations.csv'));
  for (const r of rows) {
    await prisma.fireStation.create({
      data: {
        name: r.name,
        district: r.district || '',
        trucks: parseInt(r.trucks) || 0,
      },
    });
  }
  console.log(`Seeded ${rows.length} fire stations`);
}

async function seedSupplies() {
  const rows = parseCSV(path.join(CSV_DIR, 'resources.csv'));
  for (const r of rows) {
    const typeMap = {
      'Food': 'FOOD',
      'Water': 'WATER',
      'Medicines': 'MEDICINES',
      'Tents': 'TENTS',
      'Blankets': 'BLANKETS',
    };
    await prisma.supply.create({
      data: {
        type: typeMap[r.type] || 'OTHER',
        district: r.district || '',
        quantity: parseInt(r.quantity) || 0,
        status: r.status || 'Available',
      },
    });
  }
  console.log(`Seeded ${rows.length} supplies`);
}

async function seedResources() {
  // Ambulances
  const ambRows = parseCSV(path.join(CSV_DIR, 'ambulances.csv'));
  for (const r of ambRows) {
    const lat = 12.9 + Math.random() * 6;
    const lon = 77.2 + Math.random() * 3;
    await prisma.resource.create({
      data: {
        type: 'AMBULANCE',
        status: r.status === 'On Duty' ? 'ASSIGNED' : 'AVAILABLE',
        identifier: r.vehicle,
        latitude: lat,
        longitude: lon,
      },
    });
  }
  console.log(`Seeded ${ambRows.length} ambulances`);

  // Rescue boats
  const boatRows = parseCSV(path.join(CSV_DIR, 'rescue_boats.csv'));
  for (const r of boatRows) {
    const lat = 12.9 + Math.random() * 6;
    const lon = 77.2 + Math.random() * 3;
    await prisma.resource.create({
      data: {
        type: 'BOAT',
        status: r.status === 'Deployed' ? 'ASSIGNED' : 'AVAILABLE',
        identifier: r.boat,
        latitude: lat,
        longitude: lon,
      },
    });
  }
  console.log(`Seeded ${boatRows.length} rescue boats`);

  // Volunteers
  const volRows = parseCSV(path.join(CSV_DIR, 'volunteers.csv'));
  for (const r of volRows) {
    const lat = 12.9 + Math.random() * 6;
    const lon = 77.2 + Math.random() * 3;
    await prisma.resource.create({
      data: {
        type: 'VOLUNTEER',
        status: r.availability === 'Assigned' ? 'ASSIGNED' : 'AVAILABLE',
        identifier: r.name,
        latitude: lat,
        longitude: lon,
      },
    });
  }
  console.log(`Seeded ${volRows.length} volunteers`);
}

async function main() {
  console.log('Starting synthetic data seed...\n');

  // Clear existing data for these models
  await prisma.supply.deleteMany();
  await prisma.fireStation.deleteMany();
  await prisma.governmentOffice.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.nGO.deleteMany();
  await prisma.resource.deleteMany({ where: { type: { in: ['AMBULANCE', 'BOAT', 'VOLUNTEER'] } } });
  await prisma.shelter.deleteMany();
  await prisma.hospital.deleteMany();

  await seedHospitals();
  await seedShelters();
  await seedNGOs();
  await seedWarehouses();
  await seedGovernmentOffices();
  await seedFireStations();
  await seedSupplies();
  await seedResources();

  console.log('\nSynthetic data seeding complete!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
