import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import polesInfo, { missionsHorsCurseurs } from '../data/polesInfo';
import PoleInfoModal from '../components/budget/PoleInfoModal';

// Sommes calculées depuis les données polesInfo + missionsHorsCurseurs
// Source : LFI 2024 — budget.gouv.fr
const BUDGET_ARBITRABLE = 352.3;  // Somme des 17 pôles
const BUDGET_ENGAGE = 230.7;      // Somme des 6 missions techniques
const BUDGET_TOTAL = 583;          // Total brut budget général (arbitrable + engagé)

const POLE_COLORS = [
  '#3B82F6', '#F43F5E', '#10B981', '#F59E0B',
  '#22C55E', '#0EA5E9', '#A855F7', '#64748B',
  '#3B82F6', '#F43F5E', '#10B981', '#F59E0B',
  '#22C55E', '#0EA5E9', '#A855F7', '#64748B',
  '#3B82F6',
];

export default function BudgetNation() {
  const [userAllocation, setUserAllocation] = useState(null);
  const [modalPoleId, setModalPoleId] = useState(null);

  useEffect(() => {
    api.get('/allocations/me')
      .then((res) => {
        if (res.data?.allocations?.length > 0) {
          setUserAllocation(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Build official percentages from polesInfo
  const officialPoles = useMemo(() => {
    return Object.entries(polesInfo).map(([id, info]) => ({
      id: parseInt(id),
      ...info,
      officialPct: parseFloat(((info.budgetTotal / BUDGET_ARBITRABLE) * 100).toFixed(1)),
    })).sort((a, b) => b.budgetTotal - a.budgetTotal);
  }, []);

  // Build comparison data if user has submitted
  const comparison = useMemo(() => {
    if (!userAllocation?.allocations) return null;
    return officialPoles.map((pole) => {
      const userPole = userAllocation.allocations.find((a) => a.pole_id === pole.id);
      const userPct = userPole ? parseFloat(Number(userPole.percentage).toFixed(1)) : 0;
      const ecart = parseFloat((userPct - pole.officialPct).toFixed(1));
      return {
        ...pole,
        userPct,
        ecart,
      };
    });
  }, [officialPoles, userAllocation]);

  return (
    <>
      <Helmet>
        <title>Le Budget de la Nation — Impôt Libre</title>
        <meta name="description" content="Découvrez le budget officiel de l'État français voté dans la Loi de Finances 2024." />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <span className="text-accent text-sm font-semibold tracking-wide uppercase">Loi de Finances 2024</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-2 tracking-tight">
            Le Budget de la Nation
          </h1>
          <p className="text-sm text-gris-texte mt-3 max-w-xl mx-auto">
            Ce que le Parlement français a réellement décidé de financer.
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-8 flex items-start gap-3 animate-fade-in">
          <span className="text-lg shrink-0">ℹ️</span>
          <p className="text-sm text-gris-texte leading-relaxed">
            Cette page est purement informative. Elle présente le budget officiel voté par le Parlement
            dans la Loi de Finances 2024 (LOI n° 2023-1322 du 29 décembre 2023). Aucune modification n'est possible ici.
          </p>
        </div>

        {/* Global indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-fade-in">
          <div className="bg-white border border-gris-bordure rounded-xl p-5 text-center shadow-card">
            <p className="text-xs text-gris-texte font-medium uppercase tracking-wide mb-1">Budget général brut</p>
            <p className="text-2xl font-extrabold text-primary">{BUDGET_TOTAL} Md€</p>
            <p className="text-[10px] text-gris-texte/60 mt-1">Toutes missions confondues</p>
          </div>
          <div className="bg-white border border-gris-bordure rounded-xl p-5 text-center shadow-card">
            <p className="text-xs text-gris-texte font-medium uppercase tracking-wide mb-1">Dépenses arbitrables</p>
            <p className="text-2xl font-extrabold text-accent">{BUDGET_ARBITRABLE} Md€</p>
            <p className="text-[10px] text-gris-texte/60 mt-1">17 missions sur lesquelles vous votez</p>
          </div>
          <div className="bg-white border border-gris-bordure rounded-xl p-5 text-center shadow-card">
            <p className="text-xs text-gris-texte font-medium uppercase tracking-wide mb-1">Engagements non arbitrables</p>
            <p className="text-2xl font-extrabold text-gris-texte">{BUDGET_ENGAGE} Md€</p>
            <p className="text-[10px] text-gris-texte/60 mt-1">Dette, UE, régimes spéciaux, etc.</p>
          </div>
        </div>

        {/* 17 poles — read only */}
        <h2 className="text-lg font-bold text-primary mb-4">Les 17 missions arbitrées</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {officialPoles.map((pole, i) => (
            <div
              key={pole.id}
              className="bg-white border border-gris-bordure rounded-xl p-5 shadow-card pole-card"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{pole.emoji}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-primary leading-tight truncate">{pole.nom}</h3>
                  <span className="text-[10px] text-gris-texte/60 uppercase tracking-wide">Budget officiel</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl font-extrabold text-primary">{pole.budgetTotal} Md€</span>
                <span className="text-xs text-gris-texte font-medium">{pole.officialPct} %</span>
              </div>

              <div className="w-full h-2 bg-primary-50 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(pole.officialPct * 2, 100)}%`,
                    backgroundColor: POLE_COLORS[i % POLE_COLORS.length],
                    transition: 'width 0.6s ease-out',
                  }}
                />
              </div>

              <button
                onClick={() => setModalPoleId(pole.id)}
                className="text-[11px] text-accent font-semibold hover:text-accent-600 cursor-pointer transition-colors"
              >
                En savoir plus →
              </button>
            </div>
          ))}
        </div>

        {/* Hors curseurs */}
        <h2 className="text-lg font-bold text-primary mb-4">Ce qui est déjà engagé</h2>
        <div className="space-y-3 mb-10">
          {missionsHorsCurseurs.map((m, i) => (
            <div key={i} className="bg-white border border-gris-bordure rounded-xl p-4 shadow-card flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-primary">{m.nom}</h3>
                  <span className="text-sm font-extrabold text-gris-texte shrink-0">{m.montant} Md€</span>
                </div>
                <p className="text-xs text-gris-texte leading-relaxed">{m.explication}</p>
                <a
                  href={m.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-accent hover:underline mt-1 inline-block"
                >
                  Source officielle →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        {comparison && (
          <>
            <h2 className="text-lg font-bold text-primary mb-4">Ma répartition vs le Budget de la Nation</h2>
            <div className="bg-white border border-gris-bordure rounded-xl p-5 shadow-card mb-10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-2.5 pr-3 text-primary font-semibold">Pôle</th>
                    <th className="text-right py-2.5 px-3 text-accent font-semibold">Mon choix</th>
                    <th className="text-right py-2.5 px-3 text-primary font-semibold">État</th>
                    <th className="text-right py-2.5 pl-3 font-semibold">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.id} className="border-b border-gris-bordure/50">
                      <td className="py-2.5 pr-3 text-texte">
                        <span className="mr-1.5">{row.emoji}</span>
                        <span className="text-xs">{row.nom}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-accent">
                        {row.userPct.toFixed(1)} %
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-primary">
                        {row.officialPct.toFixed(1)} %
                      </td>
                      <td className={`py-2.5 pl-3 text-right font-bold ${
                        row.ecart > 0 ? 'text-success' : row.ecart < 0 ? 'text-danger' : 'text-gris-texte'
                      }`}>
                        {row.ecart > 0 ? '+' : ''}{row.ecart.toFixed(1)} %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-6 mt-4 text-[11px] text-gris-texte">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" /> Vous financez plus que l'État
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-danger" /> Vous financez moins que l'État
                </span>
              </div>
            </div>
          </>
        )}

        {/* Source */}
        <div className="text-center text-xs text-gris-texte/50 pb-8">
          Source : Loi de Finances 2024 — LOI n° 2023-1322 du 29 décembre 2023 —{' '}
          <a href="https://www.budget.gouv.fr/documentation/documents-budgetaires/exercice-2024" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            budget.gouv.fr
          </a>
        </div>
      </div>

      {/* Modal */}
      {modalPoleId && (
        <PoleInfoModal
          poleId={modalPoleId}
          percentage={0}
          taxAmount={0}
          onClose={() => setModalPoleId(null)}
        />
      )}
    </>
  );
}
