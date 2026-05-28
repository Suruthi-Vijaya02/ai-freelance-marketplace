import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Clock, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import MatchScoreBadge from '../components/ui/MatchScoreBadge';
import { proposalService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';

const statusColors = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProposals = useCallback(async (signal) => {
    try {
      setLoading(true);
      const { data } = await proposalService.getMyProposals();
      if (!signal?.aborted) setProposals(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProposals(controller.signal);
    return () => controller.abort();
  }, [loadProposals]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">My Proposals</h1>
        <p className="text-muted mt-1 font-light">Track proposals you&apos;ve submitted</p>
      </div>

      {proposals.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">You haven&apos;t submitted any proposals yet.</p>
          <Link to="/projects" className="inline-block mt-4">
            <Button>Browse Projects</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <Card key={p._id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-text">{p.project?.title || 'Project'}</h3>
                  <Badge color={statusColors[p.status] || 'muted'}>{p.status}</Badge>
                  <MatchScoreBadge score={p.matchScore} />
                </div>
                <p className="text-sm text-muted mt-1 line-clamp-2">{p.coverLetter}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                  <span>{formatCurrency(p.price)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {p.timeline}
                  </span>
                  <span>{formatDate(p.createdAt)}</span>
                </div>
              </div>
              <Link to={`/projects/${p.project?._id}`}>
                <Button size="sm" variant="outline">
                  View Project <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
