import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Eager-loaded pages (critical path)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Resultats = lazy(() => import('./pages/Resultats'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminExport = lazy(() => import('./pages/admin/AdminExport'));
const AdminNewsletter = lazy(() => import('./pages/admin/AdminNewsletter'));

/** Shared page loader */
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gris-texte">Chargement...</p>
      </div>
    </div>
  );
}

/**
 * Route protégée : nécessite d'être authentifié ET email vérifié.
 * Redirige vers /connexion avec un message contextuel.
 */
function ProtectedRoute({ children, redirectMessage }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/connexion"
        state={{
          message: redirectMessage || 'Connectez-vous pour accéder à cette page.',
          redirect: window.location.pathname,
        }}
        replace
      />
    );
  }

  // Bloquer si email non vérifié
  if (user && !user.email_verified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-white border border-gris-bordure rounded-xl p-8 shadow-card">
          <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-primary mb-2">Confirmez votre email</h2>
          <p className="text-sm text-gris-texte leading-relaxed">
            Vous devez confirmer votre adresse email avant de pouvoir
            accéder à cette page. Vérifiez votre boîte mail
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

  if (loading) return <PageLoader />;

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_URL_SECRET || '';
const ADMIN_LOGIN_PATH = ADMIN_SECRET ? `/gestion-${ADMIN_SECRET}` : '/admin-login';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-fond text-texte">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/connexion" element={<Login />} />
            <Route
              path="/repartition"
              element={
                <ProtectedRoute redirectMessage="Connectez-vous pour répartir vos impôts.">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resultats"
              element={
                <ProtectedRoute redirectMessage="Créez un compte pour découvrir les priorités des citoyens français.">
                  <Resultats />
                </ProtectedRoute>
              }
            />
            <Route path="/mentions-legales" element={<MentionsLegales />} />

            {/* Admin login (2FA) — URL secrète */}
            {ADMIN_SECRET ? (
              <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
            ) : (
              <Route path="/admin-login" element={<AdminLogin />} />
            )}

            {/* Admin dashboard */}
            <Route
              path="/admin"
              element={<AdminRoute><AdminDashboard /></AdminRoute>}
            />
            <Route
              path="/admin/export"
              element={<AdminRoute><AdminExport /></AdminRoute>}
            />
            <Route
              path="/admin/newsletter"
              element={<AdminRoute><AdminNewsletter /></AdminRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Disclaimer banner */}
      <div className="bg-primary text-white/60 text-xs py-3 px-4 text-center">
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
