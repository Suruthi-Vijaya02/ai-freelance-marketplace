import { Navigate } from 'react-router-dom';
import useRole from '../hooks/useRole';
import Skeleton from './ui/Skeleton';
import ForbiddenPage from '../pages/ForbiddenPage';

export function RoleGuard({ children, roles, fallback = 'redirect' }) {
  const { user, loading, dashboardPath, canAccess } = useRole();

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!canAccess(roles)) {
    if (fallback === '403') return <ForbiddenPage />;
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}

export function FreelancerOnly({ children, fallback }) {
  return <RoleGuard roles={['freelancer', 'admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function ClientOnly({ children, fallback }) {
  return <RoleGuard roles={['client', 'admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function AdminOnly({ children, fallback }) {
  return <RoleGuard roles={['admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function RoleBased({ renderFor, children, fallback }) {
  return <RoleGuard roles={[renderFor, 'admin']} fallback={fallback}>{children}</RoleGuard>;
}

export default RoleGuard;
