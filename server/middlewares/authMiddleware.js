import jwt from 'jsonwebtoken';

/**
 * Middleware d'authentification JWT.
 * Lit le token depuis :
 *   1. Cookie httpOnly (prioritaire, plus securise)
 *   2. Header Authorization: Bearer <token> (fallback compatibilite)
 */
export function authMiddleware(req, res, next) {
  let token = null;

  // 1. Cookie httpOnly (recommande)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Fallback : header Authorization
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      message: 'Authentification requise.',
      error: 'Authentification requise.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expiree.', error: 'Session expiree.' });
    }
    return res.status(401).json({ message: 'Token invalide.', error: 'Token invalide.' });
  }
}
