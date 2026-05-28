import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import { buildConversationId } from './messageController.js';
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

    // Auto-create conversation between freelancer and client on proposal submission
    try {
      const convId = buildConversationId(populated.freelancer._id, project.client);
      const sysMsg = await Message.create({
        conversationId: convId,
        sender: populated.freelancer._id,
        receiver: project.client,
        content: `Proposal submitted for project: ${project.title}`,
      });
      const populatedMsg = await sysMsg.populate('sender', 'name avatar');
      if (io) {
        io.to(`conversation:${convId}`).emit('new_message', {
          id: populatedMsg._id,
          conversationId: convId,
          sender: populatedMsg.sender,
          receiver: project.client,
          content: populatedMsg.content,
          timestamp: populatedMsg.createdAt,
        });
      }
    } catch (e) {
      console.warn('Failed to auto-create conversation for proposal:', e.message);
    }

    return res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already submitted a proposal for this project' });
    }
    return res.status(500).json({ message: err.message });
  }
}

export async function getProposals(req, res) {
  try {
    const { project } = req.query;
    if (!project) {
      return res.status(400).json({ message: 'Project id is required' });
    }

    const proposals = await Proposal.find({ project })
      .populate('freelancer', 'name avatar title rating skills hourlyRate')
      .sort({ matchScore: -1, createdAt: -1 });
    return res.json(proposals);
  } catch (err) {
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

export async function getMyProposals(req, res) {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate('project', 'title budget status client')
      .populate('freelancer', 'name avatar title rating')
      .sort({ createdAt: -1 });
    return res.json(proposals);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function updateProposalStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected' });
    }

    const proposal = await Proposal.findById(req.params.id).populate('project');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    const project = await Project.findById(proposal.project._id || proposal.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can manage proposals' });
    }

    proposal.status = status;
    await proposal.save();

    if (status === 'accepted') {
      await Project.findByIdAndUpdate(project._id, { status: 'in_progress' });
      await Proposal.updateMany(
        { project: project._id, _id: { $ne: proposal._id } },
        { status: 'rejected' }
      );
    }

    const populated = await Proposal.findById(proposal._id)
      .populate('freelancer', 'name avatar title rating skills hourlyRate')
      .populate('project', 'title budget status');

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${project._id}`).emit('proposal_updated', {
        id: populated._id.toString(),
        projectId: project._id.toString(),
        status: populated.status,
        freelancerId: populated.freelancer?._id?.toString(),
      });
    }

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
