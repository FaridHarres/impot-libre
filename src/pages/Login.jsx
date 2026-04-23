import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const redirectTo = location.state?.redirect || null;
  const stateMessage = location.state?.message || null;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccessMessage('Votre adresse email a été confirmée avec succès ! Vous pouvez maintenant vous connecter.');
    }
    if (searchParams.get('verify_error') === 'true') {
      setGlobalError('Le lien de vérification est invalide ou expiré. Veuillez demander un nouveau lien.');
    }
    // Message from protected route redirect
    if (stateMessage && !successMessage && !globalError) {
      setSuccessMessage(stateMessage);
    }
  }, [searchParams, stateMessage]);

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
      if (userData?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectTo || '/repartition', { replace: true });
      }
    } catch (err) {
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
      setResendDone(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Connexion — Impôt Libre</title>
        <meta name="description" content="Connectez-vous à votre compte Impôt Libre pour répartir vos impôts entre les pôles thématiques." />
        <meta property="og:title" content="Connexion — Impôt Libre" />
        <meta property="og:description" content="Connectez-vous pour exprimer vos priorités budgétaires citoyennes." />
        <link rel="canonical" href="https://www.impot-libre.fr/connexion" />
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="text-2xl font-extrabold text-primary text-center mb-2 tracking-tight">
            Connexion
          </h1>
          <p className="text-sm text-gris-texte text-center mb-8">
            Accédez à votre espace pour répartir vos impôts.
          </p>

          {successMessage && (
            <div className={`mb-6 p-4 rounded-xl border ${
              stateMessage && successMessage === stateMessage
                ? 'bg-accent/5 border-accent/20'
                : 'bg-success/5 border-success/20'
            }`}>
              <p className={`text-sm font-medium ${
                stateMessage && successMessage === stateMessage ? 'text-accent' : 'text-success'
              }`}>{successMessage}</p>
            </div>
          )}

          {globalError && (
            <div className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-xl">
              <p className="text-sm text-danger font-medium">{globalError}</p>
              {showResend && !resendDone && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="mt-2 text-sm text-accent font-semibold hover:text-accent-600 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {resendLoading ? 'Envoi en cours...' : 'Renvoyer le lien de vérification'}
                </button>
              )}
              {resendDone && (
                <p className="mt-2 text-sm text-success font-medium">
                  Si un compte non vérifié existe, un nouveau lien a été envoyé.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-gris-bordure rounded-xl p-6 shadow-card">
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

            <div className="text-center mt-3">
              <Link to="/mot-de-passe-oublie" className="text-xs text-gris-texte hover:text-accent transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>
          </form>

          <p className="text-sm text-gris-texte text-center mt-6">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-accent font-semibold hover:text-accent-600 transition-colors">
              Créer un compte
            </Link>
          </p>

          <p className="text-xs text-gris-texte/60 text-center mt-6 leading-relaxed">
            Vos données personnelles sont traitées conformément au RGPD.
            Aucune information n&apos;est transmise à des tiers.
            Consultez nos{' '}
            <Link to="/mentions-legales" className="text-accent hover:text-accent-600">
              mentions légales
            </Link>{' '}
            pour en savoir plus.
          </p>
        </div>
      </section>
    </>
  );
}
