import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const BAR_COLORS = [
  '#003189', '#E1000F', '#18753C', '#B34000', '#6A28C7',
  '#00838F', '#C62828', '#2E7D32', '#EF6C00', '#4527A0',
  '#00695C', '#AD1457', '#1565C0', '#F9A825', '#6D4C41',
  '#546E7A', '#D84315', '#1B5E20', '#0277BD', '#7B1FA2',
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

  // Adapter aux noms de champs retournés par le backend :
  // { total_allocations, ministeres: [{ ministere_name, moyenne, minimum, maximum, nombre_allocations }] }
  const totalParticipants = stats?.total_allocations || 0;
  const sortedMinistries = stats?.ministeres
    ? [...stats.ministeres]
        .map((m) => ({
          id: m.ministere_id,
          name: m.ministere_name,
          avg: parseFloat(m.moyenne) || 0,
          min: parseFloat(m.minimum) || 0,
          max: parseFloat(m.maximum) || 0,
          count: m.nombre_allocations || 0,
        }))
        .sort((a, b) => b.avg - a.avg)
    : [];

  const maxAvg = sortedMinistries.length > 0 ? sortedMinistries[0].avg : 1;

  return (
    <>
      <Helmet>
        <title>Résultats nationaux — Impôt Libre</title>
        <meta
          name="description"
          content="Découvrez les résultats agrégés des citoyens français sur la répartition de leurs impôts entre les ministères."
        />
        <meta property="og:title" content="Résultats nationaux — Impôt Libre" />
        <meta
          property="og:description"
          content="Les priorités budgétaires exprimées par les citoyens français sur impot-libre.fr."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://impot-libre.fr/resultats" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex gap-0.5 mb-6 justify-center">
            <div className="w-8 h-1 bg-bleu-republique rounded-sm" />
            <div className="w-8 h-1 bg-white border border-gris-bordure rounded-sm" />
            <div className="w-8 h-1 bg-rouge-marianne rounded-sm" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-texte mb-3">
            Résultats nationaux
          </h1>
          <p className="text-sm text-gris-texte max-w-xl mx-auto">
            Répartition moyenne exprimée par l&apos;ensemble des participants.
            Ces résultats sont mis à jour en temps réel.
          </p>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-bleu-republique border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gris-texte">Chargement des résultats...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm text-center">
            <p className="text-sm text-rouge-marianne">{error}</p>
          </div>
        )}

        {!loading && !error && stats && sortedMinistries.length > 0 && (
          <>
            {/* Compteur de participants */}
            <div className="bg-bleu-republique text-white rounded-sm p-6 mb-10 text-center">
              <p className="text-sm text-blue-200 mb-1">Nombre de participants</p>
              <p className="text-4xl font-bold">
                {totalParticipants.toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-blue-200 mt-1">
                {totalParticipants === 1
                  ? 'citoyen a exprimé ses priorités'
                  : 'citoyens ont exprimé leurs priorités'}
              </p>
            </div>

            {/* Barres horizontales */}
            <div className="bg-white border border-gris-bordure rounded-sm p-6">
              <h2 className="text-lg font-semibold text-texte mb-6">
                Répartition moyenne par ministère
              </h2>

              <div className="space-y-4">
                {sortedMinistries.map((ministry, index) => {
                  const barWidth = maxAvg > 0 ? (ministry.avg / maxAvg) * 100 : 0;
                  const color = BAR_COLORS[index % BAR_COLORS.length];

                  return (
                    <div key={ministry.id || index}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-texte font-medium truncate mr-3">
                          {ministry.name}
                        </span>
                        <span className="text-sm font-semibold text-bleu-republique shrink-0">
                          {ministry.avg.toFixed(1)} %
                        </span>
                      </div>
                      <div className="w-full h-6 bg-gris-bordure/50 rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all duration-700 ease-out flex items-center"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: color,
                            minWidth: barWidth > 0 ? '4px' : '0',
                          }}
                        >
                          {barWidth > 15 && (
                            <span className="text-xs text-white font-medium pl-2">
                              {ministry.avg.toFixed(1)} %
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
            <p className="mt-8 text-xs text-gris-texte text-center leading-relaxed">
              Ces résultats représentent les préférences exprimées par les
              utilisateurs de la plateforme. Ils n&apos;ont aucune valeur
              officielle et ne sont pas liés à l&apos;administration fiscale.
            </p>
          </>
        )}

        {!loading && !error && (!stats || sortedMinistries.length === 0) && (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gris-bordure mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gris-texte text-sm">
              Aucun résultat disponible pour le moment. Soyez le premier à participer !
            </p>
          </div>
        )}
      </div>
    </>
  );
}
