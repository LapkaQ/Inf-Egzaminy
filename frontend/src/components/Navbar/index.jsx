import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative text-sm font-medium transition-colors duration-200 after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-accent after:to-accent-2 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 ${
      isActive(path) ? 'text-white after:scale-x-100' : 'text-subtle hover:text-white'
    }`;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-page/90 backdrop-blur-xl border-b border-line' : ''}`}>
      <div className="max-w-6xl mx-auto px-8 h-[68px] flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-[1.05rem] tracking-tight text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-sm font-black">
            K
          </div>
          KorkiINF
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={navLinkClass('/')}>Strona główna</Link>
          <Link to="/tutors" className={navLinkClass('/tutors')}>Korepetytorzy</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-subtle text-sm">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-line-hi text-subtle text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer bg-transparent font-sans"
              >
                Wyloguj
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-lg border border-line-hi text-subtle text-sm font-medium hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200">
                Zaloguj się
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,58,237,0.45)] transition-all duration-200">
                Zarejestruj →
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
