import { Router } from 'express';
import { submitAllocation, getMyAllocation, getPublicStats } from '../controllers/allocationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint public — statistiques agrégées
router.get('/stats', getPublicStats);

// Routes protégées
router.post('/', authMiddleware, submitAllocation);
router.get('/me', authMiddleware, getMyAllocation);

export default router;
