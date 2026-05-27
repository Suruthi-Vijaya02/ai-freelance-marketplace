import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wand2, Clock, DollarSign, Users, ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { projectService, proposalService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';

const aiProposal =
  'Dear Client,\n\nI am excited to propose my services for this project. With extensive experience in this domain, I bring the expertise needed to deliver on time and on budget.\n\nBest regards';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proposal, setProposal] = useState({ price: '', timeline: '', coverLetter: '' });

  const loadData = useCallback(async (signal) => {
    if (!id) return;
    try {
      setLoading(true);
      setNotFound(false);
      const [projectRes, proposalsRes] = await Promise.all([
        projectService.getProject(id),
        proposalService.getProposalsByProject(id),
      ]);
      if (signal?.aborted) return;
      setProject(projectRes.data?.project || projectRes.data);
      setProposals(proposalsRes.data || []);
    } catch (err) {
      if (signal?.aborted) return;
      if (err?.response?.status === 404 || err?.response?.status === 400) {
        setNotFound(true);
      } else {
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const generateProposal = () => {
    if (!project) return;
    setProposal({
      price: String(Math.max(0, project.budget - 500)),
      timeline: project.duration || '8 weeks',
      coverLetter: aiProposal,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in as a freelancer to submit a proposal');
      return;
    }
    setSubmitting(true);
    try {
      await proposalService.submitProposal({
        project: id,
        price: Number(proposal.price),
        timeline: proposal.timeline,
        coverLetter: proposal.coverLetter,
      });
      toast.success('Proposal submitted!');
      setProposal({ price: '', timeline: '', coverLetter: '' });
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8 w-full space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-text">Project not found</h1>
          <p className="text-muted mt-2">This project may have been removed or the ID is invalid.</p>
          <Link to="/projects" className="inline-block mt-6">
            <Button>Browse Projects</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const clientName = project.client?.name || project.clientName || 'Client';

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <Link to="/projects" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {project.category && <Badge color="secondary">{project.category}</Badge>}
                <Badge color={project.status === 'open' ? 'success' : 'warning'}>
                  {(project.status || 'open').replace('_', ' ')}
                </Badge>
              </div>
              <h1 className="text-3xl font-black text-text">{project.title}</h1>
              <p className="text-muted mt-2 font-light">
                Posted by {clientName} · {formatDate(project.createdAt || project.postedAt)}
              </p>
            </div>

            <Card>
              <h2 className="font-bold text-text mb-3">Project Description</h2>
              <p className="text-muted leading-relaxed font-light">{project.description}</p>
            </Card>

            <Card>
              <h2 className="font-bold text-text mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(project.skills || []).map((s) => (
                  <Badge key={s} color="primary">{s}</Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="font-bold text-text mb-3">Proposals ({proposals.length})</h2>
              {proposals.length === 0 ? (
                <p className="text-muted text-sm">No proposals yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {proposals.slice(0, 5).map((p) => (
                    <li key={p._id} className="flex justify-between text-muted">
                      <span>{p.freelancer?.name || 'Freelancer'}</span>
                      <span className="text-secondary">{formatCurrency(p.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: DollarSign, label: 'Budget', value: formatCurrency(project.budget) },
                { icon: Clock, label: 'Duration', value: project.duration || '—' },
                { icon: Users, label: 'Proposals', value: project.proposalsCount ?? proposals.length },
              ].map(({ icon: Icon, label, value }) => (
                <Card key={label} className="text-center !p-4">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted">{label}</p>
                  <p className="font-semibold text-text mt-1">{value}</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Card className="sticky top-24">
              <h2 className="font-bold text-text mb-4">Submit Proposal</h2>
              {user?.role === 'client' ? (
                <p className="text-sm text-muted">Log in as a freelancer to submit a proposal.</p>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-medium text-text">Your bid ($)</label>
                    <input
                      type="number"
                      value={proposal.price}
                      onChange={(e) => setProposal({ ...proposal, price: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:ring-2 focus:ring-primary/40 outline-none"
                      placeholder={String(project.budget)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">Timeline</label>
                    <input
                      type="text"
                      value={proposal.timeline}
                      onChange={(e) => setProposal({ ...proposal, timeline: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:ring-2 focus:ring-primary/40 outline-none"
                      placeholder="e.g. 8 weeks"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm font-medium text-text">Cover letter</label>
                      <Button type="button" size="sm" variant="secondary" onClick={generateProposal}>
                        <Wand2 className="w-4 h-4" /> AI Generate
                      </Button>
                    </div>
                    <textarea
                      rows={8}
                      value={proposal.coverLetter}
                      onChange={(e) => setProposal({ ...proposal, coverLetter: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm focus:ring-2 focus:ring-primary/40 outline-none"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Proposal'}
                  </Button>
                  <Link to={`/bidding/${id}`}>
                    <Button variant="outline" className="w-full" type="button">
                      View Live Bids
                    </Button>
                  </Link>
                </form>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
