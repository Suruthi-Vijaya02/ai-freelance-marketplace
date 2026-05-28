import Transaction from '../models/Transaction.js';
import Project from '../models/Project.js';
import { createEscrowPayment, releasePayment } from '../services/paymentService.js';

export async function createEscrow(req, res) {
  try {
    const { project, freelancer, milestone, amount, paymentMethod } = req.body;
    if (!project || !milestone || !amount) {
      return res.status(400).json({ message: 'project, milestone and amount are required' });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) return res.status(404).json({ message: 'Project not found' });

    const payment = await createEscrowPayment({
      amount,
      metadata: { project, milestone },
    });

    const transaction = await Transaction.create({
      project,
      client: req.user._id,
      freelancer: freelancer || undefined,
      milestone,
      amount,
      status: 'escrow',
      paymentMethod: paymentMethod || 'stripe',
      paymentIntentId: payment.id,
    });

    const milestoneItem = projectDoc.milestones?.find((item) => item.title === milestone);
    if (milestoneItem) {
      milestoneItem.status = 'escrow';
      await projectDoc.save();
    }

    return res.status(201).json({ transaction, payment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function releaseMilestone(req, res) {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isClient = transaction.client.toString() === req.user._id.toString();
    if (!isClient && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the client can release escrow payments' });
    }

    if (transaction.status !== 'escrow') {
      return res.status(400).json({ message: 'Only escrowed payments can be released' });
    }

    const payment = await releasePayment(transaction.paymentIntentId);
    transaction.status = 'released';
    transaction.releasedAt = new Date();
    await transaction.save();

    const projectDoc = await Project.findById(transaction.project);
    if (projectDoc) {
      const milestoneItem = projectDoc.milestones?.find((item) => item.title === transaction.milestone);
      if (milestoneItem) {
        milestoneItem.status = 'released';
        await projectDoc.save();
      }
    }

    return res.json({ transaction, payment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getMyEarnings(req, res) {
  try {
    const transactions = await Transaction.find({
      freelancer: req.user._id,
      status: 'released',
    }).populate('project', 'title');

    const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return res.json({ total, count: transactions.length, transactions });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getTransactions(req, res) {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    if (req.user.role === 'admin') {
      // no extra filter — see all
    } else if (req.user.role === 'freelancer') {
      filter.freelancer = req.user._id;
    } else {
      filter.client = req.user._id;
    }

    const transactions = await Transaction.find(filter)
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
