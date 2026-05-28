import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import Button from '../components/ui/Button';
import useRole from '../hooks/useRole';

export default function ForbiddenPage() {
  const { dashboardPath } = useRole();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <ShieldOff className="w-16 h-16 text-muted mb-4" />
      <h1 className="text-2xl font-black text-text">Access Denied</h1>
      <p className="text-muted mt-2 max-w-md font-light">
        You don&apos;t have permission to view this page. This area is restricted to specific account types.
      </p>
      <Link to={dashboardPath} className="mt-6">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
