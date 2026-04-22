import { Router } from 'express';
import { register, login, getProfile, verifyEmail, resendVerification } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Routes publiques avec rate-limiting strict
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Vérification email (lien cliqué depuis la boîte mail)
router.get('/verify/:token', verifyEmail);

// Renvoi du lien de vérification
router.post('/resend-verification', authLimiter, resendVerification);

// Route protégée — /me et /profile pointent vers le même contrôleur
router.get('/me', authMiddleware, getProfile);
router.get('/profile', authMiddleware, getProfile);

export default router;
