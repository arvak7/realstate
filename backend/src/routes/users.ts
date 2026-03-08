import { Router } from 'express';
import * as UserController from '../controllers/userController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// All routes below are protected by JWT
router.use(checkJwt);

router.get('/', UserController.getMe);
router.get('/properties', UserController.getMyProperties);
router.get('/contacts', UserController.getMyContacts);

// Profile photo management
router.post('/profile-photo/upload-url', UserController.generateProfilePhotoUploadUrl);
router.put('/profile-photo', UserController.updateProfilePhoto);
router.delete('/profile-photo', UserController.deleteProfilePhoto);


export default router;
