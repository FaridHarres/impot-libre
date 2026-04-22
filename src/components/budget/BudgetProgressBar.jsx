import { useState } from 'react';
import useBudget from '../../hooks/useBudget';

const POLE_COLORS = [
  '#3B82F6', '#F43F5E', '#10B981', '#F59E0B',
  '#22C55E', '#0EA5E9', '#A855F7', '#64748B',
];

export default function BudgetProgressBar() {
  const { poles, total } = useBudget();
  const [tooltip, setTooltip] = useState(null);

  const activePoles = poles.filter((p) => p.percentage > 0);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-semibold text-primary">
          Répartition globale
        </span>
        <span
          className={`text-sm font-bold ${
            Math.abs(total - 100) < 0.01 ? 'text-success' : 'text-danger'
          }`}
        >
          {total.toFixed(1)} %
        </span>
      </div>

      {/* Stacked bar */}
      <div className="relative w-full h-8 bg-primary-50 rounded-lg overflow-hidden flex">
        {activePoles.map((p, i) => {
          const widthPct = total > 0 ? (p.percentage / total) * 100 : 0;
          const color = POLE_COLORS[i % POLE_COLORS.length];

          return (
            <div
              key={p.id}
              className="h-full flex items-center justify-center overflow-hidden relative cursor-pointer transition-all duration-300 hover:brightness-110"
              style={{
                width: `${widthPct}%`,
                backgroundColor: color,
                minWidth: widthPct > 0 ? '3px' : '0',
              }}
              onMouseEnter={() =>
                setTooltip({ id: p.id, name: p.name, emoji: p.emoji, pct: p.percentage })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              {widthPct > 6 && (
                <span className="text-[10px] font-semibold text-white truncate px-1">
                  {p.emoji}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 inline-flex items-center gap-2 bg-white border border-gris-bordure rounded-lg px-3 py-2 shadow-card text-xs text-texte animate-fade-in">
          <span className="text-base">{tooltip.emoji}</span>
          <span className="font-semibold">{tooltip.name}</span>
          <span className="text-accent font-bold">
            {tooltip.pct.toFixed(1)} %
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {activePoles.map((p, i) => {
          const color = POLE_COLORS[i % POLE_COLORS.length];
          return (
            <div key={p.id} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-gris-texte font-medium">
                {p.emoji} {p.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
