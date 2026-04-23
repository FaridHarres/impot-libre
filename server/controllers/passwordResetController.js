import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import logger from '../utils/logger.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY_MINUTES = 15;
const ANTI_TIMING_DELAY_MS = 500;

/**
 * Hash a reset token with SHA-256 (for storage in DB).
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Fixed-delay response to prevent timing attacks.
 */
function delayedResponse(res, startTime, statusCode, body) {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, ANTI_TIMING_DELAY_MS - elapsed);
  setTimeout(() => res.status(statusCode).json(body), remaining);
}

/**
 * POST /api/auth/forgot-password
 * Request a password reset. Same generic message in ALL cases.
 */
export async function forgotPassword(req, res) {
  const startTime = Date.now();
  const genericMessage = 'Si cet email existe, vous recevrez un lien de réinitialisation.';
  const ip = req.ip || '';

  try {
    const { email } = req.body;
    if (!email) {
      return delayedResponse(res, startTime, 200, { message: genericMessage });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user
    const userResult = await pool.query(
      'SELECT id, prenom, email, role, email_verified FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    // Case: email not found → silent
    if (userResult.rows.length === 0) {
      logger.info('RESET_DEMANDE_EMAIL_INCONNU', { email: normalizedEmail, ip });
      return delayedResponse(res, startTime, 200, { message: genericMessage });
    }

    const user = userResult.rows[0];

    // Case: admin → NEVER allow reset via public route
    if (user.role === 'admin') {
      logger.warn('RESET_TENTATIVE_ADMIN', { email: normalizedEmail, ip });
      return delayedResponse(res, startTime, 200, { message: genericMessage });
    }

    // Case: email not verified → silent
    if (!user.email_verified) {
      logger.info('RESET_EMAIL_NON_VERIFIE', { email: normalizedEmail, ip });
      return delayedResponse(res, startTime, 200, { message: genericMessage });
    }

    // Check rate limit per email: max 3 in 30 minutes
    const recentTokens = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM password_reset_tokens
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 minutes'`,
      [user.id]
    );
    if (recentTokens.rows[0].cnt >= 3) {
      logger.warn('RESET_RATE_LIMIT_EMAIL', { userId: user.id, ip });
      return delayedResponse(res, startTime, 200, { message: genericMessage });
    }

    // Invalidate any existing tokens for this user
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Store hashed token in DB
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, tokenHash, expiresAt, ip]
    );

    // Send email
    try {
      await sendPasswordResetEmail(user.email, user.prenom, rawToken);
    } catch (emailErr) {
      logger.error('RESET_ERREUR_EMAIL', { userId: user.id, error: emailErr.message });
    }

    logger.info('RESET_DEMANDE', { userId: user.id, ip });
    return delayedResponse(res, startTime, 200, { message: genericMessage });
  } catch (err) {
    logger.error('RESET_ERREUR', { error: err.message, ip });
    return delayedResponse(res, startTime, 200, { message: genericMessage });
  }
}

/**
 * GET /api/auth/reset-password/:token
 * Verify if token is valid (used by frontend before showing form).
 */
export async function verifyResetToken(req, res) {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ valid: false, message: 'Token manquant.' });

    const tokenHash = hashToken(token);

    const result = await pool.query(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, message: 'Lien invalide ou expiré.' });
    }

    const row = result.rows[0];

    if (row.used_at) {
      return res.json({ valid: false, message: 'Ce lien a déjà été utilisé.' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.json({ valid: false, message: 'Ce lien a expiré (15 minutes).' });
    }

    return res.json({ valid: true });
  } catch (err) {
    logger.error('RESET_VERIFY_ERREUR', { error: err.message });
    return res.status(500).json({ valid: false, message: 'Erreur interne.' });
  }
}

/**
 * POST /api/auth/reset-password/:token
 * Actually reset the password.
 */
export async function resetPassword(req, res) {
  const ip = req.ip || '';

  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token et mot de passe requis.' });
    }

    // Validate password strength
    if (password.length < 12) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 12 caractères.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une majuscule.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins un chiffre.' });
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins un caractère spécial.' });
    }

    const tokenHash = hashToken(token);

    // Fetch and validate token
    const tokenResult = await pool.query(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      logger.warn('RESET_TOKEN_INVALIDE', { ip });
      return res.status(400).json({ message: 'Lien invalide ou expiré. Veuillez refaire une demande.' });
    }

    const tokenRow = tokenResult.rows[0];

    if (tokenRow.used_at) {
      logger.warn('RESET_TOKEN_DEJA_UTILISE', { userId: tokenRow.user_id, ip });
      return res.status(400).json({ message: 'Ce lien a déjà été utilisé. Veuillez refaire une demande.' });
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      logger.warn('RESET_TOKEN_EXPIRE', { userId: tokenRow.user_id, ip });
      return res.status(400).json({ message: 'Ce lien a expiré. Veuillez refaire une demande.' });
    }

    // Get user (verify still exists and is not admin)
    const userResult = await pool.query(
      'SELECT id, role, password_hash FROM users WHERE id = $1',
      [tokenRow.user_id]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role === 'admin') {
      return res.status(400).json({ message: 'Opération non autorisée.' });
    }

    const user = userResult.rows[0];

    // Check new password is different from old
    const isSame = await bcrypt.compare(password, user.password_hash);
    if (isSame) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent de l\'ancien.' });
    }

    // Hash new password
    const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update password + increment token_version (invalidates all JWT sessions)
    await pool.query(
      `UPDATE users SET password_hash = $1, token_version = COALESCE(token_version, 1) + 1
       WHERE id = $2`,
      [newHash, user.id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenRow.id]
    );

    // Invalidate ALL tokens for this user
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    logger.info('RESET_REUSSI', { userId: user.id, ip });

    return res.json({
      message: 'Mot de passe mis à jour avec succès. Veuillez vous reconnecter.',
    });
  } catch (err) {
    logger.error('RESET_ERREUR', { error: err.message, ip });
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}
