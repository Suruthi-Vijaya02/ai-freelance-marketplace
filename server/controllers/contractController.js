import Contract from '../models/Contract.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { generateBlockchainHash } from '../services/blockchainService.js';
import Message from '../models/Message.js';
import { buildConversationId } from './messageController.js';

// Get all contracts for the current user, either as a client or freelancer
export async function getMyContracts(req, res) {
  try {
    const userId = req.user._id.toString();
    const contracts = await Contract.find({
      $or: [{ client: userId }, { freelancer: userId }]
    })
      .populate('project', 'title budget status')
      .populate('client', 'name avatar')
      .populate('freelancer', 'name avatar title')
      .sort({ createdAt: -1 });
    
    return res.json(contracts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Get a single contract by ID
export async function getContractById(req, res) {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('project', 'title budget status description')
      .populate('client', 'name avatar email')
      .populate('freelancer', 'name avatar title');
    
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    
    const userId = req.user._id.toString();
    const isParty = 
      contract.client._id.toString() === userId || 
      contract.freelancer._id.toString() === userId ||
      req.user.role === 'admin';
    
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });
    
    return res.json(contract);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Create a new contract based on a project and freelancer selection
export async function createContract(req, res) {
  try {
    const { project, freelancer, terms, amount, contractTemplateId, escrowId } = req.body;
    const blockchainHash = generateBlockchainHash({ project, freelancer, terms, amount });

    const contract = await Contract.create({
      project,
      client: req.user._id,
      freelancer,
      terms,
      amount,
      blockchainHash,
      status: 'active',
      ...(contractTemplateId && { contractTemplateId }),
      ...(escrowId && { escrowId }),
    });

    // Auto-create conversation between client and freelancer when contract created
    try {
      const convId = buildConversationId(req.user._id, freelancer);
      const sysMsg = await Message.create({
        conversationId: convId,
        sender: req.user._id,
        receiver: freelancer,
        content: `Contract created for project ${project}`,
      });
      const io = req.app.get('io');
      if (io) {
        const populated = await sysMsg.populate('sender', 'name avatar');
        io.to(`conversation:${convId}`).emit('new_message', {
          id: populated._id,
          conversationId: convId,
          sender: populated.sender,
          receiver: freelancer,
          content: populated.content,
          timestamp: populated.createdAt,
        });
      }
    } catch (e) {
      console.warn('Failed to auto-create conversation for contract:', e.message);
    }

    return res.status(201).json(contract);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Mark a contract as signed by the client or freelancer
export async function signContract(req, res) {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const isClient = contract.client.toString() === req.user._id.toString();
    const isFreelancer = contract.freelancer.toString() === req.user._id.toString();

    if (isClient) {
      contract.clientSignature = { signed: true, signedAt: new Date() };
    } else if (isFreelancer) {
      contract.freelancerSignature = { signed: true, signedAt: new Date() };
    } else {
      return res.status(403).json({ message: 'Not authorized to sign this contract' });
    }

    await contract.save();
    return res.json(contract);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Mark a contract as completed
export async function markContractCompleted(req, res) {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const isParty =
      contract.client.toString() === req.user._id.toString() ||
      contract.freelancer.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    contract.isCompleted = true;
    contract.status = 'completed';
    contract.completedAt = new Date();
    await contract.save();
    return res.json(contract);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Update dispatchStatus safely
export async function updateDispatchStatus(req, res) {
  try {
    const { dispatchStatus } = req.body;
    const allowed = ['pending', 'sent', 'delivered'];
    if (!allowed.includes(dispatchStatus)) {
      return res.status(400).json({ message: 'Invalid dispatchStatus value' });
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const isParty =
      contract.client.toString() === req.user._id.toString() ||
      contract.freelancer.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    contract.dispatchStatus = dispatchStatus;
    await contract.save();
    return res.json(contract);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

const COMMISSION_RATES = { free: 0.10, pro: 0.05, elite: 0 };
const DEFAULT_TIER = 'free';

async function createSystemMessage(req, { contract, content }) {
  try {
    const convId = buildConversationId(contract.client, contract.freelancer);
    const sysMsg = await Message.create({
      conversationId: convId,
      sender: contract.client, // Use client as sender to satisfy required field
      receiver: contract.freelancer, // Use freelancer as receiver
      content: `[SYSTEM] ${content}`,
      read: false
    });
    const io = req.app.get('io');
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

      const notifyTarget = req.user._id.toString() === contract.client.toString()
        ? contract.freelancer
        : contract.client;
      io.to(`user:${notifyTarget}`).emit('notification', {
        type: 'contract_event',
        title: 'Contract Update',
        message: content,
        data: { contractId: contract._id.toString() }
      });
    }
    return sysMsg;
  } catch (err) {
    console.error('Failed to create system message:', err.message);
  }
}

// POST /api/contracts/:id/milestones/:milestoneId/submit
export async function submitMilestone(req, res) {
  try {
    const { id, milestoneId } = req.params;
    const { notes, files } = req.body;

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    if (contract.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only freelancer can submit work' });
    }

    const milestone = contract.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    if (milestone.status !== 'funded' && milestone.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Milestone not active' });
    }

    milestone.status = 'submitted';
    milestone.submittedAt = new Date();
    milestone.submissionNotes = notes || '';
    if (files) milestone.submissionFiles = files;

    await contract.save();

    await createSystemMessage(req, {
      contract,
      content: `📎 Freelancer submitted work for '${milestone.title}'. Awaiting your review.`
    });

    return res.json({ success: true, data: milestone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/contracts/:id/milestones/:milestoneId/approve
export async function approveMilestone(req, res) {
  try {
    const { id, milestoneId } = req.params;

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    if (contract.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only client can approve' });
    }

    const milestone = contract.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Milestone not submitted yet' });
    }

    milestone.status = 'approved';
    milestone.approvedAt = new Date();

    await contract.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${contract.freelancer}`).emit('milestone_approved', {
        contractId: contract._id,
        milestoneId,
        milestoneTitle: milestone.title
      });
    }

    return res.json({ success: true, data: milestone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/contracts/:id/milestones/:milestoneId/release
export async function releaseMilestone(req, res) {
  try {
    const { id, milestoneId } = req.params;

    const contract = await Contract.findById(id)
      .populate('freelancer', 'subscription name email')
      .populate('client', 'name');

    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    if (contract.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only client can release funds' });
    }

    const milestone = contract.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    if (milestone.status !== 'approved' && milestone.status !== 'submitted' && milestone.status !== 'funded') {
      return res.status(400).json({ success: false, message: 'Milestone must be funded/submitted/approved' });
    }

    // Stripe capture simulation if secret key and escrow transaction exists
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (stripeSecret && milestone.escrowTxId) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripeClient = new Stripe(stripeSecret);
        await stripeClient.paymentIntents.capture(milestone.escrowTxId);
      } catch (e) {
        console.warn('Stripe capture warning:', e.message);
      }
    }

    // Calculate commission
    const tier = contract.freelancer.subscription?.tier || DEFAULT_TIER;
    const commissionRate = COMMISSION_RATES[tier] ?? COMMISSION_RATES[DEFAULT_TIER];
    const commissionAmount = Math.round(milestone.amount * commissionRate);
    const freelancerPayout = milestone.amount - commissionAmount;

    // Update status
    milestone.status = 'released';
    milestone.releasedAt = new Date();
    milestone.freelancerPayoutStatus = 'completed';

    contract.totalReleased = (contract.totalReleased || 0) + milestone.amount;
    contract.totalInEscrow = Math.max(0, (contract.totalInEscrow || 0) - milestone.amount);

    const freelancer = await User.findById(contract.freelancer._id || contract.freelancer);
    if (freelancer) {
      freelancer.totalEarnings = (freelancer.totalEarnings || 0) + freelancerPayout;
      freelancer.availableBalance = (freelancer.availableBalance || 0) + freelancerPayout;
      await freelancer.save();
    }

    // Create payout transaction record
    const payoutTx = await Transaction.create({
      type: 'payout',
      from: null, // escrow
      to: contract.freelancer._id || contract.freelancer,
      amount: freelancerPayout,
      contractId: contract._id,
      milestoneId,
      project: contract.project,
      status: 'completed',
      description: `Payout for ${milestone.title}`,
      metadata: { commissionDeducted: commissionAmount, tier },
      
      // compatibility fields:
      projectId: contract.project,
      client: contract.client,
      freelancer: contract.freelancer,
      milestone: milestone.title,
      releasedAt: new Date()
    });

    // Create commission transaction record
    if (commissionAmount > 0) {
      await Transaction.create({
        type: 'commission',
        from: contract.freelancer._id || contract.freelancer,
        to: null, // platform
        amount: commissionAmount,
        contractId: contract._id,
        milestoneId,
        project: contract.project,
        status: 'completed',
        description: `Platform commission (${Math.round(commissionRate * 100)}%)`,
        
        // compatibility fields:
        projectId: contract.project,
        client: contract.client,
        freelancer: contract.freelancer,
        milestone: `${milestone.title} - Commission`
      });
    }

    await contract.save();

    // Create system message
    await createSystemMessage(req, {
      contract,
      content: `✅ Payment of $${(freelancerPayout / 100).toFixed(2)} released to freelancer. Commission: $${(commissionAmount / 100).toFixed(2)}.`
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${contract.freelancer._id || contract.freelancer}`).emit('payment_received', {
        contractId: contract._id,
        milestoneId,
        milestoneTitle: milestone.title,
        amount: freelancerPayout,
        commission: commissionAmount,
        netAmount: freelancerPayout
      });
    }

    return res.json({ 
      success: true, 
      data: { 
        milestone, 
        payout: freelancerPayout, 
        commission: commissionAmount,
        transaction: payoutTx 
      } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/contracts/:id/dispute
export async function openDispute(req, res) {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    const isParty = 
      contract.client.toString() === req.user._id.toString() || 
      contract.freelancer.toString() === req.user._id.toString();

    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized' });

    contract.status = 'disputed';
    await contract.save();

    await createSystemMessage(req, {
      contract,
      content: `⚠️ Dispute opened for contract.`
    });

    return res.json({ success: true, data: contract });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
