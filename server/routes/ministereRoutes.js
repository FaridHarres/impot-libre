import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * GET /api/ministeres
 * Retourne la liste complète des ministères depuis la BDD.
 * Endpoint public — c'est la SOURCE DE VÉRITÉ pour le frontend.
 */
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, minimum_percentage FROM ministeres ORDER BY id'
    );

    // Convertir minimum_percentage en number (pg retourne un string pour NUMERIC)
    const ministeres = result.rows.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      minimum_percentage: parseFloat(m.minimum_percentage),
    }));

    return res.json(ministeres);
  } catch (err) {
    console.error('[MINISTERES] Erreur lors de la récupération :', err);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des ministères.',
      error: 'Erreur lors de la récupération des ministères.',
    });
  }
});

export default router;
