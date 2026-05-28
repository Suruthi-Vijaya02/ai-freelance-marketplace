import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusCircle, Users, Sparkles, FolderKanban, DollarSign, UserCheck, AlertCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import MatchScoreBadge from '../components/ui/MatchScoreBadge';
import { projectService, proposalService, paymentService } from '../services/authService';
import { formatCurrency, mapProposalToBid, getApiErrorMessage } from '../utils/helpers';

export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [matches, setMatches] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeProject = projects[0];
  const activeProjectId = activeProject?._id || activeProject?.id;
  const activeProjects = projects.filter((p) => p.status === 'in_progress' || p.status === 'open');
  const hiredCount = projects.filter((p) => p.status === 'in_progress').length;

  const loadProjects = useCallback(async (signal) => {
    try {
      const [projectsRes, txRes] = await Promise.all([
        projectService.getMyProjects(),
        paymentService.getTransactions().catch(() => ({ data: [] })),
      ]);
      if (!signal?.aborted) {
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        const released = (txRes.data || []).filter((t) => t.status === 'released');
        setTotalSpent(released.reduce((s, t) => s + (t.amount || 0), 0));
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(getApiErrorMessage(err));
        toast.error(getApiErrorMessage(err));
      }
    }
  }, []);

  const loadMatchesAndProposals = useCallback(async (projectId, signal) => {
    if (!projectId) { setMatches([]); setProposals([]); return; }
    try {
      const [projectRes, proposalsRes] = await Promise.all([
        projectService.getProject(projectId),
        proposalService.getProposalsByProject(projectId),
      ]);
      if (signal?.aborted) return;
      setMatches(projectRes.data?.aiMatches || []);
      setProposals((proposalsRes.data || []).map(mapProposalToBid));
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    }
  }, []);

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

  const pendingProposals = proposals.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text">Client Dashboard</h1>
          <p className="text-muted mt-1 font-light">Manage projects and hire top talent</p>
        </div>
        <Link to="/create-project">
          <Button><PlusCircle className="w-4 h-4" /> Create Project</Button>
        </Link>
      </div>

      <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-secondary shrink-0" />
        <p className="text-sm text-muted">
          Add a payment method to post projects. Escrow payments are held securely until milestone approval.
        </p>
      </div>

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: activeProjects.length, icon: FolderKanban },
          { label: 'Total Spent', value: formatCurrency(totalSpent), icon: DollarSign },
          { label: 'Pending Proposals', value: pendingProposals, icon: Users },
          { label: 'Hired Freelancers', value: hiredCount, icon: UserCheck },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <Icon className="w-6 h-6 text-primary mb-2" />
            <p className="text-2xl font-black text-text">{value}</p>
            <p className="text-sm text-muted font-light">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-secondary" />
            <h2 className="font-bold text-text">AI Freelancer Matches</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !activeProjectId ? (
            <div className="text-center py-6">
              <p className="text-muted text-sm">Post a project to see AI-matched freelancers.</p>
              <Link to="/create-project" className="inline-block mt-3">
                <Button size="sm">Create Project</Button>
              </Link>
            </div>
          ) : matches.length === 0 ? (
            <p className="text-muted text-sm">No freelancer matches yet for this project.</p>
          ) : (
            <div className="space-y-4">
              {matches.slice(0, 4).map((f) => (
                <motion.div
                  key={f._id || f.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-surface border border-border/50"
                >
                  <img
                    src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.name}`}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text truncate">{f.name}</h3>
                    <p className="text-sm text-muted truncate">{f.title}</p>
                  </div>
                  <MatchScoreBadge score={f.matchScore} />
                  <Link to={`/profile/${f._id || f.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </motion.div>
              ))}
              <Link to="/talent">
                <Button variant="outline" size="sm" className="w-full">Browse Talent</Button>
              </Link>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-text">
              Proposals{activeProject ? ` — ${activeProject.title}` : ''}
            </h2>
          </div>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : !activeProjectId ? (
            <p className="text-muted text-sm">No projects yet.</p>
          ) : proposals.length === 0 ? (
            <p className="text-muted text-sm">No proposals yet for this project.</p>
          ) : (
            <>
              <div className="space-y-3">
                {proposals.slice(0, 4).map((p) => (
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
                ))}
              </div>
              <Link to={`/bidding/${activeProjectId}`} className="inline-block mt-4">
                <Button variant="outline" size="sm">Manage Proposals</Button>
              </Link>
            </>
          )}
        </Card>
      </div>

      {projects.length > 0 && (
        <Card>
          <h2 className="font-bold text-text mb-4">Your Projects</h2>
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-transparent hover:border-primary/30 transition-colors"
              >
                <span className="font-medium text-text">{p.title}</span>
                <div className="flex items-center gap-2">
                  <Badge color={p.status === 'open' ? 'success' : 'warning'}>{p.status}</Badge>
                  <span className="text-sm text-muted">{formatCurrency(p.budget)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
