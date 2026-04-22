const VARIANTS = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-accent/10 text-accent border-accent/20',
};

export default function Badge({ children, variant = 'info' }) {
  const classes = VARIANTS[variant] || VARIANTS.info;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-md ${classes}`}
    >
      {children}
    </span>
  );
}
