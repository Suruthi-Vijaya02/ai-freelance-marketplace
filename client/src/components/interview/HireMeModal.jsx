import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, MessageSquare, Calendar, Send } from 'lucide-react';
import Button from '../ui/Button';
import InterviewScheduler from './InterviewScheduler';
import { projectService, messageService } from '../../services/authService';
import { normalizeConversationId, getApiErrorMessage } from '../../utils/helpers';

export default function HireMeModal({ freelancerId, freelancerName, onClose }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [mode, setMode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await projectService.getMyProjects();
        if (!cancelled) setProjects(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startMessage = async () => {
    try {
      const { data } = await messageService.createConversation(freelancerId);
      const convId = normalizeConversationId(data.id || data.conversationId);
      onClose();
      navigate(`/messages/${convId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const inviteToApply = async () => {
    if (!selectedProject) {
      toast.error('Select a project first');
      return;
    }
    try {
      const { data } = await messageService.createConversation(freelancerId);
      const convId = normalizeConversationId(data.id || data.conversationId);
      const project = projects.find((p) => p._id === selectedProject);
      await messageService.sendMessage({
        conversationId: convId,
        receiver: freelancerId,
        content: `I'd like to invite you to apply to my project: "${project?.title}". View it here: ${window.location.origin}/projects/${selectedProject}`,
      });
      toast.success('Invite sent!');
      onClose();
      navigate(`/messages/${convId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (mode === 'interview') {
    return (
      <InterviewScheduler
        freelancerId={freelancerId}
        freelancerName={freelancerName}
        projectId={selectedProject || undefined}
        onClose={() => setMode(null)}
        onScheduled={({ interview, conversationId }) => {
          onClose();
          if (interview?._id) {
            navigate(`/interview/${interview._id}`);
          } else {
            navigate(`/messages/${conversationId}`);
          }
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">Hire {freelancerName}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!loadingProjects && projects.length > 0 && (
          <div className="mb-4">
            <label className="text-sm font-medium text-text">Link to project (optional)</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 bg-card border border-border rounded-lg text-text text-sm"
            >
              <option value="">— No project —</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Button type="button" className="w-full justify-start" variant="outline" onClick={startMessage}>
            <MessageSquare className="w-4 h-4" /> Message freelancer
          </Button>
          <Button type="button" className="w-full justify-start" variant="outline" onClick={() => setMode('interview')}>
            <Calendar className="w-4 h-4" /> Schedule interview
          </Button>
          <Button
            type="button"
            className="w-full justify-start"
            variant="outline"
            onClick={inviteToApply}
            disabled={!projects.length}
          >
            <Send className="w-4 h-4" /> Send invite to apply
          </Button>
        </div>
        {!loadingProjects && projects.length === 0 && (
          <p className="text-xs text-muted mt-3">Post a project first to send an apply invite.</p>
        )}
      </div>
    </div>
  );
}
