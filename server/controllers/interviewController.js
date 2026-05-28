import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { buildConversationId } from './messageController.js';

export async function scheduleInterview(req, res) {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only clients can schedule interviews' });
    }

    const { freelancerId, projectId, scheduledTime, notes } = req.body;
    if (!freelancerId || !scheduledTime) {
      return res.status(400).json({ message: 'freelancerId and scheduledTime are required' });
    }

    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== 'freelancer') {
      return res.status(400).json({ message: 'Invalid freelancer' });
    }

    const interview = await Interview.create({
      projectId: projectId || undefined,
      clientId: req.user._id,
      freelancerId,
      scheduledTime: new Date(scheduledTime),
      notes,
      status: 'scheduled',
    });

    const populated = await Interview.findById(interview._id)
      .populate('clientId', 'name avatar')
      .populate('freelancerId', 'name avatar title')
      .populate('projectId', 'title');

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${freelancerId}`).emit('notification', {
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `${req.user.name} scheduled an interview with you`,
        data: { interviewId: interview._id, roomId: interview.roomId },
      });
    }

    res.status(201).json({
      interview: populated,
      conversationId: buildConversationId(req.user._id, freelancerId),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMyInterviews(req, res) {
  try {
    const userId = req.user._id;
    const filter =
      req.user.role === 'client'
        ? { clientId: userId }
        : req.user.role === 'freelancer'
          ? { freelancerId: userId }
          : {};

    const interviews = await Interview.find(filter)
      .populate('clientId', 'name avatar')
      .populate('freelancerId', 'name avatar title')
      .populate('projectId', 'title')
      .sort({ scheduledTime: 1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getInterviewById(req, res) {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('clientId', 'name avatar')
      .populate('freelancerId', 'name avatar title')
      .populate('projectId', 'title');

    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const userId = req.user._id.toString();
    const allowed =
      interview.clientId._id.toString() === userId ||
      interview.freelancerId._id.toString() === userId ||
      req.user.role === 'admin';

    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    res.json({
      ...interview.toObject(),
      conversationId: buildConversationId(interview.clientId._id, interview.freelancerId._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateInterviewStatus(req, res) {
  try {
    const { status } = req.body;
    const allowedStatuses = ['scheduled', 'accepted', 'declined', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const userId = req.user._id.toString();
    const isClient = interview.clientId.toString() === userId;
    const isFreelancer = interview.freelancerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['accepted', 'declined'].includes(status) && !isFreelancer && !isAdmin) {
      return res.status(403).json({ message: 'Only the invited freelancer can accept or decline' });
    }

    interview.status = status;
    await interview.save();

    const populated = await Interview.findById(interview._id)
      .populate('clientId', 'name avatar')
      .populate('freelancerId', 'name avatar title')
      .populate('projectId', 'title');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
