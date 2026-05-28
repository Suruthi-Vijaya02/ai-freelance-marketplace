import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, Lock, CreditCard } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import { projectService, paymentService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';

const statusConfig = {
  released: { color: 'success', icon: CheckCircle, label: 'Released' },
  escrow: { color: 'secondary', icon: Lock, label: 'In Escrow' },
  pending: { color: 'muted', icon: Clock, label: 'Pending' },
  refunded: { color: 'warning', icon: Clock, label: 'Refunded' },
};

export default function PaymentPage() {
  const { projectId } = useParams();
  const { isClient, isFreelancer } = useRole();
  const [project, setProject] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async (signal) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectRes, txRes] = await Promise.all([
        projectService.getProject(projectId),
        paymentService.getTransactions({ project: projectId }),
      ]);
      if (signal?.aborted) return;
      const proj = projectRes.data?.project || projectRes.data;
      setProject(proj);
      setTransactions(txRes.data || []);
      const firstPending = proj?.milestones?.find((m) => m.status === 'pending');
      if (firstPending) {
        setSelectedMilestone(firstPending.title);
        setFundAmount(String(firstPending.amount));
      }
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const milestones = project?.milestones?.length
    ? project.milestones
    : transactions.map((tx) => ({
        title: tx.milestone,
        amount: tx.amount,
        status: tx.status,
        _txId: tx._id,
      }));

  const handleFundEscrow = async (e) => {
    e.preventDefault();
    if (!isClient) { toast.error('Only clients can fund escrow'); return; }
    setProcessing(true);
    try {
      await paymentService.createEscrow({
        project: projectId,
        milestone: selectedMilestone,
        amount: Number(fundAmount),
        paymentMethod: 'stripe',
      });
      toast.success('Escrow funded successfully!');
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleRelease = async (txId) => {
    if (!isClient) { toast.error('Only the client can release payments'); return; }
    setProcessing(true);
    try {
      await paymentService.releasePayment(txId);
      toast.success('Payment released!');
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRelease = () => {
    toast.success('Release request sent to client');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-2xl font-black text-text">Payment & Escrow</h1>
        <p className="text-muted mt-1 font-light">
          Project: {project?.title || '—'}
        </p>

        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="font-bold text-text mb-6">Milestone Tracker</h2>
              {milestones.length === 0 ? (
                <p className="text-muted text-sm">No milestones defined for this project.</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((ms, index) => {
                    const status = ms.status || 'pending';
                    const config = statusConfig[status] || statusConfig.pending;
                    const Icon = config.icon;
                    const linkedTx = transactions.find((t) => t.milestone === ms.title);
                    return (
                      <div key={ms.title || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              status === 'released'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : status === 'escrow'
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-border text-muted'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {index < milestones.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border my-1 min-h-[24px]" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-text">{ms.title}</h3>
                              <p className="text-sm text-muted mt-0.5 font-light">
                                {linkedTx?.releasedAt
                                  ? formatDate(linkedTx.releasedAt)
                                  : linkedTx?.createdAt
                                  ? formatDate(linkedTx.createdAt)
                                  : 'Not yet funded'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-text">{formatCurrency(ms.amount)}</p>
                              <Badge color={config.color} className="mt-1">{config.label}</Badge>
                            </div>
                          </div>
                          {status === 'escrow' && linkedTx && isClient && (
                            <Button size="sm" className="mt-3" disabled={processing} onClick={() => handleRelease(linkedTx._id)}>
                              Release Payment
                            </Button>
                          )}
                          {status === 'escrow' && isFreelancer && (
                            <Button size="sm" variant="outline" className="mt-3" onClick={handleRequestRelease}>
                              Request Release
                            </Button>
                          )}
                          {status === 'pending' && isClient && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={() => {
                                setSelectedMilestone(ms.title);
                                setFundAmount(String(ms.amount));
                              }}
                            >
                              Fund Milestone
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-bold text-text mb-4">Transaction History</h2>
              {transactions.length === 0 ? (
                <p className="text-muted text-sm">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted border-b border-border">
                        <th className="text-left py-2">Milestone</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx._id} className="border-b border-border/50">
                          <td className="py-3 text-text">{tx.milestone}</td>
                          <td className="py-3 text-secondary">{formatCurrency(tx.amount)}</td>
                          <td className="py-3">
                            <Badge color={(statusConfig[tx.status] || statusConfig.pending).color}>
                              {(statusConfig[tx.status] || statusConfig.pending).label}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted capitalize">{tx.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {isClient && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-text">Fund Escrow</h2>
              </div>
              <form className="space-y-4" onSubmit={handleFundEscrow}>
                <Input
                  label="Milestone"
                  value={selectedMilestone}
                  onChange={(e) => setSelectedMilestone(e.target.value)}
                  placeholder="Milestone title"
                  required
                />
                <Input
                  label="Amount ($)"
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  required
                />
                <Input label="Card number" placeholder="4242 4242 4242 4242" disabled />
                <div className="p-3 rounded-lg bg-surface border border-border text-xs text-muted">
                  <Lock className="w-4 h-4 inline mr-1 text-secondary" />
                  Stripe test mode — funds held in escrow until milestone approval.
                </div>
                <Button type="submit" className="w-full" disabled={processing}>
                  {processing ? 'Processing...' : 'Fund Escrow'}
                </Button>
              </form>
            </Card>
          )}
        </div>
    </div>
  );
}
