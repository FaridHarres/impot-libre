import { useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import polesInfo from '../../data/polesInfo';

export default function PoleInfoModal({ poleId, percentage, taxAmount, onClose }) {
  const info = polesInfo[poleId];
  if (!info) return null;

  const contributionEuros = taxAmount > 0 ? (percentage / 100) * taxAmount : 0;

  // Close on Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-hero-gradient text-white p-6 rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <span className="text-4xl">{info.emoji}</span>
          <h2 className="text-2xl font-extrabold mt-2 tracking-tight">{info.nom}</h2>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{info.budgetTotal} Md€</span>
            <span className="text-sm text-white/60">Budget 2024</span>
          </div>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/20">
            {info.evolution}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Dynamic contribution */}
          {taxAmount > 0 && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
              <p className="text-xs text-accent font-semibold uppercase tracking-wide mb-1">
                Votre contribution
              </p>
              <p className="text-lg font-extrabold text-primary">
                {formatCurrency(contributionEuros)}
              </p>
              <p className="text-sm text-gris-texte mt-1">
                Avec vos {percentage.toFixed(1)} % sur un impôt de {formatCurrency(taxAmount)},
                vous contribuez à hauteur de {formatCurrency(contributionEuros)} à ce pôle.
              </p>
            </div>
          )}

          {/* Official missions */}
          {info.missions && (
            <div className="mb-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-2">
                Missions budgétaires officielles (LFI 2024)
              </h3>
              <div className="flex flex-wrap gap-2">
                {info.missions.map((m, i) => (
                  <span key={i} className="text-xs bg-primary-50 text-primary px-2.5 py-1 rounded-md font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Budget breakdown */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">
              Ce budget finance concrètement
            </h3>
            <div className="space-y-3">
              {info.postes.map((poste, i) => (
                <div key={i} className="bg-fond border border-gris-bordure rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary">{poste.libelle}</p>
                      {poste.evolution && (
                        <p className="text-xs text-gris-texte mt-0.5">{poste.evolution}</p>
                      )}
                      {poste.note && (
                        <p className="text-[11px] text-gris-texte/60 mt-0.5 italic">{poste.note}</p>
                      )}
                    </div>
                    <span className="text-base font-extrabold text-accent shrink-0">
                      {poste.montant} Md€
                    </span>
                  </div>
                  <p className="text-[10px] text-gris-texte/40 mt-1.5">
                    Source :{' '}
                    {poste.source.startsWith('http') ? (
                      <a
                        href={poste.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent/50 hover:text-accent underline"
                      >
                        {poste.source.replace('https://www.', '').split('/')[0]}
                      </a>
                    ) : (
                      poste.source
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-3">
              En chiffres concrets
            </h3>
            <div className="space-y-2">
              {info.statistiques.map((stat, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                  <p className="text-sm text-texte leading-relaxed">{stat}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {info.note && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
              <p className="text-xs text-gris-texte leading-relaxed">
                <span className="font-semibold text-warning">Note :</span> {info.note}
              </p>
            </div>
          )}

          {/* Source */}
          <div className="border-t border-gris-bordure pt-4">
            <p className="text-[11px] text-gris-texte/50 leading-relaxed">
              Source générale : Loi de Finances 2024 — LOI n° 2023-1322 du 29 décembre 2023.
              <br />
              <a
                href={info.sourceGenerale}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-600 underline"
              >
                Consulter sur budget.gouv.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
