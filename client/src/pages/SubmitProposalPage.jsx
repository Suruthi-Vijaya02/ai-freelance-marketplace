import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { projectService, proposalService } from '../services/authService';
import { getApiErrorMessage } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

// Inline AI proposal generator fallback
function generateLocalProposal(freelancer, project) {
  const skillsMatch = (freelancer.skills || []).filter(s =>
    (project.requiredSkills || project.skills || []).some(rs => rs.toLowerCase() === s.toLowerCase())
  );
  const matchText = skillsMatch.length > 0
    ? `My expertise in ${skillsMatch.slice(0, 3).join(', ')} aligns perfectly with your requirements.`
    : `I bring strong problem-solving skills and a proven track record of delivering quality work.`;

  return `Hi there,

I'm ${freelancer.name || 'a skilled freelancer'} with ${freelancer.experience || 'several'} years of experience. ${matchText}

${freelancer.bio ? `Background: ${freelancer.bio.slice(0, 200)}` : ''}

I'm confident I can deliver ${project.title} on time and to your specifications. I'd love to discuss how I can contribute to your project.

Looking forward to hearing from you.

Best regards,
${freelancer.name || ''}`;
}

export default function SubmitProposalPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
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

  const handleAiSuggest = async () => {
    setAiSuggesting(true);
    try {
      // Try API first
      try {
        const response = await fetch('/api/ai/suggest-proposal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('svr_token')}`,
          },
          body: JSON.stringify({
            bio: user?.bio || '',
            skills: user?.skills || [],
            experience: user?.experience || 0,
            projectTitle: project.title,
            projectDescription: project.description,
            requiredSkills: project.skills || project.requiredSkills || [],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setForm({ ...form, coverLetter: data.suggestion || data.text || '' });
          toast.success('AI-generated cover letter ready!');
        } else {
          throw new Error('API failed');
        }
      } catch {
        // Fallback to local generator
        const freelancer = {
          name: user?.name,
          bio: user?.bio || '',
          skills: user?.skills || [],
          experience: user?.experience || 0,
        };
        const suggestion = generateLocalProposal(freelancer, project);
        setForm({ ...form, coverLetter: suggestion });
        toast.success('Draft generated! Feel free to edit.');
      }
    } catch (err) {
      toast.error('AI suggestion failed. Please write manually.');
    } finally {
      setAiSuggesting(false);
    }
  };

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
      const errMsg = err?.response?.status === 401 || err?.response?.status === 403
        ? 'Please complete onboarding first'
        : getApiErrorMessage(err);
      toast.error(errMsg);
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
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Back to project
      </Link>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Submit Proposal</h1>
        <p className="text-sm text-muted">{project.title}</p>
      </div>
      <Card className="p-6 md:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-text">Bid rate ($)</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full mt-2 px-4 py-3 bg-surface/80 border border-border/80 rounded-xl text-text placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-btn-blue/20 focus:border-btn-blue transition-colors"
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Timeline</label>
              <input
                type="text"
                required
                value={form.timeline}
                onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                className="w-full mt-2 px-4 py-3 bg-surface/80 border border-border/80 rounded-xl text-text placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-btn-blue/20 focus:border-btn-blue transition-colors"
                placeholder="e.g. 6 weeks"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface/70 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <label className="text-sm font-semibold text-text">Cover letter</label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiSuggesting}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiSuggesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Writing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Suggest
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={10}
              required
              value={form.coverLetter}
              onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              className="w-full min-h-[220px] resize-y px-4 py-3 bg-white/80 border border-border/80 rounded-xl text-text placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-btn-blue/20 focus:border-btn-blue transition-colors"
              placeholder="Write your cover letter or click AI Suggest to generate a draft..."
            />
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface/70 p-4 md:p-5">
            <label className="text-sm font-semibold text-text">Portfolio & attachments</label>
            <p className="text-sm text-muted mt-1">Share links, examples, or supporting materials that strengthen your proposal.</p>
            <textarea
              rows={3}
              value={form.attachmentUrls}
              onChange={(e) => setForm({ ...form, attachmentUrls: e.target.value })}
              className="w-full mt-3 px-4 py-3 bg-white/80 border border-border/80 rounded-xl text-text text-sm placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-btn-blue/20 focus:border-btn-blue transition-colors"
              placeholder="https://example.com"
            />
          </div>

          <Button type="submit" className="w-full rounded-full px-6 py-3.5 text-base shadow-sm" disabled={submitting}>
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
