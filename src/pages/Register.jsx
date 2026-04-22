import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getFingerprint } from '../utils/fingerprint';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    newsletter: false,
    rgpd: false,
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.prenom.trim()) {
      errs.prenom = 'Le prénom est requis.';
    }
    if (!form.nom.trim()) {
      errs.nom = 'Le nom est requis.';
    }
    if (!form.email.trim()) {
      errs.email = "L'adresse e-mail est requise.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Veuillez saisir une adresse e-mail valide.';
    }
    if (!form.password) {
      errs.password = 'Le mot de passe est requis.';
    } else if (form.password.length < 8) {
      errs.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }
    if (!form.rgpd) {
      errs.rgpd = 'Vous devez accepter la politique de traitement des données.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setGlobalError('');
    try {
      const fingerprint = await getFingerprint();

      await api.post('/auth/register', {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email,
        password: form.password,
        fingerprint,
      });

      // Subscribe to newsletter if opted in
      if (form.newsletter) {
        try {
          await api.post('/newsletter/subscribe', { email: form.email });
        } catch {
          // Non-blocking
        }
      }

      // NE PAS auto-login — l'utilisateur doit d'abord confirmer son email
      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Écran de succès (email envoyé) ───
  if (success) {
    return (
      <>
        <Helmet>
          <title>Vérifiez votre email — Impôt Libre</title>
        </Helmet>
        <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="flex gap-0.5 mb-6 justify-center">
              <div className="w-8 h-1 bg-bleu-republique rounded-sm" />
              <div className="w-8 h-1 bg-white border border-gris-bordure rounded-sm" />
              <div className="w-8 h-1 bg-rouge-marianne rounded-sm" />
            </div>

            <div className="bg-white border border-gris-bordure rounded-sm p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-bleu-republique/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-bleu-republique" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-texte mb-3">
                Vérifiez votre boîte mail
              </h1>
              <p className="text-sm text-gris-texte leading-relaxed mb-4">
                Un email de confirmation a été envoyé à <strong className="text-texte">{form.email}</strong>.
                Cliquez sur le lien dans l&apos;email pour activer votre compte.
              </p>
              <p className="text-xs text-gris-texte mb-6">
                Le lien est valable 24 heures. Pensez à vérifier vos spams.
              </p>
              <Link
                to="/connexion"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-bleu-republique rounded-sm hover:bg-blue-900 transition-colors"
              >
                Aller à la connexion
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Inscription — Impôt Libre</title>
        <meta name="description" content="Créez votre compte Impôt Libre pour répartir symboliquement vos impôts entre les ministères français." />
        <meta property="og:title" content="Inscription — Impôt Libre" />
        <meta property="og:description" content="Inscrivez-vous gratuitement et exprimez vos priorités budgétaires citoyennes." />
        <link rel="canonical" href="https://impot-libre.fr/inscription" />
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Tricolor accent */}
          <div className="flex gap-0.5 mb-6 justify-center">
            <div className="w-8 h-1 bg-bleu-republique rounded-sm" />
            <div className="w-8 h-1 bg-white border border-gris-bordure rounded-sm" />
            <div className="w-8 h-1 bg-rouge-marianne rounded-sm" />
          </div>

          <h1 className="text-2xl font-bold text-texte text-center mb-2">
            Créer un compte
          </h1>
          <p className="text-sm text-gris-texte text-center mb-8">
            Rejoignez la communauté des citoyens qui s&apos;expriment sur le budget de la nation.
          </p>

          {globalError && (
            <div className="mb-6 p-3 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm">
              <p className="text-sm text-rouge-marianne">{globalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-gris-bordure rounded-sm p-6">
            {/* Prénom et Nom côte à côte */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                name="prenom"
                type="text"
                value={form.prenom}
                onChange={handleChange}
                error={errors.prenom}
                placeholder="Jean"
                required
              />
              <Input
                label="Nom"
                name="nom"
                type="text"
                value={form.nom}
                onChange={handleChange}
                error={errors.nom}
                placeholder="Dupont"
                required
              />
            </div>

            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="votre.email@exemple.fr"
              required
            />

            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Minimum 8 caractères"
              required
            />

            <Input
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Retapez votre mot de passe"
              required
            />

            {/* Newsletter opt-in */}
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={form.newsletter}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded-sm border-gris-bordure text-bleu-republique focus:ring-bleu-republique"
                />
                <span className="text-sm text-gris-texte leading-relaxed">
                  Je souhaite recevoir la lettre d&apos;information d&apos;Impôt Libre
                  (résultats agrégés, actualités de la plateforme).
                </span>
              </label>
            </div>

            {/* RGPD consent */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="rgpd"
                  checked={form.rgpd}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded-sm border-gris-bordure text-bleu-republique focus:ring-bleu-republique"
                />
                <span className="text-sm text-gris-texte leading-relaxed">
                  J&apos;accepte que mes données soient traitées de manière anonyme
                  conformément à la{' '}
                  <Link to="/mentions-legales" className="text-bleu-republique underline">
                    politique de confidentialité
                  </Link>
                  . Aucune donnée personnelle n&apos;est transmise à des tiers
                  ou à l&apos;administration fiscale.
                  <span className="text-rouge-marianne ml-0.5">*</span>
                </span>
              </label>
              {errors.rgpd && (
                <p className="mt-1 ml-7 text-xs text-rouge-marianne" role="alert">
                  {errors.rgpd}
                </p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Créer mon compte
            </Button>
          </form>

          <p className="text-sm text-gris-texte text-center mt-6">
            Déjà inscrit ?{' '}
            <Link to="/connexion" className="text-bleu-republique font-medium hover:underline">
              Se connecter
            </Link>
          </p>

          <p className="text-xs text-gris-texte text-center mt-6 leading-relaxed">
            Vos données sont protégées conformément au Règlement Général
            sur la Protection des Données (RGPD). Une empreinte numérique
            anonyme est générée pour prévenir les doublons.
          </p>
        </div>
      </section>
    </>
  );
}
