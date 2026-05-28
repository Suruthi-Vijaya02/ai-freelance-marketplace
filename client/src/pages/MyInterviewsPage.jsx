import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { interviewService } from '../services/authService';
import useRole from '../hooks/useRole';
import { getApiErrorMessage } from '../utils/helpers';

const statusColors = {
  scheduled: 'warning',
  accepted: 'success',
  declined: 'danger',
  completed: 'success',
  cancelled: 'danger',
};

export default function MyInterviewsPage() {
  const { isFreelancer } = useRole();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const updateStatus = async (id, status) => {
    try {
      await interviewService.updateStatus(id, { status });
      setInterviews((prev) => prev.map((iv) => (iv._id === id ? { ...iv, status } : iv)));
      toast.success(`Interview ${status}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await interviewService.getMyInterviews();
        setInterviews(data || []);
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">My Interviews</h1>
        <p className="text-muted mt-1 font-light">Scheduled video interviews with talent</p>
      </div>
      {interviews.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted">No interviews scheduled yet.</p>
          <Link to="/talent" className="inline-block mt-4">
            <Button size="sm">Browse Talent</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => (
            <Card key={iv._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-text">
                  {iv.freelancerId?.name || iv.clientId?.name || 'Interview'}
                </p>
                <p className="text-sm text-muted">
                  {new Date(iv.scheduledTime).toLocaleString()}
                  {iv.projectId?.title ? ` · ${iv.projectId.title}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge color={statusColors[iv.status] || 'muted'}>{iv.status}</Badge>
                {isFreelancer && iv.status === 'scheduled' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(iv._id, 'accepted')}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(iv._id, 'declined')}>Decline</Button>
                  </>
                )}
                <Link to={`/interview/${iv._id}`}>
                  <Button size="sm" variant="outline">Join Room</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
