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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">Cover letter</label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiSuggesting}
                className="text-indigo-700 text-sm font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
              rows={5}
              required
              value={form.coverLetter}
              onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
              placeholder="Write your cover letter or click AI Suggest to generate a draft..."
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
