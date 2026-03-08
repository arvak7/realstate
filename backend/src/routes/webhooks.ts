import { Router } from 'express';
import { complementToken, captureIdpPicture } from '../controllers/zitadelWebhookController';

const router = Router();

// Actions V2 Function webhook: adds picture claim to tokens
router.post('/zitadel/complement-token', complementToken);

// Actions V2 Response webhook: captures Google picture from IdP intent
router.post('/zitadel/idp-picture', captureIdpPicture);

export default router;
