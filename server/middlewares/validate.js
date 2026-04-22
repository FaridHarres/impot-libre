/**
 * Middleware de validation Zod.
 * Valide req.body contre un schema et remplace par les données parsées (nettoyées).
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Données invalides.',
        error: 'Données invalides.',
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}
