import Contract from '../models/Contract.js';
import { generateBlockchainHash } from '../services/blockchainService.js';
import Message from '../models/Message.js';
import { buildConversationId } from './messageController.js';

export async function createContract(req, res) {
  try {
    const { project, freelancer, terms, amount } = req.body;
    const blockchainHash = generateBlockchainHash({ project, freelancer, terms, amount });

    const contract = await Contract.create({
      project,
      client: req.user._id,
      freelancer,
      terms,
      amount,
      blockchainHash,
      status: 'active',
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
