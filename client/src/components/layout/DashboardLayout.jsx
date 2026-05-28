import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useRole from '../../hooks/useRole';
import Skeleton from '../ui/Skeleton';

const SIDEBAR_TITLES = {
  freelancer: 'Freelancer',
  client: 'Client',
  admin: 'Admin',
};

export default function DashboardLayout() {
  const { navItems, role, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar links={navItems} title={SIDEBAR_TITLES[role] || 'Dashboard'} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
