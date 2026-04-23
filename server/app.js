import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { generalLimiter } from './middlewares/rateLimiter.js';
import logger from './utils/logger.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import allocationRoutes from './routes/allocationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import ministereRoutes from './routes/ministereRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// === Confiance au premier proxy (Railway, etc.) ===
app.set('trust proxy', 1);

// === Middlewares globaux ===

// Sécurité HTTP headers — Helmet avec CSP strict
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: IS_PROD ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // nécessaire si le frontend est séparé
    hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

// Cookie parser (pour lire les cookies httpOnly)
app.use(cookieParser());

// CORS — autorise UNIQUEMENT le frontend, méthodes restreintes
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (!origin && !IS_PROD) {
        // Autoriser curl/Postman en dev uniquement
        callback(null, true);
      } else {
        callback(new Error('CORS non autorisé'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting global
app.use(generalLimiter);

// Parser JSON (limite à 100 Ko pour éviter les abus)
app.use(express.json({ limit: '100kb' }));

// CSRF protection — double-submit cookie pattern
// Le serveur set un token CSRF dans un cookie lisible par JS
// Le frontend le renvoie dans le header X-CSRF-Token
// Le middleware vérifie que les deux correspondent
app.use((req, res, next) => {
  try {
    // Set CSRF cookie on GET requests (lisible par JS, pas httpOnly)
    if (req.method === 'GET' && req.cookies && !req.cookies.csrf_token) {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'none' : 'lax',
        path: '/',
        maxAge: 60 * 60 * 1000,
      });
    }

    // Vérifier CSRF sur les requêtes mutatives (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const cookieToken = req.cookies?.csrf_token;
      const headerToken = req.headers['x-csrf-token'];

      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        const exemptPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/resend-verification', '/api/newsletter/subscribe'];
        const isExempt = exemptPaths.some((p) => req.path.startsWith(p));

        if (!isExempt && req.cookies?.token) {
          return res.status(403).json({ message: 'Token CSRF invalide.', error: 'csrf_invalid' });
        }
      }
    }
  } catch (err) {
    console.error('[CSRF] Erreur middleware:', err.message);
  }

  next();
});

// === Montage des routes ===
app.use('/api/auth', authRoutes);
app.use('/api/ministeres', ministereRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Route de santé (pas de données sensibles)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// === Gestion des erreurs ===

// 404 — route non trouvée
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, _next) => {
  logger.error('Erreur non gérée', {
    error: err.message,
    stack: IS_PROD ? undefined : err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    error: err.message,
    stack: err.stack?.split('\n').slice(0, 3),
  });
});

// === Démarrage du serveur ===
app.listen(PORT, () => {
  logger.info(`API démarrée sur le port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
  });
});

export default app;
