import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { useSocketGlobal } from '../../hooks/useSocket';

const guestLinks = [
  { href: '/#hero', label: 'Home' },
  { href: '/#how-it-works', label: 'How it Works' },
  { href: '/#pricing', label: 'Pricing' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { connected } = useSocketGlobal();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
    setMenuOpen(false);
  };

  const dashboardPath =
    user?.role === 'freelancer'
      ? '/dashboard/freelancer'
      : user?.role === 'admin'
        ? '/admin'
        : '/dashboard/client';

  const scrollTo = (href) => {
    setOpen(false);
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      if (window.location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${href.slice(1)}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={isAuthenticated ? dashboardPath : '/'} className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <Logo size={36} />
            <div className="hidden sm:block">
              <span className="font-heading text-lg font-semibold text-text group-hover:text-primary transition-colors">
                Suruthi Vijaya R
              </span>
              <span className="block text-xs text-muted -mt-0.5 font-sans">Global Talent Network</span>
            </div>
          </Link>

          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              {guestLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(link.href);
                  }}
                  className="text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <div title={connected ? 'Connected' : 'Disconnected'} className="flex items-center gap-2 px-2">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-error'}`} aria-hidden />
                <span className="text-xs text-muted">{connected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-border hover:border-primary/40 transition-colors"
                >
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt=""
                    className="w-8 h-8 rounded-full bg-card"
                  />
                  <span className="text-sm text-text max-w-[100px] truncate hidden lg:inline">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface shadow-lg z-50 py-1">
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-card"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        to={`/profile/${user?._id || user?.id}`}
                        className="block px-4 py-2 text-sm text-text hover:bg-card"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/profile/edit"
                        className="block px-4 py-2 text-sm text-text hover:bg-card"
                        onClick={() => setMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-error hover:bg-card flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-muted hover:text-text"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-border space-y-3">
            {!isAuthenticated ? (
              <>
                {guestLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(link.href);
                    }}
                    className="block text-muted hover:text-text py-1"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex gap-2 pt-1">
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Log In</Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                    <Button size="sm" className="w-full">Get Started</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link to={dashboardPath} className="block text-text py-1" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link to={`/profile/${user?._id || user?.id}`} className="block text-text py-1" onClick={() => setOpen(false)}>
                  Profile
                </Link>
                <button type="button" onClick={handleLogout} className="flex items-center gap-2 text-error py-1">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
