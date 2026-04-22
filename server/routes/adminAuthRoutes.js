import { Router } from 'express';
import { adminLogin, adminVerify2FA } from '../controllers/admin2faController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Étape 1 — Vérification identifiants admin
router.post('/login', authLimiter, adminLogin);

// Étape 2 — Vérification OTP
router.post('/verify-2fa', authLimiter, adminVerify2FA);

export default router;
