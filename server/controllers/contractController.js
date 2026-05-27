import Contract from '../models/Contract.js';
import { generateBlockchainHash } from '../services/blockchainService.js';

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
