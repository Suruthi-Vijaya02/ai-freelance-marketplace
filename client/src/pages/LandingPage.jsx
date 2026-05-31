import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring, animate, AnimatePresence } from 'framer-motion';
import {
  Code2, GitBranch, Cpu, Terminal, Layers, Zap,
  BarChart2, TrendingUp, DollarSign, Briefcase,
  FileText, CheckSquare, Clock, Star, Award,
  Users, MessageSquare, Globe, Rocket, Target,
  Calendar, Lightbulb, PenTool, Package,
  ArrowUpRight, Shield, Lock, Repeat2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProtectedAction } from '../hooks/useProtectedAction';
import LoginModal from '../components/ui/LoginModal';
// ─── CHANGE THIS PATH to match where you saved the Gemini image ───
// e.g. src/assets/hero-illustration.png
import heroIllustration from '../assets/hero-illustration.png';

// ─────────────────────────────────────────────
// Inline SVGs (unchanged from original)
// ─────────────────────────────────────────────
const ChevronDownSVG = () => (
  <svg className="w-4 h-4 text-[#6b64a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const MenuSVG = () => (
  <svg className="w-6 h-6 text-[#1a1560]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const XSVG = () => (
  <svg className="w-6 h-6 text-[#1a1560]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const LogOutSVG = () => (
  <svg className="w-4 h-4 text-[#ff4d1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const DashboardSVG = () => (
  <svg className="w-4 h-4 text-[#6b64a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
  </svg>
);

// ─────────────────────────────────────────────
// Data (unchanged from original)
// ─────────────────────────────────────────────
const ICONS = [
  Code2, GitBranch, Cpu, Terminal, Layers, Zap,
  BarChart2, TrendingUp, DollarSign, Briefcase,
  FileText, CheckSquare, Clock, Star, Award,
  Users, MessageSquare, Globe, Rocket, Target,
  Calendar, Lightbulb, PenTool, Package,
  ArrowUpRight, Shield, Lock, Repeat2
];

const STATS_CONFIG = [
  { value: 2400, prefix: '', suffix: '+', label: 'Active Clients' },
  { value: 8900, prefix: '', suffix: '+', label: 'Verified Freelancers' },
  { value: 4.2,  prefix: '$', suffix: 'M+', label: 'Contracts Delivered', decimals: 1 },
  { value: 98,   prefix: '', suffix: '%',  label: 'Client Satisfaction' },
];

const STEPS = [
  { num: '01', icon: FileText, title: 'Post Your Project',    desc: 'Describe your needs, set your budget, and go live in minutes.' },
  { num: '02', icon: Cpu,      title: 'AI Matches Talent',    desc: 'Our algorithm scores and ranks freelancers by skill fit, rating, and availability.' },
  { num: '03', icon: Shield,   title: 'Pay with Confidence',  desc: 'Escrow holds funds securely until you approve each milestone.' },
];

const BANNER_ICON_CONFIG = [
  { icon: Code2,    top: '10%', left: '8%',  size: 24 },
  { icon: Terminal, top: '70%', left: '15%', size: 28 },
  { icon: Zap,      top: '25%', left: '45%', size: 20 },
  { icon: Star,     top: '15%', left: '80%', size: 22 },
  { icon: Rocket,   top: '65%', left: '75%', size: 26 },
  { icon: Globe,    top: '45%', left: '90%', size: 20 },
];

// ─────────────────────────────────────────────
// Stat counter (unchanged from original)
// ─────────────────────────────────────────────
function StatItem({ value, prefix, suffix, label, decimals = 0, delay }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 80 });
  const [displayValue, setDisplayValue] = useState(prefix + '0' + suffix);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        animate(motionValue, value, { duration: 2, ease: 'easeOut' });
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, motionValue, value, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      const formattedNum = decimals > 0 ? latest.toFixed(decimals) : Math.floor(latest).toLocaleString();
      setDisplayValue(`${prefix}${formattedNum}${suffix}`);
    });
    return () => unsubscribe();
  }, [springValue, prefix, suffix, decimals]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="font-display text-[40px] sm:text-[48px] font-extrabold text-[#3d47d4] leading-tight">
        {displayValue}
      </div>
      <div className="font-body text-[13px] font-semibold text-[#6b64a8] mt-1">{label}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Small floating badge used in the hero image column
