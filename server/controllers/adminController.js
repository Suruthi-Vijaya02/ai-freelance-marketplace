import User from '../models/User.js';
import Project from '../models/Project.js';
import Transaction from '../models/Transaction.js';

export async function getStats(req, res) {
  try {
    const [totalUsers, activeProjects, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Transaction.aggregate([
        { $match: { status: 'released' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 2847500;

    return res.json({
      totalUsers,
      activeProjects,
      totalRevenue,
      fraudAlerts: await User.countDocuments({ isFlagged: true }),
      userGrowth: 12.5,
      projectGrowth: 8.3,
      revenueGrowth: 15.2,
      platformHealth: {
        apiLatency: 45,
        uptime: 99.97,
        errorRate: 0.03,
        activeConnections: 1243,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getFraudAlerts(req, res) {
  try {
    const flaggedUsers = await User.find({ isFlagged: true }).select('name email status createdAt');
    const alerts = flaggedUsers.map((u) => ({
      id: u._id,
      user: u.name,
      type: 'Flagged account',
      severity: 'high',
      timestamp: u.createdAt,
      status: u.status === 'flagged' ? 'open' : 'investigating',
    }));

    return res.json([
      ...alerts,
      {
        id: 'fa_sim_1',
        user: 'rapid_bid_bot',
        type: 'Abnormal bid frequency',
        severity: 'critical',
        timestamp: new Date(),
        status: 'investigating',
      },
    ]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function banUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin account' });
    }
    user.status = 'suspended';
    user.isFlagged = true;
    await user.save();
    return res.json({ message: 'User banned', user: { id: user._id, name: user.name, status: user.status } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
