import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, PlusCircle, Users, MessageSquare, DollarSign,
  Settings, Sparkles, Wand2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import { projectService, proposalService } from '../services/authService';
import { formatCurrency, mapProposalToBid, getApiErrorMessage } from '../utils/helpers';

const aiDescription =
  'We are seeking an experienced full-stack developer to build an AI-powered recommendation engine for our global e-commerce platform. The ideal candidate will have expertise in Python, TensorFlow, and cloud deployment on AWS.';

export default function ClientDashboard() {
  const [projectForm, setProjectForm] = useState({ title: '', description: '', budget: '', skills: '' });
  const [projects, setProjects] = useState([]);
  const [matches, setMatches] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeProject = projects[0];
  const activeProjectId = activeProject?._id || activeProject?.id;

  const loadProjects = useCallback(async (signal) => {
    try {
      const { data } = await projectService.getMyProjects();
      if (!signal?.aborted) setProjects(Array.isArray(data) ? data : []);
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

  const generateDescription = () => {
    setProjectForm((f) => ({ ...f, description: aiDescription }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skills = projectForm.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await projectService.createProject({
        title: projectForm.title,
        description: projectForm.description,
        budget: Number(projectForm.budget),
        skills,
        category: 'General',
        duration: '8 weeks',
        status: 'open',
      });
      toast.success('Project posted successfully!');
      setProjectForm({ title: '', description: '', budget: '', skills: '' });
      await loadProjects();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">Client Dashboard</h1>
        <p className="text-muted mt-1 font-light">Manage projects and hire top talent</p>
      </div>

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <PlusCircle className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-text">Post a New Project</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Project title"
              placeholder="e.g. AI Recommendation Engine"
              value={projectForm.title}
              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
              required
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-text">Description</label>
                <Button type="button" size="sm" variant="secondary" onClick={generateDescription}>
                  <Wand2 className="w-4 h-4" /> AI Generate
                </Button>
              </div>
              <textarea
                rows={5}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Describe your project requirements..."
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Budget ($)"
                type="number"
                placeholder="15000"
                value={projectForm.budget}
                onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                required
              />
              <Input
                label="Required skills"
                placeholder="React, Node.js, AI"
                value={projectForm.skills}
                onChange={(e) => setProjectForm({ ...projectForm, skills: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              <Sparkles className="w-4 h-4" /> {submitting ? 'Posting...' : 'Post Project'}
            </Button>
          </form>
        </Card>

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
            <p className="text-muted text-sm">Post a project to see AI-matched freelancers.</p>
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
                  <Badge color="primary">{f.matchScore}%</Badge>
                  <Link to={`/profile/${f._id || f.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-bold text-text mb-4">
          Bid Tracker{activeProject ? ` — ${activeProject.title}` : ''}
        </h2>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : !activeProjectId ? (
          <p className="text-muted text-sm">No projects yet. Post your first project.</p>
        ) : proposals.length === 0 ? (
          <p className="text-muted text-sm">No proposals yet for this project.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-border">
                    <th className="text-left py-3 px-2">Freelancer</th>
                    <th className="text-left py-3 px-2">Bid</th>
                    <th className="text-left py-3 px-2">Timeline</th>
                    <th className="text-left py-3 px-2">Match</th>
                    <th className="text-left py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-surface/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <img src={p.avatar} alt="" className="w-8 h-8 rounded-full" />
                          <span className="text-text">{p.freelancerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-secondary font-medium">{formatCurrency(p.price)}</td>
                      <td className="py-3 px-2 text-muted">{p.timeline}</td>
                      <td className="py-3 px-2">
                        <Badge color="primary">{p.matchScore}%</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Link to={`/bidding/${activeProjectId}`}>
                          <Button size="sm">Review</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link to={`/bidding/${activeProjectId}`} className="inline-block mt-4">
              <Button variant="outline" size="sm">Open Live Bidding</Button>
            </Link>
          </>
        )}
      </Card>

      {projects.length > 0 && (
        <Card>
          <h2 className="font-bold text-text mb-4">Your Projects</h2>
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="block p-3 rounded-lg bg-surface border border-transparent hover:border-primary/30 transition-colors"
              >
                <span className="font-medium text-text">{p.title}</span>
                <span className="text-sm text-muted ml-2">· {formatCurrency(p.budget)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export const clientSidebarLinks = [
  { to: '/dashboard/client', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'My Projects', icon: PlusCircle },
  { to: '/bidding', label: 'Live Bidding', icon: Users },
  { to: '/workspace', label: 'Messages', icon: MessageSquare },
  { to: '/payments', label: 'Payments', icon: DollarSign },
  { to: '/admin', label: 'Settings', icon: Settings },
];
