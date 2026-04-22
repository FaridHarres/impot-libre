export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
}) {
  const inputId = `input-${name}`;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-texte mb-1"
        >
          {label}
          {required && <span className="text-rouge-marianne ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-3 py-2 text-sm text-texte bg-white border rounded-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-bleu-republique focus:border-bleu-republique disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error ? 'border-rouge-marianne' : 'border-gris-bordure'
        }`}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-xs text-rouge-marianne"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
