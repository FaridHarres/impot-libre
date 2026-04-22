import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint = null;

async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getFingerprint() {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const visitorId = result.visitorId;

    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const language = navigator.language || navigator.userLanguage || 'fr';

    const rawString = `${visitorId}|${screenInfo}|${language}`;
    cachedFingerprint = await hashString(rawString);

    return cachedFingerprint;
  } catch (error) {
    console.error('Erreur lors de la generation de l\'empreinte :', error);
    const fallback = `fallback|${Date.now()}|${Math.random()}`;
    cachedFingerprint = await hashString(fallback);
    return cachedFingerprint;
  }
}

export function clearFingerprintCache() {
  cachedFingerprint = null;
}

export default getFingerprint;
