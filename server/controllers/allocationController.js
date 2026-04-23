import pool from '../db.js';

/**
 * Soumission d'une allocation budgétaire par pôles.
 * POST /api/allocations
 *
 * Body attendu :
 * {
 *   totalAmount: 4200,
 *   allocations: [ { pole_id: 1, percentage: 18.5 }, ... ]
 * }
 *
 * Le backend distribue équitablement le pourcentage de chaque pôle
 * entre ses ministères rattachés pour le stockage en BDD.
 */
export async function submitAllocation(req, res) {
  const client = await pool.connect();

  try {
    const totalAmount = req.body.totalAmount ?? req.body.total_amount;
    const repartition = req.body.allocations ?? req.body.repartition ?? req.body.details;
    const userId = req.user.id;

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

    // --- Charger les pôles depuis la BDD ---
    const polesResult = await client.query(
      'SELECT id, name, minimum_percentage FROM poles ORDER BY id'
    );
    const poles = polesResult.rows;
    const poleMap = new Map(poles.map((p) => [p.id, p]));

    // --- Charger les ministères avec leur pole_id ---
    const ministeresResult = await client.query(
      'SELECT id, name, pole_id FROM ministeres WHERE pole_id IS NOT NULL ORDER BY id'
    );
    const ministeres = ministeresResult.rows;

    // Grouper les ministères par pôle
    const ministeresByPole = new Map();
    for (const m of ministeres) {
      if (!ministeresByPole.has(m.pole_id)) {
        ministeresByPole.set(m.pole_id, []);
      }
      ministeresByPole.get(m.pole_id).push(m);
    }

    // --- Vérifier que tous les pôles sont présents ---
    if (repartition.length !== poles.length) {
      return res.status(400).json({
        message: `Répartition incomplète : ${repartition.length}/${poles.length} pôles fournis.`,
      });
    }

    // --- Vérifier chaque pôle ---
    let totalPercentage = 0;

    for (const item of repartition) {
      const poleId = parseInt(item.pole_id, 10);
      const pct = parseFloat(item.percentage);
      const pole = poleMap.get(poleId);

      if (isNaN(poleId) || !pole) {
        return res.status(400).json({
          message: `Pôle inconnu : ID ${item.pole_id}.`,
        });
      }

      if (isNaN(pct) || pct < 0) {
        return res.status(400).json({
          message: `Pourcentage invalide pour le pôle « ${pole.name} ».`,
        });
      }

      const minRequired = parseInt(pole.minimum_percentage, 10);
      if (pct < minRequired - 0.1) {
        return res.status(400).json({
          message: `Le pourcentage pour « ${pole.name} » (${pct}%) est inférieur au minimum requis (${minRequired}%).`,
        });
      }

      totalPercentage += pct;
    }

    // --- Vérifier que le total ≈ 100% ---
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

    // Distribuer chaque pôle équitablement entre ses ministères
    for (const item of repartition) {
      const poleId = parseInt(item.pole_id, 10);
      const polePct = parseFloat(item.percentage);
      const poleMinisteres = ministeresByPole.get(poleId) || [];

      if (poleMinisteres.length === 0) continue;

      // Distribution égale au sein du pôle
      const pctPerMinistere = parseFloat((polePct / poleMinisteres.length).toFixed(2));
      let distributed = 0;

      for (let i = 0; i < poleMinisteres.length; i++) {
        const m = poleMinisteres[i];
        // Dernier ministère récupère le reste (gestion des arrondis)
        const finalPct = i < poleMinisteres.length - 1
          ? pctPerMinistere
          : parseFloat((polePct - distributed).toFixed(2));

        await client.query(
          'INSERT INTO allocations_detail (allocation_id, ministere_id, percentage) VALUES ($1, $2, $3)',
          [allocationId, m.id, finalPct]
        );

        distributed += pctPerMinistere;
      }
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
 * Retourne les données agrégées par pôle.
 */
export async function getMyAllocation(req, res) {
  try {
    const allocResult = await pool.query(
      'SELECT id, total_amount, created_at FROM allocations WHERE user_id = $1',
      [req.user.id]
    );

    if (allocResult.rows.length === 0) {
      return res.json({ totalAmount: 0, allocations: [] });
    }

    const allocation = allocResult.rows[0];

    // Récupérer les détails avec info pôle
    const detailsResult = await pool.query(
      `SELECT ad.ministere_id, m.name AS ministere_name, m.slug, m.pole_id,
              p.name AS pole_name, p.emoji, p.minimum_percentage AS pole_minimum,
              ad.percentage
       FROM allocations_detail ad
       JOIN ministeres m ON m.id = ad.ministere_id
       LEFT JOIN poles p ON p.id = m.pole_id
       WHERE ad.allocation_id = $1
       ORDER BY m.pole_id, m.id`,
      [allocation.id]
    );

    // Agréger par pôle
    const poleMap = new Map();
    for (const row of detailsResult.rows) {
      const pid = row.pole_id;
      if (!poleMap.has(pid)) {
        poleMap.set(pid, {
          pole_id: pid,
          pole_name: row.pole_name,
          emoji: row.emoji,
          pole_minimum: parseInt(row.pole_minimum, 10),
          percentage: 0,
          ministeres: [],
        });
      }
      const pole = poleMap.get(pid);
      pole.percentage += parseFloat(row.percentage);
      pole.ministeres.push({
        ministere_id: row.ministere_id,
        name: row.ministere_name,
        slug: row.slug,
        percentage: parseFloat(row.percentage),
      });
    }

    return res.json({
      totalAmount: parseFloat(allocation.total_amount),
      allocations: Array.from(poleMap.values()).map((p) => ({
        ...p,
        percentage: parseFloat(p.percentage.toFixed(2)),
      })),
    });
  } catch (err) {
    console.error('[ALLOCATION] Erreur lors de la récupération :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * Statistiques publiques agrégées par pôle.
 * GET /api/allocations/stats
 */
export async function getPublicStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        p.id AS pole_id,
        p.name AS pole_name,
        p.slug AS pole_slug,
        p.emoji,
        p.minimum_percentage AS pole_minimum,
        COUNT(DISTINCT a.id)::int AS nombre_allocations,
        ROUND(SUM(ad.percentage), 2) AS somme_moyenne
      FROM poles p
      LEFT JOIN ministeres m ON m.pole_id = p.id
      LEFT JOIN allocations_detail ad ON ad.ministere_id = m.id
      LEFT JOIN allocations a ON a.id = ad.allocation_id
      GROUP BY p.id, p.name, p.slug, p.emoji, p.minimum_percentage
      ORDER BY p.id
    `);

    const totalResult = await pool.query('SELECT COUNT(*)::int AS total FROM allocations');
    const totalAllocations = totalResult.rows[0].total;

    const poles = result.rows.map((r) => ({
      pole_id: r.pole_id,
      pole_name: r.pole_name,
      pole_slug: r.pole_slug,
      emoji: r.emoji,
      pole_minimum: parseInt(r.pole_minimum, 10),
      nombre_allocations: r.nombre_allocations,
      moyenne: totalAllocations > 0
        ? parseFloat((parseFloat(r.somme_moyenne) / totalAllocations).toFixed(2))
        : 0,
    }));

    return res.json({
      total_allocations: totalAllocations,
      poles,
    });
  } catch (err) {
    console.error('[ALLOCATION] Erreur lors de la récupération des stats :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}
