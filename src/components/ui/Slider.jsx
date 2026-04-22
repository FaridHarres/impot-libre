export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 0.1,
  onChange,
  disabled = false,
  color = 'bleu-republique',
}) {
  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const colorMap = {
    'bleu-republique': '#003189',
    'rouge-marianne': '#E1000F',
    succes: '#18753C',
    avertissement: '#B34000',
  };
  const trackColor = colorMap[color] || colorMap['bleu-republique'];

  return (
    <div className="mb-3">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-texte">{label}</span>
          <span className="text-sm font-semibold text-bleu-republique">
            {typeof value === 'number' ? value.toFixed(1) : value} %
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 rounded-sm appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${percentage}%, #DDDDDD ${percentage}%, #DDDDDD 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gris-texte mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
