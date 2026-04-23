import { Router } from 'express';
import { downloadPDF } from '../controllers/pdfController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de téléchargements. Réessayez dans une heure.' },
});

router.get('/download', authMiddleware, pdfLimiter, downloadPDF);

export default router;
