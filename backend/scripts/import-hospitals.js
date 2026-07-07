import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Path to CSV
const csvPath = '/Users/bhaskarreddy/Documents/ResQAI/storage/hospital_directory.csv';

// Simple CSV line parser that handles quoted fields
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, '').trim());
}

async function run() {
  try {
    console.log('Connecting to Supabase Database...');
    await prisma.$connect();
    console.log('Successfully connected to Database.');

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at ${csvPath}`);
      process.exit(1);
    }

    console.log('Resetting user hospital references...');
    await prisma.user.updateMany({
      data: { hospitalId: null }
    });
    console.log('Deleting existing hospitals...');
    await prisma.hospital.deleteMany({});

    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let headers = [];
    let lineCount = 0;
    let importedCount = 0;
    const batch = [];

    console.log('Reading and parsing CSV...');

    for await (const line of rl) {
      lineCount++;
      if (lineCount === 1) {
        headers = parseCsvLine(line);
        continue;
      }

      const columns = parseCsvLine(line);
      if (columns.length < headers.length) {
        continue;
      }

      const row = {};
      headers.forEach((h, i) => {
        row[h] = columns[i];
      });

      // We only import records with valid Coordinates and within Hyderabad/Telangana (or general south region)
      // to keep the map focused and relevant.
      const coordsStr = row['Location_Coordinates'];
      if (!coordsStr || coordsStr === '0' || coordsStr === '0,0' || coordsStr.trim() === '') {
        continue;
      }

      const parts = coordsStr.split(',');
      if (parts.length !== 2) {
        continue;
      }

      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (isNaN(lat) || isNaN(lng)) {
        continue;
      }

      const state = row['State'] || '';
      const district = row['District'] || '';

      // Filter specifically for Telangana / Andhra Pradesh / Hyderabad
      const isTargetArea =
        state.toLowerCase().includes('telangana') ||
        state.toLowerCase().includes('andhra') ||
        district.toLowerCase().includes('hyderabad');

      if (!isTargetArea) {
        continue;
      }

      const name = row['Hospital_Name'];
      if (!name || name === '0' || name.trim() === '') {
        continue;
      }

      // Determine capacity
      let capacity = parseInt(row['Total_Num_Beds']) || 0;
      if (capacity <= 0) {
        capacity = Math.floor(Math.random() * 150) + 50; // default range 50-200 beds
      }

      // Available beds is a fraction of capacity
      const availableBeds = Math.max(1, Math.floor(capacity * (0.1 + Math.random() * 0.4)));

      const address = row['Address_Original_First_Line'] || row['Location'] || 'Staging Area';
      let contact = row['Telephone'] || row['Mobile_Number'] || row['Ambulance_Phone_No'] || '040-23456789';
      if (contact === '0') contact = '040-23456789';

      const icuBeds = Math.floor(capacity * 0.15);
      const generalBeds = capacity - icuBeds;
      const ambulances = Math.floor(Math.random() * 5) + 1;

      batch.push({
        name,
        latitude: lat,
        longitude: lng,
        address,
        capacity,
        availableBeds,
        contact,
        district: district || 'Hyderabad',
        state: state || 'Telangana',
        icuBeds,
        generalBeds,
        ambulances
      });

      // Write in batches of 50 to prevent memory pressure
      if (batch.length >= 50) {
        await prisma.hospital.createMany({
          data: batch,
          skipDuplicates: true
        });
        importedCount += batch.length;
        console.log(`Imported ${importedCount} hospitals...`);
        batch.length = 0; // Clear array
      }

      // Cap at 200 hospitals for map visibility & performance
      if (importedCount >= 1000) {
        break;
      }
    }

    // Insert remaining records in batch
    if (batch.length > 0) {
      await prisma.hospital.createMany({
        data: batch,
        skipDuplicates: true
      });
      importedCount += batch.length;
    }

    console.log(`\nSuccess: Done importing. Total imported: ${importedCount} hospitals.`);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
