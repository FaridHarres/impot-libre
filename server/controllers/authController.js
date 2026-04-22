import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { hashIP, hashFingerprint } from '../utils/hashFingerprint.js';
import { sendVerificationEmail } from '../utils/mailer.js';

const BCRYPT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOM_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{1,100}$/;

/**
 * Inscription d'un nouvel utilisateur.
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const { prenom, nom, email, password, resolution, language } = req.body;

    // Validation des champs
    if (!prenom || !nom || !email || !password) {
      return res.status(400).json({
        message: 'Tous les champs sont requis (prénom, nom, email, mot de passe).',
        error: 'Tous les champs sont requis (prénom, nom, email, mot de passe).',
      });
    }

    const prenomTrimmed = prenom.trim();
    const nomTrimmed = nom.trim();

    if (!NOM_REGEX.test(prenomTrimmed)) {
      return res.status(400).json({
        message: 'Le prénom contient des caractères non autorisés.',
        error: 'Le prénom contient des caractères non autorisés.',
      });
    }

    if (!NOM_REGEX.test(nomTrimmed)) {
      return res.status(400).json({
        message: 'Le nom contient des caractères non autorisés.',
        error: 'Le nom contient des caractères non autorisés.',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: "Format d'email invalide.",
        error: "Format d'email invalide.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
        error: 'Le mot de passe doit contenir au moins 8 caractères.',
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Un compte existe déjà avec cet email.',
        error: 'Un compte existe déjà avec cet email.',
      });
    }

    // Calcul des empreintes pour la détection de doublons
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const ipHash = hashIP(ip);
    const fpHash = hashFingerprint(ip, userAgent, resolution || '', language || '');

    // Vérifier les doublons par empreinte
    const duplicateCheck = await pool.query(
      'SELECT id FROM users WHERE ip_hash = $1 AND fingerprint_hash = $2',
      [ipHash, fpHash]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: 'Un compte a déjà été créé depuis ce navigateur. Un seul compte par personne est autorisé.',
        error: 'Un compte a déjà été créé depuis ce navigateur. Un seul compte par personne est autorisé.',
      });
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
      [prenomTrimmed, nomTrimmed, email.toLowerCase().trim(), passwordHash, ipHash, fpHash, verifyToken, verifyExpires]
    );

    const user = result.rows[0];

    // Envoyer l'email de confirmation
    try {
      await sendVerificationEmail(user.email, user.prenom, verifyToken);
    } catch (emailErr) {
      console.error('[AUTH] Erreur envoi email de vérification :', emailErr);
      // On ne bloque pas l'inscription, l'utilisateur pourra redemander le lien
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
    console.error("[AUTH] Erreur lors de l'inscription :", err);
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
      return res.status(400).json({
        message: 'Lien de vérification invalide.',
        error: 'Lien de vérification invalide.',
      });
    }

    const result = await pool.query(
      `SELECT id, email, prenom FROM users
       WHERE verify_token = $1 AND verify_expires > NOW() AND email_verified = FALSE`,
      [token]
    );

    if (result.rows.length === 0) {
      // Rediriger avec erreur
      const baseUrl = process.env.FRONTEND_URL || 'https://impot-libre.fr';
      return res.redirect(`${baseUrl}/connexion?verify_error=true`);
    }

    await pool.query(
      `UPDATE users
       SET email_verified = TRUE, verify_token = NULL, verify_expires = NULL
       WHERE id = $1`,
      [result.rows[0].id]
    );

    // Rediriger vers la page de connexion avec succès
    const baseUrl = process.env.FRONTEND_URL || 'https://impot-libre.fr';
    return res.redirect(`${baseUrl}/connexion?verified=true`);
  } catch (err) {
    console.error("[AUTH] Erreur vérification email :", err);
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

    if (result.rows.length === 0) {
      // Ne pas révéler si l'email existe ou non
      return res.json({
        message: 'Si un compte non vérifié existe avec cet email, un nouveau lien a été envoyé.',
      });
    }

    const user = result.rows[0];
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET verify_token = $1, verify_expires = $2 WHERE id = $3`,
      [verifyToken, verifyExpires, user.id]
    );

    try {
      await sendVerificationEmail(user.email, user.prenom, verifyToken);
    } catch (emailErr) {
      console.error('[AUTH] Erreur renvoi email :', emailErr);
    }

    return res.json({
      message: 'Si un compte non vérifié existe avec cet email, un nouveau lien a été envoyé.',
    });
  } catch (err) {
    console.error('[AUTH] Erreur resend verification :', err);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * Connexion d'un utilisateur existant.
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email et mot de passe requis.',
        error: 'Email et mot de passe requis.',
      });
    }

    // Rechercher l'utilisateur
    const result = await pool.query(
      'SELECT id, prenom, nom, email, password_hash, role, email_verified FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Identifiants incorrects.',
        error: 'Identifiants incorrects.',
      });
    }

    const user = result.rows[0];

    // Vérification du mot de passe
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        message: 'Identifiants incorrects.',
        error: 'Identifiants incorrects.',
      });
    }

    // Vérifier que l'email est confirmé (sauf admin, qui passe par le 2FA)
    if (user.role !== 'admin' && !user.email_verified) {
      return res.status(403).json({
        message: 'Veuillez confirmer votre adresse email avant de vous connecter. Vérifiez votre boîte mail.',
        error: 'email_not_verified',
        email: user.email,
      });
    }

    // Génération du JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: 'Connexion réussie.',
      token,
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
    console.error('[AUTH] Erreur lors de la connexion :', err);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}

/**
 * Récupération du profil de l'utilisateur connecté.
 * GET /api/auth/me  |  GET /api/auth/profile
 */
export async function getProfile(req, res) {
  try {
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
    console.error('[AUTH] Erreur lors de la récupération du profil :', err);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: 'Erreur interne du serveur.',
    });
  }
}
