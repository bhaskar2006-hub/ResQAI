import prisma from '../services/prisma.service.js';

export const getNGOs = async (req, res, next) => {
  try {
    const { district, focus } = req.query;
    const where = {};
    if (district) where.district = district;
    if (focus) where.focus = focus;
    const ngos = await prisma.nGO.findMany({ where, orderBy: { volunteers: 'desc' } });
    res.json({ success: true, data: { ngos } });
  } catch (error) { next(error); }
};

export const getWarehouses = async (req, res, next) => {
  try {
    const { district } = req.query;
    const where = district ? { district } : {};
    const warehouses = await prisma.warehouse.findMany({ where });
    res.json({ success: true, data: { warehouses } });
  } catch (error) { next(error); }
};

export const getGovernmentOffices = async (req, res, next) => {
  try {
    const { district, department } = req.query;
    const where = {};
    if (district) where.district = district;
    if (department) where.department = department;
    const offices = await prisma.governmentOffice.findMany({ where });
    res.json({ success: true, data: { offices } });
  } catch (error) { next(error); }
};

export const getFireStations = async (req, res, next) => {
  try {
    const { district } = req.query;
    const where = district ? { district } : {};
    const stations = await prisma.fireStation.findMany({ where, orderBy: { trucks: 'desc' } });
    res.json({ success: true, data: { stations } });
  } catch (error) { next(error); }
};

export const getSupplies = async (req, res, next) => {
  try {
    const { district, type } = req.query;
    const where = {};
    if (district) where.district = district;
    if (type) where.type = type;
    const supplies = await prisma.supply.findMany({ where, orderBy: { quantity: 'desc' } });
    res.json({ success: true, data: { supplies } });
  } catch (error) { next(error); }
};

export const getDistrictOverview = async (req, res, next) => {
  try {
    const [hospitals, shelters, ngos, warehouses, supplies, fireStations] = await Promise.all([
      prisma.hospital.groupBy({ by: ['district'], _sum: { icuBeds: true, generalBeds: true, availableBeds: true, ambulances: true }, _count: true }),
      prisma.shelter.groupBy({ by: ['district'], _sum: { capacity: true, occupancy: true }, _count: true }),
      prisma.nGO.groupBy({ by: ['district'], _sum: { volunteers: true }, _count: true }),
      prisma.warehouse.groupBy({ by: ['district'], _sum: { foodKits: true, water: true, medicine: true }, _count: true }),
      prisma.supply.groupBy({ by: ['district', 'type'], _sum: { quantity: true } }),
      prisma.fireStation.groupBy({ by: ['district'], _sum: { trucks: true }, _count: true }),
    ]);

    const totals = {
      hospitals: { count: 0, icuBeds: 0, generalBeds: 0, ambulances: 0 },
      shelters: { count: 0, capacity: 0, occupancy: 0 },
      ngos: { count: 0, volunteers: 0 },
      warehouses: { count: 0, foodKits: 0, water: 0, medicine: 0 },
      supplies: { count: 0 },
      fireStations: { count: 0, trucks: 0 },
    };

    hospitals.forEach(h => {
      totals.hospitals.count += h._count;
      totals.hospitals.icuBeds += h._sum.icuBeds || 0;
      totals.hospitals.generalBeds += h._sum.generalBeds || 0;
      totals.hospitals.ambulances += h._sum.ambulances || 0;
    });
    shelters.forEach(s => {
      totals.shelters.count += s._count;
      totals.shelters.capacity += s._sum.capacity || 0;
      totals.shelters.occupancy += s._sum.occupancy || 0;
    });
    ngos.forEach(n => {
      totals.ngos.count += n._count;
      totals.ngos.volunteers += n._sum.volunteers || 0;
    });
    warehouses.forEach(w => {
      totals.warehouses.count += w._count;
      totals.warehouses.foodKits += w._sum.foodKits || 0;
      totals.warehouses.water += w._sum.water || 0;
      totals.warehouses.medicine += w._sum.medicine || 0;
    });
    fireStations.forEach(f => {
      totals.fireStations.count += f._count;
      totals.fireStations.trucks += f._sum.trucks || 0;
    });

    const districtMap = {};
    const allDistricts = [...new Set([
      ...hospitals.map(h => h.district),
      ...shelters.map(s => s.district),
      ...ngos.map(n => n.district),
      ...warehouses.map(w => w.district),
      ...fireStations.map(f => f.district),
    ])];

    allDistricts.forEach(d => {
      if (!d) return;
      districtMap[d] = {
        hospitals: hospitals.find(h => h.district === d)?._count || 0,
        hospitalBeds: (hospitals.find(h => h.district === d)?._sum.icuBeds || 0) + (hospitals.find(h => h.district === d)?._sum.generalBeds || 0),
        shelters: shelters.find(s => s.district === d)?._count || 0,
        shelterCapacity: shelters.find(s => s.district === d)?._sum.capacity || 0,
        ngos: ngos.find(n => n.district === d)?._count || 0,
        ngoVolunteers: ngos.find(n => n.district === d)?._sum.volunteers || 0,
        warehouses: warehouses.find(w => w.district === d)?._count || 0,
        foodKits: warehouses.find(w => w.district === d)?._sum.foodKits || 0,
        water: warehouses.find(w => w.district === d)?._sum.water || 0,
        medicine: warehouses.find(w => w.district === d)?._sum.medicine || 0,
        fireStations: fireStations.find(f => f.district === d)?._count || 0,
        fireTrucks: fireStations.find(f => f.district === d)?._sum.trucks || 0,
      };
    });

    const districtSupplies = {};
    supplies.forEach(s => {
      if (!s.district) return;
      if (!districtSupplies[s.district]) districtSupplies[s.district] = {};
      districtSupplies[s.district][s.type] = (districtSupplies[s.district][s.type] || 0) + (s._sum.quantity || 0);
    });

    res.json({
      success: true,
      data: {
        totals,
        districtOverview: districtMap,
        districtSupplies,
      },
    });
  } catch (error) { next(error); }
};
