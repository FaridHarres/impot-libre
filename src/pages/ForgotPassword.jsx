import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <Helmet><title>Email envoyé — Impôt Libre</title></Helmet>
        <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="bg-white border border-gris-bordure rounded-xl p-8 shadow-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-primary mb-3">Vérifiez votre boîte mail</h1>
              <p className="text-sm text-gris-texte leading-relaxed mb-2">
                Si cet email existe dans notre base, vous recevrez un lien de réinitialisation.
              </p>
              <p className="text-xs text-gris-texte/60 mb-6">
                Le lien expire dans 15 minutes. Pensez à vérifier vos spams.
              </p>
              <Link
                to="/connexion"
                className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-accent rounded-md hover:bg-accent-500 transition-all shadow-button"
              >
                Retour à la connexion
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
        <title>Mot de passe oublié — Impôt Libre</title>
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="text-2xl font-extrabold text-primary text-center mb-2 tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-gris-texte text-center mb-8">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-xl">
              <p className="text-sm text-danger font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-gris-bordure rounded-xl p-6 shadow-card">
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.fr"
              required
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              Envoyer le lien
            </Button>
          </form>

          <p className="text-sm text-gris-texte text-center mt-6">
            <Link to="/connexion" className="text-accent font-semibold hover:text-accent-600 transition-colors">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
