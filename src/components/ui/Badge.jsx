const VARIANTS = {
  success: 'bg-succes/10 text-succes border-succes',
  warning: 'bg-avertissement/10 text-avertissement border-avertissement',
  danger: 'bg-rouge-marianne/10 text-rouge-marianne border-rouge-marianne',
  info: 'bg-bleu-republique/10 text-bleu-republique border-bleu-republique',
};

export default function Badge({ children, variant = 'info' }) {
  const classes = VARIANTS[variant] || VARIANTS.info;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${classes}`}
    >
      {children}
    </span>
  );
}
