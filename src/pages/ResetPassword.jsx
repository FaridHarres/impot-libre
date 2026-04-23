import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('Token manquant.');
      setValidating(false);
      return;
    }
    api.get(`/auth/reset-password/${token}`)
      .then((res) => {
        if (res.data.valid) {
          setTokenValid(true);
        } else {
          setTokenError(res.data.message || 'Lien invalide ou expiré.');
        }
      })
      .catch(() => setTokenError('Impossible de vérifier le lien.'))
      .finally(() => setValidating(false));
  }, [token]);

  const passwordChecks = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const allValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid || !passwordsMatch) return;

    setLoading(true);
    setError('');
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (validating) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Invalid token
  if (!tokenValid && !success) {
    return (
      <>
        <Helmet><title>Lien invalide — Impôt Libre</title></Helmet>
        <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="bg-white border border-gris-bordure rounded-xl p-8 shadow-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-danger/10 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-primary mb-3">Lien invalide ou expiré</h1>
              <p className="text-sm text-gris-texte leading-relaxed mb-6">{tokenError}</p>
              <Link
                to="/mot-de-passe-oublie"
                className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-accent rounded-md hover:bg-accent-500 transition-all shadow-button"
              >
                Faire une nouvelle demande
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Success
  if (success) {
    return (
      <>
        <Helmet><title>Mot de passe mis à jour — Impôt Libre</title></Helmet>
        <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="bg-white border border-gris-bordure rounded-xl p-8 shadow-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-primary mb-3">Mot de passe mis à jour</h1>
              <p className="text-sm text-gris-texte leading-relaxed mb-6">
                Votre mot de passe a été réinitialisé avec succès. Veuillez vous reconnecter.
              </p>
              <Link
                to="/connexion"
                className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-accent rounded-md hover:bg-accent-500 transition-all shadow-button"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Reset form
  return (
    <>
      <Helmet><title>Nouveau mot de passe — Impôt Libre</title></Helmet>

      <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="text-2xl font-extrabold text-primary text-center mb-2 tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-gris-texte text-center mb-8">
            Choisissez un nouveau mot de passe sécurisé.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-xl">
              <p className="text-sm text-danger font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-gris-bordure rounded-xl p-6 shadow-card">
            <Input
              label="Nouveau mot de passe"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 12 caractères"
              required
            />

            {password && (
              <div className="mb-4 -mt-2 text-xs space-y-1">
                <p className={passwordChecks.length ? 'text-success' : 'text-gris-texte'}>
                  {passwordChecks.length ? '✓' : '○'} 12 caractères minimum
                </p>
                <p className={passwordChecks.upper ? 'text-success' : 'text-gris-texte'}>
                  {passwordChecks.upper ? '✓' : '○'} Une majuscule
                </p>
                <p className={passwordChecks.digit ? 'text-success' : 'text-gris-texte'}>
                  {passwordChecks.digit ? '✓' : '○'} Un chiffre
                </p>
                <p className={passwordChecks.special ? 'text-success' : 'text-gris-texte'}>
                  {passwordChecks.special ? '✓' : '○'} Un caractère spécial
                </p>
              </div>
            )}

            <Input
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
              error={confirmPassword && !passwordsMatch ? 'Les mots de passe ne correspondent pas.' : ''}
              required
            />

            <Button
              type="submit"
              loading={loading}
              disabled={!allValid || !passwordsMatch}
              className="w-full mt-2"
            >
              Réinitialiser mon mot de passe
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
