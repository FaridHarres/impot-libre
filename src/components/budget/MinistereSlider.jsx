import { useCallback } from 'react';
import useBudget from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/formatCurrency';

const LOCK_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-avertissement"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

export default function MinistereSlider({ ministry, taxAmount = 0 }) {
  const { updateMinistry, remaining } = useBudget();

  const { id, name, minimum, percentage } = ministry;
  const isAtMinimum = percentage <= minimum;

  // ─── Max dynamique : valeur actuelle + reste disponible ───
  const maxDynamique = parseFloat((percentage + Math.max(0, remaining)).toFixed(1));

  // Slider désactivé si : reste = 0 ET déjà au minimum
  const isDisabled = remaining <= 0 && isAtMinimum;

  // ─── Montants en euros (temps réel) — toujours calculés ───
  const montantCalcule = (percentage / 100) * taxAmount;
  const montantMinimum = (minimum / 100) * taxAmount;
  const hasTaxAmount = taxAmount > 0;

  const handleSliderChange = useCallback(
    (e) => {
      const val = parseFloat(e.target.value);
      updateMinistry(id, val);
    },
    [id, updateMinistry]
  );

  const handleInputChange = useCallback(
    (e) => {
      const raw = e.target.value;
      if (raw === '') return;
      const val = parseFloat(raw);
      if (isNaN(val)) return;
      updateMinistry(id, val);
    },
    [id, updateMinistry]
  );

  // Remplissage visuel du slider
  const fillPercent =
    maxDynamique > minimum
      ? ((percentage - minimum) / (maxDynamique - minimum)) * 100
      : percentage > minimum ? 100 : 0;

  const trackColor = isAtMinimum ? '#B34000' : '#003189';

  return (
    <div
      className={`bg-white border rounded-sm p-4 mb-3 transition-opacity ${
        isDisabled ? 'border-gris-bordure/50 opacity-60' : 'border-gris-bordure'
      }`}
    >
      {/* Ligne du haut : nom + pourcentage + montant € */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-texte truncate">{name}</span>
          {isAtMinimum && (
            <span title="Plancher minimum atteint" className="shrink-0">{LOCK_ICON}</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Champ pourcentage */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={percentage}
              onChange={handleInputChange}
              min={minimum}
              max={maxDynamique}
              step={0.1}
              disabled={isDisabled}
              className="w-16 px-2 py-1 text-sm text-right border border-gris-bordure rounded-sm focus:outline-none focus:ring-1 focus:ring-bleu-republique disabled:bg-gray-100 disabled:cursor-not-allowed"
              aria-label={`Pourcentage pour ${name}`}
            />
            <span className="text-sm text-gris-texte">%</span>
          </div>

          {/* Montant en € — TOUJOURS affiché */}
          <span className={`text-sm font-semibold whitespace-nowrap min-w-[100px] text-right ${
            hasTaxAmount ? 'text-bleu-republique' : 'text-gris-texte'
          }`}>
            {hasTaxAmount ? formatCurrency(montantCalcule) : '— €'}
          </span>
        </div>
      </div>

      {/* Slider avec max dynamique */}
      <input
        type="range"
        min={minimum}
        max={maxDynamique}
        step={0.1}
        value={percentage}
        onChange={handleSliderChange}
        disabled={isDisabled}
        className="w-full h-2 rounded-sm appearance-none cursor-pointer disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${fillPercent}%, #DDDDDD ${fillPercent}%, #DDDDDD 100%)`,
        }}
        aria-label={`Curseur pour ${name}`}
      />

      {/* Ligne du bas : minimum % + montant minimum */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gris-texte">
          Min. {minimum} %
        </span>
        <span className="text-xs text-gris-texte italic">
          {hasTaxAmount ? `min. ${formatCurrency(montantMinimum)}` : `min. ${minimum} %`}
        </span>
      </div>
    </div>
  );
}
