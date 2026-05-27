import Project from '../models/Project.js';
import User from '../models/User.js';

export async function getPlatformStats(_req, res) {
  try {
    const [totalUsers, totalProjects, totalFreelancers, completedProjects] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      User.countDocuments({ role: 'freelancer', status: 'active' }),
      Project.countDocuments({ status: 'completed' }),
    ]);

    return res.json({
      totalUsers,
      totalProjects,
      totalFreelancers,
      completedProjects,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
