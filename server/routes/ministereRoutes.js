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
      'SELECT id, name, slug, minimum_percentage, pole_id FROM ministeres ORDER BY id'
    );

    const ministeres = result.rows.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      minimum_percentage: parseFloat(m.minimum_percentage),
      pole_id: m.pole_id,
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

/**
 * GET /api/poles
 * Retourne les 8 pôles thématiques avec leurs ministères rattachés.
 * Endpoint public — utilisé par le Dashboard pour l'UI par pôles.
 */
router.get('/poles', async (_req, res) => {
  try {
    const polesResult = await pool.query(
      'SELECT id, name, slug, emoji, minimum_percentage FROM poles ORDER BY id'
    );

    const ministeresResult = await pool.query(
      'SELECT id, name, slug, pole_id FROM ministeres WHERE pole_id IS NOT NULL ORDER BY id'
    );

    const poles = polesResult.rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      emoji: p.emoji,
      minimum_percentage: parseInt(p.minimum_percentage, 10),
      ministeres: ministeresResult.rows
        .filter((m) => m.pole_id === p.id)
        .map((m) => ({ id: m.id, name: m.name, slug: m.slug })),
    }));

    return res.json(poles);
  } catch (err) {
    console.error('[POLES] Erreur lors de la récupération :', err);
    return res.status(500).json({
      message: 'Erreur lors de la récupération des pôles.',
    });
  }
});

export default router;
