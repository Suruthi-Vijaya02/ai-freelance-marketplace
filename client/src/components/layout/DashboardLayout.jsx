import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ sidebarLinks, sidebarTitle }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar links={sidebarLinks} title={sidebarTitle} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
