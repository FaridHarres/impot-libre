import { Router } from 'express';
import { adminLogin, adminVerify2FA } from '../controllers/admin2faController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { adminLoginSchema, adminVerify2FASchema } from '../schemas/auth.js';

const router = Router();

// Etape 1 — Verification identifiants admin (+ validation Zod)
router.post('/login', authLimiter, validate(adminLoginSchema), adminLogin);

// Etape 2 — Verification OTP (+ validation Zod)
router.post('/verify-2fa', authLimiter, validate(adminVerify2FASchema), adminVerify2FA);

export default router;
