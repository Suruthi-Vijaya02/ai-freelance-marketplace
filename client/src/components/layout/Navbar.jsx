import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { connected } = useSocketGlobal();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
    setMenuOpen(false);
  };

  let dashboardPath = '/dashboard/client';
  if (user?.role === 'freelancer') dashboardPath = '/dashboard/freelancer';
  else if (user?.role === 'admin') dashboardPath = '/admin';

  const scrollTo = (href) => {
    setOpen(false);
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      if (globalThis.location?.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${href.slice(1)}`);
      }
    }
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-6 z-50 px-4"
    >
      <nav className="max-w-7xl mx-auto relative">
        <motion.div
          layout
          className="backdrop-blur-sm bg-white/30 border border-white/20 rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-4"
          initial={{ backdropFilter: 'blur(0px)' }}
          animate={{ backdropFilter: 'blur(8px)' }}
          transition={{ duration: 0.6 }}
        >
          <Link to={isAuthenticated ? dashboardPath : '/'} className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-display text-[18px] font-extrabold text-black/90 group-hover:text-accent transition-colors">Suruthi<span className="text-accent">.</span></span>
                <span className="text-[11px] text-mid -mt-0.5">Global Talent Network</span>
              </div>
            </div>
          </Link>

          {/* Center nav - workspace routes */}
          <div className="hidden md:flex items-center gap-6 mx-auto">
            {(user?.role === 'admin' ? [
              { to: '/admin', label: 'Dashboard' },
              { to: '/admin/users', label: 'Users' },
              { to: '/admin/projects', label: 'Projects' },
              { to: '/admin/transactions', label: 'Payments' },
              { to: '/profile/edit', label: 'Settings' },
            ] : user?.role === 'client' ? [
              { to: '/dashboard/client', label: 'Workspace' },
              { to: '/dashboard/client/talents', label: 'Talents' },
              { to: '/dashboard/client/interviews', label: 'Interviews' },
              { to: '/dashboard/client/contracts', label: 'Contracts' },
              { to: '/dashboard/client/proposals', label: 'Proposals' },
              { to: '/dashboard/client/messages', label: 'Messages' },
            ] : [
              { to: dashboardPath, label: 'Workspace' },
              { to: '/projects', label: 'Browse' },
              { to: '/interviews', label: 'Interviews' },
              { to: '/contracts', label: 'Contracts' },
              { to: '/my-proposals', label: 'Proposals' },
              { to: '/messages', label: 'Messages' },
            ]).map((link) => {
              const active = location.pathname.startsWith(link.to);
              return (
                <Link key={link.to} to={link.to} className="relative">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    className={`text-sm font-medium px-3 py-2 rounded-full ${active ? 'text-black' : 'text-mid'} transition-colors`}
                  >
                    {link.label}
                  </motion.span>
                  {active && (
                    <motion.div layoutId="nav-active" className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div title={connected ? 'Connected' : 'Disconnected'} className="hidden sm:flex items-center gap-2 px-2">
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
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-transparent hover:border-white/30 bg-white/60 backdrop-blur-sm transition-all"
                >
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt=""
                    className="w-9 h-9 rounded-full border border-white/30 object-cover"
                  />
                  <span className="text-sm font-medium text-black max-w-[140px] truncate hidden lg:inline">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-mid" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-white/80 backdrop-blur-md shadow-2xl z-50 py-2 p-1"
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
              <div className="hidden sm:flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
            <button
              type="button"
              className="md:hidden p-2 text-black hover:text-accent transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden mt-3"
            >
              <div className="py-4 space-y-3 bg-white/40 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                {isAuthenticated ? (
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
                ) : (
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
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}