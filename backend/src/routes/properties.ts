import { Router } from 'express';
import * as PropertyController from '../controllers/propertyController';
import { checkJwt, optionalAuth } from '../middleware/auth';

const router = Router();

// Static routes MUST come before :id routes
router.get('/clauses', PropertyController.listClauses);
router.get('/services', PropertyController.listServices);

// Public routes (with optional auth for personalization viewing)
router.get('/', optionalAuth, PropertyController.getProperties);

// Protected routes (static paths before :id)
router.post('/', checkJwt, PropertyController.createProperty);
router.post('/upload-url', checkJwt, PropertyController.generateUploadUrl);

// Contact management — must be before /:id to avoid conflict
router.put('/contacts/:contactId/status', checkJwt, PropertyController.updateContactStatus);

// Param routes
router.get('/:id', optionalAuth, PropertyController.getPropertyById);
router.put('/:id', checkJwt, PropertyController.updateProperty);
router.delete('/:id', checkJwt, PropertyController.deleteProperty);

// Photo access routes
router.get('/:id/photo-access', checkJwt, PropertyController.getPhotoAccess);
router.post('/:id/photo-access', checkJwt, PropertyController.requestPhotoAccess);

// Contact routes
router.post('/:id/contact', checkJwt, PropertyController.createContact);
router.get('/:id/contact-status', checkJwt, PropertyController.getContactStatus);

export default router;
