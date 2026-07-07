import { Router } from 'express';
import * as dataController from '../controllers/data.controller.js';

const router = Router();

router.get('/ngos', dataController.getNGOs);
router.get('/warehouses', dataController.getWarehouses);
router.get('/government-offices', dataController.getGovernmentOffices);
router.get('/fire-stations', dataController.getFireStations);
router.get('/supplies', dataController.getSupplies);
router.get('/district-overview', dataController.getDistrictOverview);

export default router;
