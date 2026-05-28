import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import { useSocket } from '../hooks/useSocket';
import { projectService, proposalService } from '../services/authService';
import { mapProposalToBid, getApiErrorMessage } from '../utils/helpers';
import FreelancerBidding from '../components/bidding/FreelancerBidding';
import ClientProposals from '../components/bidding/ClientProposals';

const INITIAL_SECONDS = 3600;

export default function LiveBiddingPage() {
  const { id: projectId } = useParams();
  const { isFreelancer, isClient, isAdmin, isProjectOwner, dashboardPath } = useRole();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(INITIAL_SECONDS);

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
      const proj = projectRes.data?.project || projectRes.data;
      setProject(proj);
      setBids(
        (proposalsRes.data || []).map((p) => ({
          ...mapProposalToBid(p),
          freelancerId: p.freelancer?._id || p.freelancer,
        }))
      );
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

  const showClientView = isClient && isProjectOwner(project);
  const showFreelancerView = isFreelancer || (isAdmin && !showClientView);

  if (!showClientView && !showFreelancerView) {
    return <Navigate to={dashboardPath} replace />;
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

        {showClientView ? (
          <ClientProposals
            projectId={projectId}
            project={project}
            bids={bids}
            setBids={setBids}
          />
        ) : (
          <FreelancerBidding
            projectId={projectId}
            project={project}
            bids={bids}
            setBids={setBids}
            connected={connected}
            emitBid={emitBid}
            timeLeft={timeLeft}
          />
        )}
      </main>
    </div>
  );
}
