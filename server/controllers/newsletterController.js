import pool from '../db.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Inscription à la newsletter.
 * POST /api/newsletter/subscribe
 */
export async function subscribe(req, res) {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si déjà inscrit
    const existing = await pool.query(
      'SELECT id FROM newsletter WHERE email = $1',
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cette adresse est déjà inscrite à la newsletter.' });
    }

    await pool.query(
      'INSERT INTO newsletter (email) VALUES ($1)',
      [normalizedEmail]
    );

    return res.status(201).json({ message: 'Inscription à la newsletter confirmée.' });
  } catch (err) {
    console.error('[NEWSLETTER] Erreur inscription :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

/**
 * Désinscription de la newsletter.
 * POST /api/newsletter/unsubscribe
 */
export async function unsubscribe(req, res) {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const result = await pool.query(
      'DELETE FROM newsletter WHERE email = $1 RETURNING id',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cette adresse n\'est pas inscrite à la newsletter.' });
    }

    return res.json({ message: 'Désinscription effectuée.' });
  } catch (err) {
    console.error('[NEWSLETTER] Erreur désinscription :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

/**
 * Liste de tous les abonnés (admin uniquement).
 * GET /api/newsletter/subscribers?page=1&limit=50
 */
export async function listSubscribers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM newsletter');
    const total = countResult.rows[0].total;

    const result = await pool.query(
      'SELECT id, email, subscribed_at FROM newsletter ORDER BY subscribed_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return res.json({
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      subscribers: result.rows,
    });
  } catch (err) {
    console.error('[NEWSLETTER] Erreur liste abonnés :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

/**
 * Envoi d'une campagne newsletter via l'API Brevo (ex-Sendinblue).
 * POST /api/newsletter/campaign
 *
 * Body attendu :
 * {
 *   subject: "Sujet de l'email",
 *   htmlContent: "<html>...</html>"
 * }
 *
 * Note : implémentation placeholder — nécessite la clé BREVO_API_KEY.
 */
export async function sendCampaign(req, res) {
  try {
    const { subject, htmlContent } = req.body;

    if (!subject || !htmlContent) {
      return res.status(400).json({ error: 'Sujet et contenu HTML requis.' });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey || apiKey.startsWith('xkeysib-votre')) {
      return res.status(503).json({
        error: 'Clé API Brevo non configurée. Définissez BREVO_API_KEY dans les variables d\'environnement.',
      });
    }

    // Récupérer tous les abonnés
    const subscribersResult = await pool.query('SELECT email FROM newsletter');
    const subscribers = subscribersResult.rows.map((r) => r.email);

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'Aucun abonné à la newsletter.' });
    }

    // Appel à l'API Brevo via sib-api-v3-sdk
    const SibApiV3Sdk = await import('sib-api-v3-sdk');
    const defaultClient = SibApiV3Sdk.default.ApiClient.instance;
    const apiKeyAuth = defaultClient.authentications['api-key'];
    apiKeyAuth.apiKey = apiKey;

    const apiInstance = new SibApiV3Sdk.default.TransactionalEmailsApi();

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'ne-pas-repondre@impot-libre.fr';
    const senderName = process.env.BREVO_SENDER_NAME || 'Impôt Libre';

    // Envoi en batch (par lots de 50 pour éviter les limites)
    const batchSize = 50;
    let sent = 0;
    let errors = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const sendSmtpEmail = new SibApiV3Sdk.default.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = { name: senderName, email: senderEmail };
      sendSmtpEmail.to = batch.map((email) => ({ email }));

      try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        sent += batch.length;
      } catch (sendErr) {
        console.error('[NEWSLETTER] Erreur envoi batch :', sendErr);
        errors += batch.length;
      }
    }

    // Log admin
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action) VALUES ($1, $2)',
      [req.user.id, `Campagne newsletter envoyée : "${subject}" — ${sent} envoyés, ${errors} erreurs`]
    );

    return res.json({
      message: 'Campagne envoyée.',
      total_destinataires: subscribers.length,
      envoyes: sent,
      erreurs: errors,
    });
  } catch (err) {
    console.error('[NEWSLETTER] Erreur campagne :', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
