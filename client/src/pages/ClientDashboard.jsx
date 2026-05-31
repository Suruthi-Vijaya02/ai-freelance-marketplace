import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import MatchScoreBadge from '../components/ui/MatchScoreBadge';
import { projectService, proposalService, interviewService } from '../services/authService';
import { formatCurrency, mapProposalToBid, getApiErrorMessage } from '../utils/helpers';
import ClientHero from '../assets/img5.png';

export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeProject = projects[0];
  const activeProjectId = activeProject?._id || activeProject?.id;
  const upcomingInterviews = interviews.filter((i) => 
    ['scheduled', 'accepted'].includes(i.status) && new Date(i.scheduledTime) > new Date()
  ).sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

  const loadProjects = useCallback(async (signal) => {
    try {
      const [projectsRes, interviewsRes] = await Promise.all([
        projectService.getMyProjects(),
        interviewService.getMyInterviews().catch(() => ({ data: [] })),
      ]);
      if (!signal?.aborted) {
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        setInterviews(Array.isArray(interviewsRes.data) ? interviewsRes.data : []);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(getApiErrorMessage(err));
        toast.error(getApiErrorMessage(err));
      }
    }
  }, []);

  const loadMatchesAndProposals = useCallback(async (projectId, signal) => {
    if (!projectId) { setProposals([]); return; }
    try {
      const proposalsRes = await proposalService.getProposalsByProject(projectId);
      if (signal?.aborted) return;
      setProposals((proposalsRes.data || []).map(mapProposalToBid));
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    }
  }, []);

  // Precompute contents to avoid nested ternaries
  let projectsContent;
  if (loading) projectsContent = <Skeleton className="h-20" />;
  else if (projects.length === 0) projectsContent = <p className="text-muted">No projects yet. Create a project to start receiving proposals.</p>;
  else projectsContent = projects.map((p) => (
    <Link
      key={p._id}
      to={`/projects/${p._id}`}
      className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/40"
    >
      <div>
        <p className="font-medium text-text">{p.title}</p>
        <p className="text-sm text-muted">{p.shortDescription || ''}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge color={p.status === 'open' ? 'success' : 'warning'}>{p.status}</Badge>
        <span className="text-sm text-muted">{formatCurrency(p.budget)}</span>
      </div>
    </Link>
  ));

  let proposalsContent;
  if (loading) proposalsContent = <Skeleton className="h-20" />;
  else if (proposals.length === 0) proposalsContent = <p className="text-muted">No proposals yet.</p>;
  else proposalsContent = proposals.slice(0,4).map((p) => (
    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/50">
      <div className="flex items-center gap-2">
        <img src={p.avatar} alt="" className="w-8 h-8 rounded-full" />
        <div>
          <p className="text-text text-sm font-medium">{p.freelancerName}</p>
          <p className="text-xs text-muted">{formatCurrency(p.price)} · {p.timeline}</p>
        </div>
      </div>
      <MatchScoreBadge score={p.matchScore} />
    </div>
  ));

  let interviewsContent;
  if (loading) interviewsContent = <Skeleton className="h-20" />;
  else if (upcomingInterviews.length === 0) interviewsContent = <p className="text-muted">No interviews scheduled.</p>;
  else interviewsContent = upcomingInterviews.slice(0,4).map((iv) => (
    <div key={iv._id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/60">
      <div>
        <p className="font-medium text-text">{iv.freelancerId?.name || 'Interview'}</p>
        <p className="text-sm text-muted">{new Date(iv.scheduledTime).toLocaleString()}</p>
      </div>
      <Badge color={iv.status === 'accepted' ? 'success' : 'warning'}>{iv.status}</Badge>
    </div>
  ));

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      await loadProjects(controller.signal);
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [loadProjects]);

  useEffect(() => {
    const controller = new AbortController();
    loadMatchesAndProposals(activeProjectId, controller.signal);
    return () => controller.abort();
  }, [activeProjectId, loadMatchesAndProposals]);

  // pendingProposals not used in editorial layout

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-10 font-body"
    >
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <h1 className="font-display text-4xl">Hiring Command Center</h1>
          <p className="text-mid max-w-2xl">Oversee open projects, review proposals, and move top talent through interviews to signed contracts. This is your executive view for hiring.</p>
          <div className="flex items-center gap-3 mt-6">
            <Link to="/projects">
              <Button variant="outline" size="sm"><ChevronLeft className="w-4 h-4" /> Back to Browse</Button>
            </Link>
            <Link to="/create-project">
              <Button><PlusCircle className="w-4 h-4" /> Create Project</Button>
            </Link>
            <Link to="/talent">
              <Button variant="outline">Browse Talent</Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-end">
          <motion.img
            src={ClientHero}
            alt="Client hero"
            className="w-full max-w-[520px] rounded-3xl shadow-2xl"
            initial={{ y: 14, opacity: 0, scale: 0.98, rotate: 1 }}
            whileInView={{ y: [0, -8, 0], rotate: [1, -1, 1], scale: [1, 1.03, 1], opacity: 1 }}
            whileHover={{ scale: 1.04, rotate: 0, y: -6 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 8, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </section>

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Editorial sections */}
      <section className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Open Projects</h3>
            <p className="text-sm text-muted mt-2">Projects you're actively hiring for.</p>
            <div className="mt-4 space-y-3">
              {projectsContent}
            </div>
          </div>

          <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Proposal Review</h3>
            <p className="text-sm text-muted mt-2">A curated list of proposals needing your attention.</p>
            <div className="mt-4 space-y-3">
              {proposalsContent}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Interview Pipeline</h3>
            <div className="mt-3 space-y-3">
              {interviewsContent}
            </div>
            <Link to="/interviews" className="block mt-4">
              <Button variant="outline" size="sm">Manage interviews</Button>
            </Link>
          </div>

          <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-white/10 shadow-lg">
            <h3 className="card-title">Contract Workflow</h3>
            <p className="text-sm text-muted mt-2">Draft, send, and sign contracts directly from your workspace.</p>
            <div className="mt-4 space-y-2">
              <Link to="/contracts" className="block p-3 rounded-lg bg-surface border border-border/60">View contracts</Link>
              <Link to="/payments" className="block p-3 rounded-lg bg-surface border border-border/60">Payments & escrow</Link>
            </div>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}