// ─────────────────────────────────────────────
function FloatingBadge({ children, className, animate: anim, transition }) {
  return (
    <motion.div
      animate={anim}
      transition={transition}
      className={`absolute bg-white/80 backdrop-blur-sm border border-[#cec8e8]/70 rounded-2xl shadow-sm px-4 py-3 pointer-events-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { requireAuth, showLoginModal, closeLoginModal } = useProtectedAction();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen]     = useState(false);

  const ICON_CONFIG = useMemo(() =>
    ICONS.map((Icon, i) => ({
      icon: Icon,
      top:       `${8 + (Math.floor(i / 7) * 24) + (i % 3) * 4}%`,
      left:      `${4 + (i % 7) * 14 + (i % 4) * 2}%`,
      size:      18 + (i % 3) * 5,
      duration:  6 + (i % 8),
      delay:     (i * 0.4) % 5,
      rotateAmt: -8 + (i % 5) * 3,
      yAmt:      -8 + (i % 7) * 2.5,
    })), []
  );

  const dashboardPath =
    user?.role === 'freelancer' ? '/dashboard/freelancer'
    : user?.role === 'admin'   ? '/admin'
    : '/dashboard/client';

  return (
    <div className="min-h-screen flex flex-col bg-[#ede9f8] relative overflow-x-hidden selection:bg-[#3d47d4]/20">

      {/* ─── LAYER 0 — FIXED ANIMATED BACKGROUND ─── */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        {ICON_CONFIG.map(({ icon: Icon, top, left, size, duration, delay, rotateAmt, yAmt }, i) => (
          <motion.div
            key={i}
            style={{ position: 'absolute', top, left }}
            initial={{ opacity: 0 }}
            animate={{ y: [0, yAmt, 0], rotate: [0, rotateAmt, 0], opacity: [0.09, 0.16, 0.09] }}
            transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            <Icon size={size} strokeWidth={1.2} color="#1a1560" />
          </motion.div>
        ))}

        {/* Orb 1 */}
        <motion.div
          style={{ position: 'absolute', width: 500, height: 500, top: -100, left: -150,
            background: 'radial-gradient(circle, rgba(61,71,212,0.15) 0%, transparent 65%)', filter: 'blur(40px)' }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Orb 2 */}
        <motion.div
          style={{ position: 'absolute', width: 400, height: 400, bottom: 100, right: -100,
            background: 'radial-gradient(circle, rgba(255,77,28,0.10) 0%, transparent 65%)', filter: 'blur(40px)' }}
          animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Orb 3 */}
        <motion.div
          style={{ position: 'absolute', width: 350, height: 350, top: '40%', left: '50%',
            marginLeft: -175, marginTop: -175,
            background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)', filter: 'blur(50px)' }}
          animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Scrolling ticker */}
        <div className="absolute bottom-[40px] left-0 w-full overflow-hidden whitespace-nowrap pointer-events-none select-none">
          <motion.div
            className="inline-block text-[11px] font-bold tracking-[0.2em] text-[#1a1560] opacity-[0.04] uppercase"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {[0, 1].map((n) => (
              <span key={n} className="inline-block pr-4">
                FREELANCE &middot; AI MATCHING &middot; ESCROW &middot; MILESTONE &middot; PROPOSAL &middot;
                CONTRACT &middot; TALENT &middot; DEPLOY &middot; REVENUE &middot; GROWTH &middot;
                BUILD &middot; SHIP &middot; SCALE &middot;&nbsp;
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      <LoginModal open={showLoginModal} onClose={closeLoginModal} />

      {/* ─── NAVBAR (unchanged logic) ─── */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full px-6 md:px-20 py-5 bg-transparent"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to={isAuthenticated ? dashboardPath : '/'} className="flex items-center gap-1 font-display text-[22px] font-extrabold text-[#1a1560]">
            <span>Suruthi</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d1c] self-end mb-1.5" />
          </Link>

          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-8">
              {['hero', 'how-it-works', 'pricing'].map((id, i) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="relative py-1 text-[13px] font-medium text-[#6b64a8] hover:text-[#1a1560] font-body transition-colors group"
                >
                  {['Home', 'How It Works', 'Pricing'][i]}
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#3d47d4] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button type="button" onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#cec8e8] hover:border-[#1a1560]/20 bg-white transition-colors cursor-pointer"
                >
                  <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt=""
                    className="w-8 h-8 rounded-full border border-transparent hover:border-[#3d47d4] bg-[#ede9f8] object-cover" />
                  <span className="text-sm font-medium text-[#1a1560] max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDownSVG />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-56 rounded-2xl border border-[#cec8e8] bg-white shadow-xl z-50 py-2 p-1 text-left"
                      >
                        <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#1a1560] hover:bg-[#ede9f8] transition-colors">
                          <DashboardSVG /> Dashboard
                        </Link>
                        <Link to={`/profile/${user?._id || user?.id}`} onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#1a1560] hover:bg-[#ede9f8] transition-colors pl-11">Profile</Link>
                        <Link to="/profile/edit" onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#1a1560] hover:bg-[#ede9f8] transition-colors pl-11">Settings</Link>
                        <div className="h-px bg-[#cec8e8]/50 my-1 mx-2" />
                        <button type="button" onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-[#ff4d1c] hover:bg-[#ff4d1c]/10 flex items-center gap-3 transition-colors cursor-pointer">
                          <LogOutSVG /> Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-[13px] font-medium text-[#6b64a8] hover:text-[#1a1560] px-4 py-2 transition-colors">Log In</Link>
                <Link to="/signup">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="bg-[#3d47d4] text-white text-[13px] font-semibold px-6 py-2.5 rounded-full hover:bg-[#3239b3] shadow-md transition-colors cursor-pointer">
                    Get Started &rarr;
                  </motion.button>
                </Link>
              </div>
            )}
          </div>

          <button type="button" className="md:hidden p-2 text-[#1a1560] cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <XSVG /> : <MenuSVG />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border border-[#cec8e8]/50 mt-4 bg-white/40 backdrop-blur-md rounded-2xl p-4 space-y-3"
            >
              {!isAuthenticated ? (
                <>
                  {['hero', 'how-it-works', 'pricing'].map((id, i) => (
                    <a key={id} href={`#${id}`}
                      onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="block text-[#6b64a8] font-medium hover:text-[#1a1560] py-2 px-4 transition-colors">
                      {['Home', 'How It Works', 'Pricing'][i]}
                    </a>
                  ))}
                  <div className="h-px bg-[#cec8e8]/50 my-2" />
                  <div className="flex flex-col gap-2 pt-2 px-4">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full bg-transparent border border-[#cec8e8] text-[#1a1560] rounded-full py-2.5 font-semibold text-[14px] cursor-pointer">Log In</button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full bg-[#3d47d4] text-white rounded-full py-2.5 font-semibold text-[14px] cursor-pointer">Get Started</button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="px-2 space-y-1 text-left">
                  <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)} className="block text-[#1a1560] font-medium py-3 px-4 rounded-xl hover:bg-[#ede9f8]">Dashboard</Link>
                  <Link to={`/profile/${user?._id || user?.id}`} onClick={() => setMobileMenuOpen(false)} className="block text-[#1a1560] font-medium py-3 px-4 rounded-xl hover:bg-[#ede9f8]">Profile</Link>
                  <button type="button" onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 text-[#ff4d1c] font-semibold py-3 px-4 rounded-xl hover:bg-[#ff4d1c]/10 cursor-pointer">
                    <LogOutSVG /> Logout
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ═══════════════════════════════════════
          HERO — Split layout  (THE MAIN CHANGE)
          Left: headline + CTAs
          Right: illustration + floating badges
          ═══════════════════════════════════════ */}
      <section id="hero" className="relative z-[1] min-h-[92vh] flex items-center px-6 md:px-16 lg:px-24 py-10 md:py-0">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── LEFT COLUMN — Text content ── */}
          <div className="flex flex-col items-start text-left order-2 lg:order-1">

            {/* Badge pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-[#cec8e8]/80 rounded-full px-5 py-2 mb-7"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[11px] font-bold tracking-[0.14em] text-[#3d47d4] uppercase font-body">
                AI-Powered Freelance Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="font-display text-[46px] sm:text-[58px] md:text-[70px] text-[#1a1560] leading-[0.94] tracking-[-0.04em] font-extrabold"
            >
              Hire World-Class
              <br />
              Talent with
              <br />
              <span className="relative inline-block text-[#3d47d4] whitespace-nowrap">
                AI Precision.
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[5px] bg-gradient-to-r from-[#3d47d4] to-[#ff4d1c] rounded-full"
                  style={{ originX: 0 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.85, ease: 'easeOut' }}
                />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="font-body text-[16px] sm:text-[17px] text-[#6b64a8] max-w-[460px] mt-7 leading-[1.7] font-medium"
            >
              Connect with elite freelancers worldwide. Smart matching,
              secure escrow, and real-time collaboration — all in one platform.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="mt-9 flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated ? (
                <>
                  <Link to="/projects">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="w-full sm:w-auto bg-[#3d47d4] text-white rounded-full px-9 py-4 font-semibold text-[16px] flex items-center justify-center gap-2 hover:bg-[#3239b3] shadow-lg transition-colors cursor-pointer">
                      Browse Projects &rarr;
                    </motion.button>
                  </Link>
                  <Link to={dashboardPath}>
                    <motion.button whileHover={{ scale: 1.03, backgroundColor: '#1a1560', color: '#ffffff' }} whileTap={{ scale: 0.97 }}
                      className="w-full sm:w-auto bg-transparent border-[1.5px] border-[#1a1560] text-[#1a1560] rounded-full px-9 py-4 font-semibold text-[16px] transition-all cursor-pointer">
                      Go to Dashboard
                    </motion.button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="w-full sm:w-auto bg-[#3d47d4] text-white rounded-full px-9 py-4 font-semibold text-[16px] flex items-center justify-center gap-2 hover:bg-[#3239b3] shadow-lg transition-colors cursor-pointer">
                      Get Started &rarr;
                    </motion.button>
                  </Link>
                  <Link to="/signup?role=freelancer">
                    <motion.button whileHover={{ scale: 1.03, backgroundColor: '#1a1560', color: '#ffffff' }} whileTap={{ scale: 0.97 }}
                      className="w-full sm:w-auto bg-transparent border-[1.5px] border-[#1a1560] text-[#1a1560] rounded-full px-9 py-4 font-semibold text-[16px] transition-all cursor-pointer">
                      Join as Freelancer
                    </motion.button>
                  </Link>
                </>
              )}
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
            >
              {/* Avatar stack */}
              <div className="flex -space-x-2.5">
                {['Alice', 'Bob', 'Carol', 'Dave'].map((seed) => (
                  <img key={seed} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt=""
                    className="w-8 h-8 rounded-full border-2 border-[#ede9f8] bg-white object-cover" />
                ))}
              </div>
              <div className="text-[12px] font-semibold text-[#6b64a8] leading-snug">
                Trusted by <span className="text-[#1a1560]">2,400+</span> businesses &middot;{' '}
                <span className="text-[#1a1560]">8,900+</span> freelancers
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — Illustration + floating badges ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center order-1 lg:order-2 w-full"
            style={{ minHeight: 480 }}
          >
            {/*
              Soft glow behind the image — gives depth without a hard box.
              The image itself floats on the lavender background naturally.
            */}
            <div
              className="absolute inset-0 rounded-[40px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 55% 55%, rgba(61,71,212,0.10) 0%, transparent 70%)',
                filter: 'blur(24px)',
              }}
            />

            {/* Main illustration */}
            <motion.img
              src={heroIllustration}
              alt="A freelancer and client signing a contract together"
              /*
                mix-blend-mode: multiply removes the white/light background
                so the image sits seamlessly on the lavender page.
                If your image has a transparent PNG background, remove mix-blend-mode.
              */
              style={{ mixBlendMode: 'multiply' }}
              className="relative z-[2] w-full max-w-[560px] object-contain drop-shadow-xl select-none"
              // Gentle idle float
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            />

            {/* ── Floating badge: AI Match ── */}
            <FloatingBadge
              className="z-[3] top-[8%] right-[2%] min-w-[170px]"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span className="text-[11px] font-bold text-[#1a1560] tracking-wide">AI Match</span>
                <span className="ml-auto text-[11px] font-extrabold text-[#3d47d4]">94%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#cec8e8]/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#3d47d4]"
                  initial={{ width: 0 }}
                  animate={{ width: '94%' }}
                  transition={{ duration: 1.2, delay: 1.4 }}
                />
              </div>
              <div className="text-[11px] text-[#6b64a8] mt-2 font-medium">Priya S. · Full Stack</div>
            </FloatingBadge>

            {/* ── Floating badge: Contract signed ── */}
            <FloatingBadge
              className="z-[3] bottom-[22%] left-[-2%] min-w-[168px]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            >
              <div className="text-[12px] font-bold text-[#22c55e] flex items-center gap-1.5 mb-1">
                <CheckSquare size={13} strokeWidth={2.5} /> Contract Signed
              </div>
              <div className="text-[15px] font-extrabold text-[#1a1560] font-display leading-tight">$3,200</div>
              <div className="text-[11px] text-[#6b64a8] font-medium mt-0.5">Escrow secured · Milestone 1</div>
            </FloatingBadge>

            {/* ── Floating badge: Review ── */}
            <FloatingBadge
              className="z-[3] top-[38%] left-[-4%] min-w-[148px]"
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            >
              <div className="text-[11px] font-bold text-[#1a1560] mb-1.5">Client Review</div>
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className="text-[#f59e0b]" fill="#f59e0b" />
                ))}
              </div>
              <div className="text-[10px] text-[#6b64a8] italic leading-tight">"Delivered perfectly on time"</div>
            </FloatingBadge>

            {/* ── Floating badge: Project active ── */}
            <FloatingBadge
              className="z-[3] bottom-[8%] right-[4%] min-w-[158px]"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            >
              <div className="text-[11px] font-bold text-[#ff4d1c] flex items-center gap-1.5 mb-1">
                <Rocket size={11} strokeWidth={2} /> Project Live
              </div>
              <div className="text-[13px] font-bold text-[#1a1560] leading-snug">React Dashboard UI</div>
              <div className="text-[10px] text-[#6b64a8] mt-0.5">Budget · $1,500</div>
            </FloatingBadge>
          </motion.div>

        </div>
      </section>

      {/* ─── STATS STRIP (unchanged) ─── */}
      <section className="bg-white/40 backdrop-blur-md border-t border-b border-[#cec8e8]/50 py-10 md:py-14 px-6 md:px-20 relative z-[1]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {STATS_CONFIG.map((stat, i) => (
            <StatItem key={stat.label} value={stat.value} prefix={stat.prefix} suffix={stat.suffix}
              label={stat.label} decimals={stat.decimals} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS (unchanged) ─── */}
      <section id="how-it-works" className="relative z-[1] py-24 px-6 md:px-20 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-[#ff4d1c] font-bold text-[11px] tracking-[0.2em] uppercase font-body select-none">HOW IT WORKS</span>
          <h2 className="font-display text-[36px] sm:text-[48px] md:text-[64px] font-extrabold text-[#1a1560] leading-none mt-3">
            Three steps to your <br /><span className="text-[#3d47d4]">dream hire.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
                className="bg-white/55 backdrop-blur-[10px] border border-[#cec8e8]/50 rounded-[24px] p-9 text-left hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-[#3d47d4]/10 flex items-center justify-center text-[#3d47d4] group-hover:bg-[#3d47d4] group-hover:text-white transition-all">
                    <Icon size={32} />
                  </div>
                  <span className="font-display text-[20px] font-extrabold text-[#ff4d1c]">{step.num}</span>
                </div>
                <h3 className="font-display text-[22px] font-bold text-[#1a1560] mt-6">{step.title}</h3>
                <p className="font-body text-[14px] text-[#6b64a8] mt-3 leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── CTA BANNER (unchanged) ─── */}
      <section id="pricing" className="relative z-[1] mx-4 md:mx-10 my-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-[#3d47d4] to-[#1a1560] rounded-[32px] py-16 md:py-20 px-8 md:px-20 relative overflow-hidden text-center md:text-left"
        >
          {BANNER_ICON_CONFIG.map(({ icon: Icon, top, left, size }, i) => (
            <motion.div key={i} style={{ position: 'absolute', top, left }}
              animate={{ y: [0, i % 2 === 0 ? 8 : -8, 0], rotate: [0, i % 2 === 0 ? 5 : -5, 0] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
              className="text-white opacity-[0.06] pointer-events-none">
              <Icon size={size} strokeWidth={1.2} />
            </motion.div>
          ))}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 z-10 relative">
            <h2 className="font-display text-[32px] sm:text-[42px] md:text-[56px] font-extrabold text-white leading-none text-left">
              Ready to hire <br /><span className="text-white/85">smarter?</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto justify-end">
              <Link to="/signup" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto bg-white text-[#3d47d4] rounded-full px-9 py-4 font-bold text-[16px] hover:bg-white/95 shadow-lg cursor-pointer">
                  Get Started Free &rarr;
                </motion.button>
              </Link>
              <a href="mailto:sales@suruthi.ai" className="w-full sm:w-auto">
                <motion.button whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto bg-transparent border border-white text-white rounded-full px-9 py-4 font-bold text-[16px] cursor-pointer">
                  Talk to Sales
                </motion.button>
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER (unchanged) ─── */}
      <footer className="relative z-[1] mt-auto border-t border-[#1a1560]/10 py-8 px-6 md:px-20 bg-transparent select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#6b64a8] font-body font-semibold">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link to="/" className="flex items-center gap-1 font-display text-[16px] font-extrabold text-[#1a1560]">
              <span>Suruthi</span><span className="w-1.5 h-1.5 rounded-full bg-[#ff4d1c] mb-0.5" />
            </Link>
            <span className="hidden sm:inline text-[#1a1560]/20">|</span>
            <span>Global Talent Network</span>
          </div>
          <div>&copy; {new Date().getFullYear()} Suruthi Vijaya R. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}