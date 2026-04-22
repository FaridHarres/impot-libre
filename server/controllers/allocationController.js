import pool from '../db.js';

/**
 * Soumission d'une allocation budgétaire.
 * POST /api/allocations
 *
 * Body attendu :
 * {
 *   totalAmount: 4200,
 *   allocations: [ { ministere_id: 1, percentage: 21.4 }, ... ]
 * }
 */
export async function submitAllocation(req, res) {
  const client = await pool.connect();

  try {
    const totalAmount = req.body.totalAmount ?? req.body.total_amount;
    const repartition = req.body.allocations ?? req.body.repartition ?? req.body.details;
    const userId = req.user.id;

    // --- Validations basiques ---

    // --- Vérifier que l'email est confirmé ---
    const userCheck = await client.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [userId]
    );
    if (userCheck.rows.length === 0 || !userCheck.rows[0].email_verified) {
      client.release();
      return res.status(403).json({
        message: 'Vous devez confirmer votre adresse email avant de soumettre votre répartition.',
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        message: 'Le montant total doit être un nombre positif.',
      });
    }

    if (!Array.isArray(repartition) || repartition.length === 0) {
      return res.status(400).json({
        message: 'La répartition est requise.',
      });
    }

    // Vérifier que l'utilisateur n'a pas déjà soumis
    const existingAlloc = await client.query(
      'SELECT id FROM allocations WHERE user_id = $1',
      [userId]
    );

    if (existingAlloc.rows.length > 0) {
      return res.status(409).json({
        message: 'Vous avez déjà soumis une allocation. Une seule allocation par utilisateur.',
      });
    }

    // --- Charger les ministères depuis la BDD (source de vérité) ---
    const ministeresResult = await client.query(
      'SELECT id, name, minimum_percentage FROM ministeres ORDER BY id'
    );
    const ministeres = ministeresResult.rows;
    const ministereMap = new Map(ministeres.map((m) => [m.id, m]));

    // --- Vérifier que chaque ministere_id existe en BDD ---
    for (const item of repartition) {
      const id = parseInt(item.ministere_id, 10);
      if (isNaN(id) || !ministereMap.has(id)) {
        return res.status(400).json({
          message: `Ministère inconnu : ID ${item.ministere_id}.`,
        });
      }
    }

    // --- Vérifier que TOUS les ministères sont présents ---
    if (repartition.length !== ministeres.length) {
      return res.status(400).json({
        message: `Répartition incomplète : ${repartition.length}/${ministeres.length} ministères fournis.`,
      });
    }

    // --- Vérifier les planchers minimum ---
    let totalPercentage = 0;

    for (const item of repartition) {
      const id = parseInt(item.ministere_id, 10);
      const pct = parseFloat(item.percentage);
      const ministere = ministereMap.get(id);
      const minRequired = parseFloat(ministere.minimum_percentage);

      if (isNaN(pct) || pct < 0) {
        return res.status(400).json({
          message: `Pourcentage invalide pour « ${ministere.name} ».`,
        });
      }

      if (pct < minRequired - 0.1) {
        return res.status(400).json({
          message: `Le pourcentage pour « ${ministere.name} » (${pct}%) est inférieur au minimum requis (${minRequired}%).`,
        });
      }

      totalPercentage += pct;
    }

    // --- Vérifier que le total ≈ 100% (tolérance arrondi) ---
    if (Math.abs(Math.round(totalPercentage) - 100) > 1) {
      return res.status(400).json({
        message: `Le total des pourcentages doit être 100%. Total actuel : ${totalPercentage.toFixed(2)}%.`,
      });
    }

    // --- Insertion en transaction ---
    await client.query('BEGIN');

    const allocResult = await client.query(
      'INSERT INTO allocations (user_id, total_amount) VALUES ($1, $2) RETURNING id',
      [userId, totalAmount]
    );
    const allocationId = allocResult.rows[0].id;

    for (const item of repartition) {
      await client.query(
        'INSERT INTO allocations_detail (allocation_id, ministere_id, percentage) VALUES ($1, $2, $3)',
        [allocationId, parseInt(item.ministere_id, 10), parseFloat(item.percentage)]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Allocation enregistrée avec succès.',
      allocation_id: allocationId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ALLOCATION] Erreur lors de la soumission :', err);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
    });
  } finally {
    client.release();
  }
}

/**
 * Récupération de l'allocation de l'utilisateur connecté.
 * GET /api/allocations/me
 */
export async function getMyAllocation(req, res) {
  try {
    const allocResult = await pool.query(
      'SELECT id, total_amount, created_at FROM allocations WHERE user_id = $1',
      [req.user.id]
    );

    if (allocResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aucune allocation trouvée.' });
    }

    const allocation = allocResult.rows[0];

    const detailsResult = await pool.query(
      `SELECT ad.ministere_id, m.name, m.slug, ad.percentage, m.minimum_percentage
       FROM allocations_detail ad
       JOIN ministeres m ON m.id = ad.ministere_id
       WHERE ad.allocation_id = $1
       ORDER BY m.id`,
      [allocation.id]
    );

    return res.json({
      totalAmount: parseFloat(allocation.total_amount),
      allocations: detailsResult.rows.map((r) => ({
        ministere_id: r.ministere_id,
        name: r.name,
        slug: r.slug,
        percentage: parseFloat(r.percentage),
        minimum: parseFloat(r.minimum_percentage),
      })),
    });
  } catch (err) {
    console.error('[ALLOCATION] Erreur lors de la récupération :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * Statistiques publiques agrégées par ministère.
 * GET /api/allocations/stats
 */
export async function getPublicStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        m.id AS ministere_id,
        m.name AS ministere_name,
        m.slug,
        m.minimum_percentage,
        COUNT(ad.id)::int AS nombre_allocations,
        ROUND(AVG(ad.percentage), 2) AS moyenne,
        ROUND(MIN(ad.percentage), 2) AS minimum,
        ROUND(MAX(ad.percentage), 2) AS maximum
      FROM ministeres m
      LEFT JOIN allocations_detail ad ON ad.ministere_id = m.id
      GROUP BY m.id, m.name, m.slug, m.minimum_percentage
      ORDER BY m.id
    `);

    const totalResult = await pool.query('SELECT COUNT(*)::int AS total FROM allocations');

    return res.json({
      total_allocations: totalResult.rows[0].total,
      ministeres: result.rows,
    });
  } catch (err) {
    console.error('[ALLOCATION] Erreur lors de la récupération des stats :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}
