import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { messageService, projectService } from '../services/authService';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('No project ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await projectService.getById(id);
        const loadedProject = data?.project || data;
        if (!cancelled) {
          setProject(loadedProject);
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load project');
          toast.error('Could not load project details');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-danger mb-4">{error || 'Project not found'}</p>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  const isOwner = project.client?._id?.toString() === (user?._id || user?.id)?.toString();
  const isFreelancer = user?.role === 'freelancer';
  const isClient = user?.role === 'client';

  const handleMessageClient = async () => {
    if (!project?.client?._id) {
      toast.error('Client information unavailable');
      return;
    }

    try {
      const { data } = await messageService.createConversation(project.client._id);
      navigate(`/messages/${data.id}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      toast.error('Unable to open chat with client');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-text mb-2">{project.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {project.status || 'Open'}
          </span>
          <span className="px-3 py-1 bg-surface text-muted rounded-full text-sm">
            {project.budgetType === 'hourly' ? `$${project.budget}/hr` : `$${project.budget} fixed`}
          </span>
          <span className="px-3 py-1 bg-surface text-muted rounded-full text-sm">
            {project.duration}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="font-semibold text-text mb-3">Description</h2>
        <p className="text-muted whitespace-pre-wrap">{project.description}</p>
      </div>

      {/* Skills */}
      {project.skills?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-text mb-3">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span key={skill} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {project.milestones?.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="font-semibold text-text mb-3">Milestones</h2>
          <div className="space-y-3">
            {project.milestones.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div>
                  <p className="font-medium text-text">{m.title}</p>
                  <p className="text-sm text-muted">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No due date'}</p>
                </div>
                <span className="font-semibold text-primary">${m.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Info */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="font-semibold text-text mb-3">Posted By</h2>
        <div className="flex items-center gap-3">
          <img 
            src={project.client?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client?._id}`} 
            alt="" 
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-medium text-text">{project.client?.name || 'Unknown Client'}</p>
            <p className="text-sm text-muted">{project.client?.company || 'Individual Client'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {isFreelancer && project.status === 'open' && (
          <Button onClick={() => navigate(`/bidding/${id}`)}>
            <Send className="w-4 h-4 mr-2" /> Submit Proposal
          </Button>
        )}

        {isOwner && (
          <Button variant="secondary" onClick={() => navigate(`/bidding/${id}`)}>
            View Proposals
          </Button>
        )}

        {!isOwner && (
          <Button variant="outline" onClick={handleMessageClient}>
            <MessageSquare className="w-4 h-4 mr-2" /> Message Client
          </Button>
        )}
      </div>
    </div>
  );
}