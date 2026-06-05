import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import { buildConversationId } from './messageController.js';
import { emitConversationMessage } from '../utils/emitConversationMessage.js';
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
    if (io && project.biddingEnabled) {
      const f = populated.freelancer;
      io.to(`project:${project._id}`).emit('new_bid', {
        id: populated._id.toString(),
        projectId: project._id.toString(),
        freelancerId: f?._id?.toString(),
        freelancerName: f?.name || 'Freelancer',
        avatar: f?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f?.name}`,
        price: populated.price,
        timeline: populated.timeline,
        estimatedHours: populated.estimatedHours,
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
        emitConversationMessage(io, convId, {
          id: populatedMsg._id,
          _id: populatedMsg._id,
          conversationId: convId,
          sender: populatedMsg.sender,
          receiver: project.client,
          content: populatedMsg.content,
          timestamp: populatedMsg.createdAt,
          createdAt: populatedMsg.createdAt,
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
    let query = {};

    if (project) {
      query.project = project;
    } else if (req.user.role === 'client') {
      // For clients, fetch proposals for all their projects
      const myProjects = await Project.find({ client: req.user._id }).select('_id');
      query.project = { $in: myProjects.map((p) => p._id) };
    } else if (req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Project id is required' });
    }

    const proposals = await Proposal.find(query)
      .populate('freelancer', 'name avatar title rating skills hourlyRate')
      .populate('project', 'title budget status client')
      .sort({ matchScore: -1, createdAt: -1 });
    return res.json(proposals);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getProposalsByProject(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userId = req.user._id.toString();
    const isOwner = project.client.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    const hasOwnProposal = await Proposal.exists({ project: project._id, freelancer: req.user._id });

    if (!isOwner && !isAdmin && !hasOwnProposal) {
      return res.status(403).json({ message: 'Access denied' });
    }

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

export async function updateProposal(req, res) {
  try {
    const proposal = await Proposal.findOne({
      _id: req.params.id,
      freelancer: req.user._id,
    });

    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    if (!['pending', 'rejected'].includes(proposal.status)) {
      return res.status(400).json({ message: 'Only pending or rejected proposals can be updated' });
    }

    const project = await Project.findById(proposal.project);
    if (!project || project.status !== 'open') {
      return res.status(400).json({ message: 'Project is not open for proposals' });
    }

    const { price, timeline, coverLetter } = req.body;
    if (price != null) proposal.price = price;
    if (timeline) proposal.timeline = timeline;
    if (coverLetter) proposal.coverLetter = coverLetter;
    proposal.status = 'pending';
    proposal.matchScore = calculateMatchScore(req.user.skills, project.skills);
    await proposal.save();

    const populated = await proposal.populate('freelancer', 'name avatar title rating skills hourlyRate');

    const io = req.app.get('io');
    if (io && project.biddingEnabled) {
      const f = populated.freelancer;
      io.to(`project:${project._id}`).emit('new_bid', {
        id: populated._id.toString(),
        projectId: project._id.toString(),
        freelancerId: f?._id?.toString(),
        freelancerName: f?.name || 'Freelancer',
        avatar: f?.avatar,
        price: populated.price,
        timeline: populated.timeline,
        estimatedHours: populated.estimatedHours,
        matchScore: populated.matchScore,
        coverLetter: populated.coverLetter,
        status: populated.status,
      });
    }

    return res.json(populated);
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
      await Project.findByIdAndUpdate(project._id, {
        status: 'in_progress',
        hiredFreelancer: proposal.freelancer,
        acceptedProposal: proposal._id,
        startDate: new Date(),
      });
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
