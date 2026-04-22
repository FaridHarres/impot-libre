/**
 * Formate un montant en euros au format français.
 * formatCurrency(898.8)  → "898,80 €"
 * formatCurrency(4200)   → "4 200,00 €"
 */
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0,00 €';
  }
  return currencyFormatter.format(amount);
}

/**
 * Formate un pourcentage.
 * formatPercentage(21.4) → "21,4 %"
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0 %';
  }
  return `${Number(value).toFixed(decimals).replace('.', ',')} %`;
}

export default formatCurrency;
