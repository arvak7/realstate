import { Router } from 'express';
import * as UserController from '../controllers/userController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// All routes here are protected
router.use(checkJwt);

router.get('/', UserController.getMe);
router.get('/properties', UserController.getMyProperties);

export default router;
