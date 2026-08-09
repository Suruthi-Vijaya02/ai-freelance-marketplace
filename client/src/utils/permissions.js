import {
  LayoutDashboard,
  Briefcase,
  FileText,
  DollarSign,
  MessageSquare,
  Users,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Scale,
  FolderKanban,
  Calendar,
} from 'lucide-react';

export const ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin',
};

export function hasRole(user, ...roles) {
  if (!user?.role) return false;
  return roles.includes(user.role);
}

export function isFreelancer(user) {
  // Support legacy role mapping: developer => freelancer
  return hasRole(user, ROLES.FREELANCER) || user?.role === 'developer';
}

export function isClient(user) {
  return hasRole(user, ROLES.CLIENT);
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

export function getDashboardPath(role) {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.FREELANCER:
      return '/dashboard/freelancer';
    case ROLES.CLIENT:
      return '/dashboard/client';
    default:
      return '/';
  }
}

export function canAccessRoute(user, allowedRoles) {
  if (!allowedRoles?.length) return true;
  if (!user) return false;
  if (isAdmin(user)) return allowedRoles.includes(ROLES.ADMIN) || allowedRoles.includes(user.role);
  return allowedRoles.includes(user.role);
}

const NAV_CONFIG = {
  freelancer: [
    { to: '/dashboard/freelancer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/projects?tab=browse', label: 'Browse Projects', icon: Briefcase },
    { to: '/projects?tab=applied', label: 'Applied', icon: FolderKanban },
    { to: '/projects?tab=hired', label: 'Hired', icon: Briefcase },
    { to: '/my-proposals', label: 'My Proposals', icon: FileText },
    { to: '/earnings', label: 'Earnings', icon: DollarSign },
    { to: '/contracts', label: 'Contracts', icon: FolderKanban },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/interviews', label: 'Interviews', icon: Calendar },
  ],
  client: [
    { to: '/dashboard/client', label: 'Workspace', icon: LayoutDashboard, end: true },
    { to: '/dashboard/client/talents', label: 'Talents', icon: Users },
    { to: '/dashboard/client/interviews', label: 'Interviews', icon: Calendar },
    { to: '/dashboard/client/contracts', label: 'Contracts', icon: FolderKanban },
    { to: '/dashboard/client/proposals', label: 'Proposals', icon: FileText },
    { to: '/dashboard/client/messages', label: 'Messages', icon: MessageSquare },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/projects', label: 'Projects', icon: Briefcase },
    { to: '/admin/transactions', label: 'Transactions', icon: CreditCard },
    { to: '/admin/fraud', label: 'Fraud Alerts', icon: AlertTriangle },
    { to: '/admin/disputes', label: 'Disputes', icon: Scale },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};

export function getNavItems(role) {
  return NAV_CONFIG[role] || NAV_CONFIG.client;
}

export function getMatchScoreColor(score) {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

export function getAvailabilityBadge(status) {
  switch (status) {
    case 'full-time':
      return { label: 'Available', color: 'success' };
    case 'part-time':
      return { label: 'Part-time', color: 'warning' };
    case 'not-available':
      return { label: 'Not Available', color: 'danger' };
    default:
      return { label: 'Available', color: 'success' };
  }
}

export function validateFreelancerProfile(user) {
  const errors = [];
  if (!user?.title?.trim()) errors.push('Professional title');
  if (!user?.bio || user.bio.length < 50) errors.push('Bio (min 50 characters)');
  if (!user?.hourlyRate || user.hourlyRate <= 0) errors.push('Hourly rate');
  if (!user?.skills || user.skills.length < 3) errors.push('At least 3 skills');
  if (!user?.availability?.timezone) errors.push('Timezone');
  return {
    isComplete: errors.length === 0,
    missing: errors,
  };
}

export function isProjectOwner(user, project) {
  if (!user || !project) return false;
  const clientId = project.client?._id || project.client;
  const userId = user._id || user.id;
  return clientId?.toString() === userId?.toString();
}
