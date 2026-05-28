import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { paymentService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState({ total: 0, count: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  const loadEarnings = useCallback(async (signal) => {
    try {
      setLoading(true);
      const { data } = await paymentService.getMyEarnings();
      if (!signal?.aborted) setEarnings(data || { total: 0, count: 0, transactions: [] });
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadEarnings(controller.signal);
    return () => controller.abort();
  }, [loadEarnings]);

  const chartData = (earnings.transactions || []).slice(0, 6).reverse().map((tx, i) => ({
    name: tx.milestone || `Payment ${i + 1}`,
    amount: tx.amount,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">Earnings & Payouts</h1>
        <p className="text-muted mt-1 font-light">Track your released payments and request payouts</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <DollarSign className="w-8 h-8 text-secondary mb-3" />
          <p className="text-3xl font-black text-text">{formatCurrency(earnings.total || 0)}</p>
          <p className="text-sm text-muted mt-1">Total earned</p>
        </Card>
        <Card>
          <Briefcase className="w-8 h-8 text-primary mb-3" />
          <p className="text-3xl font-black text-text">{earnings.count || 0}</p>
          <p className="text-sm text-muted mt-1">Completed payments</p>
        </Card>
        <Card>
          <TrendingUp className="w-8 h-8 text-success mb-3" />
          <p className="text-3xl font-black text-text">
            {earnings.transactions?.length
              ? formatCurrency(earnings.transactions[0]?.amount || 0)
              : '$0'}
          </p>
          <p className="text-sm text-muted mt-1">Latest payment</p>
        </Card>
      </div>

      {earnings.count === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted">No completed projects yet.</p>
          <Link to="/projects" className="inline-block mt-4">
            <Button>Browse Projects</Button>
          </Link>
        </Card>
      ) : (
        <>
          {chartData.length > 0 && (
            <Card>
              <h2 className="font-bold text-text mb-4">Earnings Overview</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1DBF73" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1DBF73" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbdbdb" />
                  <XAxis dataKey="name" stroke="#8FA1A7" fontSize={12} />
                  <YAxis stroke="#8FA1A7" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="#1DBF73" fill="url(#earnGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-text">Transaction History</h2>
              <Button size="sm" variant="outline" onClick={() => toast.success('Payout request submitted')}>
                Request Payout
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-border">
                    <th className="text-left py-2">Milestone</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(earnings.transactions || []).map((tx) => (
                    <tr key={tx._id} className="border-b border-border/50">
                      <td className="py-3 text-text">{tx.milestone || 'Payment'}</td>
                      <td className="py-3 text-secondary font-medium">{formatCurrency(tx.amount)}</td>
                      <td className="py-3 text-muted">{formatDate(tx.releasedAt || tx.createdAt)}</td>
                      <td className="py-3 text-success capitalize">{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
