import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Filter, Briefcase, Clock, DollarSign, Users } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import MatchScoreBadge from '../components/ui/MatchScoreBadge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import LoginModal from '../components/ui/LoginModal';
import { useProtectedAction } from '../hooks/useProtectedAction';
import useRole from '../hooks/useRole';
import { projectService, proposalService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';
import BrowseHero from '../assets/img2.png';
import { fadeInUp, floatHero, heroReveal, pageFade, stagger } from '../utils/motionVariants';

export default function ProjectsPage() {
  const { requireAuth, showLoginModal, closeLoginModal, isAuthenticated } = useProtectedAction();
  const { isClient, isFreelancer } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || (isFreelancer ? 'browse' : (isClient ? 'mine' : 'browse'));
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const loadProjects = useCallback(async (signal) => {
    try {
      setLoading(true);
      let data;
      if (tab === 'mine' && isClient) {
        const res = await projectService.getMyProjects();
        data = res.data;
      } else if (tab === 'hired') {
        const res = await projectService.getHiredProjects();
        data = res.data;
      } else if (tab === 'applied') {
        const res = await proposalService.getMyProposals();
        data = (res.data || []).map((p) => p.project).filter(Boolean);
      } else {
        const params = {};
        if (search) params.search = search;
        if (status && status !== 'all') params.status = status;
        else if (!status) params.status = 'open';
        const res = await projectService.getProjects(params);
        data = res.data;
      }
      if (!signal?.aborted) setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [search, status, isClient, isFreelancer, tab]);

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  const statusMap = {
    open: 'success',
    in_progress: 'warning',
  };

  let projectListContent = null;
  if (loading) {
    projectListContent = (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52" />)}
      </div>
    );
  } else if (projects.length === 0) {
    projectListContent = (
      <div className="text-center py-20">
        <Briefcase className="w-12 h-12 text-muted mx-auto mb-4" />
        <p className="text-muted text-lg">No projects found.</p>
      </div>
    );
  } else {
    projectListContent = (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <motion.div key={p._id} whileHover={{ y: -2 }}>
            <Card hover className="h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <Badge color={statusMap[p.status] || 'muted'}>
                  {(p.status || 'open').replace('_', ' ')}
                </Badge>
                {p.matchScore > 0 && <MatchScoreBadge score={p.matchScore} />}
              </div>

              <h3 className="font-semibold text-text mb-2 line-clamp-2 flex-1">{p.title}</h3>
              <p className="text-sm text-muted line-clamp-2 mb-4 font-light">{p.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(p.skills || []).slice(0, 3).map((s) => (
                  <Badge key={s} color="muted">{s}</Badge>
                ))}
                {p.skills?.length > 3 && (
                  <Badge color="muted">+{p.skills.length - 3}</Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-muted mb-4">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-secondary" />
                  {formatCurrency(p.budget)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {p.duration || '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {p.proposalsCount ?? 0} bids
                </span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                <span className="text-xs text-muted">{formatDate(p.createdAt)}</span>
                {isAuthenticated ? (
                  <Link to={`/projects/${p._id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                ) : (
                  <Button size="sm" onClick={() => requireAuth(`/projects/${p._id}`)}>
                    View Details
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <LoginModal open={showLoginModal} onClose={closeLoginModal} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={pageFade}
          className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-center rounded-[2rem] bg-white/80 border border-white/20 p-6 shadow-2xl overflow-hidden"
        >
          <motion.div variants={heroReveal} className="space-y-4 max-w-xl">
            <Badge color="secondary">Browse Projects</Badge>
            <h1 className="font-display text-4xl">Find the next high-value project.</h1>
            <p className="text-mid max-w-2xl">Explore curated work requests with a calm, editorial lens. Discover roles that match your expertise, review briefs, and begin your next conversation without distraction.</p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link to="/projects?tab=browse"><Button>Browse Open Work</Button></Link>
              <Link to="/projects?tab=applied"><Button variant="outline">View Applied</Button></Link>
            </div>
          </motion.div>
          <motion.div className="flex justify-center">
            <motion.img
              src={BrowseHero}
              alt="Browse projects"
              className="w-full max-w-[520px] rounded-[2rem] shadow-2xl border border-white/20"
            />
          </motion.div>
        </motion.section>

        <div className="mb-8">
          <h1 className="text-text">
            {tab === 'mine' ? 'My Posted Projects' : tab === 'applied' ? 'Applied Projects' : tab === 'hired' ? 'Hired Projects' : 'Browse Projects'}
          </h1>
          <p className="text-muted mt-1 font-light">
            {tab === 'mine'
              ? 'Manage your posted projects and review proposals'
              : 'Browse open work, track applications, and hired projects'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(isFreelancer
            ? [
                { id: 'browse', label: 'Browse Projects' },
                { id: 'applied', label: 'Applied Projects' },
                { id: 'hired', label: 'Hired Projects' },
              ]
            : isClient
            ? [
                { id: 'mine', label: 'My Posted Projects' },
                { id: 'browse', label: 'Browse All Projects' },
              ]
            : [{ id: 'browse', label: 'Browse Projects' }]
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSearchParams({ tab: id })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                tab === id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              disabled={tab !== 'browse' && tab !== 'mine'}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60"
            />
          </div>
          {(tab === 'browse' || tab === 'mine') && (
            <>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2.5 bg-card border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Open only</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="all">All Statuses</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4" /> Filters
              </Button>
            </>
          )}
        </div>

        {projectListContent}
      </main>
      <Footer />
    </div>
  );
}
