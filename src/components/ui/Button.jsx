import { useMemo } from 'react';

const VARIANTS = {
  primary:
    'bg-bleu-republique text-white hover:bg-blue-900 focus:ring-bleu-republique disabled:bg-gray-400',
  secondary:
    'border-2 border-rouge-marianne text-rouge-marianne bg-transparent hover:bg-rouge-marianne hover:text-white focus:ring-rouge-marianne disabled:border-gray-400 disabled:text-gray-400 disabled:hover:bg-transparent',
  danger:
    'bg-rouge-marianne text-white hover:bg-red-800 focus:ring-rouge-marianne disabled:bg-gray-400',
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
      className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed ${variantClasses} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
