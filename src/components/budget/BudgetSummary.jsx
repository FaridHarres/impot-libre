import useBudget from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function BudgetSummary({ taxAmount = 0, onSubmit, loading = false }) {
  const { total, remaining, isComplete, validation } = useBudget();

  const hasTaxAmount = taxAmount > 0;
  const canSubmit = hasTaxAmount && isComplete;
  const totalColor = isComplete ? 'text-succes' : 'text-rouge-marianne';
  const remainingColor = remaining > 0 ? 'text-avertissement' : remaining < 0 ? 'text-rouge-marianne' : 'text-succes';

  return (
    <div className="bg-white border border-gris-bordure rounded-sm p-5">
      <h3 className="text-lg font-semibold text-texte mb-4">Récapitulatif</h3>

      {/* Montant d'impôt — toujours affiché */}
      <div className="flex items-center justify-between py-2 border-b border-gris-bordure">
        <span className="text-sm text-gris-texte">Montant d&apos;impôt</span>
        <span className={`text-sm font-semibold ${hasTaxAmount ? 'text-texte' : 'text-rouge-marianne'}`}>
          {hasTaxAmount ? formatCurrency(taxAmount) : 'Non renseigné'}
        </span>
      </div>

      {/* Total alloué */}
      <div className="flex items-center justify-between py-2 border-b border-gris-bordure">
        <span className="text-sm text-gris-texte">Total réparti</span>
        <span className={`text-sm font-semibold ${totalColor}`}>
          {total.toFixed(1)} %
        </span>
      </div>

      {/* Reste à allouer */}
      <div className="flex items-center justify-between py-2 border-b border-gris-bordure">
        <span className="text-sm text-gris-texte">Restant à répartir</span>
        <span className={`text-sm font-semibold ${remainingColor}`}>
          {remaining.toFixed(1)} %
        </span>
      </div>

      {/* Badge de statut */}
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

      {/* Erreurs de validation */}
      {validation.errors && validation.errors.length > 0 && !isComplete && hasTaxAmount && (
        <ul className="mb-4 space-y-1">
          {validation.errors.map((err, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-rouge-marianne">
              <span className="mt-0.5 shrink-0">&#x2022;</span>
              <span>{err}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Bouton Valider — actif UNIQUEMENT si montant renseigné ET total === 100% */}
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
            ? '✅ Valider ma répartition'
            : `Valider (il reste ${remaining.toFixed(1)} % à allouer)`}
      </Button>
    </div>
  );
}
