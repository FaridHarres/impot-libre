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
          className="block text-sm font-medium text-texte mb-1.5"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
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
        className={`w-full px-4 py-2.5 text-sm text-texte bg-white border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:bg-gray-50 disabled:cursor-not-allowed placeholder:text-gray-400 ${
          error ? 'border-danger' : 'border-gris-bordure'
        }`}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-xs text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
