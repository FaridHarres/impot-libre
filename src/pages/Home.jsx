import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hasAllocated, setHasAllocated] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    api
      .get('/allocations/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));

    // Vérifier si l'utilisateur connecté a déjà soumis
    if (isAuthenticated) {
      api
        .get('/allocations/me')
        .then((res) => {
          if (res.data?.allocations?.length > 0) setHasAllocated(true);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    setNewsletterStatus(null);
    try {
      await api.post('/newsletter/subscribe', { email: newsletterEmail });
      setNewsletterStatus({ type: 'success', message: 'Inscription confirmee ! Vous recevrez nos prochaines communications.' });
      setNewsletterEmail('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue. Veuillez reessayer.';
      setNewsletterStatus({ type: 'error', message: msg });
    } finally {
      setNewsletterLoading(false);
    }
  };

  const topMinistries = stats?.ministries
    ? [...stats.ministries].sort((a, b) => b.averagePercentage - a.averagePercentage).slice(0, 5)
    : [];

  return (
    <>
      <Helmet>
        <title>Impot Libre - Decidez ou va votre impot</title>
        <meta
          name="description"
          content="Impot Libre est un outil citoyen qui vous permet de repartir symboliquement vos impots entre les ministeres. Exprimez vos priorites budgetaires."
        />
        <meta property="og:title" content="Impot Libre - Decidez ou va votre impot" />
        <meta
          property="og:description"
          content="Repartissez symboliquement vos impots entre les ministeres et decouvrez les priorites des citoyens francais."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://impot-libre.fr" />
        <meta property="og:locale" content="fr_FR" />
        <link rel="canonical" href="https://impot-libre.fr" />
      </Helmet>

      {/* Hero */}
      <section className="relative bg-bleu-republique text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-bleu-republique" />
        <div className="absolute top-0 left-2 w-2 h-full bg-white" />
        <div className="absolute top-0 left-4 w-2 h-full bg-rouge-marianne" />
        <div className="max-w-5xl mx-auto px-8 py-20 md:py-28 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Decidez ou va votre impot
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Un outil citoyen pour exprimer vos priorites budgetaires.
            Repartissez symboliquement vos impots entre les ministeres
            et decouvrez les choix des autres citoyens.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!hasAllocated && (
              <Link
                to={isAuthenticated ? '/repartition' : '/inscription'}
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium bg-white text-bleu-republique rounded-sm hover:bg-blue-50 transition-colors"
              >
                {isAuthenticated ? 'Répartir mes impôts' : 'Commencer maintenant'}
              </Link>
            )}
            <Link
              to="/resultats"
              className={`inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-sm transition-colors ${
                hasAllocated
                  ? 'bg-white text-bleu-republique hover:bg-blue-50'
                  : 'border-2 border-white text-white hover:bg-white/10'
              }`}
            >
              Voir les résultats
            </Link>
          </div>
          {hasAllocated && (
            <p className="mt-4 text-sm text-blue-200">
              Vous avez déjà soumis votre répartition. Merci pour votre participation !
            </p>
          )}
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-texte text-center mb-12">
            Comment ca marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Etape 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-bleu-republique text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-texte mb-2">
                Inscrivez-vous
              </h3>
              <p className="text-sm text-gris-texte leading-relaxed">
                Creez un compte en quelques secondes. Vos donnees restent
                anonymes et ne sont jamais transmises a l&apos;administration.
              </p>
            </div>

            {/* Etape 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-rouge-marianne text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-texte mb-2">
                Repartissez vos impots
              </h3>
              <p className="text-sm text-gris-texte leading-relaxed">
                Indiquez le montant de votre impot annuel puis ajustez
                les curseurs pour chaque ministere selon vos priorites.
              </p>
            </div>

            {/* Etape 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-succes text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-texte mb-2">
                Decouvrez les resultats
              </h3>
              <p className="text-sm text-gris-texte leading-relaxed">
                Consultez les resultats agreges pour connaitre les priorites
                budgetaires de l&apos;ensemble des citoyens participants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {!statsLoading && stats && topMinistries.length > 0 && (
        <section className="bg-fond py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-texte text-center mb-4">
              Les priorites des citoyens
            </h2>
            <p className="text-center text-gris-texte mb-10">
              {stats.totalParticipants
                ? `${stats.totalParticipants.toLocaleString('fr-FR')} citoyen${stats.totalParticipants > 1 ? 's' : ''} ont deja participe`
                : 'Resultats en temps reel'}
            </p>

            <div className="space-y-4 max-w-2xl mx-auto">
              {topMinistries.map((m) => (
                <div key={m.ministryId || m.id} className="bg-white border border-gris-bordure rounded-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-texte">{m.name || m.ministryId}</span>
                    <span className="text-sm font-semibold text-bleu-republique">
                      {Number(m.averagePercentage).toFixed(1)} %
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gris-bordure rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-bleu-republique rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(m.averagePercentage * 2, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/resultats"
                className="inline-flex items-center text-sm font-medium text-bleu-republique hover:underline"
              >
                Voir tous les resultats
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="bg-white py-16 md:py-20 border-t border-gris-bordure">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-texte mb-4">
            Restez informe
          </h2>
          <p className="text-sm text-gris-texte mb-8">
            Inscrivez-vous a notre lettre d&apos;information pour recevoir les resultats
            agreges et les prochaines evolutions de la plateforme.
          </p>

          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                name="newsletter-email"
                type="email"
                placeholder="votre.email@exemple.fr"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" loading={newsletterLoading} className="sm:self-start sm:mt-0">
              S&apos;inscrire
            </Button>
          </form>

          {newsletterStatus && (
            <p
              className={`mt-4 text-sm ${
                newsletterStatus.type === 'success' ? 'text-succes' : 'text-rouge-marianne'
              }`}
            >
              {newsletterStatus.message}
            </p>
          )}

          <p className="mt-4 text-xs text-gris-texte">
            En vous inscrivant, vous acceptez de recevoir des communications de la part
            d&apos;impot-libre.fr. Vous pouvez vous desinscrire a tout moment.
          </p>
        </div>
      </section>
    </>
  );
}
