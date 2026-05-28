import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import { interviewService, messageService } from '../../services/authService';
import { normalizeConversationId } from '../../utils/helpers';

export default function InterviewScheduler({
  freelancerId,
  freelancerName,
  projectId,
  onClose,
  onScheduled,
}) {
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledTime) {
      toast.error('Select a date and time');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await interviewService.schedule({
        freelancerId,
        projectId,
        scheduledTime,
        notes,
      });

      const conv = await messageService.createConversation(freelancerId);
      const convId = normalizeConversationId(conv.data?.id || data.conversationId);

      toast.success(`Interview scheduled with ${freelancerName}`);
      onScheduled?.({ interview: data.interview, conversationId: convId, roomId: data.interview?.roomId });
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule Interview
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted mb-4">
          Hire <span className="text-text font-medium">{freelancerName}</span> and schedule a video interview.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-text">Date & time</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 bg-card border border-border rounded-lg text-text"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Notes (optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Topics to discuss..."
              className="w-full mt-1.5 px-4 py-2.5 bg-card border border-border rounded-lg text-text text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule & Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
