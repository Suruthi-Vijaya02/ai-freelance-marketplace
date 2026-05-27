import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Timer, TrendingDown, TrendingUp, ArrowLeft, Zap, Wifi, WifiOff } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { projectService, proposalService } from '../services/authService';
import { formatCurrency, mapProposalToBid, getApiErrorMessage } from '../utils/helpers';

const INITIAL_SECONDS = 3600;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function LiveBiddingPage() {
  const { id: projectId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(INITIAL_SECONDS);
  const [selectedBid, setSelectedBid] = useState(null);
  const [bidForm, setBidForm] = useState({ price: '', timeline: '', coverLetter: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleNewBid = useCallback((bid) => {
    setBids((prev) => {
      const exists = prev.some((b) => b.id === bid.id);
      if (exists) return prev;
      return [mapProposalToBid(bid), ...prev].slice(0, 20);
    });
  }, []);

  const { connected, emitBid } = useSocket(projectId, { onNewBid: handleNewBid });

  const loadInitial = useCallback(async (signal) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectRes, proposalsRes] = await Promise.all([
        projectService.getProject(projectId),
        proposalService.getProposalsByProject(projectId),
      ]);
      if (signal?.aborted) return;
      setProject(projectRes.data?.project || projectRes.data);
      setBids((proposalsRes.data || []).map(mapProposalToBid));
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    loadInitial(controller.signal);
    return () => controller.abort();
  }, [loadInitial]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.role !== 'freelancer') {
      toast.error('Log in as a freelancer to place a bid');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        project: projectId,
        price: Number(bidForm.price),
        timeline: bidForm.timeline,
        coverLetter: bidForm.coverLetter || 'Live bid submission',
      };
      const { data } = await proposalService.submitProposal(payload);
      const mapped = mapProposalToBid(data);
      setBids((prev) => [mapped, ...prev.filter((b) => b.id !== mapped.id)]);
      emitBid({
        freelancerName: user.name,
        avatar: user.avatar,
        price: payload.price,
        timeline: payload.timeline,
        matchScore: data.matchScore,
        coverLetter: payload.coverLetter,
        skills: user.skills,
        projectSkills: project?.skills,
      });
      toast.success('Bid submitted!');
      setBidForm({ price: '', timeline: '', coverLetter: '' });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const lowestBid = bids.length ? Math.min(...bids.map((b) => b.price)) : 0;
  const highestMatch = bids.length ? Math.max(...bids.map((b) => b.matchScore)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-muted hover:text-primary mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to project
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-text">{project?.title || 'Live Bidding'}</h1>
            <p className="text-muted font-light">Live Bidding · {bids.length} active bids</p>
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
              <h2 className="font-bold text-text mb-4">Live Bid Feed</h2>
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
                        onClick={() => setSelectedBid(bid.id)}
                        className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedBid === bid.id
                            ? 'bg-primary/15 border border-primary/30'
                            : 'bg-surface border border-transparent hover:border-border'
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
                          <Badge color="primary" className="mt-1">{bid.matchScore}%</Badge>
                        </div>
                        {bids.length > 0 && bid.price === lowestBid && (
                          <TrendingDown className="w-5 h-5 text-success shrink-0" />
                        )}
                        {bids.length > 0 && bid.matchScore === highestMatch && (
                          <TrendingUp className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </Card>

            {user?.role === 'freelancer' && (
              <Card>
                <h2 className="font-bold text-text mb-4">Place a Bid</h2>
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
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Live Bid'}
                  </Button>
                </form>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="font-bold text-text mb-4">Bid Comparison</h2>
              {selectedBid ? (
                (() => {
                  const bid = bids.find((b) => b.id === selectedBid);
                  if (!bid) return null;
                  return (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Freelancer</span>
                        <span className="text-text">{bid.freelancerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Bid amount</span>
                        <span className="text-secondary font-medium">{formatCurrency(bid.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Timeline</span>
                        <span className="text-text">{bid.timeline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">AI Match</span>
                        <Badge color="primary">{bid.matchScore}%</Badge>
                      </div>
                      {project && (
                        <div className="flex justify-between">
                          <span className="text-muted">vs. Budget</span>
                          <span className={bid.price <= project.budget ? 'text-success' : 'text-accent'}>
                            {bid.price <= project.budget ? 'Within budget' : 'Over budget'}
                          </span>
                        </div>
                      )}
                      <Button className="w-full mt-4">Accept Bid</Button>
                    </div>
                  );
                })()
              ) : (
                <p className="text-muted text-sm">Select a bid to compare details</p>
              )}
            </Card>
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
        </div>
      </main>
    </div>
  );
}
