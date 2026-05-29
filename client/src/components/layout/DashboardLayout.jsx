import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2, GitBranch, Cpu, Terminal, Layers, Zap,
  BarChart2, TrendingUp, DollarSign, Briefcase,
  FileText, CheckSquare, Clock, Star, Award,
  Users, MessageSquare, Globe, Rocket, Target,
  Calendar, Lightbulb, PenTool, Package,
  ArrowUpRight, Shield, Lock, Repeat2
} from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useRole from '../../hooks/useRole';
import Skeleton from '../ui/Skeleton';
import BackgroundTicker from '../ui/BackgroundTicker';

const ICONS = [
  Code2, GitBranch, Cpu, Terminal, Layers, Zap,
  BarChart2, TrendingUp, DollarSign, Briefcase,
  FileText, CheckSquare, Clock, Star, Award,
  Users, MessageSquare, Globe, Rocket, Target,
  Calendar, Lightbulb, PenTool, Package,
  ArrowUpRight, Shield, Lock, Repeat2
];

const SIDEBAR_TITLES = {
  freelancer: 'Freelancer',
  client: 'Client',
  admin: 'Admin',
};

export default function DashboardLayout() {
  const { navItems, role, loading } = useRole();

  const ICON_CONFIG = useMemo(() => 
    ICONS.map((Icon, i) => ({
      icon: Icon,
      top: `${8 + (Math.floor(i/7) * 24) + (i%3)*4}%`,
      left: `${4 + (i%7) * 14 + (i%4)*2}%`,
      size: 18 + (i % 3) * 5,
      duration: 6 + (i % 8),
      delay: (i * 0.4) % 5,
      rotateAmt: -8 + (i % 5) * 3,
      yAmt: -8 + (i % 7) * 2.5,
    })), []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-12 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-body relative overflow-hidden">
      {/* Floating Icons Grid */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        {ICON_CONFIG.map(({ icon: Icon, top, left, size, duration, delay, rotateAmt, yAmt }, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              top,
              left,
            }}
            initial={{ opacity: 0 }}
            animate={{
              y: [0, yAmt, 0],
              rotate: [0, rotateAmt, 0],
              opacity: [0.12, 0.22, 0.12]
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay
            }}
          >
            <Icon size={size} strokeWidth={1.2} color="#1a1560" />
          </motion.div>
        ))}
      </div>

      <BackgroundTicker />
      
      {/* Floating Ambient Blobs */}
      <motion.div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 400, height: 400, top: '-10%', left: '-5%',
          background: 'radial-gradient(circle, rgba(61,71,212,0.12) 0%, transparent 70%)'
        }}
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 300, height: 300, bottom: '-5%', right: '-5%',
          background: 'radial-gradient(circle, rgba(255,77,28,0.08) 0%, transparent 70%)'
        }}
        animate={{ y: [0, 25, 0], x: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 250, height: 250, top: '10%', right: '10%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)'
        }}
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 200, height: 200, bottom: '15%', left: '5%',
          background: 'radial-gradient(circle, rgba(61,71,212,0.07) 0%, transparent 70%)'
        }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Decorative Corner SVGs */}
      <motion.div
        className="fixed pointer-events-none z-0"
        style={{ bottom: 40, right: 40, opacity: 0.06 }}
        animate={{ rotate: [0, 10, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
      >
        <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
          <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="4" fill="var(--color-btn-blue)" />
          </pattern>
          <rect width="80" height="80" fill="url(#gridPattern)" />
        </svg>
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-0"
        style={{ top: 80, right: 60, opacity: 0.06 }}
        animate={{ opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,40 L 20,20 L 40,30 L 60,5" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
        </svg>
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-0"
        style={{ top: '50%', left: 40, opacity: 0.06, y: '-50%' }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="12" width="24" height="24" transform="rotate(45 24 24)" stroke="var(--color-btn-blue)" strokeWidth="1.5" fill="none" />
        </svg>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col flex-1 h-full">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar links={navItems} title={SIDEBAR_TITLES[role] || 'Dashboard'} />
          <main className="flex-1 p-6 md:p-12 overflow-auto relative">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
