import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Hook: animate elements when they enter the viewport.
 * Respects prefers-reduced-motion.
 */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({ children, delay = 0, className = '' }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [hasAllocated, setHasAllocated] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/allocations/me')
        .then((res) => setHasAllocated(res.data?.allocations?.length > 0))
        .catch(() => setHasAllocated(false));
    } else {
      setHasAllocated(false);
    }
  }, [isAuthenticated]);

  const handleNewsletter = useCallback(async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    setNewsletterStatus(null);
    try {
      await api.post('/newsletter/subscribe', { email: newsletterEmail });
      setNewsletterStatus({ type: 'success', message: 'C\'est noté. On vous tiendra au courant.' });
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus({ type: 'error', message: err.response?.data?.message || 'Erreur. Réessayez.' });
    } finally {
      setNewsletterLoading(false);
    }
  }, [newsletterEmail]);

  return (
    <>
      <Helmet>
        <title>Impôt Libre — Décidez où va votre impôt</title>
        <meta name="description" content="Répartissez symboliquement vos impôts entre les 17 missions de l'État. Outil citoyen gratuit et anonyme." />
        <meta property="og:title" content="Impôt Libre — Décidez où va votre impôt" />
        <meta property="og:description" content="Répartissez symboliquement vos impôts et découvrez les priorités des citoyens français." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.impot-libre.fr" />
        <link rel="canonical" href="https://www.impot-libre.fr" />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative bg-hero-gradient text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] flex">
          <div className="flex-1" style={{ background: '#003189' }} />
          <div className="flex-1 bg-white/20" />
          <div className="flex-1" style={{ background: '#E1000F' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-14 md:py-20 text-center hero-fade-in">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-5 leading-[1.1] tracking-tight">
            Décidez où va{' '}
            <span className="bg-gradient-to-r from-accent-200 via-white to-success bg-clip-text text-transparent">
              votre impôt
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-6 leading-relaxed">
            Répartissez vos impôts entre les 17 missions budgétaires de l&apos;État.
            Découvrez ce que les autres contribuables financeraient.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm text-white/40">
            <span>Gratuit</span>
            <span className="hidden sm:inline">·</span>
            <span>Anonyme</span>
            <span className="hidden sm:inline">·</span>
            <span>2 minutes</span>
          </div>
        </div>
      </section>

      {/* ── Notre mission ── */}
      <section className="bg-fond py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">Notre mission</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mt-3 mb-8 tracking-tight max-w-xl">
              La dépense publique vous concerne.
              <br />Votre avis devrait aussi.
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="border-l-[3px] border-accent/30 pl-6 md:pl-8 mb-8 max-w-2xl">
              <p className="text-base text-texte leading-relaxed mb-4">
                En France, les recettes fiscales représentent 349 milliards d&apos;euros en 2024.
                Ces ressources financent l&apos;ensemble des missions de l&apos;État —
                des hôpitaux aux armées, de l&apos;école aux institutions.
              </p>
              <p className="text-base text-texte leading-relaxed">
                Pourtant, aucun mécanisme ne permet aux contribuables d&apos;exprimer
                leurs priorités budgétaires entre deux scrutins électoraux.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="max-w-2xl mb-10">
              <p className="text-base text-texte leading-relaxed mb-4">
                <strong className="text-primary">impot-libre.fr</strong> est un outil de consultation citoyenne indépendant.
                Il vous permet de simuler la répartition de votre contribution fiscale
                entre les 17 missions budgétaires officielles de la Loi de Finances 2024.
              </p>
              <p className="text-base text-texte leading-relaxed">
                Vos choix sont anonymisés, agrégés et rendus publics.
                Ils constituent un indicateur citoyen indépendant de toute institution.
              </p>
            </div>
          </Reveal>

          {/* 3 garanties */}
          <div className="grid md:grid-cols-3 gap-8">
            <Reveal delay={0.1}>
              <div className="bg-fond border border-gris-bordure rounded-xl p-7 h-full">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-primary mb-1">Transparence</p>
                <p className="text-sm text-gris-texte leading-relaxed">
                  Données issues exclusivement de la LFI 2024 (LOI n° 2023-1322).
                  Chaque chiffre est sourcé et vérifiable sur budget.gouv.fr.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="bg-fond border border-gris-bordure rounded-xl p-7 h-full">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-primary mb-1">Confidentialité</p>
                <p className="text-sm text-gris-texte leading-relaxed">
                  Aucune donnée personnelle identifiante n&apos;est collectée ni transmise
                  à des tiers ou à des institutions publiques.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="bg-fond border border-gris-bordure rounded-xl p-7 h-full">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <p className="text-base font-bold text-primary mb-1">Indépendance</p>
                <p className="text-sm text-gris-texte leading-relaxed">
                  Projet citoyen sans financement public, sans affiliation partisane
                  et sans objectif commercial.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="bg-white py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mb-10 tracking-tight">
              Comment ça marche ?
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Saisissez votre impôt', desc: 'Le montant annuel de votre impôt sur le revenu. Rien d\'autre.' },
              { num: '02', title: 'Répartissez librement', desc: 'Défense, santé, éducation, écologie... À vous de choisir ce que vous financez.' },
              { num: '03', title: 'Consultez les résultats', desc: 'Ce que les contribuables financeraient si on leur demandait vraiment.' },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.15}>
                <div className="relative bg-fond border border-gris-bordure rounded-xl p-7 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-xs font-bold text-accent tracking-wider">{step.num}</span>
                  <h3 className="text-base font-bold text-primary mt-3 mb-2">{step.title}</h3>
                  <p className="text-sm text-gris-texte leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      {!isAuthenticated && (
        <section className="bg-fond py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <Reveal>
              <p className="text-xl md:text-2xl font-extrabold text-primary leading-snug mb-8 max-w-lg mx-auto">
                Vos choix budgétaires,<br />
                agrégés et rendus{' '}
                <span className="text-accent">publics.</span>
              </p>

              <Link
                to="/inscription"
                className="inline-flex items-center justify-center px-10 py-4 text-base font-bold text-white bg-accent rounded-xl hover:bg-accent-500 transition-all shadow-button hover:shadow-button-hover hover:-translate-y-0.5"
              >
                Répartir mes impôts
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="mt-4 text-xs text-gris-texte/50">
                Gratuit · Anonyme · 2 minutes
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="bg-white py-14 md:py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary mb-2 tracking-tight">
            Résultats mensuels par email
          </h2>
          <p className="text-sm text-gris-texte mb-6">
            On publie les résultats complets une fois par mois.
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
            <p className={`mt-4 text-sm font-medium ${newsletterStatus.type === 'success' ? 'text-success' : 'text-danger'}`}>
              {newsletterStatus.message}
            </p>
          )}

          <p className="mt-4 text-xs text-gris-texte/40">
            Pas de spam. Désinscription en un clic.
          </p>
        </div>
      </section>
    </>
  );
}
