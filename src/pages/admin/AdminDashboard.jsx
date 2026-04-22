import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const COLORS = [
  '#003189', '#E1000F', '#18753C', '#B34000', '#6A6AF4',
  '#009099', '#FFD200', '#FF6F6F', '#5E2A84', '#00AC8C',
  '#E18B00', '#C9191E', '#465F9D', '#8585F6', '#D64D00',
  '#417DC4', '#169B62', '#AEA397', '#FF8D7E', '#00B050',
];

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('barres'); // 'barres' | 'camembert'

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setDashboard(res.data))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Impossible de charger le tableau de bord.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-bleu-republique border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gris-texte">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-4 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm">
          <p className="text-sm text-rouge-marianne">{error}</p>
        </div>
      </div>
    );
  }

  const stats = dashboard;
  const ministeres = stats.ministeres || [];

  // Données pour recharts
  const chartData = ministeres.map((m) => ({
    name: m.name,
    value: m.moyenne,
    participants: m.nb_participants,
    moyenne_euros: m.moyenne_euros,
    mediane: m.mediane,
    min: m.min_percent,
    max: m.max_percent,
  }));

  return (
    <>
      <Helmet>
        <title>Administration — Impôt Libre</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-texte">
            Tableau de bord administrateur
          </h1>
          <Badge variant="danger">Admin</Badge>
        </div>

        {/* ─── KPIs ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard
            icon="👥"
            label="Participants"
            value={stats.total_utilisateurs}
          />
          <KpiCard
            icon="📋"
            label="Allocations"
            value={stats.total_allocations}
          />
          <KpiCard
            icon="📅"
            label="Aujourd'hui"
            value={stats.allocations_aujourdhui}
          />
          <KpiCard
            icon="💶"
            label="Impôt moyen"
            value={formatCurrency(stats.montant_moyen)}
            raw
          />
          <KpiCard
            icon="🚨"
            label="Suspects"
            value={stats.comptes_suspects}
            danger={stats.comptes_suspects > 0}
          />
        </div>

        {/* ─── Liens rapides ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            to="/admin/export"
            className="flex items-center gap-3 bg-white border border-gris-bordure rounded-sm p-4 hover:border-bleu-republique transition-colors"
          >
            <span className="text-xl">📥</span>
            <div>
              <p className="text-sm font-medium text-texte">Export des données</p>
              <p className="text-xs text-gris-texte">CSV, JSON</p>
            </div>
          </Link>
          <Link
            to="/admin/newsletter"
            className="flex items-center gap-3 bg-white border border-gris-bordure rounded-sm p-4 hover:border-bleu-republique transition-colors"
          >
            <span className="text-xl">📧</span>
            <div>
              <p className="text-sm font-medium text-texte">Newsletter</p>
              <p className="text-xs text-gris-texte">Gestion des abonnés</p>
            </div>
          </Link>
          <Link
            to="/resultats"
            className="flex items-center gap-3 bg-white border border-gris-bordure rounded-sm p-4 hover:border-bleu-republique transition-colors"
          >
            <span className="text-xl">📊</span>
            <div>
              <p className="text-sm font-medium text-texte">Résultats publics</p>
              <p className="text-xs text-gris-texte">Page visible par tous</p>
            </div>
          </Link>
        </div>

        {/* ─── Graphiques ─── */}
        {ministeres.length > 0 && (
          <div className="bg-white border border-gris-bordure rounded-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-texte">
                Répartition moyenne par ministère
              </h2>
              <div className="flex gap-2">
                <Button
                  variant={view === 'barres' ? 'primary' : 'secondary'}
                  onClick={() => setView('barres')}
                  className="text-xs px-3 py-1"
                >
                  Barres
                </Button>
                <Button
                  variant={view === 'camembert' ? 'primary' : 'secondary'}
                  onClick={() => setView('camembert')}
                  className="text-xs px-3 py-1"
                >
                  Camembert
                </Button>
              </div>
            </div>

            {/* Barres horizontales */}
            {view === 'barres' && (
              <ResponsiveContainer width="100%" height={600}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" unit="%" domain={[0, 'auto']} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={240}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value}% — ${props.payload.participants} participants — moy. ${formatCurrency(props.payload.moyenne_euros)}`,
                      'Moyenne',
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Camembert */}
            {view === 'camembert' && (
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    dataKey="value"
                    label={({ name, value }) => value > 3 ? `${name.split(' ')[0]} ${value}%` : ''}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value}% — ${props.payload.participants} part.`,
                      props.payload.name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ─── Tableau détaillé ─── */}
        {ministeres.length > 0 && (
          <div className="bg-white border border-gris-bordure rounded-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-texte mb-4">
              Statistiques détaillées
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-bleu-republique">
                    <th className="text-left py-2 pr-3 font-semibold text-texte">Ministère</th>
                    <th className="text-right py-2 px-2 font-semibold text-texte">Part.</th>
                    <th className="text-right py-2 px-2 font-semibold text-bleu-republique">Moy. %</th>
                    <th className="text-right py-2 px-2 font-semibold text-gris-texte">Méd. %</th>
                    <th className="text-right py-2 px-2 font-semibold text-gris-texte">Min %</th>
                    <th className="text-right py-2 px-2 font-semibold text-gris-texte">Max %</th>
                    <th className="text-right py-2 pl-2 font-semibold text-bleu-republique">Moy. €</th>
                  </tr>
                </thead>
                <tbody>
                  {ministeres.map((m, i) => (
                    <tr key={m.id} className="border-b border-gris-bordure/50 hover:bg-fond/50">
                      <td className="py-2 pr-3 text-texte">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {m.name}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right text-gris-texte">{m.nb_participants}</td>
                      <td className="py-2 px-2 text-right font-bold text-bleu-republique">{m.moyenne}%</td>
                      <td className="py-2 px-2 text-right text-gris-texte">{m.mediane}%</td>
                      <td className="py-2 px-2 text-right text-gris-texte">{m.min_percent}%</td>
                      <td className="py-2 px-2 text-right text-gris-texte">{m.max_percent}%</td>
                      <td className="py-2 pl-2 text-right font-semibold text-bleu-republique">
                        {formatCurrency(m.moyenne_euros)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Activité récente ─── */}
        {stats.activite_recente && stats.activite_recente.length > 0 && (
          <div className="bg-white border border-gris-bordure rounded-sm p-6">
            <h2 className="text-lg font-semibold text-texte mb-4">
              Activité récente
            </h2>
            <div className="space-y-2">
              {stats.activite_recente.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gris-bordure/50 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-bleu-republique shrink-0" />
                  <span className="text-texte flex-1">{a.action}</span>
                  <span className="text-xs text-gris-texte shrink-0">
                    {a.admin} — {new Date(a.date).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function KpiCard({ icon, label, value, raw = false, danger = false }) {
  return (
    <div className={`bg-white border rounded-sm p-4 ${danger ? 'border-rouge-marianne' : 'border-gris-bordure'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gris-texte">{label}</span>
      </div>
      <p className={`text-xl font-bold ${danger ? 'text-rouge-marianne' : 'text-texte'}`}>
        {raw ? value : (typeof value === 'number' ? value.toLocaleString('fr-FR') : value)}
      </p>
    </div>
  );
}
