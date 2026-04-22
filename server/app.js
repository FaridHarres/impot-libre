import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { generalLimiter } from './middlewares/rateLimiter.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import allocationRoutes from './routes/allocationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import ministereRoutes from './routes/ministereRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// === Middlewares globaux ===

// Sécurité HTTP headers
app.use(helmet());

// CORS — autorise le frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting global
app.use(generalLimiter);

// Parser JSON (limite à 1 Mo pour éviter les abus)
app.use(express.json({ limit: '1mb' }));

// Confiance au premier proxy (pour X-Forwarded-For)
app.set('trust proxy', 1);

// === Montage des routes ===
app.use('/api/auth', authRoutes);
app.use('/api/ministeres', ministereRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Route de santé
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Gestion des erreurs ===

// 404 — route non trouvée
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

// Gestionnaire d'erreurs global
app.use((err, _req, res, _next) => {
  console.error('[SERVER] Erreur non gérée :', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur.'
      : err.message,
  });
});

// === Démarrage du serveur ===
app.listen(PORT, () => {
  console.log(`[SERVER] impot-libre.fr API démarrée sur le port ${PORT}`);
  console.log(`[SERVER] Environnement : ${process.env.NODE_ENV || 'development'}`);
});

export default app;
