/**
 * Middleware de vérification du rôle administrateur.
 * Doit être utilisé APRÈS authMiddleware.
 */
export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }

  next();
}
