import crypto from 'crypto';

/**
 * Génère un hash SHA-256 à partir des éléments d'empreinte du navigateur.
 * Utilisé pour détecter les comptes multiples (anti-fraude).
 *
 * @param {string} ip         - Adresse IP du client
 * @param {string} userAgent  - User-Agent du navigateur
 * @param {string} resolution - Résolution écran (ex: "1920x1080")
 * @param {string} language   - Langue du navigateur (ex: "fr-FR")
 * @returns {string} Hash SHA-256 en hexadécimal
 */
export function hashFingerprint(ip, userAgent, resolution, language) {
  const data = [ip, userAgent, resolution, language].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Génère un hash SHA-256 de l'adresse IP seule.
 *
 * @param {string} ip - Adresse IP du client
 * @returns {string} Hash SHA-256 en hexadécimal
 */
export function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}
