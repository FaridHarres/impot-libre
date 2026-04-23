import PDFDocument from 'pdfkit';
import pool from '../db.js';
import logger from '../utils/logger.js';

/**
 * Format number as French currency without toLocaleString
 * (avoids encoding issues in PDF)
 */
function formatEuros(amount) {
  const fixed = parseFloat(amount).toFixed(2);
  const [whole, decimals] = fixed.split('.');
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted},${decimals} €`;
}

/**
 * GET /api/pdf/download
 * Generates and streams a PDF of the user's allocation.
 * JWT required — user_id extracted from token, never from URL.
 */
export async function downloadPDF(req, res) {
  const userId = req.user.id;
  const ip = req.ip || '';

  try {
    // Fetch allocation (v2 only)
    const allocResult = await pool.query(
      'SELECT id, total_amount, created_at FROM allocations WHERE user_id = $1 AND structure_version = 2 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (allocResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aucune répartition trouvée.' });
    }

    const alloc = allocResult.rows[0];
    const totalAmount = parseFloat(alloc.total_amount);
    const dateStr = new Date(alloc.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    // Fetch detail by pole
    const detailResult = await pool.query(
      `SELECT
        p.name AS pole_name, p.emoji,
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

    const poles = detailResult.rows;

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Ma Repartition Budgetaire - Impot Libre',
        Author: 'impot-libre.fr',
      },
    });

    // Security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ma-repartition-impot-libre-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.setHeader('Pragma', 'no-cache');

    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, 595, 100).fill('#1A3A6B');
    doc.fontSize(24).fill('#FFFFFF').text('impot-libre.fr', 50, 30);
    doc.fontSize(10).fill('#FFFFFF').opacity(0.7).text('Outil citoyen independant', 50, 60);
    doc.opacity(1);

    // ── Title ──
    doc.fill('#1A3A6B').fontSize(20).text('Ma Repartition Budgetaire', 50, 130);
    doc.fontSize(11).fill('#6B7280').text(`Loi de Finances 2024 — Genere le ${dateStr}`, 50, 158);

    // Warning
    doc.rect(50, 185, 495, 30).fill('#FEF3C7');
    doc.fontSize(9).fill('#92400E').text('Document personnel et confidentiel — ne constitue pas un document administratif', 60, 195);

    // ── Amount ──
    doc.rect(50, 235, 495, 50).fill('#EDF2FF');
    doc.fontSize(12).fill('#1A3A6B').text("Montant d'impot declare", 60, 248);
    doc.fontSize(18).fill('#1A3A6B').text(formatEuros(totalAmount), 350, 245, { align: 'right', width: 185 });

    // ── Table header ──
    const tableTop = 310;
    doc.rect(50, tableTop, 495, 25).fill('#1A3A6B');
    doc.fontSize(10).fill('#FFFFFF');
    doc.text('Mission budgetaire', 60, tableTop + 7, { width: 280 });
    doc.text('%', 360, tableTop + 7, { width: 50, align: 'right' });
    doc.text('Montant', 420, tableTop + 7, { width: 115, align: 'right' });

    // ── Table rows (no emojis — PDFKit default font doesn't support them) ──
    let y = tableTop + 25;
    poles.forEach((pole, i) => {
      const bg = i % 2 === 0 ? '#F7F9FC' : '#FFFFFF';
      doc.rect(50, y, 495, 22).fill(bg);
      doc.fontSize(9).fill('#374151');
      doc.text(pole.pole_name, 60, y + 6, { width: 280 });
      doc.fill('#1A3A6B').text(`${parseFloat(pole.pourcentage).toFixed(1)} %`, 360, y + 6, { width: 50, align: 'right' });
      doc.fill('#4F7FFF').text(formatEuros(pole.montant), 420, y + 6, { width: 115, align: 'right' });
      y += 22;
    });

    // ── Total row ──
    doc.rect(50, y, 495, 25).fill('#1A3A6B');
    doc.fontSize(10).fill('#FFFFFF');
    doc.text('TOTAL', 60, y + 7, { width: 280 });
    doc.text('100 %', 360, y + 7, { width: 50, align: 'right' });
    doc.text(formatEuros(totalAmount), 420, y + 7, { width: 115, align: 'right' });

    // ── Comparison: Ma repartition vs LFI 2024 ──
    y += 40;

    // Check if we need a new page
    if (y > 620) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(14).fill('#1A3A6B').text('Ma repartition face au Budget de la Nation', 50, y);
    y += 22;
    doc.fontSize(9).fill('#6B7280').text('Loi de Finances 2024 — Credits de paiement officiels (352 Md euros)', 50, y);
    y += 25;

    // Budget data per pole (official LFI 2024 amounts in Md euros)
    const officialBudgets = {
      'Enseignement scolaire': 63.6, 'Recherche et enseignement superieur': 31.8,
      'Defense': 56.8, 'Securites et justice': 36.3, 'Sante': 2.3,
      'Solidarite et insertion': 30.8, 'Travail et emploi': 22.4,
      'Logement et territoires': 19.4, 'Ecologie et agriculture': 26.9,
      'Economie et finances publiques': 16.3, 'Culture et medias': 8.6,
      'Action internationale': 9.4, 'Outre-mer': 2.76,
      'Immigration et integration': 2.16, 'Investissement et innovation': 7.3,
      'Sport, jeunesse et memoire nationale': 3.7, 'Institutions et gouvernance': 11.8,
    };
    const budgetTotal = 352.3;

    // Normalize pole name for lookup (remove accents)
    function normalize(str) {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    // Table header
    doc.rect(50, y, 495, 22).fill('#1A3A6B');
    doc.fontSize(8).fill('#FFFFFF');
    doc.text('Mission', 60, y + 6, { width: 200 });
    doc.text('Mon choix', 270, y + 6, { width: 60, align: 'right' });
    doc.text('LFI 2024', 340, y + 6, { width: 60, align: 'right' });
    doc.text('Ecart', 420, y + 6, { width: 115, align: 'right' });
    y += 22;

    poles.forEach((pole, i) => {
      if (y > 710) { doc.addPage(); y = 50; }
      const bg = i % 2 === 0 ? '#F7F9FC' : '#FFFFFF';
      doc.rect(50, y, 495, 20).fill(bg);

      const normalizedName = normalize(pole.pole_name);
      const officialEntry = Object.entries(officialBudgets).find(([k]) => normalize(k) === normalizedName);
      const officialMd = officialEntry ? officialEntry[1] : 0;
      const officialPct = budgetTotal > 0 ? parseFloat(((officialMd / budgetTotal) * 100).toFixed(1)) : 0;
      const userPct = parseFloat(pole.pourcentage);
      const ecart = parseFloat((userPct - officialPct).toFixed(1));

      doc.fontSize(8).fill('#374151').text(pole.pole_name, 60, y + 5, { width: 200 });
      doc.fill('#4F7FFF').text(`${userPct.toFixed(1)} %`, 270, y + 5, { width: 60, align: 'right' });
      doc.fill('#1A3A6B').text(`${officialPct.toFixed(1)} %`, 340, y + 5, { width: 60, align: 'right' });

      const ecartColor = ecart > 0 ? '#00C48C' : ecart < 0 ? '#FF4D4F' : '#6B7280';
      const ecartStr = `${ecart > 0 ? '+' : ''}${ecart.toFixed(1)} pts`;
      doc.fill(ecartColor).text(ecartStr, 420, y + 5, { width: 115, align: 'right' });

      y += 20;
    });

    y += 10;
    doc.fontSize(7).fill('#9CA3AF').text(
      'Pourcentages LFI 2024 calcules sur la base des 17 missions arbitrables (352 Md euros). Source : budget.gouv.fr',
      50, y, { width: 495 }
    );

    // ── Footer ──
    const footerY = 750;
    doc.rect(0, footerY, 595, 92).fill('#F7F9FC');
    doc.fontSize(8).fill('#9CA3AF');
    doc.text(
      "Ce document est genere a titre personnel et informatif uniquement. impot-libre.fr est un outil citoyen independant non affilie a l'Etat francais. Aucune donnee personnelle identifiante n'apparait dans ce document.",
      50, footerY + 15, { width: 495, lineGap: 3 }
    );
    doc.text('Source : Loi de Finances 2024 — LOI n 2023-1322 du 29 decembre 2023 — budget.gouv.fr', 50, footerY + 55, { width: 495 });

    doc.end();

    logger.info('PDF_TELECHARGE', { userId, ip });
  } catch (err) {
    logger.error('PDF_ERREUR', { userId, error: err.message, ip });
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Erreur lors de la generation du PDF.' });
    }
  }
}
