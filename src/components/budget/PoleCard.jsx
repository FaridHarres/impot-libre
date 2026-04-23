import { memo, useCallback, useMemo, useState } from 'react';
import useBudget from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/formatCurrency';
import polesInfo from '../../data/polesInfo';
import PoleInfoModal from './PoleInfoModal';

const POLE_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-rose-500 to-red-600',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
  'from-green-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-purple-500 to-violet-600',
  'from-slate-500 to-slate-700',
];

const POLE_COLORS_HEX = [
  ['#3B82F6', '#1D4ED8'],
  ['#F43F5E', '#DC2626'],
  ['#10B981', '#047857'],
  ['#F59E0B', '#EA580C'],
  ['#22C55E', '#0D9488'],
  ['#0EA5E9', '#2563EB'],
  ['#A855F7', '#7C3AED'],
  ['#64748B', '#334155'],
];

const PoleCard = memo(function PoleCard({ pole, taxAmount = 0, index = 0, onSliderChange }) {
  const { id, name, emoji, minimum, percentage, ministeres } = pole;
  const { remaining } = useBudget();
  const [showModal, setShowModal] = useState(false);
  const info = polesInfo[id];

  const isAtMinimum = percentage <= minimum;
  const maxDynamique = parseFloat((percentage + Math.max(0, remaining)).toFixed(1));
  const isDisabled = remaining <= 0 && isAtMinimum;
  const hasTaxAmount = taxAmount > 0;
  const colors = POLE_COLORS_HEX[index % POLE_COLORS_HEX.length];
  const gradient = POLE_GRADIENTS[index % POLE_GRADIENTS.length];

  const montantCalcule = useMemo(
    () => (percentage / 100) * taxAmount,
    [percentage, taxAmount]
  );

  const fillPercent = useMemo(
    () =>
      maxDynamique > minimum
        ? ((percentage - minimum) / (maxDynamique - minimum)) * 100
        : percentage > minimum ? 100 : 0,
    [percentage, minimum, maxDynamique]
  );

  const handleSliderChange = useCallback(
    (e) => {
      const val = parseFloat(e.target.value);
      if (onSliderChange) {
        onSliderChange(id, val);
      }
    },
    [id, onSliderChange]
  );

  const handleInputChange = useCallback(
    (e) => {
      const raw = e.target.value.replace(',', '.');
      if (raw === '' || raw === '.') return;
      const val = parseFloat(raw);
      if (isNaN(val)) return;
      const clamped = Math.min(Math.max(val, minimum), 100);
      if (onSliderChange) {
        onSliderChange(id, clamped);
      }
    },
    [id, minimum, onSliderChange]
  );

  return (
    <div
      className={`pole-card relative bg-white border rounded-xl p-5 overflow-hidden group ${
        isDisabled
          ? 'border-gris-bordure/50 opacity-60'
          : 'border-gris-bordure hover:shadow-card-hover hover:-translate-y-0.5'
      }`}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* Decorative background */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] -translate-y-8 translate-x-8"
        style={{
          background: `radial-gradient(circle, ${colors[0]}, ${colors[1]})`,
          transition: 'transform 0.3s ease',
        }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 mb-4 relative">
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shrink-0 shadow-sm`}
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-primary leading-tight">
            {name}
          </h3>
          <p className="text-[11px] text-gris-texte mt-0.5 leading-relaxed line-clamp-2">
            {ministeres.join(' · ')}
          </p>
        </div>
      </div>

      {/* Description + En savoir plus */}
      {info && (
        <div className="mb-3">
          <p className="text-[11px] text-gris-texte leading-relaxed line-clamp-2">
            {info.descriptionCourte}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-[11px] text-accent font-semibold hover:text-accent-600 mt-1 cursor-pointer transition-colors"
          >
            En savoir plus →
          </button>
        </div>
      )}

      {/* Slider - CSS transitions only, no framer-motion */}
      <div className="relative mb-1">
        <input
          type="range"
          min={minimum}
          max={maxDynamique}
          step={0.1}
          value={percentage}
          onChange={handleSliderChange}
          disabled={isDisabled}
          className="w-full h-[6px] rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, ${colors[0]} 0%, ${colors[1]} ${fillPercent}%, #E5E7EB ${fillPercent}%, #E5E7EB 100%)`,
          }}
          aria-label={`Curseur pour ${name}`}
        />
      </div>

      {/* Thin progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="progress-bar h-full rounded-full"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
            willChange: 'width',
            transition: 'width 0.25s ease',
            transform: 'translateZ(0)',
          }}
        />
      </div>

      {/* Percentage + Amount */}
      <div className="flex items-center justify-between">
        <div className="pole-input-group">
          <div
            className="pole-input-wrapper"
            style={{ '--pole-color': colors[0], '--pole-color-end': colors[1] }}
          >
            <input
              type="text"
              inputMode="decimal"
              value={percentage.toFixed(1)}
              onChange={handleInputChange}
              disabled={isDisabled}
              className="pole-input-field"
              aria-label={`Pourcentage pour ${name}`}
            />
            <span className="pole-input-suffix">%</span>
          </div>
        </div>

        <span
          className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${
            hasTaxAmount
              ? 'bg-accent-50 text-accent border border-accent/20'
              : 'bg-gray-50 text-gris-texte border border-gris-bordure'
          }`}
        >
          {hasTaxAmount ? formatCurrency(montantCalcule) : '— €'}
        </span>
      </div>

      {/* Minimum label */}
      <p className="mt-2.5 text-[11px] text-gris-texte/60 text-right">
        minimum : {minimum} %
      </p>

      {/* Info Modal */}
      {showModal && (
        <PoleInfoModal
          poleId={id}
          percentage={percentage}
          taxAmount={taxAmount}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison — only re-render when meaningful props change
  return (
    prev.pole.percentage === next.pole.percentage &&
    prev.pole.id === next.pole.id &&
    prev.taxAmount === next.taxAmount &&
    prev.index === next.index
  );
});

export default PoleCard;
