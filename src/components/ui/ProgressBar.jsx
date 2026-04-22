export default function ProgressBar({
  value = 0,
  color = 'bleu-republique',
  label,
  showPercentage = true,
}) {
  const clamped = Math.min(100, Math.max(0, value));

  const colorMap = {
    'bleu-republique': 'bg-bleu-republique',
    'rouge-marianne': 'bg-rouge-marianne',
    succes: 'bg-succes',
    avertissement: 'bg-avertissement',
  };
  const barClass = colorMap[color] || colorMap['bleu-republique'];

  return (
    <div className="mb-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm font-medium text-texte">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-gris-texte">
              {clamped.toFixed(1)} %
            </span>
          )}
        </div>
      )}
      <div className="w-full h-3 bg-gris-bordure rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm transition-all duration-300 ${barClass}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
