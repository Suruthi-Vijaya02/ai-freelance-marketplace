import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ArrowUpRight, ArrowRight, Shield, Zap,
  CheckSquare, Globe, LogOut, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProtectedAction } from '../hooks/useProtectedAction';
import LoginModal from '../components/ui/LoginModal';
import heroIllustration from '../assets/hero-illustration.png';

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const STEPS = [
  { num: '01', title: 'Post Your Project', desc: 'Describe your needs, set your budget, and go live in minutes. No fluff, no friction.' },
  { num: '02', title: 'Match with Talent', desc: 'Our system scores and ranks freelancers by skill fit, rating, and real availability.' },
  { num: '03', title: 'Pay with Confidence', desc: 'Escrow holds funds securely until you approve each milestone. Release only when satisfied.' },
];

const MARQUEE_ITEMS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'UI Design', 'Copywriting',
  'DevOps', 'Mobile', 'Blockchain', 'Marketing', 'SEO', 'Video Editing',
  'Illustration', '3D Modeling', 'Data Science', 'Consulting'
];

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { requireAuth, showLoginModal, closeLoginModal } = useProtectedAction();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardPath =
    user?.role === 'freelancer' ? '/dashboard/freelancer'
      : user?.role === 'admin' ? '/admin'
        : '/dashboard/client';

  return (
    <div className="min-h-screen bg-[#ede9f8] text-[#1a1560] antialiased selection:bg-[#3d47d4]/20 selection:text-[#1a1560]">
      <LoginModal open={showLoginModal} onClose={closeLoginModal} />

      {/* ═══════════════════════════════════════
          NAVIGATION
          ═══════════════════════════════════════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#ede9f8]/80 backdrop-blur-xl border-b border-[#cec8e8]/50' : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          {/* Abstract mark */}
          <Link to={isAuthenticated ? dashboardPath : '/'} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#1a1560] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {['Work', 'Process', 'Join'].map((label, i) => (
              <a
                key={label}
                href={['#work', '#process', '#join'][i]}
                onClick={(e) => { e.preventDefault(); document.getElementById(['work', 'process', 'join'][i])?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-[13px] font-medium text-[#6b64a8] hover:text-[#1a1560] transition-colors tracking-wide"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full border border-[#cec8e8] hover:border-[#1a1560]/20 bg-white/50 hover:bg-white transition-all"
                >
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt=""
                    className="w-7 h-7 rounded-full bg-[#ede9f8] object-cover"
                  />
                  <span className="text-[13px] font-medium text-[#1a1560]">{user?.name}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-52 rounded-2xl border border-[#cec8e8] bg-white shadow-xl z-50 py-2 px-1"
                      >
                        <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#1a1560] hover:bg-[#ede9f8] transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link to={`/profile/${user?._id || user?.id}`} onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#1a1560] hover:bg-[#ede9f8] transition-colors pl-11">Profile</Link>
                        <Link to="/profile/edit" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#1a1560] hover:bg-[#ede9f8] transition-colors pl-11">Settings</Link>
                        <div className="h-px bg-[#cec8e8]/50 my-1 mx-2" />
                        <button onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#ff4d1c] hover:bg-[#ff4d1c]/10 flex items-center gap-3 transition-colors">
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link to="/login" className="text-[13px] font-medium text-[#6b64a8] hover:text-[#1a1560] transition-colors">Log In</Link>
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#3d47d4] text-white text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#3239b3] transition-colors shadow-md"
                  >
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 text-[#1a1560]/60 hover:text-[#1a1560] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-[#cec8e8]/50 bg-[#ede9f8]/95 backdrop-blur-xl"
            >
              <div className="px-6 py-6 space-y-1">
                {['Work', 'Process', 'Join'].map((label, i) => (
                  <a
                    key={label}
                    href={['#work', '#process', '#join'][i]}
                    onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById(['work', 'process', 'join'][i])?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="block text-[#6b64a8] hover:text-[#1a1560] py-3 text-[15px] font-medium transition-colors"
                  >
                    {label}
                  </a>
                ))}
                <div className="h-px bg-[#cec8e8]/50 my-3" />
                {isAuthenticated ? (
                  <>
                    <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)} className="block text-[#1a1560] py-3 text-[15px] font-medium">Dashboard</Link>
                    <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="block text-[#ff4d1c] py-3 text-[15px] font-medium">Sign out</button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 pt-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full border border-[#cec8e8] text-[#1a1560] rounded-full py-3 font-medium text-[14px]">Log In</button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full bg-[#3d47d4] text-white rounded-full py-3 font-semibold text-[14px]">Get Started</button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ═══════════════════════════════════════
          HERO — Full Background Image
          ═══════════════════════════════════════ */}
      <section id="work" className="relative min-h-screen flex items-end md:items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroIllustration}
            alt=""
            className="w-full h-full object-cover object-center scale-105"
          />
          {/* Light gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ede9f8]/90 via-[#ede9f8]/70 to-[#ede9f8]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ede9f8]/80 via-transparent to-transparent" />
          <NoiseOverlay />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 md:px-10 lg:px-16 pb-20 md:pb-0 md:pt-32 max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="h-px w-8 bg-[#3d47d4]" />
              <span className="text-[#ff4d1c] text-[11px] tracking-[0.25em] uppercase font-semibold">
                Freelance Marketplace
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="font-display text-[3.2rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem] text-[#1a1560] leading-[0.9] tracking-tighter mb-8"
            >
              Hire talent.
              <br />
              <span className="text-[#6b64a8]">Not promises.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-[#6b64a8] text-base md:text-lg max-w-md leading-relaxed mb-10 font-body"
            >
              Connect with verified freelancers worldwide. Smart matching, secure escrow, and real-time collaboration.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated ? (
                <>
                  <Link to="/projects">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group bg-[#3d47d4] text-white rounded-full px-8 py-4 font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#3239b3] shadow-lg transition-colors"
                    >
                      Browse Projects
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </motion.button>
                  </Link>
                  <Link to={dashboardPath}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="border border-[#1a1560]/15 text-[#1a1560] rounded-full px-8 py-4 font-semibold text-[14px] hover:bg-[#1a1560]/5 transition-colors"
                    >
                      Dashboard
                    </motion.button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group bg-[#3d47d4] text-white rounded-full px-8 py-4 font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#3239b3] shadow-lg transition-colors"
                    >
                      Get Started
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </motion.button>
                  </Link>
                  <Link to="/signup?role=freelancer">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="border border-[#1a1560]/15 text-[#1a1560] rounded-full px-8 py-4 font-semibold text-[14px] hover:bg-[#1a1560]/5 transition-colors"
                    >
                      Join as Freelancer
                    </motion.button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom marquee */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-[#1a1560]/5 py-4 bg-gradient-to-t from-[#ede9f8] to-transparent">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          >
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="text-[11px] tracking-[0.2em] text-[#1a1560]/15 uppercase font-medium mx-8 flex items-center gap-3">
                {item} <span className="w-1 h-1 rounded-full bg-[#1a1560]/15" />
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — Editorial Grid
          ═══════════════════════════════════════ */}
      <section id="process" className="relative py-32 md:py-40 px-6 md:px-10 lg:px-16 max-w-7xl mx-auto">
        <NoiseOverlay />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20 md:mb-28"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-[#3d47d4]" />
              <span className="text-[#ff4d1c] text-[11px] tracking-[0.25em] uppercase font-semibold">Process</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-[#1a1560] leading-[0.95] tracking-tight max-w-2xl">
              Getting started is simple.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#cec8e8]/40 rounded-2xl overflow-hidden border border-[#cec8e8]/50">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/60 backdrop-blur-sm p-8 md:p-10 group hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-12">
                  <span className="font-display text-5xl md:text-6xl text-[#1a1560]/5 group-hover:text-[#1a1560]/10 transition-colors font-bold tracking-tighter">
                    {step.num}
                  </span>
                  <ArrowRight className="w-5 h-5 text-[#1a1560]/20 group-hover:text-[#3d47d4] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-display text-xl md:text-2xl text-[#1a1560] font-semibold tracking-tight mb-3">
                  {step.title}
                </h3>
                <p className="text-[#6b64a8] text-[14px] leading-relaxed font-body">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES — Minimal List
          ═══════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-6 md:px-10 lg:px-16 max-w-7xl mx-auto border-t border-[#1a1560]/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-[#3d47d4]" />
              <span className="text-[#ff4d1c] text-[11px] tracking-[0.25em] uppercase font-semibold">Why us</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-[#1a1560] leading-[0.95] tracking-tight">
              Built for work that matters.
            </h2>
          </motion.div>

          <div className="space-y-0">
            {[
              { icon: Shield, title: 'Secure Escrow', desc: 'Funds held safely until milestones are approved. No upfront risk.' },
              { icon: Zap, title: 'Smart Matching', desc: 'AI scores candidates by skill fit, not just keywords.' },
              { icon: CheckSquare, title: 'Milestone Payments', desc: 'Break projects into phases. Pay only for completed work.' },
              { icon: Globe, title: 'Global Talent', desc: 'Access verified freelancers across 120+ countries.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-5 py-6 border-b border-[#1a1560]/5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#3d47d4]/10 flex items-center justify-center shrink-0 group-hover:bg-[#3d47d4]/15 transition-colors">
                  <item.icon className="w-4 h-4 text-[#3d47d4] group-hover:text-[#3d47d4] transition-colors" />
                </div>
                <div>
                  <h4 className="text-[#1a1560] font-semibold text-[15px] mb-1">{item.title}</h4>
                  <p className="text-[#6b64a8] text-[13px] leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA — Gradient Card
          ═══════════════════════════════════════ */}
      <section id="join" className="relative py-32 md:py-40 px-6 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative bg-gradient-to-br from-[#3d47d4] to-[#1a1560] rounded-[2rem] md:rounded-[3rem] p-10 md:p-20 lg:p-24 overflow-hidden shadow-xl"
          >
            <NoiseOverlay />
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ff4d1c]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-white leading-[0.95] tracking-tight mb-6">
                Ready to build something?
              </h2>
              <p className="text-white/60 text-base md:text-lg leading-relaxed mb-10 max-w-md">
                Join thousands of teams who hire smarter, not harder.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group bg-white text-[#3d47d4] rounded-full px-8 py-4 font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#ede9f8] transition-colors"
                  >
                    Start for free
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </motion.button>
                </Link>
                <a href="mailto:hello@platform.com">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border border-white/20 text-white rounded-full px-8 py-4 font-semibold text-[14px] hover:bg-white/10 transition-colors"
                  >
                    Talk to us
                  </motion.button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER — Minimal
          ═══════════════════════════════════════ */}
      <footer className="border-t border-[#1a1560]/5 py-10 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#1a1560] flex items-center justify-center">
              <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-[#6b64a8] text-[13px] font-medium">Global Talent Network</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-[#6b64a8] hover:text-[#1a1560] text-[13px] transition-colors">Privacy</a>
            <a href="#" className="text-[#6b64a8] hover:text-[#1a1560] text-[13px] transition-colors">Terms</a>
            <span className="text-[#6b64a8]/50 text-[13px]">&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}