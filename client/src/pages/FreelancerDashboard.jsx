import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Briefcase, MessageSquare, DollarSign, User,
  Sparkles, TrendingUp, Clock, Star, ArrowRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { projectService, paymentService } from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (signal) => {
    try {
      const [projectsRes, earningsRes] = await Promise.all([
        projectService.getProjects({ status: 'open' }),
        paymentService.getMyEarnings().catch(() => ({ data: { total: 0 } })),
      ]);
      if (!signal?.aborted) {
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
        setEarnings(earningsRes.data || { total: 0 });
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
  const activeProjects = projects.filter((p) => p.status === 'in_progress');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">Freelancer Dashboard</h1>
        <p className="text-muted mt-1 font-light">Your AI-powered workspace</p>
      </div>

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-text">AI Match Feed</h2>
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
                    <Badge color="primary">{m.matchScore ?? 0}% match</Badge>
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
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-secondary" />
            <h2 className="font-bold text-text">Earnings</h2>
          </div>
          <p className="text-3xl font-black text-text">{formatCurrency(earnings.total || 0)}</p>
          <p className="text-sm text-muted mt-1">Total released earnings</p>
          <Link to={projects[0]?._id ? `/payments/${projects[0]._id}` : '#'}>
            <Button variant="outline" size="sm" className="w-full mt-4">View Payments</Button>
          </Link>
        </Card>
      </div>

      <Card>
        <h2 className="font-bold text-text mb-4">Project Recommendations</h2>
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : openProjects.length === 0 ? (
          <p className="text-muted text-sm">No open projects available right now.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {openProjects.slice(0, 2).map((p) => (
              <div key={p._id} className="p-4 rounded-lg bg-surface border border-border/60">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-text">{p.title}</h3>
                  <Badge color="secondary">AI Pick</Badge>
                </div>
                <p className="text-sm text-muted mt-1 line-clamp-2 font-light">{p.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-secondary font-medium">{formatCurrency(p.budget)}</span>
                  <Link to={`/projects/${p._id}`}>
                    <Button size="sm">Apply</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-bold text-text mb-4">Active Projects</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : activeProjects.length === 0 ? (
          <p className="text-muted text-sm">No active projects yet.</p>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((p) => (
              <div key={p._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-surface border border-border/60">
                <div className="flex-1">
                  <h3 className="font-medium text-text">{p.title}</h3>
                  <p className="text-sm text-muted">{p.client?.name || 'Client'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {p.duration || 'In progress'}
                    </span>
                  </div>
                </div>
                <Link to="/workspace">
                  <Button variant="outline" size="sm">Workspace</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export const freelancerSidebarLinks = [
  { to: '/dashboard/freelancer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Find Work', icon: Briefcase },
  { to: '/bidding', label: 'Live Bidding', icon: Star },
  { to: '/workspace', label: 'Messages', icon: MessageSquare },
  { to: '/payments', label: 'Payments', icon: DollarSign },
  { to: '/profile', label: 'Profile', icon: User },
];
