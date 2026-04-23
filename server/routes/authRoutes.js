import { Router } from 'express';
import { register, login, logout, getProfile, verifyEmail, resendVerification } from '../controllers/authController.js';
import { forgotPassword, verifyResetToken, resetPassword } from '../controllers/passwordResetController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { authLimiter, resetLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema, resendVerificationSchema } from '../schemas/auth.js';

const router = Router();

// Routes publiques avec rate-limiting strict + validation Zod
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

// Verification email (lien clique depuis la boite mail)
router.get('/verify/:token', verifyEmail);

// Renvoi du lien de verification
router.post('/resend-verification', authLimiter, validate(resendVerificationSchema), resendVerification);

// Password reset
router.post('/forgot-password', resetLimiter, validate(resendVerificationSchema), forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetLimiter, resetPassword);

// Deconnexion (supprime le cookie httpOnly)
router.post('/logout', logout);

// Route protegee
router.get('/me', authMiddleware, getProfile);
router.get('/profile', authMiddleware, getProfile);

export default router;
