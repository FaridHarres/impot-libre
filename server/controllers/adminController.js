import pool from '../db.js';
import { toCSV } from '../utils/exportCSV.js';

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

    // ─── Stats par ministère : moyenne, médiane, min, max, écart-type ───
    const statsResult = await pool.query(`
      SELECT
        m.id,
        m.name,
        m.slug,
        m.minimum_percentage,
        COUNT(ad.id)::int AS nb_participants,
        ROUND(AVG(ad.percentage), 2) AS moyenne,
        ROUND(MIN(ad.percentage), 2) AS min_percent,
        ROUND(MAX(ad.percentage), 2) AS max_percent,
        ROUND(STDDEV(ad.percentage), 2) AS ecart_type
      FROM ministeres m
      LEFT JOIN allocations_detail ad ON ad.ministere_id = m.id
      GROUP BY m.id, m.name, m.slug, m.minimum_percentage
      ORDER BY moyenne DESC NULLS LAST
    `);

    // Médiane par ministère
    const medianResult = await pool.query(`
      SELECT
        m.id,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ad.percentage)::numeric, 2) AS mediane
      FROM ministeres m
      LEFT JOIN allocations_detail ad ON ad.ministere_id = m.id
      GROUP BY m.id
    `);
    const medianMap = new Map(medianResult.rows.map((r) => [r.id, parseFloat(r.mediane) || 0]));

    // Moyenne en euros par ministère
    const eurosResult = await pool.query(`
      SELECT
        ad.ministere_id,
        ROUND(AVG((ad.percentage / 100.0) * a.total_amount), 2) AS moyenne_euros
      FROM allocations_detail ad
      JOIN allocations a ON a.id = ad.allocation_id
      GROUP BY ad.ministere_id
    `);
    const eurosMap = new Map(eurosResult.rows.map((r) => [r.ministere_id, parseFloat(r.moyenne_euros) || 0]));

    const ministeres = statsResult.rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
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
      ministeres,
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
