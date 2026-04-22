import { useMemo } from 'react';

const VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-500 focus:ring-accent shadow-button hover:shadow-button-hover disabled:bg-gray-300 disabled:shadow-none',
  secondary:
    'border border-gris-bordure text-primary bg-white hover:bg-primary-50 hover:border-primary-200 focus:ring-accent disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white',
  danger:
    'bg-danger text-white hover:opacity-90 focus:ring-danger disabled:bg-gray-300',
  ghost:
    'text-primary bg-transparent hover:bg-primary-50 focus:ring-accent disabled:text-gray-400',
};

function Spinner() {
  return (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
}) {
  const variantClasses = useMemo(() => VARIANTS[variant] || VARIANTS.primary, [variant]);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed ${variantClasses} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
