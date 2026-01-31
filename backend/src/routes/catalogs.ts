import { Router } from 'express';
import * as CatalogController from '../controllers/catalogController';

const router = Router();

// All catalog endpoints are public (no authentication required)
router.get('/property-types', CatalogController.getPropertyTypes);
router.get('/conditions', CatalogController.getPropertyConditions);
router.get('/orientations', CatalogController.getOrientations);
router.get('/energy-labels', CatalogController.getEnergyLabels);
router.get('/provinces', CatalogController.getProvinces);
router.get('/municipalities', CatalogController.getMunicipalities);

export default router;
