import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';

const POLE_COLORS = [
  '#3B82F6', '#F43F5E', '#10B981', '#F59E0B',
  '#22C55E', '#0EA5E9', '#A855F7', '#64748B',
];

export default function AdminParticipants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Detail panel
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch participants list
  const fetchParticipants = useCallback(async (p, q) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (q) params.set('search', q);
      const res = await api.get(`/admin/participants?${params}`);
      setParticipants(res.data.participants);
      setTotalPages(res.data.total_pages);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants(page, search);
  }, [page, search, fetchParticipants]);

  // Fetch detail
  const handleSelectParticipant = useCallback(async (id) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/participants/${id}`);
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId]);

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  // Export CSV
  const handleExportCSV = useCallback(async () => {
    if (!selectedId) return;
    setExportLoading(true);
    try {
      const res = await api.get(`/admin/participants/${selectedId}/export-csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.download = match ? match[1] : 'repartition.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExportLoading(false);
    }
  }, [selectedId]);

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const formatDateTime = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <>
      <Helmet>
        <title>Participants — Admin — Impôt Libre</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">
              Participants
            </h1>
            <p className="text-sm text-gris-texte mt-1">
              {total} participant{total > 1 ? 's' : ''} inscrits
            </p>
          </div>
          <Badge variant="danger">Admin</Badge>
        </div>

        <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: '70vh' }}>
          {/* ── Left: Participant List ── */}
          <div className="lg:w-[420px] shrink-0 flex flex-col">
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gris-texte" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher par nom, prénom, email..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gris-bordure rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </form>

            {error && (
              <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg mb-4">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-6 h-6 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-sm text-gris-texte text-center py-12">Aucun participant trouvé.</p>
              ) : (
                participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectParticipant(p.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      selectedId === p.id
                        ? 'bg-accent/10 border border-accent/30'
                        : 'bg-white border border-gris-bordure hover:border-primary-200 hover:shadow-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {p.prenom} {p.nom}
                        </p>
                        <p className="text-xs text-gris-texte truncate">{p.email}</p>
                      </div>
                      {p.allocation_id ? (
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold text-accent">
                            {formatCurrency(p.total_amount)}
                          </p>
                          <p className="text-[10px] text-gris-texte">
                            {formatDate(p.date_soumission)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-warning font-medium bg-warning/10 px-2 py-0.5 rounded-full shrink-0 ml-3">
                          Pas soumis
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gris-bordure">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-sm text-primary font-medium disabled:text-gris-texte/40 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← Précédent
                </button>
                <span className="text-xs text-gris-texte">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-sm text-primary font-medium disabled:text-gris-texte/40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Detail Panel ── */}
          <div className="flex-1 min-w-0">
            {!selectedId && (
              <div className="h-full flex items-center justify-center bg-white border border-gris-bordure rounded-xl">
                <div className="text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gris-texte">
                    Sélectionnez un participant pour voir sa répartition
                  </p>
                </div>
              </div>
            )}

            {selectedId && detailLoading && (
              <div className="h-full flex items-center justify-center bg-white border border-gris-bordure rounded-xl">
                <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {selectedId && !detailLoading && detail && (
              <div className="bg-white border border-gris-bordure rounded-xl p-6 shadow-card animate-fade-in">
                {/* User header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-primary">
                      {detail.user.prenom} {detail.user.nom}
                    </h2>
                    <p className="text-sm text-gris-texte">{detail.user.email}</p>
                    {detail.allocation && (
                      <p className="text-xs text-gris-texte mt-1">
                        Soumis le {formatDateTime(detail.allocation.date_soumission)}
                      </p>
                    )}
                  </div>
                  {detail.user.email_verified ? (
                    <Badge variant="success">Vérifié</Badge>
                  ) : (
                    <Badge variant="warning">Non vérifié</Badge>
                  )}
                </div>

                {!detail.allocation ? (
                  <div className="text-center py-12 bg-warning/5 rounded-xl border border-warning/20">
                    <p className="text-sm text-warning font-medium">
                      Ce participant n&apos;a pas encore soumis de répartition.
                    </p>
                    <p className="text-xs text-gris-texte mt-1">
                      Inscrit le {formatDate(detail.user.date_inscription)}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Amount highlight */}
                    <div className="bg-hero-gradient text-white rounded-xl p-5 mb-6">
                      <p className="text-xs text-white/60 mb-1">Impôt déclaré</p>
                      <p className="text-3xl font-extrabold tracking-tight">
                        {formatCurrency(detail.allocation.total_amount)}
                      </p>
                    </div>

                    {/* Poles breakdown */}
                    <div className="space-y-4 mb-6">
                      {detail.poles.map((pole, i) => {
                        const color = POLE_COLORS[pole.pole_id - 1] || POLE_COLORS[i % POLE_COLORS.length];
                        return (
                          <div key={pole.pole_id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-primary flex items-center gap-2">
                                <span className="text-lg">{pole.emoji}</span>
                                {pole.pole_name}
                              </span>
                              <div className="text-right">
                                <span className="text-sm font-bold text-accent">
                                  {pole.pourcentage.toFixed(1)} %
                                </span>
                                <span className="text-xs text-gris-texte ml-2">
                                  {formatCurrency(pole.montant_euros)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-5 bg-primary-50 rounded-lg overflow-hidden">
                              <div
                                className="h-full rounded-lg flex items-center"
                                style={{
                                  width: `${pole.pourcentage}%`,
                                  backgroundColor: color,
                                  minWidth: pole.pourcentage > 0 ? '4px' : '0',
                                  transition: 'width 0.5s ease-out',
                                }}
                              >
                                {pole.pourcentage > 12 && (
                                  <span className="text-[11px] text-white font-semibold pl-2.5">
                                    {pole.pourcentage.toFixed(1)} %
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary table */}
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-primary/20">
                            <th className="text-left py-2 pr-3 text-primary font-semibold">Pôle</th>
                            <th className="text-right py-2 px-3 text-primary font-semibold">%</th>
                            <th className="text-right py-2 pl-3 text-accent font-semibold">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.poles.map((pole) => (
                            <tr key={pole.pole_id} className="border-b border-gris-bordure/50">
                              <td className="py-2 pr-3 text-texte">
                                {pole.emoji} {pole.pole_name}
                              </td>
                              <td className="py-2 px-3 text-right text-gris-texte font-medium">
                                {pole.pourcentage.toFixed(1)} %
                              </td>
                              <td className="py-2 pl-3 text-right font-bold text-accent">
                                {formatCurrency(pole.montant_euros)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-primary/20">
                            <td className="py-2.5 pr-3 font-bold text-primary">TOTAL</td>
                            <td className="py-2.5 px-3 text-right font-bold text-primary">100 %</td>
                            <td className="py-2.5 pl-3 text-right font-bold text-accent">
                              {formatCurrency(detail.allocation.total_amount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Export button */}
                    <button
                      onClick={handleExportCSV}
                      disabled={exportLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary border border-gris-bordure rounded-lg hover:bg-primary-50 hover:border-primary-200 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {exportLoading ? 'Export en cours...' : 'Exporter ce profil en CSV'}
                    </button>
                  </>
                )}
              </div>
            )}

            {selectedId && !detailLoading && !detail && (
              <div className="h-full flex items-center justify-center bg-white border border-gris-bordure rounded-xl">
                <p className="text-sm text-danger">Impossible de charger le détail.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
