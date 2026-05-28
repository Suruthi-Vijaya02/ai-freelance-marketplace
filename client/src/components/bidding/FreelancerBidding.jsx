import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { TrendingDown, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MatchScoreBadge from '../ui/MatchScoreBadge';
import { useAuth } from '../../context/AuthContext';
import { proposalService } from '../../services/authService';
import { formatCurrency, mapProposalToBid, getApiErrorMessage } from '../../utils/helpers';

export default function FreelancerBidding({ projectId, project, bids, setBids, connected }) {
  const { user } = useAuth();
  const [bidForm, setBidForm] = useState({ price: '', timeline: '', coverLetter: '' });
  const [submitting, setSubmitting] = useState(false);

  const myId = (user?._id || user?.id)?.toString();
  const existingProposal = bids.find((b) => b.freelancerId?.toString() === myId);
  const canSubmit = !existingProposal || existingProposal.status === 'rejected';

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (project?.status !== 'open') {
      toast.error('This project is no longer accepting proposals');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        project: projectId,
        price: Number(bidForm.price),
        timeline: bidForm.timeline,
        coverLetter: bidForm.coverLetter || 'Proposal submission',
      };

      let data;
      if (existingProposal?.status === 'rejected') {
        const res = await proposalService.updateProposal(existingProposal.id, payload);
        data = res.data;
        toast.success('Proposal updated!');
      } else {
        const res = await proposalService.submitProposal(payload);
        data = res.data;
        toast.success('Proposal submitted!');
      }

      const mapped = { ...mapProposalToBid(data), freelancerId: myId };
      setBids((prev) => [mapped, ...prev.filter((b) => b.id !== mapped.id)]);
      setBidForm({ price: '', timeline: '', coverLetter: '' });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const sortedBids = [...bids].sort((a, b) => a.price - b.price);
  const lowestBid = sortedBids.length ? sortedBids[0].price : 0;
  const highestMatch = bids.length ? Math.max(...bids.map((b) => b.matchScore)) : 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-text">{project?.title || 'Submit Proposal'}</h1>
        <p className="text-muted font-light flex items-center gap-2 mt-1">
          Live leaderboard · {bids.length} bids
          <Badge color={connected ? 'success' : 'muted'} className="flex items-center gap-1">
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'LIVE' : 'OFFLINE'}
          </Badge>
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-bold text-text mb-4">Live Bid Leaderboard</h2>
            {sortedBids.length === 0 ? (
              <p className="text-muted text-sm py-8 text-center">No bids yet. Be the first!</p>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {sortedBids.map((bid, index) => (
                    <motion.div
                      key={bid.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        bid.freelancerId?.toString() === myId
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-surface border-border/60'
                      }`}
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
            <h2 className="font-bold text-text mb-4">
              {existingProposal?.status === 'rejected' ? 'Update Proposal' : 'Submit Proposal'}
            </h2>
            {!canSubmit ? (
              <div className="text-center py-6">
                <Badge color={existingProposal.status === 'accepted' ? 'success' : 'warning'}>
                  Proposal {existingProposal.status}
                </Badge>
                <p className="text-sm text-muted mt-2">
                  {existingProposal.status === 'pending'
                    ? 'Awaiting client review.'
                    : 'You cannot submit another proposal for this project.'}
                </p>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={handleSubmitBid}>
                <input
                  type="number"
                  placeholder="Your bid ($)"
                  value={bidForm.price}
                  onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
                  required
                />
                <input
                  type="text"
                  placeholder="Timeline (e.g. 6 weeks)"
                  value={bidForm.timeline}
                  onChange={(e) => setBidForm({ ...bidForm, timeline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
                  required
                />
                <textarea
                  rows={3}
                  placeholder="Cover letter"
                  value={bidForm.coverLetter}
                  onChange={(e) => setBidForm({ ...bidForm, coverLetter: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
                  required
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : existingProposal ? 'Update Proposal' : 'Submit Proposal'}
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
                  {sortedBids.length ? formatCurrency(lowestBid) : '—'}
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
