import Contract from '../models/Contract.js';
import { generateBlockchainHash } from '../services/blockchainService.js';
import Message from '../models/Message.js';
import { buildConversationId } from './messageController.js';

// Get contracts for the current user (either as client or freelancer)
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
