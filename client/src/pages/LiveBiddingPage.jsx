import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import { useSocket } from '../hooks/useSocket';
import { projectService, proposalService } from '../services/authService';
import { mapProposalToBid, getApiErrorMessage } from '../utils/helpers';
import FreelancerBidding from '../components/bidding/FreelancerBidding';

export default function LiveBiddingPage() {
  const { id: projectId } = useParams();
  const { isFreelancer, isClient, isAdmin, isProjectOwner, dashboardPath } = useRole();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleNewBid = useCallback((bid) => {
    setBids((prev) => {
      const mapped = {
        ...mapProposalToBid(bid),
        freelancerId: bid.freelancerId || bid.freelancer?._id,
      };
      const idx = prev.findIndex((b) => b.id === mapped.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next.sort((a, b) => a.price - b.price);
      }
      return [mapped, ...prev].slice(0, 50).sort((a, b) => a.price - b.price);
    });
  }, []);

  const handleProposalUpdated = useCallback((payload) => {
    setBids((prev) =>
      prev.map((b) => {
        if (b.id === payload.id) return { ...b, status: payload.status };
        if (payload.status === 'accepted' && b.id !== payload.id) return { ...b, status: 'rejected' };
        return b;
      })
    );
    if (payload.status === 'accepted') toast.success('Proposal accepted');
  }, []);

  const { connected } = useSocket(projectId, {
    onNewBid: handleNewBid,
    onProposalUpdated: handleProposalUpdated,
  });

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
      const list = (proposalsRes.data || [])
        .map((p) => ({
          ...mapProposalToBid(p),
          freelancerId: (p.freelancer?._id || p.freelancer)?.toString(),
        }))
        .sort((a, b) => a.price - b.price);
      setBids(list);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const showClientView = isClient && isProjectOwner(project);
  const showFreelancerView = (isFreelancer || (isAdmin && !showClientView)) && project?.biddingEnabled;

  if (!showClientView && !showFreelancerView) {
    if (isFreelancer && project) {
      return <Navigate to={`/projects/${projectId}/proposal`} replace />;
    }
    return <Navigate to={dashboardPath} replace />;
  }

  if (showClientView) {
    return <Navigate to={`/projects/${projectId}/proposals`} replace />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-muted hover:text-primary text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to project
      </Link>

      <FreelancerBidding
        projectId={projectId}
        project={project}
        bids={bids}
        setBids={setBids}
        connected={connected}
      />
    </div>
  );
}
