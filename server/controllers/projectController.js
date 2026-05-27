import Project from '../models/Project.js';
import User from '../models/User.js';
import {
  rankProjectsForFreelancer,
  rankFreelancersForProject,
} from '../services/aiMatchingService.js';

export async function createProject(req, res) {
  try {
    const project = await Project.create({ ...req.body, client: req.user._id });
    return res.status(201).json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getProjects(req, res) {
  try {
    const { search, skills, status, mine, limit, budgetMin, budgetMax } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (skills) {
      filter.skills = { $in: skills.split(',').map((s) => s.trim()) };
    }

    if (budgetMin || budgetMax) {
      filter.budget = {};
      if (budgetMin) filter.budget.$gte = Number(budgetMin);
      if (budgetMax) filter.budget.$lte = Number(budgetMax);
    }

    if (mine === 'true' && req.user) {
      filter.client = req.user._id;
    }

    let query = Project.find(filter)
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 });

    if (limit) query = query.limit(Number(limit));

    let projects = await query;

    if (req.user?.role === 'freelancer' && req.user.skills?.length) {
      projects = rankProjectsForFreelancer(projects, req.user.skills);
    }

    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getMyProjects(req, res) {
  try {
    const projects = await Project.find({ client: req.user._id })
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 });
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id).populate('client', 'name avatar email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const freelancers = await User.find({ role: 'freelancer', status: 'active' }).limit(10);
    const matches = rankFreelancersForProject(freelancers, project.skills);

    return res.json({ project, aiMatches: matches.slice(0, 5) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getProjectMatches(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const freelancers = await User.find({ role: 'freelancer' });
    const matches = rankFreelancersForProject(freelancers, project.skills);
    return res.json(matches);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
