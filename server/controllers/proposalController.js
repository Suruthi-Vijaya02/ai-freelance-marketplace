import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import { calculateMatchScore } from '../services/aiMatchingService.js';

export async function submitProposal(req, res) {
  try {
    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const matchScore = calculateMatchScore(req.user.skills, project.skills);

    const proposal = await Proposal.create({
      ...req.body,
      freelancer: req.user._id,
      matchScore,
    });

    await Project.findByIdAndUpdate(project._id, { $inc: { proposalsCount: 1 } });

    const populated = await proposal.populate('freelancer', 'name avatar title rating skills hourlyRate');

    const io = req.app.get('io');
    if (io) {
      const f = populated.freelancer;
      io.to(`project:${project._id}`).emit('new_bid', {
        id: populated._id.toString(),
        projectId: project._id.toString(),
        freelancerName: f?.name || 'Freelancer',
        avatar: f?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f?.name}`,
        price: populated.price,
        timeline: populated.timeline,
        matchScore: populated.matchScore,
        coverLetter: populated.coverLetter,
        submittedAt: populated.createdAt,
        status: populated.status,
      });
    }

    return res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already submitted a proposal for this project' });
    }
    return res.status(500).json({ message: err.message });
  }
}

export async function getProposalsByProject(req, res) {
  try {
    const proposals = await Proposal.find({ project: req.params.id })
      .populate('freelancer', 'name avatar title rating skills hourlyRate')
      .sort({ matchScore: -1, createdAt: -1 });
    return res.json(proposals);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
