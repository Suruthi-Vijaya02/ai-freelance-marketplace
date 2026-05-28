import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, Briefcase, DollarSign, AlertTriangle, Activity, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { adminService } from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';

const revenueData = [
  { month: 'Jan', revenue: 180000 },
  { month: 'Feb', revenue: 210000 },
  { month: 'Mar', revenue: 195000 },
  { month: 'Apr', revenue: 240000 },
  { month: 'May', revenue: 285000 },
];

const userGrowthData = [
  { month: 'Jan', users: 8200 },
  { month: 'Feb', users: 9100 },
  { month: 'Mar', users: 10200 },
  { month: 'Apr', users: 11500 },
  { month: 'May', users: 12450 },
];

const severityColors = {
  critical: 'danger',
  high: 'warning',
  medium: 'muted',
};

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
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [banningId, setBanningId] = useState(null);

  const loadStats = useCallback(async (signal) => {
    try {
      const [statsRes, fraudRes] = await Promise.all([
        adminService.getStats(),
        adminService.getFraudAlerts(),
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
      const { data } = await adminService.getUsers({ page, limit: PAGE_SIZE });
      if (signal?.aborted) return;
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      await loadStats(controller.signal);
      await loadUsers(1, controller.signal);
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [loadStats, loadUsers]);

  const handlePageChange = (newPage) => {
    const controller = new AbortController();
    loadUsers(newPage, controller.signal);
  };

  const handleBan = async (userId, userName) => {
    if (!window.confirm(`Ban user "${userName}"?`)) return;
    setBanningId(userId);
    try {
      await adminService.banUser(userId);
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

  const platformHealth = stats?.platformHealth;

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text">
          {section === 'overview' && 'Admin Dashboard'}
          {section === 'users' && 'User Management'}
          {section === 'projects' && 'Project Monitoring'}
          {section === 'transactions' && 'Transaction Monitoring'}
          {section === 'fraud' && 'Fraud Alerts'}
          {section === 'disputes' && 'Dispute Resolution'}
          {section === 'analytics' && 'Platform Analytics'}
        </h1>
        <p className="text-muted mt-1 font-light">Platform overview and management</p>
      </div>

      {(section === 'overview' || section === 'analytics') && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '—', icon: Users, growth: stats?.userGrowth },
              { label: 'Active Projects', value: stats?.activeProjects?.toLocaleString() ?? '—', icon: Briefcase, growth: stats?.projectGrowth },
              { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, growth: stats?.revenueGrowth },
              { label: 'Fraud Alerts', value: stats?.fraudAlerts ?? 0, icon: AlertTriangle, growth: null },
            ].map(({ label, value, icon: Icon, growth }) => (
              <Card key={label}>
                <div className="flex items-center justify-between">
                  <Icon className="w-8 h-8 text-primary opacity-80" />
                  {growth != null && <span className="text-xs text-primary">+{growth}%</span>}
                </div>
                <p className="text-2xl font-black text-text mt-3">{value}</p>
                <p className="text-sm text-muted font-light">{label}</p>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="font-bold text-text mb-4">Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1DBF73" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1DBF73" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbdbdb" />
                  <XAxis dataKey="month" stroke="#8FA1A7" fontSize={12} />
                  <YAxis stroke="#8FA1A7" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="revenue" stroke="#1DBF73" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="font-bold text-text mb-4">User Growth</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbdbdb" />
                  <XAxis dataKey="month" stroke="#8FA1A7" fontSize={12} />
                  <YAxis stroke="#8FA1A7" fontSize={12} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="users" fill="#4FE3C1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {(section === 'overview' || section === 'fraud') && (
        <Card>
          <h2 className="font-bold text-text mb-4">Fraud Alerts</h2>
          {fraudAlerts.length === 0 ? (
            <p className="text-muted text-sm">No fraud alerts.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-border">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Severity</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudAlerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-border/50">
                      <td className="py-3 text-text">{alert.user}</td>
                      <td className="py-3 text-muted">{alert.type}</td>
                      <td className="py-3">
                        <Badge color={severityColors[alert.severity] || 'muted'}>{alert.severity}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge color={alert.status === 'resolved' ? 'success' : 'warning'}>
                          {alert.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {(section === 'overview' || section === 'users') && (
        <Card>
          <h2 className="font-bold text-text mb-4">User Management</h2>
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

      {section === 'projects' && (
        <Card>
          <h2 className="font-bold text-text mb-4">Project Monitoring</h2>
          <p className="text-muted text-sm">
            {stats?.activeProjects ?? 0} active projects on the platform. Use the overview dashboard for full stats.
          </p>
        </Card>
      )}

      {section === 'transactions' && (
        <Card>
          <h2 className="font-bold text-text mb-4">Transaction Monitoring</h2>
          <p className="text-2xl font-black text-text">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
          <p className="text-sm text-muted mt-1">Total platform revenue</p>
        </Card>
      )}

      {section === 'disputes' && (
        <Card>
          <h2 className="font-bold text-text mb-4">Dispute Resolution</h2>
          <p className="text-muted text-sm">No open disputes at this time.</p>
        </Card>
      )}

      {(section === 'overview') && platformHealth && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-secondary" />
            <h2 className="font-bold text-text">Platform Health</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'API Latency', value: `${platformHealth.apiLatency}ms` },
              { label: 'Uptime', value: `${platformHealth.uptime}%` },
              { label: 'Error Rate', value: `${platformHealth.errorRate}%` },
              { label: 'Active Connections', value: platformHealth.activeConnections?.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 rounded-lg bg-surface border border-border">
                <p className="text-2xl font-bold text-text">{value}</p>
                <p className="text-sm text-muted mt-1 font-light">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
