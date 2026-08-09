import Project from '../models/Project.js';
import User from '../models/User.js';
import Proposal from '../models/Proposal.js';
import Transaction from '../models/Transaction.js';
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
    const { search, skills, category, status, mine, limit, budgetMin, budgetMax } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = { $regex: category, $options: 'i' };

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

    // Enforce visibility: only show public projects or owned private projects
    const publicOrOwned = [
      { visibility: 'public' },
      { visibility: { $exists: false } },
      { visibility: null },
    ];
    if (req.user) {
      publicOrOwned.push({ client: req.user._id });
    }

    if (!req.user || (req.user.role !== 'admin' && mine !== 'true')) {
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: publicOrOwned },
        ];
        delete filter.$or;
      } else {
        filter.$or = publicOrOwned;
      }
    }

    let query = Project.find(filter)
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 });

    if (limit) query = query.limit(Number(limit));

    let projects = await query;

    if (req.user?.role === 'freelancer' && req.user.skills?.length) {
      projects = await rankProjectsForFreelancer(projects, req.user);
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

export async function getHiredProjects(req, res) {
  try {
    const accepted = await Proposal.find({
      freelancer: req.user._id,
      status: 'accepted',
    }).populate('project');

    const projects = accepted
      .map((p) => p.project)
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name avatar email')
      .populate('acceptedProposal');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const freelancers = await User.find({ role: 'freelancer', status: 'active' }).limit(10);
    const matches = await rankFreelancersForProject(freelancers, project);

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
    const matches = await rankFreelancersForProject(freelancers, project);
    return res.json(matches);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Update project lifecycle dates (startDate, endDate, completedAt)
export async function updateProjectLifecycle(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { startDate, endDate, completedAt, acceptedProposal } = req.body;
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) project.endDate = endDate ? new Date(endDate) : null;
    if (completedAt !== undefined) project.completedAt = completedAt ? new Date(completedAt) : null;
    if (acceptedProposal !== undefined) project.acceptedProposal = acceptedProposal || null;

    await project.save();
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Compute and update totalSpent from released transactions for a project
export async function updateProjectTotalSpent(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const transactions = await Transaction.find({
      project: project._id,
      status: 'released',
    });

    const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    project.totalSpent = totalSpent;
    await project.save();

    return res.json({ totalSpent, project });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function updateProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(project, req.body);
    await project.save();
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function deleteProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Project.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

