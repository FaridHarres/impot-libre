import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBudget } from '../hooks/useBudget';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import MinistereSlider from '../components/budget/MinistereSlider';
import BudgetSummary from '../components/budget/BudgetSummary';
import BudgetProgressBar from '../components/budget/BudgetProgressBar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function Dashboard() {
  const {
    ministries,
    loadingMinistries,
    ministriesError,
    total,
    remaining,
    isComplete,
    validation,
    resetToMinimums,
    resetToEqual,
    getAllocationData,
  } = useBudget();

  const [taxAmount, setTaxAmount] = useState('');
  const [taxAmountNum, setTaxAmountNum] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingAllocation, setExistingAllocation] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Check if user already submitted
  useEffect(() => {
    api
      .get('/allocations/me')
      .then((res) => {
        if (res.data && res.data.allocations && res.data.allocations.length > 0) {
          setExistingAllocation(res.data);
        }
      })
      .catch(() => {
        // No existing allocation - that's fine
      })
      .finally(() => setPageLoading(false));
  }, []);

  const handleTaxAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setTaxAmount(raw);
    setTaxAmountNum(raw ? parseInt(raw, 10) : 0);
  };

  const handleSubmit = useCallback(async () => {
    if (!taxAmountNum || !isComplete || !validation.isValid) return;

    setSubmitLoading(true);
    setSubmitError('');
    try {
      // getAllocationData() retourne [{ ministere_id: <int>, percentage: <float> }]
      const repartition = getAllocationData();

      await api.post('/allocations', {
        totalAmount: taxAmountNum,
        allocations: repartition,
      });

      setSubmitSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Une erreur est survenue lors de la soumission. Veuillez réessayer.';
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  }, [taxAmountNum, isComplete, validation.isValid, getAllocationData]);

  if (pageLoading || loadingMinistries) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gris-texte">Chargement de votre espace...</p>
      </div>
    );
  }

  if (ministriesError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-rouge-marianne/10 border border-rouge-marianne rounded-sm p-6 text-center">
          <p className="text-rouge-marianne font-medium">{ministriesError}</p>
          <p className="text-sm text-gris-texte mt-2">
            Vérifiez que le serveur backend est bien démarré et que la base de données est initialisée.
          </p>
        </div>
      </div>
    );
  }

  // Already submitted - show read-only view
  if (existingAllocation || submitSuccess) {
    const data = existingAllocation;
    return (
      <>
        <Helmet>
          <title>Ma repartition - Impot Libre</title>
          <meta name="description" content="Consultez votre repartition budgetaire sur Impot Libre." />
        </Helmet>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-succes/10 border border-succes rounded-sm p-6 mb-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-succes mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-texte mb-2">
              Votre repartition a ete enregistree
            </h1>
            <p className="text-sm text-gris-texte">
              Merci pour votre participation citoyenne. Votre allocation a ete prise en compte
              dans les resultats agreges.
            </p>
          </div>

          {data && data.allocations && (
            <div className="bg-white border border-gris-bordure rounded-sm p-6">
              <h2 className="text-lg font-semibold text-texte mb-4">Votre repartition</h2>
              {data.totalAmount > 0 && (
                <p className="text-sm text-gris-texte mb-4">
                  Montant total declare : {formatCurrency(data.totalAmount)}
                </p>
              )}
              <div className="space-y-3">
                {data.allocations
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((alloc) => (
                    <div key={alloc.ministere_id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-texte">{alloc.name}</span>
                          <span className="text-sm font-semibold text-bleu-republique">
                            {Number(alloc.percentage).toFixed(1)} %
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gris-bordure rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-bleu-republique rounded-sm"
                            style={{ width: `${Math.min(alloc.percentage * 2, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {submitSuccess && !data && (
            <div className="bg-white border border-gris-bordure rounded-sm p-6 text-center">
              <p className="text-sm text-gris-texte">
                Votre repartition a ete enregistree avec succes.
                Rafraichissez la page pour consulter vos resultats.
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Repartition de mes impots - Impot Libre</title>
        <meta name="description" content="Repartissez symboliquement vos impots entre les 20 ministeres selon vos priorites citoyennes." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-texte mb-2">
            Repartition de vos impots
          </h1>
          <p className="text-sm text-gris-texte">
            Ajustez les curseurs pour chaque ministere. Le total doit atteindre exactement 100 %.
          </p>
        </div>

        {/* Tax amount input — OBLIGATOIRE */}
        <div className={`border rounded-sm p-5 mb-6 ${
          taxAmountNum > 0
            ? 'bg-white border-succes'
            : 'bg-yellow-50 border-avertissement'
        }`}>
          <label htmlFor="tax-amount" className="block text-sm font-bold text-texte mb-1">
            Montant annuel de votre impôt sur le revenu <span className="text-rouge-marianne">*</span>
          </label>
          <p className="text-xs text-gris-texte mb-3">
            Saisissez le montant de votre impôt pour débloquer la répartition. Ce montant est anonymisé et n&apos;est jamais communiqué.
          </p>
          <div className="flex items-center gap-3 max-w-sm">
            <input
              id="tax-amount"
              type="text"
              inputMode="numeric"
              value={taxAmount ? parseInt(taxAmount, 10).toLocaleString('fr-FR') : ''}
              onChange={handleTaxAmountChange}
              placeholder="Ex. : 4 200"
              className={`flex-1 px-3 py-2.5 text-base font-semibold border rounded-sm focus:outline-none focus:ring-2 focus:ring-bleu-republique ${
                taxAmountNum > 0 ? 'border-succes' : 'border-avertissement'
              }`}
              autoFocus
            />
            <span className="text-base font-semibold text-texte">€</span>
          </div>
          {taxAmountNum > 0 && (
            <p className="mt-2 text-xs text-succes font-medium">
              ✅ Montant enregistré : {formatCurrency(taxAmountNum)} — vous pouvez répartir vos impôts ci-dessous.
            </p>
          )}
          {!taxAmountNum && (
            <p className="mt-2 text-xs text-avertissement font-medium">
              ⚠️ Veuillez saisir votre montant d&apos;impôt pour pouvoir répartir les curseurs.
            </p>
          )}
        </div>

        {/* Two-column layout */}
        <div className={`flex flex-col lg:flex-row gap-6 transition-opacity duration-300 ${
          taxAmountNum > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none select-none'
        }`}>
          {/* Left: Sliders */}
          <div className="flex-1 min-w-0">
            {/* Message si montant non renseigné */}
            {!taxAmountNum && (
              <div className="mb-4 p-4 bg-yellow-50 border border-avertissement rounded-sm text-center">
                <p className="text-sm text-avertissement font-medium">
                  Saisissez d&apos;abord votre montant d&apos;impôt ci-dessus pour débloquer les curseurs.
                </p>
              </div>
            )}

            {/* Progress bar */}
            <BudgetProgressBar />

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Button variant="secondary" onClick={resetToMinimums} disabled={!taxAmountNum} className="text-xs">
                Réinitialiser aux minimums
              </Button>
              <Button variant="secondary" onClick={resetToEqual} disabled={!taxAmountNum} className="text-xs">
                Répartition égale
              </Button>
            </div>

            {/* Barre de progression globale */}
            <div className="mb-4 p-4 bg-white border border-gris-bordure rounded-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-texte">Progression</span>
                <span className={`text-sm font-bold ${isComplete ? 'text-succes' : 'text-avertissement'}`}>
                  {total.toFixed(1)} % alloués
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all duration-300 ${
                    isComplete ? 'bg-succes' : total > 100 ? 'bg-rouge-marianne' : 'bg-bleu-republique'
                  }`}
                  style={{ width: `${Math.min(total, 100)}%` }}
                />
              </div>

              {/* Message de statut contextuel */}
              <div className="mt-3">
                {isComplete ? (
                  <div className="flex items-center gap-2 text-succes">
                    <span>✅</span>
                    <span className="text-sm font-medium">
                      Votre répartition est complète, vous pouvez valider !
                    </span>
                  </div>
                ) : remaining > 0 ? (
                  <div className="flex items-center gap-2 text-avertissement">
                    <span>⚠️</span>
                    <span className="text-sm font-medium">
                      Il vous reste {remaining.toFixed(1)} % à allouer
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rouge-marianne">
                    <span>❌</span>
                    <span className="text-sm font-medium">
                      Le total dépasse 100 % de {Math.abs(remaining).toFixed(1)} %
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ministry sliders */}
            <div className="space-y-0">
              {ministries.map((ministry) => (
                <MinistereSlider
                  key={ministry.id}
                  ministry={ministry}
                  taxAmount={taxAmountNum}
                />
              ))}
            </div>

            {/* ─── Tableau récapitulatif (visible quand montant renseigné) ─── */}
            {taxAmountNum > 0 && (
              <div className="mt-6 bg-white border border-gris-bordure rounded-sm p-5">
                <h3 className="text-base font-semibold text-texte mb-4">
                  Récapitulatif de votre répartition
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-bleu-republique">
                        <th className="text-left py-2 pr-4 text-texte font-semibold">Ministère</th>
                        <th className="text-right py-2 px-4 text-texte font-semibold">Pourcentage</th>
                        <th className="text-right py-2 pl-4 text-bleu-republique font-semibold">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ministries
                        .slice()
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((m) => (
                          <tr key={m.id} className="border-b border-gris-bordure/50">
                            <td className="py-2 pr-4 text-texte">{m.name}</td>
                            <td className="py-2 px-4 text-right text-gris-texte">
                              {m.percentage.toFixed(1)} %
                            </td>
                            <td className="py-2 pl-4 text-right font-semibold text-bleu-republique">
                              {formatCurrency((m.percentage / 100) * taxAmountNum)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-bleu-republique">
                        <td className="py-3 pr-4 font-bold text-texte">Total</td>
                        <td className={`py-3 px-4 text-right font-bold ${isComplete ? 'text-succes' : 'text-rouge-marianne'}`}>
                          {total.toFixed(1)} %
                        </td>
                        <td className="py-3 pl-4 text-right font-bold text-bleu-republique">
                          {formatCurrency(taxAmountNum)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary (sticky on desktop) */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-20">
              <BudgetSummary
                taxAmount={taxAmountNum}
                onSubmit={handleSubmit}
                loading={submitLoading}
              />

              {submitError && (
                <div className="mt-4 p-3 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm">
                  <p className="text-sm text-rouge-marianne">{submitError}</p>
                </div>
              )}

              <p className="mt-4 text-xs text-gris-texte leading-relaxed">
                En validant, vous confirmez que cette repartition reflète vos
                preferences personnelles. Les donnees sont anonymisees et
                agregees a des fins statistiques.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
