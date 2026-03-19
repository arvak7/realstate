import { Router } from 'express';
import { checkJwt } from '../middleware/auth';
import { sseHandler } from '../controllers/eventsController';

const router = Router();
router.get('/', checkJwt, sseHandler);
export default router;
