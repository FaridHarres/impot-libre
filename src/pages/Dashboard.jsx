import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBudget } from '../hooks/useBudget';
import { useThrottledSlider } from '../hooks/useThrottledSlider';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import PoleCard from '../components/budget/PoleCard';
import BudgetSummary from '../components/budget/BudgetSummary';
import BudgetProgressBar from '../components/budget/BudgetProgressBar';
import Button from '../components/ui/Button';
import polesInfo from '../data/polesInfo';

const BUDGET_ARBITRABLE = 352.3;

function PDFDownloadButton() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleDownload = async () => {
    setStatus('loading');
    try {
      const res = await api.get('/pdf/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ma-repartition-impot-libre-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const labels = {
    idle: 'Télécharger ma répartition en PDF',
    loading: 'Génération en cours...',
    success: 'Téléchargement lancé',
    error: 'Erreur — Réessayer',
  };

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'loading'}
      aria-label="Télécharger ma répartition en PDF"
      className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border cursor-pointer transition-all disabled:cursor-wait ${
        status === 'success'
          ? 'bg-success/5 border-success/20 text-success'
          : status === 'error'
          ? 'bg-danger/5 border-danger/20 text-danger'
          : 'bg-white border-gris-bordure text-primary hover:bg-primary-50 hover:border-primary-200'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {labels[status]}
    </button>
  );
}

