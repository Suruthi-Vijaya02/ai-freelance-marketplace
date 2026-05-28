import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Timer, TrendingDown, TrendingUp, Zap, Wifi, WifiOff } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MatchScoreBadge from '../ui/MatchScoreBadge';
import { useAuth } from '../../context/AuthContext';
import { proposalService } from '../../services/authService';
import { formatCurrency, mapProposalToBid, getApiErrorMessage } from '../../utils/helpers';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function FreelancerBidding({
  projectId,
  project,
  bids,
  setBids,
  connected,
  emitBid,
  timeLeft,
}) {
  const { user } = useAuth();
  const [bidForm, setBidForm] = useState({ price: '', timeline: '', coverLetter: '' });
  const [submitting, setSubmitting] = useState(false);
  const [myProposalStatus, setMyProposalStatus] = useState(null);

  const existingProposal = bids.find(
    (b) => b.freelancerId === (user?._id || user?.id)
  );

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        project: projectId,
        price: Number(bidForm.price),
        timeline: bidForm.timeline,
        coverLetter: bidForm.coverLetter || 'Proposal submission',
      };
      const { data } = await proposalService.submitProposal(payload);
      const mapped = { ...mapProposalToBid(data), freelancerId: user._id || user.id };
      setBids((prev) => [mapped, ...prev.filter((b) => b.id !== mapped.id)]);
      setMyProposalStatus('pending');
      emitBid({
        freelancerName: user.name,
        avatar: user.avatar,
        price: payload.price,
        timeline: payload.timeline,
        matchScore: data.matchScore,
        coverLetter: payload.coverLetter,
      });
      toast.success('Proposal submitted!');
      setBidForm({ price: '', timeline: '', coverLetter: '' });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const lowestBid = bids.length ? Math.min(...bids.map((b) => b.price)) : 0;
  const highestMatch = bids.length ? Math.max(...bids.map((b) => b.matchScore)) : 0;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-text">{project?.title || 'Live Bidding'}</h1>
          <p className="text-muted font-light">Submit your bid · {bids.length} active bids</p>
        </div>
        <Card className="!p-4 flex items-center gap-4">
          <Timer className={`w-8 h-8 ${timeLeft < 300 ? 'text-error' : 'text-secondary'}`} />
          <div>
            <p className="text-xs text-muted">Auction ends in</p>
            <p className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-error' : 'text-text'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
          <Badge color={connected ? 'success' : 'muted'} className="flex items-center gap-1">
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'LIVE' : 'OFFLINE'}
          </Badge>
          {connected && (
            <Badge color="warning" className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> REALTIME
            </Badge>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-bold text-text mb-4">Live Bid Feed (View Only)</h2>
            {bids.length === 0 ? (
              <p className="text-muted text-sm py-8 text-center">No bids yet. Be the first to bid!</p>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <motion.div
                      key={bid.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border/60"
                    >
                      <span className="text-muted font-mono text-sm w-6">#{index + 1}</span>
                      <img src={bid.avatar} alt="" className="w-10 h-10 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text">{bid.freelancerName}</p>
                        <p className="text-sm text-muted">{bid.timeline}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-secondary">{formatCurrency(bid.price)}</p>
                        <MatchScoreBadge score={bid.matchScore} className="mt-1" />
                      </div>
                      {bid.price === lowestBid && <TrendingDown className="w-5 h-5 text-success shrink-0" />}
                      {bid.matchScore === highestMatch && <TrendingUp className="w-5 h-5 text-primary shrink-0" />}
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </Card>

          <Card>
            <h2 className="font-bold text-text mb-4">Submit Proposal</h2>
            {existingProposal || myProposalStatus === 'pending' ? (
              <div className="text-center py-6">
                <Badge color="warning" className="mb-2">Proposal Pending</Badge>
                <p className="text-sm text-muted">Your proposal is awaiting client review.</p>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={handleSubmitBid}>
                <input
                  type="number"
                  placeholder="Your bid ($)"
                  value={bidForm.price}
                  onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
                <input
                  type="text"
                  placeholder="Timeline (e.g. 6 weeks)"
                  value={bidForm.timeline}
                  onChange={(e) => setBidForm({ ...bidForm, timeline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
                <textarea
                  rows={3}
                  placeholder="Cover letter"
                  value={bidForm.coverLetter}
                  onChange={(e) => setBidForm({ ...bidForm, coverLetter: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {project && (
          <Card>
            <h3 className="font-medium text-text mb-2">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Lowest bid</span>
                <span className="text-success font-medium">
                  {bids.length ? formatCurrency(lowestBid) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Project budget</span>
                <span className="text-text">{formatCurrency(project.budget)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
