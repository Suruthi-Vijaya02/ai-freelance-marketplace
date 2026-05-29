import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.header 
      initial={{ y: -60, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border bg-transparent"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <Link to={isAuthenticated ? dashboardPath : '/'} className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <Logo size={36} />
            <div className="hidden sm:block">
              <span className="font-display text-[20px] font-extrabold text-black group-hover:text-accent transition-colors">
                Suruthi<span className="text-accent">.</span>
              </span>
              <span className="block text-[11px] text-mid -mt-1 font-body">Global Talent Network</span>
            </div>
          </Link>

          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-8">
              {guestLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(link.href);
                  }}
                  className="text-[13px] font-medium text-black/70 hover:text-black font-body transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && (
              <div title={connected ? 'Connected' : 'Disconnected'} className="flex items-center gap-2 px-2">
                <motion.span 
                  animate={{ opacity: [0.4, 1, 0.4] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-error'}`} 
                  aria-hidden 
                />
                <span className="text-[11px] font-bold tracking-wider text-mid">{connected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-border hover:border-black/20 bg-white transition-colors"
                >
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-accent transition-colors bg-surface object-cover"
                  />
                  <span className="text-sm font-medium text-black max-w-[100px] truncate hidden lg:inline">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-mid" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-56 rounded-2xl border border-border bg-white shadow-xl z-50 py-2 p-1"
                      >
                        <Link
                          to={dashboardPath}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-black hover:bg-surface transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-mid" /> Dashboard
                        </Link>
                        <Link
                          to={`/profile/${user?._id || user?.id}`}
                          className="block px-4 py-2.5 rounded-xl text-sm font-medium text-black hover:bg-surface transition-colors pl-11"
                          onClick={() => setMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/profile/edit"
                          className="block px-4 py-2.5 rounded-xl text-sm font-medium text-black hover:bg-surface transition-colors pl-11"
                          onClick={() => setMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <div className="h-px bg-border my-1 mx-2" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-accent hover:bg-accent/10 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-black hover:text-accent transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="py-4 space-y-3">
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
                        className="block text-black/70 font-medium hover:text-black py-2 px-4 transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                    <div className="flex flex-col gap-3 pt-4 px-4">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        <Button variant="outline" className="w-full">Log In</Button>
                      </Link>
                      <Link to="/signup" onClick={() => setOpen(false)}>
                        <Button className="w-full">Get Started</Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="px-2 space-y-1">
                    <Link to={dashboardPath} className="block text-black font-medium py-3 px-4 rounded-xl hover:bg-surface" onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                    <Link to={`/profile/${user?._id || user?.id}`} className="block text-black font-medium py-3 px-4 rounded-xl hover:bg-surface" onClick={() => setOpen(false)}>
                      Profile
                    </Link>
                    <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 text-accent font-bold py-3 px-4 rounded-xl hover:bg-accent/10">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
