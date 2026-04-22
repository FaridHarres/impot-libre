/**
 * Utilitaire d'envoi de SMS via Twilio.
 *
 * Nécessite dans le .env :
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE  (numéro expéditeur Twilio, format +33...)
 *
 * En développement (pas de SID ou NODE_ENV !== 'production'),
 * les SMS sont logués en console.
 */

/**
 * Envoie un SMS via l'API REST Twilio (sans SDK, fetch natif).
 */
async function sendSms(to, body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE;

  // Mode développement
  if (!accountSid || !authToken || process.env.NODE_ENV !== 'production') {
    console.log('─────────────────────────────────────');
    console.log('[SMS] SMS simulé (pas de Twilio SID ou dev mode)');
    console.log(`  To   : ${to}`);
    console.log(`  Body : ${body}`);
    console.log('─────────────────────────────────────');
    return { success: true, simulated: true };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', from);
  params.append('Body', body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[SMS] Erreur Twilio :', response.status, text);
    throw new Error(`Erreur envoi SMS : ${response.status}`);
  }

  return { success: true };
}

/**
 * Envoie le code OTP par SMS (2FA admin).
 */
export async function sendOTPSms(phone, otp) {
  return sendSms(
    phone,
    `[Impôt Libre] Votre code de connexion admin : ${otp} (valable 5 min)`
  );
}
