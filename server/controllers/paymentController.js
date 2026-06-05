import Transaction from '../models/Transaction.js';
import Project from '../models/Project.js';
import Contract from '../models/Contract.js';
import User from '../models/User.js';
import { createEscrowPayment, releasePayment } from '../services/paymentService.js';

const COMMISSION_RATES = { free: 0.10, pro: 0.05, elite: 0 };
const DEFAULT_TIER = 'free';

// Create a new escrow payment for a project milestone
export async function createEscrow(req, res) {
  try {
    const { project, freelancer, milestone, amount, paymentMethod, contractId } = req.body;
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

    // Use dollars for Stripe PaymentIntent (which expects dollars in createEscrowPayment because it multiplies by 100)
    const payment = await createEscrowPayment({
      amount: amount / 100,
      metadata: { contractId: contract._id.toString(), milestone },
    });

    const milestoneItem = contract.milestones.find(
      (m) => m.title === milestone || m._id.toString() === req.body.milestoneId
    );

    if (milestoneItem) {
      milestoneItem.status = 'funded';
      milestoneItem.fundedAt = new Date();
      milestoneItem.escrowTxId = payment.id;
    }

    contract.totalInEscrow = (contract.totalInEscrow || 0) + amount;
    await contract.save();

    const transaction = await Transaction.create({
      type: 'escrow_fund',
      from: req.user._id,
      to: null, // platform escrow
      amount,
      contractId: contract._id,
      milestoneId: milestoneItem?._id,
      project: contract.project,
      status: 'held',
      stripePaymentIntentId: payment.id,
      description: `Escrow funding for ${milestoneItem?.title || milestone}`,
      
      // compatibility fields:
      projectId: contract.project,
      client: req.user._id,
      freelancer: contract.freelancer?._id || contract.freelancer,
      milestone: milestoneItem?.title || milestone,
      paymentMethod: paymentMethod || 'stripe',
      paymentIntentId: payment.id,
    });

    // Notify freelancer
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${contract.freelancer._id || contract.freelancer}`).emit('milestone_funded', {
        contractId: contract._id,
        milestoneId: milestoneItem?._id,
        milestoneTitle: milestoneItem?.title || milestone,
        amount
      });
    }

    // System Message
    try {
      const { buildConversationId } = await import('./contractController.js');
      const convId = buildConversationId(contract.client, contract.freelancer);
      const Message = (await import('../models/Message.js')).default;
      const sysMsg = await Message.create({
        conversationId: convId,
        sender: contract.client,
        receiver: contract.freelancer,
        content: `[SYSTEM] 💰 Client funded '${milestoneItem?.title || milestone}' for $${(amount / 100).toFixed(2)}. Start working!`,
        read: false
      });
      if (io) {
        const populated = await sysMsg.populate('sender', 'name avatar');
        const { emitConversationMessage } = await import('../utils/emitConversationMessage.js');
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

    // Calculate commission preview for client UI
    const tier = contract.freelancer.subscription?.tier || DEFAULT_TIER;
    const commissionRate = COMMISSION_RATES[tier] ?? COMMISSION_RATES[DEFAULT_TIER];
    const commissionAmount = Math.round(amount * commissionRate);
    const freelancerReceives = amount - commissionAmount;

    return res.status(201).json({ 
      transaction, 
      payment,
      commissionPreview: {
        rate: commissionRate,
        amount: commissionAmount,
        freelancerReceives
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Release funds from escrow to the freelancer after milestone approval
export async function releaseMilestone(req, res) {
  try {
    const { id } = req.params;await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isClient = transaction.client.toString() === req.user._id.toString();
    if (!isClient && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the client can release escrow payments' });
    }

    if (transaction.status !== 'escrow' && transaction.status !== 'held') {
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

// Fetch earnings statistics and available balance for a freelancer
export async function getMyEarnings(req, res) {
  try {
    const userId = req.user._id;await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Transaction.find({
      $or: [
        { to: req.user._id },
        { from: req.user._id, type: 'commission' }
      ]
    })
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    const total = user.totalEarnings || 0;
    return res.json({ 
      totalEarnings: total, 
      availableBalance: user.availableBalance || 0,
      totalWithdrawn: user.totalWithdrawn || 0,
      transactions,
      // Compatibility fields:
      total,
      count: transactions.filter(t => t.type === 'payout').length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Fetch all transactions related to the current user
export async function getTransactions(req, res) {
  try {
    const { project } = req.query;{};
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

/** 
  * Captures a previously authorized Stripe PaymentIntent to release escrowed funds. 
  * Called when a client approves a milestone as complete. 
  */ 
 export const releaseMilestonePayment = async (req, res) => { 
   try { 
     const { paymentIntentId } = req.params; 
 
     if (!paymentIntentId) { 
       return res.status(400).json({ success: false, message: 'paymentIntentId is required' }); 
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
 }; 
