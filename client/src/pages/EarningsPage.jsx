import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { paymentService } from '../services/authService';
import { formatCurrency, formatDate, getApiErrorMessage } from '../utils/helpers';
import PaymentsHero from '../assets/img6.png';
import { fadeInUp, floatHero, heroReveal, pageFade } from '../utils/motionVariants';

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
    <motion.div initial="hidden" animate="visible" variants={pageFade} className="space-y-8">
      <motion.section variants={heroReveal} className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center rounded-[2rem] bg-white/80 border border-white/20 p-6 shadow-2xl overflow-hidden">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-3xl font-black text-text">Earnings & Payouts</h1>
          <p className="text-mid mt-1 max-w-2xl">Track your released payments, request payouts, and keep your freelance revenue flowing smoothly.</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/payments"><Button>View Payments</Button></Link>
            <Link to="/projects"><Button variant="outline">Browse Projects</Button></Link>
          </div>
        </div>
        <motion.div variants={fadeInUp} className="flex justify-center">
          <motion.img
            src={PaymentsHero}
            alt="Earnings workflow"
            className="w-full max-w-[520px] rounded-[2rem] shadow-2xl border border-white/20"
            variants={floatHero}
          />
        </motion.div>
      </motion.section>

      <div className="text-muted mt-1 font-light">Track your released payments and request payouts</div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-4 p-6">
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
    </motion.div>
  );
}
