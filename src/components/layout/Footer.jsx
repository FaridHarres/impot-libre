import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex gap-[3px] h-6">
              <div className="w-[4px] rounded-full" style={{ background: '#003189' }} />
              <div className="w-[4px] bg-white/80 rounded-full" />
              <div className="w-[4px] rounded-full" style={{ background: '#E1000F' }} />
            </div>
            <span className="text-base font-bold tracking-tight text-white/90">
              Impôt Libre
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              to="/mentions-legales"
              className="text-white/60 hover:text-white transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              to="/confidentialite"
              className="text-white/60 hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
            <Link
              to="/cgu"
              className="text-white/60 hover:text-white transition-colors"
            >
              CGU
            </Link>
          </nav>

          {/* Tagline */}
          <p className="text-sm text-white/40">
            Fait par un contribuable qui voulait avoir son mot à dire.
          </p>
        </div>

        {/* Bottom accent line */}
        <div className="mt-8 h-[2px] rounded-full bg-gradient-to-r from-accent via-white/20 to-success opacity-40" />
      </div>
    </footer>
  );
}
