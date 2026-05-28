import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MessageSquare, Check, X } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MatchScoreBadge from '../ui/MatchScoreBadge';
import { proposalService, messageService } from '../../services/authService';
import { formatCurrency, getApiErrorMessage } from '../../utils/helpers';

export default function ClientProposals({ projectId, project, bids, setBids, onProposalUpdate }) {
  const navigate = useNavigate();
  const [processingId, setProcessingId] = useState(null);

  const handleAccept = async (bidId) => {
    setProcessingId(bidId);
    try {
      const { data } = await proposalService.updateStatus(bidId, 'accepted');
      setBids((prev) =>
        prev.map((b) => ({
          ...b,
          status: b.id === bidId ? 'accepted' : 'rejected',
        }))
      );
      onProposalUpdate?.(data);
      toast.success('Proposal accepted! Contract created.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bidId) => {
    setProcessingId(bidId);
    try {
      await proposalService.updateStatus(bidId, 'rejected');
      setBids((prev) => prev.map((b) => (b.id === bidId ? { ...b, status: 'rejected' } : b)));
      toast.success('Proposal rejected');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleMessage = async (freelancerId) => {
    try {
      const { data } = await messageService.createConversation(freelancerId);
      navigate(`/messages/${data.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const statusColors = { pending: 'warning', accepted: 'success', rejected: 'danger' };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-text">{project?.title || 'Manage Proposals'}</h1>
        <p className="text-muted font-light">Review and accept proposals for your project</p>
      </div>

      <Card>
        <h2 className="font-bold text-text mb-4">Proposals ({bids.length})</h2>
        {bids.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">No proposals received yet.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {[...bids].sort((a, b) => a.price - b.price).map((bid) => (
                <motion.div
                  key={bid.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-surface border border-border/60"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <img src={bid.avatar} alt="" className="w-12 h-12 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-text">{bid.freelancerName}</h3>
                        <Badge color={statusColors[bid.status] || 'muted'}>{bid.status || 'pending'}</Badge>
                        <MatchScoreBadge score={bid.matchScore} />
                      </div>
                      <p className="text-sm text-muted mt-2">{bid.coverLetter}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-secondary font-medium">{formatCurrency(bid.price)}</span>
                        <span className="text-muted">{bid.timeline}</span>
                      </div>
                    </div>
                    {bid.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={processingId === bid.id}
                          onClick={() => handleAccept(bid.id)}
                        >
                          <Check className="w-4 h-4" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === bid.id}
                          onClick={() => handleReject(bid.id)}
                        >
                          <X className="w-4 h-4" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMessage(bid.freelancerId)}
                        >
                          <MessageSquare className="w-4 h-4" /> Message
                        </Button>
                      </div>
                    )}
                    {bid.status === 'accepted' && (
                      <Link to={`/payments/${projectId}`}>
                        <Button size="sm" variant="outline">Fund Escrow</Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </Card>
    </>
  );
}
