import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { hashIP, hashFingerprint } from '../utils/hashFingerprint.js';
import { sendVerificationEmail } from '../utils/mailer.js';
import logger from '../utils/logger.js';

const BCRYPT_ROUNDS = 12;
const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_USER_EXPIRY = '1h';
const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1h

/**
 * Hash un session ID avec SHA-256 pour stockage en BDD.
 */
function hashSessionId(rawId) {
  return crypto.createHash('sha256').update(rawId).digest('hex');
}

/**
 * Nettoyage opportuniste des sessions expirées/révoquées.
 * Non-bloquant — ne fait jamais échouer le login.
 */
function cleanupSessions() {
  pool.query(
    "DELETE FROM sessions WHERE expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days')"
  ).catch(() => {});
}

/**
 * Helper : configure le cookie httpOnly contenant le JWT.
 */
function setTokenCookie(res, token, maxAgeMs = 60 * 60 * 1000) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

/**
 * Inscription d'un nouvel utilisateur.
 * POST /api/auth/register
 * Body validé par Zod (middleware validate) avant d'arriver ici.
 */
export async function register(req, res) {
  try {
    const { prenom, nom, email, password, resolution, language } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Un compte existe déjà avec cet email.',
        error: 'Un compte existe déjà avec cet email.',
      });
    }

    // Calcul des empreintes pour la détection de doublons
    const ip = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    const ipHash = hashIP(ip);
    const fpHash = hashFingerprint(ip, userAgent, resolution || '', language || '');

    // Vérifier les doublons par empreinte (désactivé en dev)
    if (process.env.NODE_ENV === 'production') {
      const duplicateCheck = await pool.query(
        'SELECT id FROM users WHERE ip_hash = $1 AND fingerprint_hash = $2',
        [ipHash, fpHash]
      );

      if (duplicateCheck.rows.length > 0) {
        logger.warn('DOUBLON_INSCRIPTION', { ip_hash: ipHash, email });
        return res.status(409).json({
          message: 'Un compte a déjà été créé depuis ce navigateur. Un seul compte par personne est autorisé.',
          error: 'Un compte a déjà été créé depuis ce navigateur. Un seul compte par personne est autorisé.',
        });
      }
    } else {
      logger.info('DEV_MODE: vérification doublon fingerprint désactivée', { email });
    }

    // Hashage du mot de passe
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Générer un token de vérification email
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Créer l'utilisateur (non vérifié)
    const result = await pool.query(
      `INSERT INTO users (prenom, nom, email, password_hash, ip_hash, fingerprint_hash, role,
                          email_verified, verify_token, verify_expires)
       VALUES ($1, $2, $3, $4, $5, $6, 'user', FALSE, $7, $8)
       RETURNING id, prenom, nom, email, role, email_verified, created_at`,
      [prenom.trim(), nom.trim(), email, passwordHash, ipHash, fpHash, verifyToken, verifyExpires]
    );

    const user = result.rows[0];

    logger.info('INSCRIPTION', { userId: user.id, email: user.email });

    // Envoyer l'email de confirmation
    try {
      await sendVerificationEmail(user.email, user.prenom, verifyToken);
    } catch (emailErr) {
      logger.error('ERREUR_EMAIL_VERIFICATION', { userId: user.id, error: emailErr.message });
    }

    return res.status(201).json({
      message: 'Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre adresse.',
      user: {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
      },
    });
  } catch (err) {
    logger.error('ERREUR_INSCRIPTION', { error: err.message });
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * Confirmation de l'email via le lien reçu.
 * GET /api/auth/verify/:token
 */
export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      const baseUrl = process.env.FRONTEND_URL || 'https://impot-libre.fr';
      return res.redirect(`${baseUrl}/connexion?verify_error=true`);
    }

    const result = await pool.query(
      `SELECT id, email, prenom FROM users
       WHERE verify_token = $1 AND verify_expires > NOW() AND email_verified = FALSE`,
      [token]
    );

    if (result.rows.length === 0) {
      const baseUrl = process.env.FRONTEND_URL || 'https://impot-libre.fr';
      return res.redirect(`${baseUrl}/connexion?verify_error=true`);
    }

    await pool.query(
      `UPDATE users
       SET email_verified = TRUE, verify_token = NULL, verify_expires = NULL
       WHERE id = $1`,
      [result.rows[0].id]
    );

    logger.info('EMAIL_VERIFIE', { userId: result.rows[0].id, email: result.rows[0].email });

    const baseUrl = process.env.FRONTEND_URL || 'https://impot-libre.fr';
    return res.redirect(`${baseUrl}/connexion?verified=true`);
  } catch (err) {
    logger.error('ERREUR_VERIFICATION_EMAIL', { error: err.message });
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * Renvoi du lien de vérification.
 * POST /api/auth/resend-verification
 */
export async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis.', error: 'Email requis.' });
    }

    const result = await pool.query(
      `SELECT id, prenom, email FROM users
       WHERE email = $1 AND email_verified = FALSE`,
      [email.toLowerCase().trim()]
    );

    // Réponse identique que l'email existe ou non (anti-énumération)
    const genericMessage = 'Si un compte non vérifié existe avec cet email, un nouveau lien a été envoyé.';

    if (result.rows.length === 0) {
      return res.json({ message: genericMessage });
    }

    const user = result.rows[0];

    // Rate limit par email en BDD : max 3 en 30 minutes
    const recentCount = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM users
       WHERE id = $1 AND verify_expires > NOW() - INTERVAL '30 minutes'`,
      [user.id]
    );
    if (recentCount.rows[0].cnt >= 3) {
      return res.json({ message: genericMessage });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET verify_token = $1, verify_expires = $2 WHERE id = $3`,
      [verifyToken, verifyExpires, user.id]
    );

    try {
      await sendVerificationEmail(user.email, user.prenom, verifyToken);
    } catch (emailErr) {
      logger.error('ERREUR_RENVOI_EMAIL', { userId: user.id, error: emailErr.message });
    }

    return res.json({ message: genericMessage });
  } catch (err) {
    logger.error('ERREUR_RESEND_VERIFICATION', { error: err.message });
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * Connexion d'un utilisateur existant.
 * POST /api/auth/login
 * Body validé par Zod (middleware validate) avant d'arriver ici.
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Rechercher l'utilisateur (sélection explicite — jamais de *)
    const result = await pool.query(
      'SELECT id, prenom, nom, email, password_hash, role, email_verified, failed_login_attempts, locked_until FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Identifiants incorrects.',
        error: 'Identifiants incorrects.',
      });
    }

    const user = result.rows[0];

    // Vérifier si le compte est verrouillé
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      logger.warn('LOGIN_COMPTE_VERROUILLE', { email, ip: req.ip, minutesLeft });
      return res.status(429).json({
        message: `Compte temporairement verrouillé. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        error: 'account_locked',
      });
    }

    // Vérification du mot de passe
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const lockout = attempts >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await pool.query(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockout, user.id]
      );

      if (lockout) {
        logger.warn('LOGIN_VERROUILLAGE', { email, ip: req.ip, attempts });
      } else {
        logger.warn('TENTATIVE_LOGIN_ECHEC', { email, ip: req.ip, attempts });
      }

      return res.status(401).json({
        message: 'Identifiants incorrects.',
        error: 'Identifiants incorrects.',
      });
    }

    // Login réussi — reset le compteur
    if (user.failed_login_attempts > 0) {
      await pool.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
        [user.id]
      );
    }

    // Vérifier que l'email est confirmé (sauf admin, qui passe par le 2FA)
    if (user.role !== 'admin' && !user.email_verified) {
      return res.status(403).json({
        message: 'Veuillez confirmer votre adresse email avant de vous connecter.',
        error: 'email_not_verified',
        // NE PAS renvoyer l'email dans la réponse (anti-énumération)
      });
    }

    // Nettoyage opportuniste des anciennes sessions (non-bloquant)
    cleanupSessions();

    // Créer une session en BDD
    const rawSessionId = crypto.randomBytes(32).toString('hex');
    const sessionHash = hashSessionId(rawSessionId);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    await pool.query(
      'INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [sessionHash, user.id, expiresAt, req.ip || '', (req.headers['user-agent'] || '').slice(0, 500)]
    );

    // JWT avec session hash (claim sid)
    const token = jwt.sign(
      { id: user.id, role: user.role, sid: sessionHash },
      process.env.JWT_SECRET,
      { expiresIn: JWT_USER_EXPIRY }
    );

    // Cookie httpOnly uniquement — PAS de token dans le body
    setTokenCookie(res, token, SESSION_MAX_AGE_MS);

    logger.info('CONNEXION', { userId: user.id, role: user.role, ip: req.ip, sessionId: sessionHash.slice(0, 8) });

    return res.json({
      message: 'Connexion réussie.',
      user: {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
      },
    });
  } catch (err) {
    logger.error('ERREUR_LOGIN', { error: err.message });
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * Déconnexion — supprime le cookie httpOnly.
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  // Révoquer la session en BDD si un token valide est présent
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.sid) {
        await pool.query(
          'UPDATE sessions SET revoked_at = NOW() WHERE id = $1',
          [decoded.sid]
        );
        logger.info('DECONNEXION', { userId: decoded.id, sessionId: decoded.sid.slice(0, 8) });
      }
    }
  } catch {
    // Token invalide/expiré — on clear le cookie quand même
  }

  res.clearCookie('token', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path: '/',
  });
  return res.json({ message: 'Déconnexion réussie.' });
}

/**
 * Récupération du profil de l'utilisateur connecté.
 * GET /api/auth/me
 */
export async function getProfile(req, res) {
  try {
    // Sélection explicite — jamais de password_hash, otp, tokens, etc.
    const result = await pool.query(
      'SELECT id, prenom, nom, email, role, email_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Utilisateur introuvable.',
        error: 'Utilisateur introuvable.',
      });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    logger.error('ERREUR_PROFIL', { userId: req.user?.id, error: err.message });
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}
