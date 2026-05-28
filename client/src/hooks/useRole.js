import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ROLES,
  hasRole,
  isFreelancer,
  isClient,
  isAdmin,
  getDashboardPath,
  getNavItems,
  canAccessRoute,
  validateFreelancerProfile,
  isProjectOwner,
} from '../utils/permissions';

export default function useRole() {
  const { user, loading, isAuthenticated } = useAuth();

  return useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      role: user?.role,
      ROLES,
      hasRole: (...roles) => hasRole(user, ...roles),
      isFreelancer: isFreelancer(user),
      isClient: isClient(user),
      isAdmin: isAdmin(user),
      dashboardPath: getDashboardPath(user?.role),
      navItems: getNavItems(user?.role),
      canAccess: (allowedRoles) => canAccessRoute(user, allowedRoles),
      profileValidation: user?.role === ROLES.FREELANCER ? validateFreelancerProfile(user) : { isComplete: true, missing: [] },
      isProjectOwner: (project) => isProjectOwner(user, project),
    }),
    [user, loading, isAuthenticated]
  );
}
