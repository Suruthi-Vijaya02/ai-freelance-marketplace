import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
// lightweight imports kept minimal for workspace UI
import useRole from '../hooks/useRole';
import { proposalService, contractService, interviewService } from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';
import HeroImg from '../assets/img1.png';

export default function FreelancerDashboard() {
  const { user, profileValidation } = useRole();
  // Projects list not required in editorial workspace view
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (signal) => {
    try {
      const [proposalsRes, contractsRes, interviewsRes] = await Promise.all([
        proposalService.getMyProposals().catch(() => ({ data: [] })),
        contractService.getMyContracts().catch(() => ({ data: [] })),
        interviewService.getMyInterviews().catch(() => ({ data: [] })),
      ]);
      if (!signal?.aborted) {
        setProposals(Array.isArray(proposalsRes.data) ? proposalsRes.data : []);
        setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
        setInterviews(Array.isArray(interviewsRes.data) ? interviewsRes.data : []);
      }
    } catch (err) {
      if (!signal?.aborted) {
        const msg = getApiErrorMessage(err);
        setError(msg);
        toast.error(msg);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      await loadData(controller.signal);
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [loadData]);

  const activeProposals = proposals.filter((p) => p.status === 'pending');
  const activeContracts = contracts.filter((c) => c.status === 'active');
  const upcomingInterviews = interviews.filter((i) => 
    ['scheduled', 'accepted'].includes(i.status) && new Date(i.scheduledTime) > new Date()
  ).sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

  // Compose section contents to avoid nested ternaries in JSX
  let activeContractsContent;
  if (loading) activeContractsContent = <Skeleton className="h-20" />;
  else if (activeContracts.length === 0) activeContractsContent = <p className="text-muted">No active contracts. Start by submitting proposals.</p>;
  else activeContractsContent = activeContracts.map((c) => (
    <div key={c._id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/60">
      <div>
        <p className="font-medium text-text">{c.project?.title || 'Contract'}</p>
        <p className="text-sm text-muted">{formatCurrency(c.amount)}</p>
      </div>
      <Badge color="success">{c.status}</Badge>
    </div>
  ));

  let proposalActivityContent;
  if (loading) proposalActivityContent = <Skeleton className="h-20" />;
  else if (activeProposals.length === 0) proposalActivityContent = <p className="text-muted">No active proposals.</p>;
  else proposalActivityContent = activeProposals.slice(0,4).map((p) => (
    <div key={p._id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/60">
      <div>
        <p className="font-medium text-text">{p.project?.title}</p>
        <p className="text-sm text-muted">{p.timeline} · {formatCurrency(p.price)}</p>
      </div>
      <Badge color="warning">{p.status}</Badge>
    </div>
  ));

  let upcomingInterviewsContent;
  if (loading) upcomingInterviewsContent = <Skeleton className="h-20" />;
  else if (upcomingInterviews.length === 0) upcomingInterviewsContent = <p className="text-muted">No upcoming interviews scheduled.</p>;
  else upcomingInterviewsContent = upcomingInterviews.slice(0,4).map((iv) => (
    <div key={iv._id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/60">
      <div>
        <p className="font-medium text-text">{iv.projectId?.title || iv.clientId?.name}</p>
        <p className="text-sm text-muted">{new Date(iv.scheduledTime).toLocaleString()}</p>
      </div>
      <Badge color={iv.status === 'accepted' ? 'success' : 'warning'}>{iv.status}</Badge>
    </div>
  ));

  let recentConversationsContent;
  if (loading) recentConversationsContent = <Skeleton className="h-16" />;
  else recentConversationsContent = proposals.slice(0,3).map((p) => (
    <Link key={p._id} to={`/messages/${p._id}`} className="block p-2 rounded-md hover:bg-surface transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-text">{p.project?.title}</p>
          <p className="text-sm text-muted">{p.freelancerName || ''}</p>
        </div>
        <span className="text-xs text-mid">{p.status}</span>
      </div>
    </Link>
  ));
  // avgMatch not used in editorial layout

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-10 font-body"
    >
      {/* Hero - large visual anchor with img1 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <h1 className="font-display text-4xl">Welcome back, {user?.name}</h1>
          <p className="text-mid max-w-2xl">This is your professional workspace — where you build your career, manage active work, and move proposals to signed contracts. Your recent activity and next steps live here.</p>

          {!profileValidation.isComplete && (
            <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0" />
              <div>
                <p className="font-medium text-text">Complete your profile to increase discoverability</p>
                <p className="text-sm text-muted mt-1">Missing: {profileValidation.missing.join(', ')}</p>
                <Link to="/profile/edit" className="inline-block mt-3">
                  <Button size="sm">Complete Profile</Button>
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Link to="/projects">
              <Button size="md">Browse Projects</Button>
            </Link>
            <Link to="/my-proposals" className="ml-2">
              <Button variant="outline" size="md">My Proposals</Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-end">
          <motion.img
            src={HeroImg}
            alt="Hero"
            className="w-full max-w-[520px] rounded-3xl shadow-2xl"
            initial={{ y: 12, scale: 0.98, opacity: 0, rotate: -1 }}
            whileInView={{ y: [0, -10, 0], rotate: [-1, 1, -1], scale: [1, 1.03, 1], opacity: 1 }}
            whileHover={{ scale: 1.03, rotate: 0, y: -6 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 7.5, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </section>

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Editorial sections - asymmetrical layout */}
      <section className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <motion.div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Active Contracts</h3>
            <p className="text-sm text-muted mt-2">Work you're delivering now — quick access to tasks and milestones.</p>
            <div className="mt-4 space-y-3">
              {activeContractsContent}
            </div>
          </motion.div>

          <motion.div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Proposal Activity</h3>
            <p className="text-sm text-muted mt-2">Recent proposals and next actions.</p>
            <div className="mt-4 space-y-3">
              {proposalActivityContent}
            </div>
          </motion.div>
        </div>

        <aside className="lg:col-span-3 space-y-6">
          <motion.div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Upcoming Interviews</h3>
            <div className="mt-3 space-y-3">
              {upcomingInterviewsContent}
            </div>
            <Link to="/interviews" className="block mt-4">
              <Button variant="outline" size="sm">See all interviews</Button>
            </Link>
          </motion.div>

          <motion.div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Recent Conversations</h3>
            <div className="mt-3 space-y-3">
              {recentConversationsContent}
            </div>
            <Link to="/messages" className="block mt-4">
              <Button variant="outline" size="sm">Open messages</Button>
            </Link>
            <div className="mt-3 flex gap-2">
              <Link to="/earnings"><Button variant="ghost" size="sm">Earnings</Button></Link>
              <Link to="/contracts"><Button variant="ghost" size="sm">Contracts</Button></Link>
            </div>
          </motion.div>
        </aside>
      </section>
    </motion.div>
  );
}