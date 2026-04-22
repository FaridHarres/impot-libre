import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-bleu-republique text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              to="/mentions-legales"
              className="hover:underline text-white/80 hover:text-white transition-colors"
            >
              Mentions legales
            </Link>
            <span className="hidden md:inline text-white/40">|</span>
            <Link
              to="/confidentialite"
              className="hover:underline text-white/80 hover:text-white transition-colors"
            >
              Politique de confidentialite
            </Link>
            <span className="hidden md:inline text-white/40">|</span>
            <Link
              to="/cgu"
              className="hover:underline text-white/80 hover:text-white transition-colors"
            >
              CGU
            </Link>
          </nav>

          {/* Tagline */}
          <p className="text-sm text-white/60">
            Un projet citoyen &mdash; impot-libre.fr
          </p>
        </div>

        {/* Bottom border tricolor */}
        <div className="flex mt-6">
          <div className="h-1 flex-1 bg-[#003189]" />
          <div className="h-1 flex-1 bg-white" />
          <div className="h-1 flex-1 bg-rouge-marianne" />
        </div>
      </div>
    </footer>
  );
}
