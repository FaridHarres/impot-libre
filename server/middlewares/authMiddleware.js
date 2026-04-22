import jwt from 'jsonwebtoken';

/**
 * Middleware d'authentification JWT.
 * Extrait et vérifie le token Bearer, puis attache l'utilisateur à req.user.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou mal formaté.', error: 'Token manquant ou mal formaté.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.', error: 'Token expiré.' });
    }
    return res.status(401).json({ message: 'Token invalide.', error: 'Token invalide.' });
  }
}
