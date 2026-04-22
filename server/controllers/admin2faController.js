import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { sendOTPEmail } from '../utils/mailer.js';
import logger from '../utils/logger.js';

const MAX_OTP_ATTEMPTS = 3;
const OTP_LOCK_DURATION = 30 * 60 * 1000; // 30 minutes
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Hash un OTP avec SHA-256 + salt fixe par utilisateur (email).
 * On utilise SHA-256 plutôt que bcrypt car l'OTP est éphémère (5 min)
 * et on a besoin de rapidité pour les comparaisons.
 */
function hashOTP(otp, email) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(otp + email).digest('hex');
}

/**
 * Helper : configure le cookie httpOnly contenant le JWT admin.
 */
function setAdminTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    maxAge: 4 * 60 * 60 * 1000, // 4h
    path: '/',
  });
}

/**
 * ETAPE 1 — Verification identifiants admin.
 * POST /api/admin-auth/login
 * Body valide par Zod avant d'arriver ici.
 */
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Rechercher l'admin
    const result = await pool.query(
      "SELECT id, email, password_hash, otp_locked_until FROM users WHERE email = $1 AND role = 'admin'",
      [email]
    );

    if (result.rows.length === 0) {
      // Timing attack mitigation : toujours hasher meme si pas d'utilisateur
      await bcrypt.hash(password, 12);
      return res.status(401).json({
        message: 'Identifiants invalides.',
        error: 'Identifiants invalides.',
      });
    }

    const admin = result.rows[0];

    // Verifier le verrouillage OTP
    if (admin.otp_locked_until && new Date(admin.otp_locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(admin.otp_locked_until) - new Date()) / 60000);
      logger.warn('ADMIN_LOGIN_VERROUILLE', { email, ip: req.ip, minutesLeft });
      return res.status(429).json({
        message: `Trop de tentatives. Reessayez dans ${minutesLeft} minute(s).`,
        error: 'otp_locked',
      });
    }

    // Verifier le mot de passe
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      logger.warn('ADMIN_LOGIN_ECHEC', { email, ip: req.ip });
      return res.status(401).json({
        message: 'Identifiants invalides.',
        error: 'Identifiants invalides.',
      });
    }

    // Generer OTP 6 chiffres (crypto-secure)
    const otpBuffer = crypto.randomBytes(3);
    const otpNum = (otpBuffer.readUIntBE(0, 3) % 900000) + 100000;
    const otp = otpNum.toString();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY);

    // Hasher l'OTP avant stockage (ne jamais stocker en clair)
    const otpHash = hashOTP(otp, admin.email);

    // Stocker le hash et reset les tentatives
    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires = $2, otp_attempts = 0 WHERE id = $3',
      [otpHash, otpExpires, admin.id]
    );

    // Envoyer le code par email
    try {
      await sendOTPEmail(admin.email, otp);
    } catch (sendErr) {
      logger.error('ERREUR_ENVOI_OTP', { email, error: sendErr.message });
    }

    logger.info('ADMIN_OTP_ENVOYE', { email, ip: req.ip });

    return res.json({
      message: 'Code de verification envoye par email.',
      step: 2,
      // NE PAS renvoyer l'email complet (anti-enumeration)
    });
  } catch (err) {
    logger.error('ERREUR_ADMIN_LOGIN', { error: err.message });
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * ETAPE 2 — Verification OTP admin.
 * POST /api/admin-auth/verify-2fa
 * Body valide par Zod avant d'arriver ici.
 */
export async function adminVerify2FA(req, res) {
  try {
    const { email, otp } = req.body;

    // Chercher l'admin
    const result = await pool.query(
      "SELECT id, email, role, otp_code, otp_expires, otp_attempts, otp_locked_until FROM users WHERE email = $1 AND role = 'admin'",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Compte introuvable.',
        error: 'Compte introuvable.',
      });
    }

    const admin = result.rows[0];

    // Verifier le verrouillage
    if (admin.otp_locked_until && new Date(admin.otp_locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(admin.otp_locked_until) - new Date()) / 60000);
      return res.status(429).json({
        message: `Compte verrouille. Reessayez dans ${minutesLeft} minute(s).`,
        error: 'otp_locked',
      });
    }

    // Verifier l'expiration d'abord
    if (!admin.otp_code || !admin.otp_expires || new Date(admin.otp_expires) < new Date()) {
      await pool.query(
        'UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE id = $1',
        [admin.id]
      );
      return res.status(401).json({
        message: 'Code expire. Veuillez vous reconnecter.',
        error: 'otp_expired',
      });
    }

    // Comparer le hash de l'OTP soumis avec le hash stocke
    const submittedHash = hashOTP(otp.trim(), admin.email);
    if (submittedHash !== admin.otp_code) {
      // Incrementer les tentatives
      const newAttempts = (admin.otp_attempts || 0) + 1;

      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + OTP_LOCK_DURATION);
        await pool.query(
          'UPDATE users SET otp_attempts = $1, otp_locked_until = $2, otp_code = NULL, otp_expires = NULL WHERE id = $3',
          [newAttempts, lockUntil, admin.id]
        );
        logger.warn('ADMIN_OTP_VERROUILLE', { email, ip: req.ip, attempts: newAttempts });
        return res.status(429).json({
          message: 'Trop de tentatives. Compte verrouille pour 30 minutes.',
          error: 'otp_locked',
        });
      }

      await pool.query(
        'UPDATE users SET otp_attempts = $1 WHERE id = $2',
        [newAttempts, admin.id]
      );

      logger.warn('ADMIN_OTP_INCORRECT', { email, ip: req.ip, remaining: MAX_OTP_ATTEMPTS - newAttempts });

      return res.status(401).json({
        message: `Code incorrect. ${MAX_OTP_ATTEMPTS - newAttempts} tentative(s) restante(s).`,
        error: 'invalid_otp',
        remaining: MAX_OTP_ATTEMPTS - newAttempts,
      });
    }

    // Succes — invalider le code
    await pool.query(
      'UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_attempts = 0, otp_locked_until = NULL WHERE id = $1',
      [admin.id]
    );

    logger.info('ADMIN_CONNEXION_2FA', { adminId: admin.id, email, ip: req.ip });

    // JWT admin (duree courte : 4h)
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    // Cookie httpOnly
    setAdminTokenCookie(res, token);

    return res.json({
      message: 'Authentification reussie.',
      token, // Garder temporairement pour compatibilite frontend
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    logger.error('ERREUR_ADMIN_2FA', { error: err.message });
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}
