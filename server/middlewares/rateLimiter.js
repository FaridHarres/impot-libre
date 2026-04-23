import rateLimit from 'express-rate-limit';

/**
 * Limiteur general : 100 requetes par fenetre de 15 minutes.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes. Veuillez reessayer dans quelques minutes.' },
});

/**
 * Limiteur strict pour les routes d'authentification : 5 requetes par 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Veuillez reessayer dans 15 minutes.' },
});

/**
 * Limiteur reset mot de passe : 3 par 30 minutes par IP.
 */
export const resetLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de demandes. Veuillez réessayer dans 30 minutes.' },
});

/**
 * Limiteur inscription : 3 comptes par heure par IP.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'inscriptions. Veuillez reessayer dans une heure.' },
});
