import pool from '../db.js';
import { toCSV } from '../utils/exportCSV.js';

// Simple in-memory cache (5 min TTL)
const cache = new Map();
function getCached(key, ttlMs = 300000) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data;
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

/**
 * Enregistre une action dans les logs d'administration.
 */
async function logAction(adminId, action) {
  try {
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action) VALUES ($1, $2)',
      [adminId, action]
    );
  } catch (err) {
    console.error('[ADMIN] Erreur lors du log :', err);
  }
}

/**
 * GET /api/admin/dashboard
 * Tableau de bord complet avec KPIs, stats par ministère, et activité récente.
 */
export async function getDashboard(req, res) {
  try {
    // ─── KPIs globaux ───
    const totalUsers = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE role = 'user'"
    );
    const totalAllocations = await pool.query(
      'SELECT COUNT(*)::int AS total FROM allocations'
    );
    const todayAllocations = await pool.query(
      "SELECT COUNT(*)::int AS total FROM allocations WHERE created_at::date = CURRENT_DATE"
    );
    const avgAmount = await pool.query(
      'SELECT ROUND(AVG(total_amount), 2) AS moyenne FROM allocations'
    );
    const suspectCount = await pool.query(`
      SELECT COUNT(*) AS total FROM (
        SELECT ip_hash, fingerprint_hash
        FROM users
        WHERE role = 'user' AND ip_hash IS NOT NULL AND fingerprint_hash IS NOT NULL
        GROUP BY ip_hash, fingerprint_hash
        HAVING COUNT(*) > 1
      ) sub
    `);

    // ─── Stats par pôle : moyenne, médiane, min, max, écart-type ───
    // Sous-requête : pour chaque (allocation, pôle), sommer les % des ministères du pôle
    const statsResult = await pool.query(`
      SELECT
        p.id, p.name, p.slug, p.emoji, p.minimum_percentage,
        COUNT(DISTINCT sub.allocation_id)::int AS nb_participants,
        ROUND(AVG(sub.pole_pct), 2) AS moyenne,
        ROUND(MIN(sub.pole_pct), 2) AS min_percent,
        ROUND(MAX(sub.pole_pct), 2) AS max_percent,
        ROUND(STDDEV(sub.pole_pct), 2) AS ecart_type
      FROM poles p
      LEFT JOIN (
        SELECT ad.allocation_id, m.pole_id, SUM(ad.percentage) AS pole_pct
        FROM allocations_detail ad
        JOIN ministeres m ON m.id = ad.ministere_id
        GROUP BY ad.allocation_id, m.pole_id
      ) sub ON sub.pole_id = p.id
      GROUP BY p.id, p.name, p.slug, p.emoji, p.minimum_percentage
      ORDER BY moyenne DESC NULLS LAST
    `);

    // Médiane par pôle
    const medianResult = await pool.query(`
      SELECT
        p.id,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sub.pole_pct)::numeric, 2) AS mediane
      FROM poles p
      LEFT JOIN (
        SELECT ad.allocation_id, m.pole_id, SUM(ad.percentage) AS pole_pct
        FROM allocations_detail ad
        JOIN ministeres m ON m.id = ad.ministere_id
        GROUP BY ad.allocation_id, m.pole_id
      ) sub ON sub.pole_id = p.id
      GROUP BY p.id
    `);
    const medianMap = new Map(medianResult.rows.map((r) => [r.id, parseFloat(r.mediane) || 0]));

    // Moyenne en euros par pôle
    const eurosResult = await pool.query(`
      SELECT
        sub.pole_id,
        ROUND(AVG((sub.pole_pct / 100.0) * a.total_amount), 2) AS moyenne_euros
      FROM (
        SELECT ad.allocation_id, m.pole_id, SUM(ad.percentage) AS pole_pct
        FROM allocations_detail ad
        JOIN ministeres m ON m.id = ad.ministere_id
        GROUP BY ad.allocation_id, m.pole_id
      ) sub
      JOIN allocations a ON a.id = sub.allocation_id
      GROUP BY sub.pole_id
    `);
    const eurosMap = new Map(eurosResult.rows.map((r) => [r.pole_id, parseFloat(r.moyenne_euros) || 0]));

    const poles = statsResult.rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      emoji: s.emoji,
      minimum_percentage: parseFloat(s.minimum_percentage),
      nb_participants: s.nb_participants,
      moyenne: parseFloat(s.moyenne) || 0,
      mediane: medianMap.get(s.id) || 0,
      min_percent: parseFloat(s.min_percent) || 0,
      max_percent: parseFloat(s.max_percent) || 0,
      ecart_type: parseFloat(s.ecart_type) || 0,
      moyenne_euros: eurosMap.get(s.id) || 0,
    }));

    // ─── Activité récente (10 derniers logs) ───
    const logsResult = await pool.query(`
      SELECT al.action, al.created_at, u.email AS admin_email
      FROM admin_logs al
      JOIN users u ON u.id = al.admin_id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    await logAction(req.user.id, 'Consultation du tableau de bord');

    return res.json({
      total_utilisateurs: totalUsers.rows[0].total,
      total_allocations: totalAllocations.rows[0].total,
      allocations_aujourdhui: todayAllocations.rows[0].total,
      montant_moyen: parseFloat(avgAmount.rows[0].moyenne) || 0,
      comptes_suspects: parseInt(suspectCount.rows[0].total) || 0,
      poles,
      activite_recente: logsResult.rows.map((l) => ({
        action: l.action,
        admin: l.admin_email,
        date: l.created_at,
      })),
    });
  } catch (err) {
    console.error('[ADMIN] Erreur dashboard :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * GET /api/admin/export/csv
 */
export async function exportCSV(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        a.id AS allocation_id,
        a.total_amount,
        a.created_at,
        m.name AS ministere,
        m.slug AS ministere_slug,
        ad.percentage
      FROM allocations a
      JOIN allocations_detail ad ON ad.allocation_id = a.id
      JOIN ministeres m ON m.id = ad.ministere_id
      ORDER BY a.id, m.id
    `);

    const columns = ['allocation_id', 'total_amount', 'created_at', 'ministere', 'ministere_slug', 'percentage'];
    const csv = toCSV(result.rows, columns);

    await logAction(req.user.id, 'Export CSV des allocations');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="allocations-export.csv"');
    return res.send('\ufeff' + csv);
  } catch (err) {
    console.error('[ADMIN] Erreur export CSV :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * GET /api/admin/export/json
 */
export async function exportJSON(req, res) {
  try {
    const allocResult = await pool.query(
      'SELECT a.id AS allocation_id, a.total_amount, a.created_at FROM allocations a ORDER BY a.id'
    );

    const detailsResult = await pool.query(`
      SELECT ad.allocation_id, m.name AS ministere, m.slug, ad.percentage
      FROM allocations_detail ad
      JOIN ministeres m ON m.id = ad.ministere_id
      ORDER BY ad.allocation_id, m.id
    `);

    const detailsMap = new Map();
    for (const d of detailsResult.rows) {
      if (!detailsMap.has(d.allocation_id)) detailsMap.set(d.allocation_id, []);
      detailsMap.get(d.allocation_id).push({
        ministere: d.ministere,
        slug: d.slug,
        percentage: parseFloat(d.percentage),
      });
    }

    const allocations = allocResult.rows.map((a) => ({
      allocation_id: a.allocation_id,
      total_amount: parseFloat(a.total_amount),
      created_at: a.created_at,
      details: detailsMap.get(a.allocation_id) || [],
    }));

    await logAction(req.user.id, 'Export JSON des allocations');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="allocations-export.json"');
    return res.json({ total: allocations.length, allocations });
  } catch (err) {
    console.error('[ADMIN] Erreur export JSON :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * GET /api/admin/suspects
 */
export async function getSuspects(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        ip_hash,
        fingerprint_hash,
        COUNT(*)::int AS nombre_comptes,
        ARRAY_AGG(id ORDER BY created_at) AS user_ids,
        MIN(created_at) AS premier_compte,
        MAX(created_at) AS dernier_compte
      FROM users
      WHERE role = 'user' AND ip_hash IS NOT NULL AND fingerprint_hash IS NOT NULL
      GROUP BY ip_hash, fingerprint_hash
      HAVING COUNT(*) > 1
      ORDER BY nombre_comptes DESC
    `);

    await logAction(req.user.id, 'Consultation des comptes suspects');

    return res.json({
      total_groupes_suspects: result.rows.length,
      suspects: result.rows,
    });
  } catch (err) {
    console.error('[ADMIN] Erreur suspects :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * GET /api/admin/logs?page=1&limit=50
 */
export async function getLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM admin_logs');
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT al.id, al.action, al.created_at, u.email AS admin_email
       FROM admin_logs al
       JOIN users u ON u.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({
      page, limit, total,
      total_pages: Math.ceil(total / limit),
      logs: result.rows,
    });
  } catch (err) {
    console.error('[ADMIN] Erreur logs :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * GET /api/admin/participants?page=1&limit=20&search=dupont
 * Liste paginée des participants avec montant et date de soumission.
 */
export async function getParticipants(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    let whereClause = "WHERE u.role = 'user'";
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        u.prenom ILIKE $${params.length}
        OR u.nom ILIKE $${params.length}
        OR u.email ILIKE $${params.length}
        OR CONCAT(u.prenom, ' ', u.nom) ILIKE $${params.length}
      )`;
    }

    // Count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    // Participants with allocation info
    params.push(limit, offset);
    const result = await pool.query(
      `SELECT
        u.id, u.prenom, u.nom, u.email, u.email_verified, u.created_at AS date_inscription,
        a.id AS allocation_id, a.total_amount, a.created_at AS date_soumission
      FROM users u
      LEFT JOIN allocations a ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC NULLS LAST, u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    await logAction(req.user.id, `Liste participants (page ${page}, recherche: "${search || '-'}")`);

    return res.json({
      page, limit, total,
      total_pages: Math.ceil(total / limit),
      participants: result.rows.map((r) => ({
        id: r.id,
        prenom: r.prenom,
        nom: r.nom,
        email: r.email,
        email_verified: r.email_verified,
        date_inscription: r.date_inscription,
        allocation_id: r.allocation_id,
        total_amount: r.total_amount ? parseFloat(r.total_amount) : null,
        date_soumission: r.date_soumission,
      })),
    });
  } catch (err) {
    console.error('[ADMIN] Erreur participants :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * GET /api/admin/participants/:id
 * Détail complet d'un participant avec répartition par pôle.
 */
export async function getParticipantDetail(req, res) {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID invalide.' });
    }

    // Check cache
    const cacheKey = `participant_${userId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      await logAction(req.user.id, `Consultation participant #${userId} (cache)`);
      return res.json(cached);
    }

    // User info (no sensitive fields)
    const userResult = await pool.query(
      `SELECT id, prenom, nom, email, email_verified, created_at AS date_inscription
       FROM users WHERE id = $1 AND role = 'user'`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Participant introuvable.' });
    }

    const user = userResult.rows[0];

    // Allocation
    const allocResult = await pool.query(
      `SELECT id, total_amount, created_at AS date_soumission
       FROM allocations WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    let allocation = null;
    let poles = [];

    if (allocResult.rows.length > 0) {
      const alloc = allocResult.rows[0];
      allocation = {
        id: alloc.id,
        total_amount: parseFloat(alloc.total_amount),
        date_soumission: alloc.date_soumission,
      };

      // Detail by pole (aggregated from ministere-level allocations_detail)
      const detailResult = await pool.query(
        `SELECT
          p.id AS pole_id, p.name AS pole_name, p.emoji, p.slug,
          ROUND(SUM(ad.percentage)::numeric, 2) AS pourcentage,
          ROUND(SUM(ad.percentage) / 100.0 * $2, 2) AS montant_euros
        FROM allocations_detail ad
        JOIN ministeres m ON m.id = ad.ministere_id
        JOIN poles p ON p.id = m.pole_id
        WHERE ad.allocation_id = $1
        GROUP BY p.id, p.name, p.emoji, p.slug
        ORDER BY pourcentage DESC`,
        [alloc.id, alloc.total_amount]
      );

      poles = detailResult.rows.map((r) => ({
        pole_id: r.pole_id,
        pole_name: r.pole_name,
        emoji: r.emoji,
        slug: r.slug,
        pourcentage: parseFloat(r.pourcentage),
        montant_euros: parseFloat(r.montant_euros),
      }));
    }

    const data = { user, allocation, poles };
    setCache(cacheKey, data);

    await logAction(req.user.id, `Consultation participant #${userId} (${user.email})`);

    return res.json(data);
  } catch (err) {
    console.error('[ADMIN] Erreur participant detail :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

/**
 * GET /api/admin/participants/:id/export-csv
 * Export CSV de la répartition d'un participant.
 */
export async function exportParticipantCSV(req, res) {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID invalide.' });
    }

    const userResult = await pool.query(
      'SELECT prenom, nom FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Participant introuvable.' });
    }

    const { prenom, nom } = userResult.rows[0];

    const allocResult = await pool.query(
      'SELECT id, total_amount FROM allocations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (allocResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aucune répartition trouvée.' });
    }

    const alloc = allocResult.rows[0];
    const totalAmount = parseFloat(alloc.total_amount);

    const detailResult = await pool.query(
      `SELECT
        p.name AS pole, p.emoji,
        ROUND(SUM(ad.percentage)::numeric, 2) AS pourcentage,
        ROUND(SUM(ad.percentage) / 100.0 * $2, 2) AS montant
      FROM allocations_detail ad
      JOIN ministeres m ON m.id = ad.ministere_id
      JOIN poles p ON p.id = m.pole_id
      WHERE ad.allocation_id = $1
      GROUP BY p.id, p.name, p.emoji
      ORDER BY pourcentage DESC`,
      [alloc.id, totalAmount]
    );

    // Build CSV
    let csv = 'Pôle,Pourcentage,Montant (€)\n';
    for (const row of detailResult.rows) {
      csv += `"${row.emoji} ${row.pole}",${row.pourcentage}%,${row.montant}\n`;
    }
    csv += `TOTAL,100%,${totalAmount.toFixed(2)}\n`;

    const filename = `${prenom}_${nom}_repartition.csv`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_.-]/g, '_');

    await logAction(req.user.id, `Export CSV participant #${userId} (${prenom} ${nom})`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send('\ufeff' + csv);
  } catch (err) {
    console.error('[ADMIN] Erreur export participant CSV :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}
