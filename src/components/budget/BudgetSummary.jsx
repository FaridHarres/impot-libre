import useBudget from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function BudgetSummary({ taxAmount = 0, onSubmit, loading = false }) {
  const { total, remaining, isComplete, validation } = useBudget();

  const hasTaxAmount = taxAmount > 0;
  const canSubmit = hasTaxAmount && isComplete;
  const totalColor = isComplete ? 'text-success' : 'text-danger';
  const remainingColor = remaining > 0 ? 'text-warning' : remaining < 0 ? 'text-danger' : 'text-success';

  return (
    <div className="bg-white border border-gris-bordure rounded-xl p-5 shadow-card">
      <h3 className="text-lg font-bold text-primary mb-4">Récapitulatif</h3>

      {/* Montant d'impôt */}
      <div className="flex items-center justify-between py-2.5 border-b border-gris-bordure/50">
        <span className="text-sm text-gris-texte">Montant d&apos;impôt</span>
        <span className={`text-sm font-semibold ${hasTaxAmount ? 'text-primary' : 'text-danger'}`}>
          {hasTaxAmount ? formatCurrency(taxAmount) : 'Non renseigné'}
        </span>
      </div>

      {/* Total alloué */}
      <div className="flex items-center justify-between py-2.5 border-b border-gris-bordure/50">
        <span className="text-sm text-gris-texte">Total réparti</span>
        <span className={`text-sm font-semibold ${totalColor}`}>
          {total.toFixed(1)} %
        </span>
      </div>

      {/* Reste */}
      <div className="flex items-center justify-between py-2.5 border-b border-gris-bordure/50">
        <span className="text-sm text-gris-texte">Restant à répartir</span>
        <span className={`text-sm font-semibold ${remainingColor}`}>
          {remaining.toFixed(1)} %
        </span>
      </div>

      {/* Badge */}
      <div className="mt-3 mb-4">
        {!hasTaxAmount ? (
          <Badge variant="warning">Saisissez votre montant d&apos;impôt</Badge>
        ) : isComplete ? (
          <Badge variant="success">Répartition valide</Badge>
        ) : remaining > 0 ? (
          <Badge variant="warning">Il reste {remaining.toFixed(1)} % à allouer</Badge>
        ) : (
          <Badge variant="danger">Dépassement de {Math.abs(remaining).toFixed(1)} %</Badge>
        )}
      </div>

      {/* Validation errors */}
      {validation.errors && validation.errors.length > 0 && !isComplete && hasTaxAmount && (
        <ul className="mb-4 space-y-1.5">
          {validation.errors.map((err, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-danger">
              <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-danger/60" />
              <span>{err}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Submit */}
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={!canSubmit}
        loading={loading}
        className={`w-full ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {!hasTaxAmount
          ? 'Saisissez votre impôt pour commencer'
          : isComplete
            ? 'Valider ma répartition'
            : `Valider (il reste ${remaining.toFixed(1)} %)`}
      </Button>
    </div>
  );
}
