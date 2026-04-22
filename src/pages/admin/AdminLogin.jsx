import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login: setAuthState } = useAuth();

  const [step, setStep] = useState(1); // 1 = identifiants, 2 = code OTP
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [globalInfo, setGlobalInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  // ─── ÉTAPE 1 : Identifiants ───
  const handleStep1 = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = "L'email est requis.";
    if (!form.password) errs.password = 'Le mot de passe est requis.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setGlobalError('');
    try {
      const res = await api.post('/admin-auth/login', {
        email: form.email,
        password: form.password,
      });
      setGlobalInfo(res.data.message || 'Code envoyé.');
      setStep(2);
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ─── ÉTAPE 2 : Code OTP ───
  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setGlobalError('Veuillez saisir le code à 6 chiffres.');
      return;
    }

    setLoading(true);
    setGlobalError('');
    try {
      const res = await api.post('/admin-auth/verify-2fa', {
        email: form.email,
        otp: otp.trim(),
      });

      // Stocker le token et les infos admin
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Rafraîchir le contexte auth — on force un reload pour que AuthContext relise localStorage
      window.location.href = '/admin';
    } catch (err) {
      const msg = err.response?.data?.message || 'Code invalide.';
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Administration — Connexion sécurisée</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          {/* Tricolor accent */}
          <div className="flex gap-0.5 mb-6 justify-center">
            <div className="w-8 h-1 bg-bleu-republique rounded-sm" />
            <div className="w-8 h-1 bg-white border border-gris-bordure rounded-sm" />
            <div className="w-8 h-1 bg-rouge-marianne rounded-sm" />
          </div>

          <h1 className="text-xl font-bold text-texte text-center mb-2">
            Espace administration
          </h1>
          <p className="text-sm text-gris-texte text-center mb-8">
            {step === 1
              ? 'Authentification requise'
              : 'Saisissez le code reçu par email et SMS'}
          </p>

          {/* Info */}
          {globalInfo && step === 2 && (
            <div className="mb-4 p-3 bg-bleu-republique/10 border border-bleu-republique rounded-sm">
              <p className="text-sm text-bleu-republique">{globalInfo}</p>
            </div>
          )}

          {/* Erreur */}
          {globalError && (
            <div className="mb-4 p-3 bg-rouge-marianne/10 border border-rouge-marianne rounded-sm">
              <p className="text-sm text-rouge-marianne">{globalError}</p>
            </div>
          )}

          {/* ─── ÉTAPE 1 ─── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="bg-white border border-gris-bordure rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-rouge-marianne/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rouge-marianne" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-texte">Étape 1/2 — Identifiants</span>
              </div>

              <Input
                label="Email administrateur"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="admin@impot-libre.fr"
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
                Vérifier les identifiants
              </Button>
            </form>
          )}

          {/* ─── ÉTAPE 2 : OTP ─── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="bg-white border border-gris-bordure rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-bleu-republique/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bleu-republique" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-texte">Étape 2/2 — Code de vérification</span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-texte mb-1.5">
                  Code à 6 chiffres
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    setGlobalError('');
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] border border-gris-bordure rounded-sm focus:outline-none focus:ring-2 focus:ring-bleu-republique focus:border-transparent"
                  autoFocus
                  autoComplete="one-time-code"
                />
                <p className="mt-1 text-xs text-gris-texte">
                  Code valable 5 minutes. Vérifiez aussi vos SMS.
                </p>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Valider le code
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setGlobalError('');
                  setGlobalInfo('');
                }}
                className="mt-3 w-full text-sm text-gris-texte hover:text-bleu-republique cursor-pointer text-center"
              >
                Retour à l&apos;étape 1
              </button>
            </form>
          )}

          <p className="text-xs text-gris-texte text-center mt-8 leading-relaxed">
            Accès réservé aux administrateurs. Toute tentative non autorisée
            est enregistrée et tracée.
          </p>
        </div>
      </section>
    </>
  );
}
