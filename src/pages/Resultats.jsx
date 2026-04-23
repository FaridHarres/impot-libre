import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';

const POLE_COLORS = [
  '#3B82F6', '#F43F5E', '#10B981', '#F59E0B',
  '#22C55E', '#0EA5E9', '#A855F7', '#64748B',
];

export default function Resultats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/allocations/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Impossible de charger les résultats. Veuillez réessayer plus tard.'))
      .finally(() => setLoading(false));
  }, []);

  const totalParticipants = stats?.total_allocations || 0;
  const sortedPoles = stats?.poles
    ? [...stats.poles].sort((a, b) => b.moyenne - a.moyenne)
    : [];
  const maxAvg = sortedPoles.length > 0 ? sortedPoles[0].moyenne : 1;

  return (
    <>
      <Helmet>
        <title>Résultats nationaux — Impôt Libre</title>
        <meta
          name="description"
          content="Découvrez les résultats agrégés des citoyens français sur la répartition de leurs impôts entre les pôles thématiques."
        />
        <meta property="og:title" content="Résultats nationaux — Impôt Libre" />
        <meta
          property="og:description"
          content="Les priorités budgétaires exprimées par les citoyens français sur impot-libre.fr."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.impot-libre.fr/resultats" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-accent text-sm font-semibold tracking-wide uppercase">En temps réel</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-3 tracking-tight">
            Résultats nationaux
          </h1>
          <p className="text-sm text-gris-texte max-w-xl mx-auto mt-4 leading-relaxed">
            Répartition moyenne exprimée par l&apos;ensemble des participants,
            regroupée par pôle thématique.
          </p>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gris-texte">Chargement des résultats...</p>
          </div>
        )}

        {error && (
          <div className="p-5 bg-danger/5 border border-danger/20 rounded-xl text-center">
            <p className="text-sm text-danger font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && stats && sortedPoles.length > 0 && (
          <>
            {/* Participant counter */}
            <div className="bg-white border-l-4 border-accent rounded-lg p-6 mb-10 flex items-baseline gap-3 shadow-card animate-fade-in">
              <span className="text-3xl font-extrabold text-primary tracking-tight">
                {totalParticipants.toLocaleString('fr-FR')}
              </span>
              <span className="text-sm text-gris-texte">
                {totalParticipants === 1
                  ? 'contribution enregistrée'
                  : 'contributions enregistrées'}
              </span>
            </div>

            {/* Pole bars */}
            <div className="bg-white border border-gris-bordure rounded-xl p-6 shadow-card animate-slide-up">
              <h2 className="text-lg font-bold text-primary mb-6">
                Répartition moyenne par pôle
              </h2>

              <div className="space-y-5">
                {sortedPoles.map((pole, index) => {
                  const barWidth = maxAvg > 0 ? (pole.moyenne / maxAvg) * 100 : 0;
                  const color = POLE_COLORS[pole.pole_id - 1] || POLE_COLORS[index % POLE_COLORS.length];

                  return (
                    <div
                      key={pole.pole_id}
                      className="pole-card"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-primary font-semibold truncate mr-3 flex items-center gap-2">
                          <span className="text-lg">{pole.emoji}</span>
                          {pole.pole_name}
                        </span>
                        <span className="text-sm font-bold text-accent shrink-0">
                          {pole.moyenne.toFixed(1)} %
                        </span>
                      </div>
                      <div className="w-full h-7 bg-primary-50 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg flex items-center"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: color,
                            minWidth: barWidth > 0 ? '6px' : '0',
                            transition: 'width 0.8s ease-out',
                            willChange: 'width',
                          }}
                        >
                          {barWidth > 20 && (
                            <span className="text-xs text-white font-semibold pl-3">
                              {pole.moyenne.toFixed(1)} %
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-10 text-xs text-gris-texte/50 text-center leading-relaxed">
              Ces résultats représentent les préférences exprimées par les
              utilisateurs de la plateforme. Ils n&apos;ont aucune valeur
              officielle et ne sont pas liés à l&apos;administration fiscale.
            </p>
          </>
        )}

        {!loading && !error && (!stats || sortedPoles.length === 0) && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gris-texte text-sm">
              Aucun résultat disponible pour le moment. Soyez le premier à participer !
            </p>
          </div>
        )}
      </div>
    </>
  );
}
