import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { interviewService } from '../services/authService';
import useRole from '../hooks/useRole';
import { getApiErrorMessage } from '../utils/helpers';
import InterviewHero from '../assets/img3.png';
import { fadeInUp, floatHero, heroReveal, pageFade } from '../utils/motionVariants';

const statusColors = {
  scheduled: 'warning',
  accepted: 'success',
  declined: 'danger',
  completed: 'success',
  cancelled: 'danger',
};

export default function MyInterviewsPage() {
  const { isFreelancer, user } = useRole();
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
      <div className="p-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={pageFade} className="space-y-10 pb-12">
      <motion.section variants={heroReveal} className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center rounded-[2rem] bg-white/80 border border-white/20 p-6 shadow-2xl overflow-hidden">
        <div className="space-y-4 max-w-xl">
          <Badge color="secondary">Interviews</Badge>
          <h1 className="font-display text-4xl">
            {isFreelancer ? 'Your Interview Schedule' : 'Prepare for your next conversation.'}
          </h1>
          <p className="text-mid max-w-2xl">
            {isFreelancer
              ? 'Keep track of your upcoming interviews with clients and manage your availability.'
              : 'See upcoming interviews, confirm availability, and keep your hiring rhythm smooth with a dedicated interview workspace.'}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/contracts"><Button>{isFreelancer ? 'My Contracts' : 'Review Contracts'}</Button></Link>
            <Link to="/messages"><Button variant="outline">Open Messages</Button></Link>
          </div>
        </div>
        <motion.div className="flex justify-center">
          <motion.img
            src={InterviewHero}
            alt="Interview workflow"
            className="w-full max-w-[520px] rounded-[2rem] shadow-2xl border border-white/20"

          />
        </motion.div>
      </motion.section>

      <div>
        <h2 className="text-2xl font-black text-text">
          {isFreelancer ? 'My Upcoming Interviews' : 'My Interviews'}
        </h2>
        <p className="text-muted mt-1 font-light">
          {isFreelancer ? 'Scheduled interviews with clients' : 'Scheduled video interviews with talent'}
        </p>
      </div>

      {interviews.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-muted text-lg font-medium">No upcoming interviews.</p>
          {!isFreelancer && (
            <Link to="/talent" className="inline-block mt-4">
              <Button size="sm">Browse Talent</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const partner = isFreelancer ? iv.clientId : iv.freelancerId;
            return (
              <Card key={iv._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <img
                    src={partner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner?.name || 'user'}`}
                    alt=""
                    className="w-12 h-12 rounded-full border border-border"
                  />
                  <div>
                    <p className="font-bold text-text">
                      {partner?.name || 'Partner'}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(iv.scheduledTime).toLocaleString()}
                      {iv.projectId?.title ? ` · ${iv.projectId.title}` : ''}
                    </p>
                  </div>
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
                    <Button size="sm" variant="outline" className="font-bold">Join Room</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
