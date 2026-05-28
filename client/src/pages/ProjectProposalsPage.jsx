import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import { projectService, proposalService } from '../services/authService';
import { mapProposalToBid, getApiErrorMessage } from '../utils/helpers';
import ClientProposals from '../components/bidding/ClientProposals';

export default function ProjectProposalsPage() {
  const { id: projectId } = useParams();
  const { isClient, isProjectOwner, dashboardPath } = useRole();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal) => {
    try {
      const [projectRes, proposalsRes] = await Promise.all([
        projectService.getById(projectId),
        proposalService.getProposalsByProject(projectId),
      ]);
      if (signal?.aborted) return;
      setProject(projectRes.data?.project || projectRes.data);
      setBids(
        (proposalsRes.data || []).map((p) => ({
          ...mapProposalToBid(p),
          freelancerId: (p.freelancer?._id || p.freelancer)?.toString(),
        }))
      );
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isClient || !isProjectOwner(project)) {
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-muted hover:text-primary text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to project
      </Link>
      <ClientProposals projectId={projectId} project={project} bids={bids} setBids={setBids} />
    </div>
  );
}
