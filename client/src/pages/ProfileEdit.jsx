import useRole from '../hooks/useRole';
import EditProfileFreelancer from '../components/profile/EditProfileFreelancer';
import EditProfileClient from '../components/profile/EditProfileClient';
import AdminDashboard from './AdminDashboard';

export default function ProfileEdit() {
  const { isFreelancer, isClient, isAdmin } = useRole();

  if (isAdmin) return <AdminDashboard section="settings" />;
  if (isFreelancer) return <EditProfileFreelancer />;
  if (isClient) return <EditProfileClient />;

  return <EditProfileFreelancer />;
}
