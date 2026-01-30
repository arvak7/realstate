import { Router } from 'express';
import * as PropertyController from '../controllers/propertyController';
import { checkJwt, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (with optional auth for personalization viewing)
router.get('/', optionalAuth, PropertyController.getProperties);
router.get('/:id', optionalAuth, PropertyController.getPropertyById);

// Protected routes
router.post('/', checkJwt, PropertyController.createProperty);
router.put('/:id', checkJwt, PropertyController.updateProperty);
router.delete('/:id', checkJwt, PropertyController.deleteProperty);
router.post('/upload-url', checkJwt, PropertyController.generateUploadUrl);

// User specific routes
// Note: This endpoint is technically cleaner at /users/me/properties or /me/properties
// For now, we keep it here but it might need to mask /:id collision if not careful.
// However, since 'upload-url' and 'me' are strings, they will be caught by /:id if defined AFTER.
// But 'me' is not a UUID, so we can route validation or just ensure specific routes come first.
// The index.ts had /me/properties defined separately. We will handle that in index.ts or a separate user router.
// For now, I will NOT include /me/properties here to avoid confusion. It belongs in a User controller/route.

export default router;
