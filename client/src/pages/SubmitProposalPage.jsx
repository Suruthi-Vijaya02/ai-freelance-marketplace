import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { projectService, proposalService } from '../services/authService';
import { getApiErrorMessage } from '../utils/helpers';

export default function SubmitProposalPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    price: '',
    timeline: '',
    estimatedHours: '',
    coverLetter: '',
    attachmentUrls: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await projectService.getById(projectId);
        if (!cancelled) setProject(data?.project || data);
      } catch (err) {
        if (!cancelled) toast.error(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (project?.status !== 'open') {
      toast.error('This project is no longer accepting proposals');
      return;
    }
    setSubmitting(true);
    try {
      const attachments = form.attachmentUrls
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, i) => ({ name: `Attachment ${i + 1}`, url }));

      await proposalService.create({
        project: projectId,
        price: Number(form.price),
        timeline: form.timeline,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        coverLetter: form.coverLetter,
        attachments,
      });
      toast.success('Proposal submitted!');
      navigate(`/projects/${projectId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-muted">
        Project not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Back to project
      </Link>
      <div>
        <h1 className="text-2xl font-black text-text">Submit Proposal</h1>
        <p className="text-muted text-sm mt-1">{project.title}</p>
      </div>
      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-text">Bid rate ($)</label>
            <input
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Estimated hours</label>
            <input
              type="number"
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
              placeholder="e.g. 120"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Timeline</label>
            <input
              type="text"
              required
              value={form.timeline}
              onChange={(e) => setForm({ ...form, timeline: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
              placeholder="e.g. 6 weeks"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Cover letter</label>
            <textarea
              rows={5}
              required
              value={form.coverLetter}
              onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Attachments (URLs, one per line)</label>
            <textarea
              rows={2}
              value={form.attachmentUrls}
              onChange={(e) => setForm({ ...form, attachmentUrls: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm"
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </form>
      </Card>
      {project.biddingEnabled && (
        <p className="text-sm text-muted text-center">
          This project also has live bidding.{' '}
          <Link to={`/bidding/${projectId}`} className="text-primary hover:underline">
            View live bidding
          </Link>
        </p>
      )}
    </div>
  );
}
