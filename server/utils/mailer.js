/**
 * Utilitaire d'envoi d'emails via l'API Brevo (ex-Sendinblue).
 *
 * Nécessite : BREVO_API_KEY dans le .env
 *
 * En mode développement (NODE_ENV !== 'production'), les emails sont
 * simplement logués en console pour faciliter le debug.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Envoie un email via l'API Brevo.
 */
async function sendEmail({ to, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;

  // Mode développement : log en console
  if (!apiKey || process.env.NODE_ENV !== 'production') {
    console.log('─────────────────────────────────────');
    console.log('[MAILER] Email simulé (pas de BREVO_API_KEY ou dev mode)');
    console.log(`  To      : ${to.map((t) => t.email).join(', ')}`);
    console.log(`  Subject : ${subject}`);
    const linkMatch = htmlContent.match(/href="(https?:\/\/[^"]+)"/);
    if (linkMatch) {
      console.log(`  Lien    : ${linkMatch[1]}`);
    }
    console.log('─────────────────────────────────────');
    return { success: true, simulated: true };
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Impôt Libre', email: process.env.BREVO_SENDER_EMAIL || 'ne-pas-repondre@impot-libre.fr' },
      to,
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[MAILER] Erreur Brevo :', response.status, text);
    throw new Error(`Erreur envoi email : ${response.status}`);
  }

  return { success: true };
}

/**
 * Envoie l'email de vérification d'adresse.
 */
export async function sendVerificationEmail(email, prenom, token) {
  const baseUrl = process.env.BASE_URL || 'https://impot-libre.fr';
  const link = `${baseUrl}/api/auth/verify/${token}`;

  return sendEmail({
    to: [{ email, name: prenom }],
    subject: 'Confirmez votre adresse email — Impôt Libre',
    htmlContent: `
      <div style="font-family: 'Marianne', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <!-- Header tricolore -->
        <div style="display: flex; height: 4px;">
          <div style="flex: 1; background: #003189;"></div>
          <div style="flex: 1; background: #fff;"></div>
          <div style="flex: 1; background: #E1000F;"></div>
        </div>
        <div style="background: #003189; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 0.5px;">Impôt Libre</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 16px; color: #1E1E1E;">Bonjour <strong>${escapeHtml(prenom)}</strong>,</p>
          <p style="font-size: 15px; color: #333; line-height: 1.6;">
            Merci de votre inscription sur Impôt Libre. Pour activer votre compte
            et pouvoir soumettre votre répartition, veuillez confirmer votre adresse email
            en cliquant sur le bouton ci-dessous :
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}"
               style="display: inline-block; background: #003189; color: #fff; padding: 14px 36px;
                      text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
              Confirmer mon email
            </a>
          </div>
          <p style="font-size: 13px; color: #666; line-height: 1.5;">
            Ce lien est valable <strong>24 heures</strong>. Si vous n'êtes pas à l'origine
            de cette inscription, ignorez simplement cet email.
          </p>
          <p style="font-size: 13px; color: #999; margin-top: 24px;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
            <a href="${link}" style="color: #003189; word-break: break-all;">${link}</a>
          </p>
        </div>
        <div style="background: #F5F5FE; padding: 16px 24px; text-align: center; border-top: 1px solid #ddd;">
          <p style="font-size: 11px; color: #888; margin: 0;">
            impot-libre.fr — Outil citoyen à titre informatif. Aucune affiliation politique.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 */
export async function sendPasswordResetEmail(email, prenom, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.impot-libre.fr';
  const link = `${frontendUrl}/reset-password/${token}`;

  return sendEmail({
    to: [{ email, name: prenom }],
    subject: 'Réinitialisation de votre mot de passe — Impôt Libre',
    htmlContent: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: linear-gradient(135deg, #1A3A6B 0%, #2952A3 100%); padding: 28px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">Impôt Libre</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 16px; color: #1A1A2E;">Bonjour <strong>${escapeHtml(prenom)}</strong>,</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe sur impot-libre.fr.
            Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}"
               style="display: inline-block; background: #4F7FFF; color: #fff; padding: 14px 36px;
                      text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="font-size: 13px; color: #DC2626; font-weight: 600;">
            ⏱️ Ce lien expire dans 15 minutes.
          </p>
          <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin-top: 16px;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            Votre mot de passe actuel reste inchangé.
          </p>
          <div style="margin-top: 24px; padding: 12px; background: #F7F9FC; border-radius: 6px; border: 1px solid #E5E7EB;">
            <p style="font-size: 12px; color: #6B7280; margin: 0;">
              🔒 Pour votre sécurité : ne partagez jamais ce lien. Notre équipe ne vous demandera jamais votre mot de passe.
            </p>
          </div>
          <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px;">
            Si le bouton ne fonctionne pas :<br/>
            <a href="${link}" style="color: #4F7FFF; word-break: break-all;">${link}</a>
          </p>
        </div>
        <div style="background: #F7F9FC; padding: 16px 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="font-size: 11px; color: #9CA3AF; margin: 0;">
            impot-libre.fr — Outil citoyen indépendant. Cet email est envoyé automatiquement, ne pas répondre.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Envoie le code OTP par email (2FA admin).
 */
export async function sendOTPEmail(email, otp) {
  return sendEmail({
    to: [{ email }],
    subject: 'Code de connexion admin — Impôt Libre',
    htmlContent: `
      <div style="font-family: 'Marianne', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: #003189; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">Impôt Libre — Admin</h1>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <p style="font-size: 15px; color: #333;">Votre code de connexion :</p>
          <div style="background: #F5F5FE; border: 2px solid #003189; border-radius: 8px;
                      padding: 20px; margin: 20px auto; max-width: 200px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #003189;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #E1000F; font-weight: 600;">
            Ce code expire dans 5 minutes.
          </p>
          <p style="font-size: 13px; color: #666; margin-top: 20px;">
            Si vous n'avez pas demandé ce code, quelqu'un tente d'accéder
            à votre espace admin. Changez votre mot de passe immédiatement.
          </p>
        </div>
      </div>
    `,
  });
}
