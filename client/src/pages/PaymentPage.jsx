import { useState, useEffect, useCallback } from 'react';
import { formatCurrency as formatCurrencyUtil, CURRENCY_RATES } from '../utils/currency';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, Lock, CreditCard, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import { projectService, paymentService, contractService } from '../services/authService';
import api from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';

const statusConfig = {
  released: { color: 'success', icon: CheckCircle, label: 'Released' },
  approved: { color: 'info', icon: CheckCircle, label: 'Approved' },
  submitted: { color: 'warning', icon: Clock, label: 'Submitted' },
  funded: { color: 'secondary', icon: Lock, label: 'Funded' },
  escrow: { color: 'secondary', icon: Lock, label: 'In Escrow' },
  pending: { color: 'muted', icon: Clock, label: 'Pending' },
  refunded: { color: 'danger', icon: Clock, label: 'Refunded' },
};

export default function PaymentPage() {
  const { projectId } = useParams();
  const { isClient, isFreelancer } = useRole();
  const [currency, setCurrency] = useState('USD');
  const [project, setProject] = useState(null);
  const [contract, setContract] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [processing, setProcessing] = useState(false);

  // Commission preview state
  const [commissionRate, setCommissionRate] = useState(0.10); // default 10%
  const [reviewingMilestone, setReviewingMilestone] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const loadData = useCallback(async (signal) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectRes, txRes, contractsRes] = await Promise.all([
        projectService.getProject(projectId),
        paymentService.getTransactions({ project: projectId }),
        contractService.getMyContracts()
      ]);
      if (signal?.aborted) return;

      const proj = projectRes.data?.project || projectRes.data;
      setProject(proj);
      setTransactions(txRes.data || []);

      const contractsList = contractsRes.data || [];
      const relatedContract = contractsList.find(
        (c) => c.project?._id === projectId || c.project === projectId
      );
      
      if (relatedContract) {
        setContract(relatedContract);
        const freelancerTier = relatedContract.freelancer?.subscription?.tier || 'free';
        const rates = { free: 0.10, pro: 0.05, elite: 0 };
        setCommissionRate(rates[freelancerTier] ?? 0.10);

        // Autofill first pending milestone
        const firstPending = relatedContract.milestones?.find((m) => m.status === 'pending');
        if (firstPending) {
          setSelectedMilestone(firstPending.title);
          setSelectedMilestoneId(firstPending._id);
          setFundAmount(String(firstPending.amount / 100)); // display in dollars
        }
      } else {
        // Fallback to project milestones if contract is missing
        const firstPending = proj?.milestones?.find((m) => m.status === 'pending');
        if (firstPending) {
          setSelectedMilestone(firstPending.title);
          setFundAmount(String(firstPending.amount / 100));
        }
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

  // Fallback or Contract milestones
  const milestones = contract?.milestones?.length
    ? contract.milestones
    : project?.milestones?.length
    ? project.milestones
    : transactions.map((tx) => ({
        title: tx.milestone,
        amount: tx.amount,
        status: tx.status,
        _txId: tx._id,
      }));

  // Calculations for Escrow Balance Display
  const totalInEscrow = milestones
    .filter(m => m.status === 'funded' || m.status === 'submitted' || m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, 0) / 100;

  const totalReleased = milestones
    .filter(m => m.status === 'released')
    .reduce((sum, m) => sum + m.amount, 0) / 100;

  const totalRemaining = milestones
    .filter(m => m.status === 'pending')
    .reduce((sum, m) => sum + m.amount, 0) / 100;

  const handleFundEscrow = async (e) => {
    e.preventDefault();
    if (!isClient) { toast.error('Only clients can fund escrow'); return; }
    setProcessing(true);
    try {
      const centAmount = Math.round(Number(fundAmount) * 100);
      await paymentService.createEscrow({
        project: projectId,
        contractId: contract?._id,
        milestone: selectedMilestone,
        milestoneId: selectedMilestoneId,
        amount: centAmount,
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

  const handleRelease = async (milestoneId) => {
    if (!isClient) { toast.error('Only the client can release payments'); return; }
    if (!contract) { toast.error('Contract details missing'); return; }
    setProcessing(true);
    try {
      // Direct call to contract release endpoint
      await api.put(`/contracts/${contract._id}/milestones/${milestoneId}/release`);
      toast.success('Payment released to freelancer!');
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAndRelease = async (milestoneId) => {
    if (!isClient) { toast.error('Only the client can approve and release payments'); return; }
    if (!contract) { toast.error('Contract details missing'); return; }
    setProcessing(true);
    try {
      await api.put(`/contracts/${contract._id}/milestones/${milestoneId}/approve`);
      await api.put(`/contracts/${contract._id}/milestones/${milestoneId}/release`);
      toast.success('Milestone approved and payment released!');
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRelease = () => {
    toast.success('Release request sent to client via Messages');
  };

  const handleSubmitReview = async (freelancerId) => {
    try {
      setProcessing(true);
      const projectId = contract.project?._id || contract.project;
      await api.post(`/users/${freelancerId}/reviews`, {
        rating,
        comment: reviewComment,
        projectId
      });
      toast.success('Review submitted successfully!');
      setReviewingMilestone(null);
      setRating(5);
      setReviewComment('');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Calculate freelancer payout values for funding preview
  const fundVal = Number(fundAmount) || 0;
  const commAmt = fundVal * commissionRate;
  const netPay = fundVal - commAmt;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 font-body">
      <div className="flex justify-end items-center gap-2 mb-4">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Currency:</span>
        <select 
          value={currency} 
          onChange={(e) => setCurrency(e.target.value)}
          className="text-sm border border-[var(--color-border-secondary)] rounded-md px-2 py-1 bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] focus:outline-none" 
        > 
          {Object.keys(CURRENCY_RATES).map((c) => ( 
            <option key={c} value={c}> 
              {c} 
            </option> 
          ))} 
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/contracts" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-text" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-text">Payment & Escrow</h1>
          <p className="text-sm text-muted mt-0.5">
            Project: {project?.title || '—'}
          </p>
        </div>
      </div>

      {/* Escrow Balance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-3xl border border-border shadow-md">
        <div className="space-y-1">
          <span className="text-xs text-muted font-medium uppercase">Total in Escrow</span>
          <p className="text-2xl font-black text-text">{formatCurrencyUtil(totalInEscrow, currency)}</p>
        </div>
        <div className="space-y-1 border-y md:border-y-0 md:border-x border-border/70 py-3 md:py-0 md:px-6">
          <span className="text-xs text-muted font-medium uppercase">Released to Freelancer</span>
          <p className="text-2xl font-black text-success">{formatCurrencyUtil(totalReleased, currency)}</p>
        </div>
        <div className="space-y-1 md:pl-6">
          <span className="text-xs text-muted font-medium uppercase">Remaining Balance</span>
          <p className="text-2xl font-black text-secondary">{formatCurrencyUtil(totalRemaining, currency)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
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
                  const linkedTx = transactions.find((t) => t.milestone === ms.title || t.milestoneId === ms._id);

                  // Calculate commission for released milestones
                  const actualRate = commissionRate;
                  const commissionValue = ms.amount * actualRate;
                  const freelancerNet = ms.amount - commissionValue;

                  return (
                    <div key={ms.title || index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                            status === 'released'
                              ? 'bg-emerald-50 text-emerald-500 border-emerald-300'
                              : status === 'submitted' || status === 'approved'
                              ? 'bg-amber-50 text-amber-500 border-amber-300'
                              : status === 'funded'
                              ? 'bg-blue-50 text-blue-500 border-blue-300'
                              : 'bg-gray-50 text-muted border-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {index < milestones.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border my-1 min-h-[32px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-text">{ms.title}</h3>
                            <p className="text-xs text-muted mt-0.5">
                              {ms.releasedAt
                                ? `Released ${formatDate(ms.releasedAt)}`
                                : ms.submittedAt
                                ? `Submitted ${formatDate(ms.submittedAt)}`
                                : ms.fundedAt
                                ? `Funded ${formatDate(ms.fundedAt)}`
                                : 'Not yet funded'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-text">{formatCurrencyUtil(ms.amount / 100, currency)}</p>
                            <Badge color={config.color} className="mt-1 font-bold">{config.label}</Badge>
                          </div>
                        </div>

                        {/* Submission Info */}
                        {ms.submissionNotes && (
                          <div className="p-3 bg-gray-50 rounded-xl mt-2 text-xs border border-gray-200">
                            <span className="font-bold text-text block mb-0.5">Freelancer submitted work:</span>
                            <p className="text-muted italic">"{ms.submissionNotes}"</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3">
                          {status === 'submitted' && isClient && (
                            <Button 
                              size="sm" 
                              disabled={processing} 
                              onClick={() => handleApproveAndRelease(ms._id)}
                            >
                              Approve & Release
                            </Button>
                          )}
                          {status === 'funded' && isClient && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={processing} 
                              onClick={() => handleRelease(ms._id)}
                            >
                              Release Payment
                            </Button>
                          )}
                          {status === 'approved' && isClient && (
                            <Button 
                              size="sm" 
                              disabled={processing} 
                              onClick={() => handleRelease(ms._id)}
                            >
                              Release Escrow
                            </Button>
                          )}
                          {(status === 'funded' || status === 'submitted') && isFreelancer && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleRequestRelease}
                            >
                              Request Release
                            </Button>
                          )}
                          {status === 'released' && (
                            <div className="text-xs text-muted flex flex-col gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Payout Completed
                                </span>
                                <span>Freelancer paid: {formatCurrencyUtil(freelancerNet / 100, currency)} (after {actualRate * 100}% commission)</span>
                              </div>
                              {isClient && !reviewingMilestone && (
                                <Button size="sm" variant="outline" onClick={() => setReviewingMilestone(ms._id)}>
                                  Leave a Review
                                </Button>
                              )}
                              {isClient && reviewingMilestone === ms._id && (
                                <div className="p-3 bg-white border border-border rounded-lg mt-2 flex flex-col gap-2 shadow-sm">
                                  <label className="font-semibold text-text text-sm">Rating (1-5)</label>
                                  <input 
                                    type="number" 
                                    min="1" max="5" 
                                    value={rating} 
                                    onChange={e => setRating(Number(e.target.value))}
                                    className="border border-border p-1 rounded-md"
                                  />
                                  <label className="font-semibold text-text text-sm">Comment</label>
                                  <textarea 
                                    value={reviewComment} 
                                    onChange={e => setReviewComment(e.target.value)}
                                    className="border border-border p-2 rounded-md"
                                    rows="2"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" disabled={processing} onClick={() => handleSubmitReview(contract.freelancer?._id || contract.freelancer)}>Submit Review</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setReviewingMilestone(null)}>Cancel</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Milestone</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isPayout = tx.type === 'payout';
                      const isCommission = tx.type === 'commission';
                      const isEscrow = tx.type === 'escrow_fund';

                      return (
                        <tr key={tx._id} className="border-b border-border/50">
                          <td className="py-3 text-text capitalize font-medium">
                            {tx.type ? tx.type.replace('_', ' ') : 'Stripe funding'}
                          </td>
                          <td className="py-3 text-muted">{tx.milestone || '—'}</td>
                          <td className={`py-3 font-semibold ${
                            isPayout ? 'text-green-600' : isCommission ? 'text-red-500' : 'text-text'
                          }`}>
                            {isCommission ? '-' : '+'}{formatCurrencyUtil(tx.amount / 100, currency)}
                          </td>
                          <td className="py-3">
                            <Badge color={
                              tx.status === 'completed' || tx.status === 'released' ? 'success' :
                              tx.status === 'held' ? 'secondary' : 'muted'
                            }>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted text-xs">{formatDate(tx.createdAt)}</td>
                        </tr>
                      );
                    })}
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
              <div>
                <label className="text-xs text-muted block mb-1">Select Milestone</label>
                <select 
                  value={selectedMilestone}
                  onChange={(e) => {
                    const sel = milestones.find(m => m.title === e.target.value);
                    setSelectedMilestone(e.target.value);
                    if (sel) {
                      setSelectedMilestoneId(sel._id);
                      setFundAmount(String(sel.amount / 100));
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm"
                  required
                >
                  <option value="">Select a milestone</option>
                  {milestones.filter(m => m.status === 'pending').map((m) => (
                    <option key={m._id || m.title} value={m.title}>
                      {m.title} (${(m.amount / 100).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount ($)"
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                required
              />

              {/* Commission Preview Card */}
              {fundVal > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-150 text-xs space-y-1">
                  <span className="font-bold text-indigo-900 block mb-1 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-700" /> Platform Commission Preview
                  </span>
                  <div className="flex justify-between">
                    <span className="text-muted">Milestone total:</span>
                    <span className="font-semibold text-text">{formatCurrencyUtil(fundVal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Commission ({commissionRate * 100}%):</span>
                    <span>-{formatCurrencyUtil(commAmt, currency)}</span>
                  </div>
                  <div className="h-px bg-indigo-200/50 my-1" />
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>Freelancer receives:</span>
                    <span>{formatCurrencyUtil(netPay, currency)}</span>
                  </div>
                </div>
              )}

              <Input label="Card number" placeholder="4242 4242 4242 4242" disabled />
              
              <div className="p-3 rounded-lg bg-surface border border-border text-xs text-muted">
                <Lock className="w-4 h-4 inline mr-1 text-secondary" />
                Stripe test mode — funds held in escrow until milestone approval.
              </div>

              <Button type="submit" className="w-full animate-hover" disabled={processing || !selectedMilestone}>
                {processing ? 'Processing...' : 'Fund Escrow'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
