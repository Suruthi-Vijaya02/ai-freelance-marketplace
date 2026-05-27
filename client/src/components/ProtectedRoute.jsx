import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from './ui/Skeleton';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const redirect =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'freelancer'
        ? '/dashboard/freelancer'
        : '/dashboard/client';
    return <Navigate to={redirect} replace />;
  }

  return children;
}
