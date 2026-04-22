import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  // Gérer les paramètres d'URL
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccessMessage('Votre adresse email a été confirmée avec succès ! Vous pouvez maintenant vous connecter.');
    }
    if (searchParams.get('verify_error') === 'true') {
      setGlobalError('Le lien de vérification est invalide ou expiré. Veuillez demander un nouveau lien.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
    setSuccessMessage('');
    setShowResend(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "L'adresse e-mail est requise.";
    if (!form.password) errs.password = 'Le mot de passe est requis.';
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
    setSuccessMessage('');
    setShowResend(false);
    try {
      const userData = await login(form.email, form.password);
      // Rediriger les admins vers le tableau de bord admin
      if (userData?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/repartition', { replace: true });
      }
    } catch (err) {
      // Vérifier si c'est une erreur d'email non vérifié
      const errorCode = err.response?.data?.error || err.errorCode;
      if (errorCode === 'email_not_verified') {
        setGlobalError('Veuillez confirmer votre adresse email avant de vous connecter. Vérifiez votre boîte mail.');
        setResendEmail(err.response?.data?.email || form.email);
        setShowResend(true);
      } else {
        const msg =
          err.message ||
          'Identifiants incorrects. Veuillez vérifier votre e-mail et votre mot de passe.';
        setGlobalError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResendDone(true);
    } catch {
      // Silencieux par design (ne pas révéler si l'email existe)
      setResendDone(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Connexion — Impôt Libre</title>
        <meta name="description" content="Connectez-vous à votre compte Impôt Libre pour répartir vos impôts entre les ministères." />
        <meta property="og:title" content="Connexion — Impôt Libre" />
        <meta property="og:description" content="Connectez-vous pour exprimer vos priorités budgétaires citoyennes." />
        <link rel="canonical" href="https://impot-libre.fr/connexion" />
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
            Connexion
          </h1>
          <p className="text-sm text-gris-texte text-center mb-8">
            Accédez à votre espace pour répartir vos impôts.
          </p>

          {/* Message de succès (email vérifié) */}
          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-500 rounded-sm">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Message d'erreur */}
          {globalError && (
            <div className="mb-6 p-3 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm">
              <p className="text-sm text-rouge-marianne">{globalError}</p>
              {/* Bouton de renvoi du lien de vérification */}
              {showResend && !resendDone && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="mt-2 text-sm text-bleu-republique font-medium hover:underline cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? 'Envoi en cours...' : 'Renvoyer le lien de vérification'}
                </button>
              )}
              {resendDone && (
                <p className="mt-2 text-sm text-green-600">
                  Si un compte non vérifié existe, un nouveau lien a été envoyé.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-gris-bordure rounded-sm p-6">
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
              placeholder="Votre mot de passe"
              required
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Se connecter
            </Button>
          </form>

          <p className="text-sm text-gris-texte text-center mt-6">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-bleu-republique font-medium hover:underline">
              Créer un compte
            </Link>
          </p>

          <p className="text-xs text-gris-texte text-center mt-6 leading-relaxed">
            Vos données personnelles sont traitées conformément au RGPD.
            Aucune information n&apos;est transmise à des tiers.
            Consultez nos{' '}
            <Link to="/mentions-legales" className="underline">
              mentions légales
            </Link>{' '}
            pour en savoir plus.
          </p>
        </div>
      </section>
    </>
  );
}
