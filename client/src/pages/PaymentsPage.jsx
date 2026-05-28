import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import { paymentService, projectService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';

const statusColors = {
  released: 'success',
  escrow: 'secondary',
  pending: 'muted',
  refunded: 'warning',
};

export default function PaymentsPage() {
  const { isClient, isFreelancer } = useRole();
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (signal) => {
    try {
      setLoading(true);
      const [txRes, projectsRes] = await Promise.all([
        paymentService.getTransactions(),
        isClient ? projectService.getMyProjects() : Promise.resolve({ data: [] }),
      ]);
      if (!signal?.aborted) {
        setTransactions(txRes.data || []);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      }
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [isClient]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">
          {isClient ? 'Escrow & Payments' : 'Payment History'}
        </h1>
        <p className="text-muted mt-1 font-light">
          {isClient
            ? 'Manage milestone funding and release payments to freelancers'
            : 'View payments received from completed milestones'}
        </p>
      </div>

      {isClient && projects.length > 0 && (
        <Card>
          <h2 className="font-bold text-text mb-4">Your Projects</h2>
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/payments/${p._id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-primary/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-text">{p.title}</p>
                  <p className="text-sm text-muted">{formatCurrency(p.budget)} · {p.status}</p>
                </div>
                <Button size="sm" variant="outline">Manage Escrow</Button>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-text">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <Lock className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted">No transactions yet.</p>
            {isClient && (
              <Link to="/create-project" className="inline-block mt-4">
                <Button size="sm">Create a Project</Button>
              </Link>
            )}
            {isFreelancer && (
              <Link to="/projects" className="inline-block mt-4">
                <Button size="sm">Browse Projects</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="text-left py-2">Milestone</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Method</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-border/50">
                    <td className="py-3 text-text">{tx.milestone || '—'}</td>
                    <td className="py-3 text-secondary font-medium">{formatCurrency(tx.amount)}</td>
                    <td className="py-3">
                      <Badge color={statusColors[tx.status] || 'muted'}>{tx.status}</Badge>
                    </td>
                    <td className="py-3 text-muted">{formatDate(tx.releasedAt || tx.createdAt)}</td>
                    <td className="py-3 text-muted capitalize">{tx.paymentMethod || 'stripe'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
