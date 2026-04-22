import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { sendOTPEmail } from '../utils/mailer.js';

const MAX_OTP_ATTEMPTS = 3;
const OTP_LOCK_DURATION = 30 * 60 * 1000; // 30 minutes
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * ÉTAPE 1 — Vérification identifiants admin.
 * POST /api/admin-auth/login
 */
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email et mot de passe requis.',
        error: 'Email et mot de passe requis.',
      });
    }

    // Rechercher l'admin
    const result = await pool.query(
      "SELECT id, email, password_hash, otp_locked_until FROM users WHERE email = $1 AND role = 'admin'",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Identifiants invalides.',
        error: 'Identifiants invalides.',
      });
    }

    const admin = result.rows[0];

    // Vérifier le verrouillage OTP
    if (admin.otp_locked_until && new Date(admin.otp_locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(admin.otp_locked_until) - new Date()) / 60000);
      return res.status(429).json({
        message: `Trop de tentatives. Réessayez dans ${minutesLeft} minute(s).`,
        error: 'otp_locked',
      });
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({
        message: 'Identifiants invalides.',
        error: 'Identifiants invalides.',
      });
    }

    // Générer OTP 6 chiffres (crypto-secure)
    const otpBuffer = crypto.randomBytes(3);
    const otpNum = (otpBuffer.readUIntBE(0, 3) % 900000) + 100000;
    const otp = otpNum.toString();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY);

    // Stocker le code et reset les tentatives
    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires = $2, otp_attempts = 0 WHERE id = $3',
      [otp, otpExpires, admin.id]
    );

    // Envoyer le code par email
    try {
      await sendOTPEmail(admin.email, otp);
    } catch (sendErr) {
      console.error('[ADMIN 2FA] Erreur envoi OTP email :', sendErr);
    }

    return res.json({
      message: 'Code de vérification envoyé par email.',
      step: 2,
      email: admin.email,
    });
  } catch (err) {
    console.error('[ADMIN 2FA] Erreur login :', err);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * ÉTAPE 2 — Vérification OTP admin.
 * POST /api/admin-auth/verify-2fa
 */
export async function adminVerify2FA(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email et code requis.',
        error: 'Email et code requis.',
      });
    }

    // Chercher l'admin
    const result = await pool.query(
      "SELECT id, email, role, otp_code, otp_expires, otp_attempts, otp_locked_until FROM users WHERE email = $1 AND role = 'admin'",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Compte introuvable.',
        error: 'Compte introuvable.',
      });
    }

    const admin = result.rows[0];

    // Vérifier le verrouillage
    if (admin.otp_locked_until && new Date(admin.otp_locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(admin.otp_locked_until) - new Date()) / 60000);
      return res.status(429).json({
        message: `Compte verrouillé. Réessayez dans ${minutesLeft} minute(s).`,
        error: 'otp_locked',
      });
    }

    // Vérifier le code
    if (!admin.otp_code || admin.otp_code !== otp.trim()) {
      // Incrémenter les tentatives
      const newAttempts = (admin.otp_attempts || 0) + 1;

      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        // Verrouiller le compte pour 30 minutes
        const lockUntil = new Date(Date.now() + OTP_LOCK_DURATION);
        await pool.query(
          'UPDATE users SET otp_attempts = $1, otp_locked_until = $2, otp_code = NULL, otp_expires = NULL WHERE id = $3',
          [newAttempts, lockUntil, admin.id]
        );
        return res.status(429).json({
          message: 'Trop de tentatives. Compte verrouillé pour 30 minutes.',
          error: 'otp_locked',
        });
      }

      await pool.query(
        'UPDATE users SET otp_attempts = $1 WHERE id = $2',
        [newAttempts, admin.id]
      );

      return res.status(401).json({
        message: `Code incorrect. ${MAX_OTP_ATTEMPTS - newAttempts} tentative(s) restante(s).`,
        error: 'invalid_otp',
        remaining: MAX_OTP_ATTEMPTS - newAttempts,
      });
    }

    // Vérifier l'expiration
    if (!admin.otp_expires || new Date(admin.otp_expires) < new Date()) {
      await pool.query(
        'UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE id = $1',
        [admin.id]
      );
      return res.status(401).json({
        message: 'Code expiré. Veuillez vous reconnecter.',
        error: 'otp_expired',
      });
    }

    // Succès — invalider le code
    await pool.query(
      'UPDATE users SET otp_code = NULL, otp_expires = NULL, otp_attempts = 0, otp_locked_until = NULL WHERE id = $1',
      [admin.id]
    );

    // Log de connexion admin
    try {
      await pool.query(
        'INSERT INTO admin_logs (admin_id, action) VALUES ($1, $2)',
        [admin.id, 'Connexion admin via 2FA']
      );
    } catch (_) { /* non-bloquant */ }

    // JWT admin (durée courte : 4h)
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    return res.json({
      message: 'Authentification réussie.',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('[ADMIN 2FA] Erreur verify-2fa :', err);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}
