import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import useRole from '../../hooks/useRole';
import Skeleton from '../ui/Skeleton';

function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.025] z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

export default function DashboardLayout() {
  const { loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ede9f8] p-12 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ede9f8] font-body relative overflow-hidden">
      <NoiseOverlay />

      {/* Single subtle ambient gradient — not 4 blobs */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          width: 600,
          height: 600,
          top: '-10%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(61,71,212,0.06) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col flex-1 h-full">
        <Navbar />
        <main className="flex-1 px-6 md:px-10 lg:px-16 py-8 md:py-12 overflow-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}