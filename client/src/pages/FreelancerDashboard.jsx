import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sparkles, TrendingUp, Clock, DollarSign, ArrowRight, FileText, AlertCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import MatchScoreBadge from '../components/ui/MatchScoreBadge';
import useRole from '../hooks/useRole';
import { projectService, paymentService, proposalService } from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';

export default function FreelancerDashboard() {
  const { user, profileValidation } = useRole();
  const [projects, setProjects] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0 });
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (signal) => {
    try {
      const [projectsRes, earningsRes, proposalsRes] = await Promise.all([
        projectService.getProjects({ status: 'open' }),
        paymentService.getMyEarnings().catch(() => ({ data: { total: 0 } })),
        proposalService.getMyProposals().catch(() => ({ data: [] })),
      ]);
      if (!signal?.aborted) {
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        setEarnings(earningsRes.data || { total: 0 });
        setProposals(Array.isArray(proposalsRes.data) ? proposalsRes.data : []);
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

  const matches = projects.slice(0, 5);
  const openProjects = projects.filter((p) => p.status === 'open');
  const activeProposals = proposals.filter((p) => p.status === 'pending');
  const avgMatch = matches.length
    ? Math.round(matches.reduce((s, p) => s + (p.matchScore || 0), 0) / matches.length)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-12 font-body"
    >
      <div>
        <h1 className="font-display">Freelancer Dashboard</h1>
        <p className="text-mid mt-2 text-lg">Welcome back, {user?.name}</p>
      </div>

      {!profileValidation.isComplete && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0" />
          <div>
            <p className="font-medium text-text">Complete your profile to apply for projects</p>
            <p className="text-sm text-muted mt-1">Missing: {profileValidation.missing.join(', ')}</p>
            <Link to="/profile/edit" className="inline-block mt-2">
              <Button size="sm">Complete Profile</Button>
            </Link>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Proposals', value: activeProposals.length, icon: FileText },
          { label: 'Total Earnings', value: formatCurrency(earnings.total || 0), icon: DollarSign },
          { label: 'Open Projects', value: openProjects.length, icon: TrendingUp },
          { label: 'Avg Match Score', value: `${avgMatch}%`, icon: Sparkles },
        ].map(({ label, value, icon: Icon }, index) => (
          <Card 
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.4 }}
          >
            <Icon className="w-[22px] h-[22px] text-accent mb-4" />
            <p className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.03em] text-btn-blue mb-1">{value}</p>
            <p className="text-[13px] text-mid font-medium">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-accent" />
            <h3 className="card-title">AI Match Feed</h3>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : matches.length === 0 ? (
            <p className="text-muted text-center py-8">No matching projects found. Check back soon!</p>
          ) : (
            <div className="space-y-4">
              {matches.map((m) => (
                <motion.div
                  key={m._id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border/60"
                >
                  <div>
                    <h3 className="font-medium text-text">{m.title}</h3>
                    <p className="text-sm text-muted">
                      {m.client?.name || 'Client'} · {m.category || 'Project'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {(m.skills || []).slice(0, 2).map((s) => (
                        <Badge key={s} color="muted">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <MatchScoreBadge score={m.matchScore} />
                    <p className="text-sm font-medium text-secondary mt-2">{formatCurrency(m.budget)}</p>
                    <Link to={`/projects/${m._id}`}>
                      <Button size="sm" variant="ghost" className="mt-2">
                        View <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-accent2" />
            <h3 className="card-title">Earnings</h3>
          </div>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : earnings.total > 0 ? (
            <>
              <p className="text-3xl font-black text-text">{formatCurrency(earnings.total)}</p>
              <p className="text-sm text-muted mt-1">Total released earnings</p>
              <Link to="/earnings">
                <Button variant="outline" size="sm" className="w-full mt-4">View Earnings</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted text-sm">No completed projects yet.</p>
              <Link to="/projects" className="inline-block mt-4">
                <Button size="sm">Browse Projects</Button>
              </Link>
            </>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="card-title mb-4">Active Proposals</h3>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : activeProposals.length === 0 ? (
          <p className="text-muted text-sm">No pending proposals.</p>
        ) : (
          <div className="space-y-3">
            {activeProposals.slice(0, 3).map((p) => (
              <div key={p._id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/60">
                <div>
                  <p className="font-medium text-text">{p.project?.title}</p>
                  <p className="text-sm text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {p.timeline} · {formatCurrency(p.price)}
                  </p>
                </div>
                <Badge color="warning">{p.status}</Badge>
              </div>
            ))}
            <Link to="/my-proposals">
              <Button variant="outline" size="sm">View All Proposals</Button>
            </Link>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
