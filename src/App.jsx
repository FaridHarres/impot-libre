import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Resultats from './pages/Resultats';
import MentionsLegales from './pages/MentionsLegales';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExport from './pages/admin/AdminExport';
import AdminNewsletter from './pages/admin/AdminNewsletter';

/**
 * Route protégée : nécessite d'être authentifié ET email vérifié.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container-dsfr py-12 text-center">
        <p className="text-gris-texte">Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  // Bloquer si email non vérifié
  if (user && !user.email_verified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-gris-bordure rounded-sm p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-bleu-republique mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-bold text-texte mb-2">Confirmez votre email</h2>
          <p className="text-sm text-gris-texte">
            Vous devez confirmer votre adresse email avant de pouvoir
            accéder à la répartition. Vérifiez votre boîte mail
            (pensez aux spams).
          </p>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Route admin : nécessite d'être authentifié avec le rôle admin.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="container-dsfr py-12 text-center">
        <p className="text-gris-texte">Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    // Rediriger vers la page de login admin sécurisée
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

/**
 * L'URL secrète admin est construite à partir de VITE_ADMIN_URL_SECRET.
 * En prod, elle est du type /gestion-k9mX2pL7nQ4rW8vY3zB6cF1hJ5tD0eA
 * En dev, on utilise /admin-login comme fallback.
 */
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_URL_SECRET || '';
const ADMIN_LOGIN_PATH = ADMIN_SECRET ? `/gestion-${ADMIN_SECRET}` : '/admin-login';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-marianne bg-fond text-texte">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/connexion" element={<Login />} />
          <Route
            path="/repartition"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/resultats" element={<Resultats />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />

          {/* ─── Admin login (2FA) ─── */}
          {/* Toujours accessible via /admin-login (dev) */}
          <Route path="/admin-login" element={<AdminLogin />} />
          {/* Accessible via l'URL secrète si définie */}
          {ADMIN_SECRET && (
            <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
          )}

          {/* ─── Admin dashboard (protégé) ─── */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/export"
            element={
              <AdminRoute>
                <AdminExport />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/newsletter"
            element={
              <AdminRoute>
                <AdminNewsletter />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <div className="bg-bleu-republique text-white text-xs py-3 px-4 text-center">
        <p>
          impot-libre.fr est un outil citoyen à titre informatif uniquement.
          Il ne constitue ni une déclaration fiscale, ni un acte administratif.
          Aucune affiliation politique. Données anonymes et non transmises
          à l&apos;administration fiscale.
        </p>
      </div>
      <Footer />
    </div>
  );
}

export default App;
