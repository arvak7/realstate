import { Router, Request, Response, NextFunction } from 'express';
import * as UserController from '../controllers/userController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// Internal API key middleware for server-to-server communication
const checkInternalApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-internal-api-key'];
    if (!process.env.INTERNAL_API_KEY || apiKey !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
};

// Internal route (not protected by JWT, uses API key instead)
router.get('/internal/by-email', checkInternalApiKey, UserController.getUserByEmail);

// All routes below are protected by JWT
router.use(checkJwt);

router.get('/', UserController.getMe);
router.get('/properties', UserController.getMyProperties);

// Profile photo management
router.post('/profile-photo/upload-url', UserController.generateProfilePhotoUploadUrl);
router.put('/profile-photo', UserController.updateProfilePhoto);
router.delete('/profile-photo', UserController.deleteProfilePhoto);


export default router;
