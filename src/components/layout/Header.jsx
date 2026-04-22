import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
      isActive(path)
        ? 'text-accent bg-accent-50'
        : 'text-gris-texte hover:text-primary hover:bg-primary-50'
    }`;

  return (
    <header className="glass sticky top-0 z-40 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex gap-[3px] h-7">
              <div className="w-[5px] bg-primary rounded-full transition-transform group-hover:scale-y-110" />
              <div className="w-[5px] bg-white border border-gris-bordure rounded-full" />
              <div className="w-[5px] bg-danger rounded-full transition-transform group-hover:scale-y-110" />
            </div>
            <span className="text-lg font-bold text-primary tracking-tight">
              Impôt Libre
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkClass('/')}>
              Accueil
            </Link>
            <Link to="/resultats" className={linkClass('/resultats')}>
              Résultats
            </Link>
            {isAuthenticated && (
              <Link to="/repartition" className={linkClass('/repartition')}>
                Répartition
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className={linkClass('/admin')}>
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gris-texte">{user?.email}</span>
                <button
                  onClick={logout}
                  className="text-sm text-danger hover:text-danger/80 font-medium cursor-pointer transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/connexion"
                  className="px-4 py-2 text-sm font-medium text-primary border border-gris-bordure rounded-md hover:bg-primary-50 hover:border-primary-200 transition-all"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="px-4 py-2 text-sm font-semibold text-white bg-accent rounded-md hover:bg-accent-500 transition-all shadow-button hover:shadow-button-hover"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 text-gris-texte hover:text-primary rounded-md hover:bg-primary-50 cursor-pointer transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gris-bordure py-3 space-y-1 animate-fade-in">
            <Link to="/" className={`block ${linkClass('/')}`} onClick={() => setMenuOpen(false)}>
              Accueil
            </Link>
            <Link to="/resultats" className={`block ${linkClass('/resultats')}`} onClick={() => setMenuOpen(false)}>
              Résultats
            </Link>
            {isAuthenticated && (
              <Link to="/repartition" className={`block ${linkClass('/repartition')}`} onClick={() => setMenuOpen(false)}>
                Répartition
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className={`block ${linkClass('/admin')}`} onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            )}

            <div className="border-t border-gris-bordure pt-3 mt-3">
              {isAuthenticated ? (
                <div className="space-y-2 px-3">
                  <p className="text-sm text-gris-texte">{user?.email}</p>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="text-sm text-danger hover:text-danger/80 font-medium cursor-pointer"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Link
                    to="/connexion"
                    className="text-center px-4 py-2.5 text-sm font-medium text-primary border border-gris-bordure rounded-md hover:bg-primary-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/inscription"
                    className="text-center px-4 py-2.5 text-sm font-semibold text-white bg-accent rounded-md hover:bg-accent-500 shadow-button"
                    onClick={() => setMenuOpen(false)}
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
