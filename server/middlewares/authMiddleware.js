import jwt from 'jsonwebtoken';
import pool from '../db.js';

/**
 * Middleware d'authentification JWT.
 * Lit le token UNIQUEMENT depuis le cookie httpOnly.
 * Vérifie la session en BDD (non révoquée, non expirée).
 */
export async function authMiddleware(req, res, next) {
  // Cookie httpOnly uniquement — plus de header Authorization
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: 'Authentification requise.',
      error: 'auth_required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier la session en BDD
    if (decoded.sid) {
      const sessionResult = await pool.query(
        'SELECT id FROM sessions WHERE id = $1 AND revoked_at IS NULL AND expires_at > NOW()',
        [decoded.sid]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({
          message: 'Session expirée ou révoquée.',
          error: 'session_revoked',
        });
      }
    }

    req.user = decoded; // { id, role, sid, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée.', error: 'token_expired' });
    }
    return res.status(401).json({ message: 'Token invalide.', error: 'token_invalid' });
  }
}
