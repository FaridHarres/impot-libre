import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const STEPS = [
  {
    num: '01',
    title: 'Inscrivez-vous',
    desc: 'Créez un compte en quelques secondes. Vos données restent anonymes et ne sont jamais transmises à l\'administration.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Répartissez vos impôts',
    desc: 'Indiquez le montant de votre impôt puis ajustez les curseurs pour chaque pôle thématique selon vos priorités.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Découvrez les résultats',
    desc: 'Consultez les résultats agrégés pour connaître les priorités budgétaires de l\'ensemble des citoyens participants.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

/**
 * Teaser flouté pour les visiteurs non connectés.
 * Montre un faux graphique avec overlay CTA.
 */
function ResultatsTeaser() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-fond">
      {/* Blurred fake chart background */}
      <div
        className="flex gap-3 justify-center items-end"
        style={{
          filter: 'blur(8px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.35,
          height: '120px',
        }}
      >
        {[65, 42, 78, 35, 55, 28, 48, 38].map((h, i) => (
          <div
            key={i}
            style={{
              width: '44px',
              height: `${h}px`,
              background: 'linear-gradient(180deg, #4F7FFF, #1A3A6B)',
              borderRadius: '8px 8px 0 0',
            }}
          />
        ))}
      </div>

      {/* Overlay CTA */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        style={{
          background: 'rgba(247,249,252,0.88)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        <div className="w-[72px] h-[72px] rounded-full bg-accent/10 flex items-center justify-center text-4xl mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl md:text-2xl font-extrabold text-primary tracking-tight mb-3">
          Les priorités des citoyens<br />en temps réel
        </h3>
        <p className="text-sm text-gris-texte max-w-sm leading-relaxed mb-6">
          Créez un compte gratuit pour découvrir comment
          les Français répartissent leurs impôts.
        </p>
        <Link
          to="/inscription"
          className="inline-flex items-center justify-center px-8 py-3.5 text-[15px] font-bold text-white rounded-full shadow-button hover:shadow-button-hover transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #4F7FFF, #1A3A6B)' }}
        >
          Créer mon compte gratuit
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

/**
 * Stats section visible uniquement aux utilisateurs connectés.
 */
function ResultatsConnectes({ stats, totalParticipants }) {
  const sortedPoles = stats?.poles
    ? [...stats.poles].sort((a, b) => b.moyenne - a.moyenne).slice(0, 5)
    : [];
  const maxAvg = sortedPoles.length > 0 ? sortedPoles[0].moyenne : 1;

  if (sortedPoles.length === 0) return null;

  return (
    <section className="bg-fond py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-accent text-sm font-semibold tracking-wide uppercase">En temps réel</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mt-3 tracking-tight">
            Les priorités des citoyens
          </h2>
          {totalParticipants > 0 && (
            <p className="text-gris-texte mt-4">
              {totalParticipants.toLocaleString('fr-FR')} citoyen{totalParticipants > 1 ? 's' : ''} ont déjà participé
            </p>
          )}
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {sortedPoles.map((pole, i) => {
            const barWidth = maxAvg > 0 ? (pole.moyenne / maxAvg) * 100 : 0;
            return (
              <div
                key={pole.pole_id}
                className="bg-white border border-gris-bordure rounded-xl p-5 pole-card"
                style={{ animationDelay: `${i * 0.08}s`, transition: 'box-shadow 0.2s ease' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-primary flex items-center gap-2">
                    <span className="text-xl">{pole.emoji}</span>
                    {pole.pole_name}
                  </span>
                  <span className="text-sm font-bold text-accent">
                    {pole.moyenne.toFixed(1)} %
                  </span>
                </div>
                <div className="w-full h-2.5 bg-primary-50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-gradient"
                    style={{
                      width: `${barWidth}%`,
                      minWidth: barWidth > 0 ? '8px' : '0',
                      transition: 'width 0.8s ease-out',
                      willChange: 'width',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/resultats"
            className="inline-flex items-center text-sm font-semibold text-accent hover:text-accent-600 transition-colors"
          >
            Voir tous les résultats
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hasAllocated, setHasAllocated] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    // Only fetch stats if authenticated (since /resultats is now protected)
    if (isAuthenticated) {
      api
        .get('/allocations/stats')
        .then((res) => setStats(res.data))
        .catch(() => setStats(null))
        .finally(() => setStatsLoading(false));

      api
        .get('/allocations/me')
        .then((res) => {
          if (res.data?.allocations?.length > 0) setHasAllocated(true);
        })
        .catch(() => {});
    } else {
      setStatsLoading(false);
    }
  }, [isAuthenticated]);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    setNewsletterStatus(null);
    try {
      await api.post('/newsletter/subscribe', { email: newsletterEmail });
      setNewsletterStatus({ type: 'success', message: 'Inscription confirmée ! Vous recevrez nos prochaines communications.' });
      setNewsletterEmail('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.';
      setNewsletterStatus({ type: 'error', message: msg });
    } finally {
      setNewsletterLoading(false);
    }
  };

  const totalParticipants = stats?.total_allocations || 0;

  return (
    <>
      <Helmet>
        <title>Impôt Libre — Décidez où va votre impôt</title>
        <meta
          name="description"
          content="Impôt Libre est un outil citoyen qui vous permet de répartir symboliquement vos impôts entre les pôles thématiques. Exprimez vos priorités budgétaires."
        />
        <meta property="og:title" content="Impôt Libre — Décidez où va votre impôt" />
        <meta
          property="og:description"
          content="Répartissez symboliquement vos impôts et découvrez les priorités des citoyens français."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.impot-libre.fr" />
        <meta property="og:locale" content="fr_FR" />
        <link rel="canonical" href="https://www.impot-libre.fr" />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative bg-hero-gradient text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] rounded-full bg-success/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              Plateforme citoyenne participative
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Décidez où va{' '}
            <span className="bg-gradient-to-r from-accent-200 via-white to-success bg-clip-text text-transparent">
              votre impôt
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Un outil citoyen pour exprimer vos priorités budgétaires.
            Répartissez symboliquement vos impôts entre les pôles thématiques
            et découvrez les choix des autres citoyens.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            {!hasAllocated && (
              <Link
                to={isAuthenticated ? '/repartition' : '/inscription'}
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold bg-white text-primary rounded-lg hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {isAuthenticated ? 'Répartir mes impôts' : 'Commencer maintenant'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/resultats"
                className={`inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-lg transition-all ${
                  hasAllocated
                    ? 'bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm'
                }`}
              >
                Voir les résultats
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                to="/connexion"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-lg border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all"
              >
                Se connecter
              </Link>
            )}
          </motion.div>

          {hasAllocated && (
            <motion.p
              className="mt-6 text-sm text-white/50"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
            >
              Vous avez déjà soumis votre répartition. Merci pour votre participation !
            </motion.p>
          )}

          {/* Floating stat (only for authenticated) */}
          {isAuthenticated && totalParticipants > 0 && (
            <motion.div
              className="mt-12 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
            >
              <span className="text-3xl font-extrabold">
                {totalParticipants.toLocaleString('fr-FR')}
              </span>
              <span className="text-sm text-white/60 text-left leading-tight">
                citoyen{totalParticipants > 1 ? 's' : ''}<br />
                ont participé
              </span>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <span className="text-accent text-sm font-semibold tracking-wide uppercase">Mode d&apos;emploi</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mt-3 tracking-tight">
              Comment ça marche ?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                className="relative bg-fond border border-gris-bordure rounded-xl p-8 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={i}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-accent tracking-wider">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-gris-texte leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats or Teaser ── */}
      {isAuthenticated && !statsLoading && stats ? (
        <ResultatsConnectes stats={stats} totalParticipants={totalParticipants} />
      ) : !isAuthenticated ? (
        <ResultatsTeaser />
      ) : null}

      {/* ── Newsletter ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeUp}
          >
            <span className="text-accent text-sm font-semibold tracking-wide uppercase">Newsletter</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mt-3 mb-4 tracking-tight">
              Restez informé
            </h2>
            <p className="text-sm text-gris-texte mb-8 leading-relaxed">
              Inscrivez-vous à notre lettre d&apos;information pour recevoir les résultats
              agrégés et les prochaines évolutions de la plateforme.
            </p>
          </motion.div>

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
              className={`mt-4 text-sm font-medium ${
                newsletterStatus.type === 'success' ? 'text-success' : 'text-danger'
              }`}
            >
              {newsletterStatus.message}
            </p>
          )}

          <p className="mt-6 text-xs text-gris-texte/60">
            En vous inscrivant, vous acceptez de recevoir des communications de la part
            d&apos;impot-libre.fr. Vous pouvez vous désinscrire à tout moment.
          </p>
        </div>
      </section>
    </>
  );
}
