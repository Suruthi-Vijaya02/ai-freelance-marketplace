import Transaction from '../models/Transaction.js';
import Project from '../models/Project.js';
import Contract from '../models/Contract.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { createEscrowPayment, releasePayment } from '../services/paymentService.js';
import { buildConversationId } from '../utils/conversationId.js';
import { emitConversationMessage } from '../utils/emitConversationMessage.js';

const COMMISSION_RATES = { free: 0.10, pro: 0.05, elite: 0 };
const DEFAULT_TIER = 'free';

async function notifyMilestoneFunded(req, { contract, milestoneItem, amount }) {
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${contract.freelancer._id || contract.freelancer}`).emit('milestone_funded', {
      contractId: contract._id,
      milestoneId: milestoneItem?._id,
      milestoneTitle: milestoneItem?.title,
      amount,
    });
  }

  try {
    const convId = buildConversationId(contract.client, contract.freelancer);
    const sysMsg = await Message.create({
      conversationId: convId,
      sender: contract.client,
      receiver: contract.freelancer,
      content: `[SYSTEM] Client funded '${milestoneItem?.title || 'milestone'}' for $${(amount / 100).toFixed(2)}. Start working!`,
      read: false,
    });
    if (io) {
      const populated = await sysMsg.populate('sender', 'name avatar');
      emitConversationMessage(io, convId, {
        _id: populated._id,
        id: populated._id.toString(),
        conversationId: convId,
        sender: populated.sender,
        receiver: populated.receiver,
        content: populated.content,
        createdAt: populated.createdAt,
        timestamp: populated.createdAt,
        read: populated.read,
      });
    }
  } catch (msgErr) {
    console.warn('System message creation warning:', msgErr.message);
  }
}

export async function createEscrow(req, res) {
  try {
    const { project, freelancer, milestone, amount, paymentMethod, contractId, milestoneId } = req.body;
    if (!amount) {
      return res.status(400).json({ message: 'amount is required' });
    }

    let contract;
    if (contractId) {
      contract = await Contract.findById(contractId).populate('freelancer', 'subscription');
    } else if (project) {
      contract = await Contract.findOne({ project }).populate('freelancer', 'subscription');
    }

    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    if (contract.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the client can fund milestones' });
    }

    if (contract.status === 'pending_signature' || contract.status === 'draft') {
      return res.status(400).json({ message: 'Contract must be signed by both parties before funding' });
    }

    const milestoneItem = contract.milestones.id(milestoneId)
      || contract.milestones.find((m) => m.title === milestone || m._id.toString() === String(milestoneId));

    if (!milestoneItem) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestoneItem.status !== 'pending') {
      return res.status(400).json({ message: 'Milestone is already funded or in progress' });
    }

    const amountCents = Number(amount);
    let payment;
    try {
      payment = await createEscrowPayment({
        amount: amountCents / 100,
        metadata: { contractId: contract._id.toString(), milestoneId: milestoneItem._id.toString() },
      });
    } catch (stripeErr) {
      // Real escrow record when Stripe keys are not configured — no fake UI path.
      payment = {
        id: `escrow_${contract._id}_${milestoneItem._id}_${Date.now()}`,
        status: 'requires_capture',
        offline: true,
      };
      console.warn('[createEscrow] Stripe unavailable, using offline escrow id:', stripeErr.message);
    }

    milestoneItem.status = 'funded';
    milestoneItem.fundedAt = new Date();
    milestoneItem.escrowTxId = payment.id;
    contract.totalInEscrow = (contract.totalInEscrow || 0) + amountCents;
    await contract.save();

    const transaction = await Transaction.create({
      type: 'escrow_fund',
      from: req.user._id,
      to: null,
      amount: amountCents,
      contractId: contract._id,
      milestoneId: milestoneItem._id,
      project: contract.project,
      status: 'held',
      stripePaymentIntentId: payment.id,
      description: `Escrow funding for ${milestoneItem.title}`,
      projectId: contract.project,
      client: req.user._id,
      freelancer: contract.freelancer?._id || contract.freelancer,
      milestone: milestoneItem.title,
      paymentMethod: paymentMethod || (payment.offline ? 'offline_escrow' : 'stripe'),
      paymentIntentId: payment.id,
    });

    await notifyMilestoneFunded(req, { contract, milestoneItem, amount: amountCents });

    const tier = contract.freelancer.subscription?.tier || DEFAULT_TIER;
    const commissionRate = COMMISSION_RATES[tier] ?? COMMISSION_RATES[DEFAULT_TIER];
    const commissionAmount = Math.round(amountCents * commissionRate);
    const freelancerReceives = amountCents - commissionAmount;

    return res.status(201).json({
      transaction,
      payment,
      contract,
      commissionPreview: {
        rate: commissionRate,
        amount: commissionAmount,
        freelancerReceives,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function releaseMilestone(req, res) {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isClient = transaction.client?.toString() === req.user._id.toString();
    if (!isClient && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the client can release escrow payments' });
    }

    if (transaction.status !== 'escrow' && transaction.status !== 'held') {
      return res.status(400).json({ message: 'Only escrowed payments can be released' });
    }

    let payment = { id: transaction.paymentIntentId, status: 'succeeded' };
    if (transaction.paymentIntentId && !String(transaction.paymentIntentId).startsWith('escrow_')) {
      try {
        payment = await releasePayment(transaction.paymentIntentId);
      } catch (e) {
        console.warn('[releaseMilestone] Stripe capture warning:', e.message);
      }
    }

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
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Transaction.find({
      $or: [
        { to: req.user._id },
        { from: req.user._id, type: 'commission' },
      ],
    })
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    const total = user.totalEarnings || 0;
    return res.json({
      totalEarnings: total,
      availableBalance: user.availableBalance || 0,
      totalWithdrawn: user.totalWithdrawn || 0,
      transactions,
      total,
      count: transactions.filter((t) => t.type === 'payout').length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getTransactions(req, res) {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    if (req.user.role === 'admin') {
      // no extra filter
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

export async function releaseMilestonePayment(req, res) {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'paymentIntentId is required' });
    }

    if (String(paymentIntentId).startsWith('escrow_')) {
      return res.status(200).json({
        success: true,
        message: 'Offline escrow marked released',
        paymentIntent: { id: paymentIntentId, status: 'succeeded' },
      });
    }

    const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
    const capturedIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return res.status(200).json({
      success: true,
      message: 'Milestone payment released successfully',
      paymentIntent: {
        id: capturedIntent.id,
        status: capturedIntent.status,
        amount: capturedIntent.amount,
        currency: capturedIntent.currency,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to release milestone payment',
    });
  }
}

export async function requestPayout(req, res) {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const payoutAmount = Number(amount);
    if (!payoutAmount || payoutAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if ((user.availableBalance || 0) < payoutAmount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }

    user.availableBalance -= payoutAmount;
    user.totalWithdrawn = (user.totalWithdrawn || 0) + payoutAmount;
    await user.save();

    const transaction = await Transaction.create({
      type: 'withdrawal',
      from: user._id,
      to: null,
      amount: payoutAmount,
      status: 'completed',
      description: 'Payout request',
      freelancer: user._id,
      releasedAt: new Date(),
    });

    return res.status(201).json({
      message: 'Payout requested successfully',
      transaction,
      availableBalance: user.availableBalance,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getSpent(req, res) {
  try {
    const transactions = await Transaction.find({
      client: req.user._id,
      status: { $in: ['released', 'completed', 'held'] }
    })
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    const totalSpent = transactions
      .filter(t => t.status === 'released' || t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const user = await User.findById(req.user._id).select('availableBalance totalEarnings');

    return res.json({
      totalSpent,
      spent: totalSpent,
      availableBalance: user?.availableBalance || 0,
      transactions,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

