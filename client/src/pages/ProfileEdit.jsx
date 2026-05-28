import useRole from '../hooks/useRole';
import EditProfileFreelancer from '../components/profile/EditProfileFreelancer';
import EditProfileClient from '../components/profile/EditProfileClient';

export default function ProfileEdit() {
  const { isFreelancer, isClient } = useRole();

  if (isFreelancer) return <EditProfileFreelancer />;
  if (isClient) return <EditProfileClient />;

  return <EditProfileFreelancer />;
}
