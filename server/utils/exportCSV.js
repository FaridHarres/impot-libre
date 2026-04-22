/**
 * Convertit un tableau d'objets en format CSV.
 *
 * @param {Array<Object>} rows    - Données à exporter
 * @param {string[]}      columns - Noms des colonnes
 * @returns {string} Contenu CSV
 */
export function toCSV(rows, columns) {
  // En-tête
  const header = columns.map(escapeCSVField).join(';');

  // Lignes de données
  const lines = rows.map((row) =>
    columns.map((col) => escapeCSVField(row[col] ?? '')).join(';')
  );

  return [header, ...lines].join('\n');
}

/**
 * Échappe un champ CSV selon la RFC 4180.
 * Utilise le point-virgule comme séparateur (convention française).
 */
function escapeCSVField(value) {
  const str = String(value);
  if (str.includes('"') || str.includes(';') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
