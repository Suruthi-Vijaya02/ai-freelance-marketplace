import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FileText, 
  MessageSquare, 
  Check, 
  X, 
  Clock, 
  DollarSign,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { proposalService, messageService, projectService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';
import { fadeInUp, pageFade, stagger } from '../utils/motionVariants';

export default function ProposalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadProposals = useCallback(async (signal) => {
    try {
      setLoading(true);
      // Fetch all proposals for projects owned by the client
      // The API endpoint router.get('/', authMiddleware, getProposals) usually returns all or filtered
      // Let's use getProposals which should return proposals relevant to the user's role
      const { data } = await proposalService.getProposals();
      if (!signal?.aborted) setProposals(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!signal?.aborted) setError('Unable to load proposals. Please refresh.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProposals(controller.signal);
    return () => controller.abort();
  }, [loadProposals]);

  const handleAccept = async (proposalId) => {
    if (!window.confirm('Are you sure you want to accept this proposal? A contract will be created.')) return;
    setProcessingId(proposalId);
    try {
      await proposalService.updateStatus(proposalId, 'accepted');
      toast.success('Proposal accepted! Contract created.');
      // Refresh list
      setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status: 'accepted' } : p));
      // Navigate to contracts after a short delay
      setTimeout(() => navigate('/contracts'), 1500);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (proposalId) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;
    setProcessingId(proposalId);
    try {
      await proposalService.updateStatus(proposalId, 'rejected');
      toast.success('Proposal rejected');
      setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status: 'rejected' } : p));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleMessage = async (freelancerId) => {
    try {
      const { data } = await messageService.createConversation(freelancerId);
      navigate(`/messages/${data.id || data._id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const statusColors = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'error',
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageFade}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text">Incoming Proposals</h1>
          <p className="text-muted mt-1">Review and manage proposals from talented freelancers.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/projects">
            <Button variant="outline" size="sm">My Projects</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-error/10 border border-error/30 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
      ) : proposals.length === 0 ? (
        <Card className="text-center py-16">
          <FileText className="w-16 h-16 text-muted mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold text-text">No proposals yet</h2>
          <p className="text-muted mt-2 max-w-md mx-auto">
            When freelancers bid on your projects, they will appear here. Try creating a new project to get started.
          </p>
          <Link to="/create-project" className="inline-block mt-6">
            <Button>Post a Project</Button>
          </Link>
        </Card>
      ) : (
        <motion.div variants={stagger} className="space-y-4">
          {proposals.map((proposal) => (
            <motion.div key={proposal._id} variants={fadeInUp}>
              <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Freelancer Info */}
                  <div className="md:w-64 shrink-0 flex flex-col items-center text-center space-y-3 p-2">
                    <img 
                      src={proposal.freelancer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${proposal.freelancer?.name || 'user'}`} 
                      alt={proposal.freelancer?.name}
                      className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-text text-lg">{proposal.freelancer?.name || 'Freelancer'}</h3>
                      <p className="text-xs text-muted font-medium uppercase tracking-wider">{proposal.freelancer?.title || 'Professional'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <span className="text-sm font-bold">★ 4.9</span>
                      <span className="text-[10px] text-muted">(12 reviews)</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary"
                      onClick={() => handleMessage(proposal.freelancer?._id || proposal.freelancer)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Message
                    </Button>
                  </div>

                  {/* Proposal Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge color={statusColors[proposal.status] || 'muted'}>{proposal.status}</Badge>
                          <span className="text-xs text-muted">Submitted {formatDate(proposal.createdAt)}</span>
                        </div>
                        <h4 className="font-bold text-text text-xl">
                          Project: {proposal.project?.title || 'Untitled Project'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-secondary">{formatCurrency(proposal.bidAmount || proposal.price)}</p>
                        <p className="text-xs text-muted font-medium flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" /> {proposal.estimatedDuration || proposal.timeline || 'TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-surface rounded-2xl p-4 border border-border/40">
                      <h5 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Cover Letter</h5>
                      <p className="text-sm text-text leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                        {proposal.coverLetter || 'No cover letter provided.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex gap-4">
                        {proposal.milestones?.length > 0 && (
                          <div className="text-xs">
                            <span className="text-muted">Milestones: </span>
                            <span className="font-bold text-text">{proposal.milestones.length} steps</span>
                          </div>
                        )}
                      </div>
                      
                      {proposal.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            disabled={processingId === proposal._id}
                            onClick={() => handleReject(proposal._id)}
                          >
                            <X className="w-4 h-4 mr-1.5" /> Decline
                          </Button>
                          <Button 
                            size="sm"
                            disabled={processingId === proposal._id}
                            onClick={() => handleAccept(proposal._id)}
                          >
                            <Check className="w-4 h-4 mr-1.5" /> Accept Proposal
                          </Button>
                        </div>
                      )}

                      {proposal.status === 'accepted' && (
                        <Link to="/contracts">
                          <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/5">
                            View Contract <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
