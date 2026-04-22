import { Router } from 'express';
import { subscribe, unsubscribe, listSubscribers, sendCampaign } from '../controllers/newsletterController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = Router();

// Routes publiques
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Routes admin
router.get('/subscribers', authMiddleware, adminMiddleware, listSubscribers);
router.post('/campaign', authMiddleware, adminMiddleware, sendCampaign);

export default router;