export default function Dashboard() {
  const {
    poles,
    loadingPoles,
    polesError,
    total,
    remaining,
    isComplete,
    validation,
    updatePole,
    resetToMinimums,
    resetToEqual,
    getAllocationData,
  } = useBudget();

  // Throttled slider updates via requestAnimationFrame
  const throttledUpdatePole = useThrottledSlider(updatePole);

  const [taxAmount, setTaxAmount] = useState('');
  const [taxAmountNum, setTaxAmountNum] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingAllocation, setExistingAllocation] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    api
      .get('/allocations/me')
      .then((res) => {
        if (res.data && res.data.allocations && res.data.allocations.length > 0) {
          setExistingAllocation(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  const handleTaxAmountChange = useCallback((e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setTaxAmount(raw);
    setTaxAmountNum(raw ? parseInt(raw, 10) : 0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!taxAmountNum || !isComplete || !validation.isValid) return;

    setSubmitLoading(true);
    setSubmitError('');
    try {
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

  // Memoized sorted poles for the summary table
  const sortedPoles = useMemo(
    () => poles.slice().sort((a, b) => b.percentage - a.percentage),
    [poles]
  );

  if (pageLoading || loadingPoles) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gris-texte">Chargement de votre espace...</p>
      </div>
    );
  }

  if (polesError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-6 text-center">
          <p className="text-danger font-semibold">{polesError}</p>
          <p className="text-sm text-gris-texte mt-2">
            Vérifiez que le serveur backend est bien démarré et que la base de données est initialisée.
          </p>
        </div>
      </div>
    );
  }

  // Already submitted
  if (existingAllocation || submitSuccess) {
    const data = existingAllocation;
    return (
      <>
        <Helmet>
          <title>Ma répartition — Impôt Libre</title>
          <meta name="description" content="Consultez votre répartition budgétaire sur Impôt Libre." />
        </Helmet>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
          <div className="bg-success/5 border border-success/20 rounded-xl p-8 mb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Votre répartition a été enregistrée
            </h1>
            <p className="text-sm text-gris-texte">
              Merci pour votre participation citoyenne. Votre allocation a été prise en compte
              dans les résultats agrégés.
            </p>
          </div>

          {data && data.allocations && (
            <div className="bg-white border border-gris-bordure rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-bold text-primary mb-4">Votre répartition par pôle</h2>
              {data.totalAmount > 0 && (
                <p className="text-sm text-gris-texte mb-5">
                  Montant total déclaré : <span className="font-semibold text-primary">{formatCurrency(data.totalAmount)}</span>
                </p>
              )}
              <div className="space-y-4">
                {data.allocations
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((alloc) => (
                    <div key={alloc.pole_id} className="flex items-center gap-3">
                      <span className="text-2xl shrink-0">{alloc.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-primary font-semibold">{alloc.pole_name}</span>
                          <span className="text-sm font-bold text-accent">
                            {Number(alloc.percentage).toFixed(1)} %
                          </span>
                        </div>
                        <div className="w-full h-2 bg-primary-50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent-gradient"
                            style={{ width: `${Math.min(alloc.percentage * 2, 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gris-texte mt-1">
                          {alloc.ministeres.map((m) => m.name).join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* PDF Download */}
          <PDFDownloadButton />

          {/* Comparaison Ma répartition vs LFI 2024 */}
          {data && data.allocations && (
            <div className="bg-white border border-gris-bordure rounded-xl p-6 shadow-card mt-6">
              <h2 className="text-lg font-bold text-primary mb-2">
                Ma répartition face au Budget de la Nation
              </h2>
              <p className="text-xs text-gris-texte mb-5">
                Loi de Finances 2024 — Crédits de paiement officiels
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-primary/20">
                      <th className="text-left py-2.5 pr-3 text-primary font-semibold">Mission budgétaire</th>
                      <th className="text-right py-2.5 px-3 text-accent font-semibold">Mon choix</th>
                      <th className="text-right py-2.5 px-3 text-primary font-semibold">LFI 2024</th>
                      <th className="text-right py-2.5 pl-3 font-semibold">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.allocations
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((alloc) => {
                        const info = polesInfo[alloc.pole_id];
                        const officialPct = info
                          ? parseFloat(((info.budgetTotal / BUDGET_ARBITRABLE) * 100).toFixed(1))
                          : 0;
                        const userPct = parseFloat(Number(alloc.percentage).toFixed(1));
                        const ecart = parseFloat((userPct - officialPct).toFixed(1));
                        return (
                          <tr key={alloc.pole_id} className="border-b border-gris-bordure/50">
                            <td className="py-2.5 pr-3 text-texte">
                              <span className="mr-1.5">{alloc.emoji}</span>
                              <span className="text-xs">{alloc.pole_name}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-accent">
                              {userPct.toFixed(1)} %
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-primary">
                              {officialPct.toFixed(1)} %
                            </td>
                            <td className={`py-2.5 pl-3 text-right font-bold ${
                              ecart > 0 ? 'text-success' : ecart < 0 ? 'text-danger' : 'text-gris-texte'
                            }`}>
                              {ecart > 0 ? '+' : ''}{ecart.toFixed(1)} pts {ecart > 0 ? '↑' : ecart < 0 ? '↓' : ''}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-1 mt-4 text-[11px] text-gris-texte">
                <div className="flex items-center gap-1.5">
                  <span className="text-success">↑</span> Vous souhaitez financer davantage que ce que l&apos;État a décidé
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-danger">↓</span> Vous souhaitez financer moins que ce que l&apos;État a décidé
                </div>
              </div>
              <p className="mt-4 text-[10px] text-gris-texte/50">
                Les pourcentages LFI 2024 sont calculés sur la base des crédits de paiement des 17 missions arbitrables (352 Md€).
                Source : Loi de Finances 2024 — budget.gouv.fr
              </p>
            </div>
          )}

          {submitSuccess && !data && (
            <div className="bg-white border border-gris-bordure rounded-xl p-6 text-center shadow-card">
              <p className="text-sm text-gris-texte">
                Votre répartition a été enregistrée avec succès.
                Rafraîchissez la page pour consulter vos résultats.
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
        <title>Répartition de mes impôts — Impôt Libre</title>
        <meta name="description" content="Répartissez symboliquement vos impôts entre les 8 pôles thématiques selon vos priorités citoyennes." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary mb-2 tracking-tight">
            Répartition de vos impôts
          </h1>
          <p className="text-sm text-gris-texte">
            Ajustez les curseurs pour chaque pôle thématique. Chaque pôle a un minimum de 3%.
            Le total doit atteindre exactement 100%.
          </p>
        </div>

        {/* Tax amount input */}
        <div
          className={`border rounded-xl p-6 mb-6 animate-fade-in ${
            taxAmountNum > 0
              ? 'bg-white border-success/30 shadow-card'
              : 'bg-warning/5 border-warning/30'
          }`}
          style={{ transition: 'border-color 0.2s ease, background-color 0.2s ease' }}
        >
          <label htmlFor="tax-amount" className="block text-sm font-bold text-primary mb-1">
            Montant annuel de votre impôt sur le revenu <span className="text-danger">*</span>
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
              className={`flex-1 px-4 py-3 text-base font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors ${
                taxAmountNum > 0 ? 'border-success/50 focus:border-success' : 'border-warning/50 focus:border-warning'
              }`}
              autoFocus
            />
            <span className="text-base font-semibold text-primary">€</span>
          </div>
          {taxAmountNum > 0 && (
            <p className="mt-3 text-xs text-success font-semibold flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Montant enregistré : {formatCurrency(taxAmountNum)}
            </p>
          )}
          {!taxAmountNum && (
            <p className="mt-3 text-xs text-warning font-medium">
              Veuillez saisir votre montant d&apos;impôt pour pouvoir répartir les curseurs.
            </p>
          )}
        </div>

        {/* Two-column layout */}
        <div
          className={`flex flex-col lg:flex-row gap-6 ${
            taxAmountNum > 0 ? 'opacity-100' : 'opacity-30 pointer-events-none select-none'
          }`}
          style={{ transition: 'opacity 0.4s ease' }}
        >
          {/* Left: Pole Cards */}
          <div className="flex-1 min-w-0">
            <BudgetProgressBar />

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3 mb-5">
              <Button variant="secondary" onClick={resetToMinimums} disabled={!taxAmountNum} className="text-xs">
                Réinitialiser aux minimums
              </Button>
              <Button variant="secondary" onClick={resetToEqual} disabled={!taxAmountNum} className="text-xs">
                Répartition égale
              </Button>
            </div>

            {/* Global progress */}
            <div className="mb-5 p-5 bg-white border border-gris-bordure rounded-xl shadow-card">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-primary">Progression</span>
                <span className={`text-sm font-bold ${isComplete ? 'text-success' : 'text-warning'}`}>
                  {total.toFixed(1)} % alloués
                </span>
              </div>
              <div className="w-full h-3 bg-primary-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isComplete ? 'bg-success' : total > 100 ? 'bg-danger' : 'bg-accent'
                  }`}
                  style={{
                    width: `${Math.min(total, 100)}%`,
                    transition: 'width 0.3s ease',
                    willChange: 'width',
                  }}
                />
              </div>

              <div className="mt-3">
                {isComplete ? (
                  <p className="text-sm font-semibold text-success flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Répartition complète, vous pouvez valider !
                  </p>
                ) : remaining > 0 ? (
                  <p className="text-sm font-medium text-warning">
                    Il vous reste {remaining.toFixed(1)} % à allouer
                  </p>
                ) : (
                  <p className="text-sm font-medium text-danger">
                    Le total dépasse 100 % de {Math.abs(remaining).toFixed(1)} %
                  </p>
                )}
              </div>
            </div>

            {/* Pole Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poles.map((pole, i) => (
                <PoleCard
                  key={pole.id}
                  pole={pole}
                  taxAmount={taxAmountNum}
                  index={i}
                  onSliderChange={throttledUpdatePole}
                />
              ))}
            </div>

            {/* Summary table */}
            {taxAmountNum > 0 && (
              <div className="mt-6 bg-white border border-gris-bordure rounded-xl p-6 shadow-card animate-fade-in">
                <h3 className="text-base font-bold text-primary mb-4">
                  Récapitulatif de votre répartition
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-primary/20">
                        <th className="text-left py-2.5 pr-4 text-primary font-semibold">Pôle</th>
                        <th className="text-right py-2.5 px-4 text-primary font-semibold">Pourcentage</th>
                        <th className="text-right py-2.5 pl-4 text-accent font-semibold">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPoles.map((p) => (
                        <tr key={p.id} className="border-b border-gris-bordure/50 hover:bg-primary-50/30 transition-colors">
                          <td className="py-2.5 pr-4 text-texte">
                            <span className="mr-2">{p.emoji}</span>
                            {p.name}
                          </td>
                          <td className="py-2.5 px-4 text-right text-gris-texte font-medium">
                            {p.percentage.toFixed(1)} %
                          </td>
                          <td className="py-2.5 pl-4 text-right font-bold text-accent">
                            {formatCurrency((p.percentage / 100) * taxAmountNum)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-primary/20">
                        <td className="py-3 pr-4 font-bold text-primary">Total</td>
                        <td className={`py-3 px-4 text-right font-bold ${isComplete ? 'text-success' : 'text-danger'}`}>
                          {total.toFixed(1)} %
                        </td>
                        <td className="py-3 pl-4 text-right font-bold text-accent">
                          {formatCurrency(taxAmountNum)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary (sticky) */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-20">
              <BudgetSummary
                taxAmount={taxAmountNum}
                onSubmit={handleSubmit}
                loading={submitLoading}
              />

              {submitError && (
                <div className="mt-4 p-4 bg-danger/5 border border-danger/20 rounded-xl">
                  <p className="text-sm text-danger font-medium">{submitError}</p>
                </div>
              )}

              <p className="mt-4 text-xs text-gris-texte/60 leading-relaxed">
                En validant, vous confirmez que cette répartition reflète vos
                préférences personnelles. Les données sont anonymisées et
                agrégées à des fins statistiques.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
