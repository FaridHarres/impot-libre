import { useState } from 'react';
import useBudget from '../../hooks/useBudget';

// Deterministic color palette for ministry segments
const SEGMENT_COLORS = [
  '#003189', '#E1000F', '#18753C', '#B34000', '#6A28C7',
  '#00838F', '#C62828', '#2E7D32', '#EF6C00', '#4527A0',
  '#00695C', '#AD1457', '#1565C0', '#F9A825', '#6D4C41',
  '#546E7A', '#D84315', '#1B5E20', '#0277BD', '#7B1FA2',
];

/**
 * Génère une abréviation courte à partir du nom complet du ministère.
 * Ex: "Éducation nationale" → "Éduc.", "Outre-Mer" → "O-M."
 */
function getAbbreviation(name) {
  if (!name) return '?';
  // Prendre le premier mot, tronquer à 5 caractères + "."
  const firstWord = name.split(/[\s,]+/)[0];
  if (firstWord.length <= 5) return firstWord;
  return firstWord.substring(0, 4) + '.';
}

export default function BudgetProgressBar() {
  const { ministries, total } = useBudget();
  const [tooltip, setTooltip] = useState(null);

  // Only show ministries with percentage > 0
  const activeMinistries = ministries.filter((m) => m.percentage > 0);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-texte">
          Repartition globale
        </span>
        <span
          className={`text-sm font-semibold ${
            Math.abs(total - 100) < 0.01 ? 'text-succes' : 'text-rouge-marianne'
          }`}
        >
          {total.toFixed(1)} %
        </span>
      </div>

      {/* Stacked bar */}
      <div className="relative w-full h-8 bg-gris-bordure rounded-sm overflow-hidden flex">
        {activeMinistries.map((m, i) => {
          const widthPct = total > 0 ? (m.percentage / total) * 100 : 0;
          const abbr = getAbbreviation(m.name);
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

          return (
            <div
              key={m.id}
              className="h-full flex items-center justify-center overflow-hidden relative cursor-pointer transition-opacity hover:opacity-90"
              style={{
                width: `${widthPct}%`,
                backgroundColor: color,
                minWidth: widthPct > 0 ? '2px' : '0',
              }}
              onMouseEnter={() =>
                setTooltip({ id: m.id, name: m.name, pct: m.percentage })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              {widthPct > 4 && (
                <span className="text-[10px] font-medium text-white truncate px-0.5">
                  {abbr}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-1 inline-flex items-center gap-2 bg-white border border-gris-bordure rounded-sm px-3 py-1.5 shadow-sm text-xs text-texte">
          <span className="font-medium">{tooltip.name}</span>
          <span className="text-bleu-republique font-semibold">
            {tooltip.pct.toFixed(1)} %
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {activeMinistries.map((m, i) => {
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
          const abbr = getAbbreviation(m.name);

          return (
            <div key={m.id} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-gris-texte">{abbr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
