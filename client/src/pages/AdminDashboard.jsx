import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { 
  Users, Briefcase, DollarSign, AlertTriangle, Activity, Ban, 
  ChevronLeft, ChevronRight, Search, Shield, Globe, Lock, Bell, 
  Monitor, Trash2, CheckCircle2, XCircle, MapPin, Laptop, LogOut
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import api from '../services/api';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';

const chartTooltipStyle = {
  contentStyle: { background: '#ffffff', border: '1px solid #dbdbdb', borderRadius: '12px' },
  labelStyle: { color: '#262626' },
  itemStyle: { color: '#8e8e8e' },
};

const PAGE_SIZE = 10;

export default function AdminDashboard({ section = 'overview' }) {
  const [stats, setStats] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [banningId, setBanningId] = useState(null);

  const loadStats = useCallback(async (signal) => {
    try {
      const [statsRes, fraudRes] = await Promise.all([
        api.get('/admin/stats', { signal }),
        api.get('/admin/fraud-alerts', { signal }),
      ]);
      if (signal?.aborted) return;
      setStats(statsRes.data);
      setFraudAlerts(fraudRes.data || []);
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    }
  }, []);

  const loadUsers = useCallback(async (page, signal) => {
    try {
      setUsersLoading(true);
      const { data } = await api.get('/admin/users', { params: { page, limit: PAGE_SIZE }, signal });
      if (signal?.aborted) return;
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setUsersLoading(false);
    }
  }, []);

  const loadProjectsData = useCallback(async (signal) => {
    try {
      setProjectsLoading(true);
      const [projectsRes, proposalsRes] = await Promise.all([
        api.get('/projects', { signal }),
        api.get('/proposals', { signal }),
      ]);
      if (signal?.aborted) return;
      setProjects(projectsRes.data || []);
      setProposals(proposalsRes.data || []);
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setProjectsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (signal) => {
    try {
      setTransactionsLoading(true);
      const { data } = await api.get('/payments', { signal });
      if (signal?.aborted) return;
      setTransactions(data || []);
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      const promises = [loadStats(controller.signal)];
      if (section === 'overview' || section === 'users') promises.push(loadUsers(1, controller.signal));
      if (section === 'projects') promises.push(loadProjectsData(controller.signal));
      if (section === 'transactions') promises.push(loadTransactions(controller.signal));
      
      await Promise.all(promises);
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [section, loadStats, loadUsers, loadProjectsData, loadTransactions]);

  const handlePageChange = (newPage) => {
    const controller = new AbortController();
    loadUsers(newPage, controller.signal);
  };

  const handleBan = async (userId, userName) => {
    if (!window.confirm(`Ban user "${userName}"?`)) return;
    setBanningId(userId);
    try {
      await api.patch(`/admin/users/${userId}/ban`);
      toast.success(`${userName} has been banned`);
      const controller = new AbortController();
      await loadUsers(pagination.page, controller.signal);
      await loadStats(controller.signal);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBanningId(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const query = searchQuery.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(query) ||
      tx.type?.toLowerCase().includes(query) ||
      tx.project?.title?.toLowerCase().includes(query) ||
      tx.status?.toLowerCase().includes(query) ||
      tx.amount?.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-12 font-body"
    >
      <div>
        <h1 className="font-display text-3xl font-black text-text">
          {section === 'overview' && 'Admin Dashboard'}
          {section === 'users' && 'User Management'}
          {section === 'projects' && 'Project Monitoring'}
          {section === 'transactions' && 'Transaction Monitoring'}
          {section === 'fraud' && 'Fraud Alerts'}
          {section === 'disputes' && 'Dispute Resolution'}
          {section === 'analytics' && 'Platform Analytics'}
          {section === 'settings' && 'Platform Settings'}
        </h1>
        <p className="text-mid mt-2 text-lg font-light">Platform overview and management</p>
      </div>

      {(section === 'overview' || section === 'analytics') && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '—', icon: Users, growth: stats?.userGrowth },
              { label: 'Active Projects', value: stats?.activeProjects?.toLocaleString() ?? '—', icon: Briefcase, growth: stats?.projectGrowth },
              { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, growth: stats?.revenueGrowth },
              { label: 'Fraud Alerts', value: stats?.fraudAlerts ?? 0, icon: AlertTriangle, growth: null },
            ].map(({ label, value, icon: Icon, growth }, index) => (
              <Card 
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-8 h-8 text-accent opacity-80" />
                  {growth != null && <span className="text-xs text-success font-bold">+{growth}%</span>}
                </div>
                <p className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.03em] text-btn-blue mt-4 mb-1">{value}</p>
                <p className="text-[13px] text-mid font-medium">{label}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-secondary" />
              <h3 className="card-title">Platform Health</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'API Latency', value: `${stats?.platformHealth?.apiLatency ?? 0}ms` },
                { label: 'Uptime', value: `${stats?.platformHealth?.uptime ?? 0}%` },
                { label: 'Error Rate', value: `${stats?.platformHealth?.errorRate ?? 0}%` },
                { label: 'Active Connections', value: stats?.platformHealth?.activeConnections?.toLocaleString() ?? '0' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-4 rounded-lg bg-surface border border-border">
                  <p className="text-2xl font-bold text-text">{value}</p>
                  <p className="text-sm text-muted mt-1 font-light">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {section === 'projects' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="card-title">Project Monitoring</h3>
            <Badge color="accent">{projects.length} Total Projects</Badge>
          </div>
          {projectsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-border text-left uppercase text-[10px] font-bold tracking-widest">
                    <th className="pb-3 px-2">Project Name</th>
                    <th className="pb-3 px-2">Budget</th>
                    <th className="pb-3 px-2">Applied</th>
                    <th className="pb-3 px-2 text-error">Rejected</th>
                    <th className="pb-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {projects.map((p) => {
                    const rejectedCount = proposals.filter(pr => pr.project?._id === p._id && pr.status === 'rejected').length;
                    return (
                      <tr key={p._id} className="group hover:bg-surface transition-colors">
                        <td className="py-4 px-2 font-bold text-text">{p.title}</td>
                        <td className="py-4 px-2 text-muted">{formatCurrency(p.budget)}</td>
                        <td className="py-4 px-2 font-black text-text">{p.proposalsCount || 0}</td>
                        <td className="py-4 px-2 font-black text-error">{rejectedCount}</td>
                        <td className="py-4 px-2">
                          <Badge color={p.status === 'open' ? 'success' : p.status === 'completed' ? 'accent' : 'warning'}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-muted">No projects found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {section === 'transactions' && (
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="card-title">Transaction Monitoring</h3>
              <p className="text-2xl font-black text-text mt-1">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">Total Platform Revenue</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {transactionsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-border text-left uppercase text-[10px] font-bold tracking-widest">
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2">Project</th>
                    <th className="pb-3 px-2">Amount</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx._id} className="group hover:bg-surface transition-colors">
                      <td className="py-4 px-2">
                        <span className="capitalize font-bold text-text">{tx.type?.replace('_', ' ')}</span>
                      </td>
                      <td className="py-4 px-2 text-muted">{tx.project?.title || '—'}</td>
                      <td className="py-4 px-2 font-black text-text">{formatCurrency(tx.amount)}</td>
                      <td className="py-4 px-2">
                        <Badge color={tx.status === 'released' ? 'success' : tx.status === 'held' ? 'warning' : 'danger'}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-2 text-muted">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-muted">No transactions matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {section === 'users' && (
        <Card>
          <h3 className="card-title mb-6">User Management</h3>
          {usersLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted border-b border-border">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Role</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-border/50">
                        <td className="py-3">
                          <p className="text-text">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </td>
                        <td className="py-3">
                          <Badge color="accent">{u.role}</Badge>
                        </td>
                        <td className="py-3">
                          <Badge color={u.status === 'active' ? 'success' : 'danger'}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {u.role !== 'admin' && u.status !== 'suspended' && (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={banningId === u._id}
                              onClick={() => handleBan(u._id, u.name)}
                            >
                              <Ban className="w-3 h-3" /> Ban
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted font-light">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {section === 'settings' && <AdminSettingsView />}
    </motion.div>
  );
}

function AdminSettingsView() {
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  return (
    <div className="space-y-8 max-w-4xl">
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Shield className="w-4 h-4" /> Account Security
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <h3 className="font-bold text-text flex items-center gap-2">
              <Lock className="w-4 h-4" /> Change Password
            </h3>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <Input type="password" placeholder="Current Password" required />
              <Input type="password" placeholder="New Password" required />
              <Input type="password" placeholder="Confirm New Password" required />
              <Button type="submit" className="w-full">Update Password</Button>
            </form>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-text">Two-Factor Authentication</h3>
                  <p className="text-xs text-muted mt-1">Add an extra layer of security to your account.</p>
                </div>
                <button 
                  onClick={() => setIs2faEnabled(!is2faEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${is2faEnabled ? 'bg-success' : 'bg-border'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${is2faEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Status:</span>
                {is2faEnabled ? (
                  <span className="text-xs font-bold text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Enabled</span>
                ) : (
                  <span className="text-xs font-bold text-muted flex items-center gap-1"><XCircle className="w-3 h-3" /> Disabled</span>
                )}
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6" onClick={() => toast.success('2FA config required')}>Configure</Button>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Monitor className="w-4 h-4" /> Platform Configuration
        </h2>
        <Card className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Input label="Platform Name" defaultValue="Suruthi Global Talent Network" />
            <Input label="Support Email" defaultValue="support@suruthi.ai" />
          </div>
          <div className="space-y-4">
            <p className="text-sm font-bold text-text">Commission Rates</p>
            <div className="space-y-2">
              {[
                { label: 'Free Tier', value: '10%' },
                { label: 'Pro Tier', value: '5%' },
                { label: 'Elite Tier', value: '0%' },
              ].map((rate) => (
                <div key={rate.label} className="flex justify-between p-2 rounded-lg bg-surface border border-border/50">
                  <span className="text-xs text-muted">{rate.label}</span>
                  <span className="text-xs font-bold text-text">{rate.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted italic flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Edit commission rates requires super admin access
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notification Preferences
        </h2>
        <Card>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              'Email notifications',
              'Push notifications',
              'Weekly reports',
              'System alerts'
            ].map((pref) => (
              <div key={pref} className="flex items-center justify-between p-2">
                <span className="text-sm font-medium text-text">{pref}</span>
                <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-success">
                  <span className="inline-block h-3 w-3 transform translate-x-5 rounded-full bg-white" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Laptop className="w-4 h-4" /> Session Management
        </h2>
        <Card className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 font-bold text-muted uppercase text-[10px] tracking-widest">Device</th>
                  <th className="pb-3 font-bold text-muted uppercase text-[10px] tracking-widest">Location</th>
                  <th className="pb-3 font-bold text-muted uppercase text-[10px] tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  { device: 'MacBook Pro - Chrome', loc: 'Chennai, India', current: true },
                  { device: 'iPhone 15 - Safari', loc: 'Bangalore, India', current: false },
                ].map((session, i) => (
                  <tr key={i}>
                    <td className="py-4 font-medium text-text flex items-center gap-2">
                      {session.device}
                      {session.current && <Badge size="sm" color="success">Current</Badge>}
                    </td>
                    <td className="py-4 text-muted flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.loc}</td>
                    <td className="py-4 text-right">
                      {!session.current && <Button size="sm" variant="ghost" className="text-error">Revoke</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" className="text-error border-error/30 hover:bg-error/5 flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Log Out All Devices
          </Button>
        </Card>
      </section>

      <section className="space-y-4 pt-8 border-t border-border">
        <h2 className="text-sm font-black uppercase tracking-widest text-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h2>
        <Card className="border-error/20 bg-error/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-text">Delete Account</h3>
              <p className="text-xs text-muted mt-1">Permanently delete your admin account and all associated data.</p>
            </div>
            <Button variant="danger" className="sm:w-auto w-full">Delete Account</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

