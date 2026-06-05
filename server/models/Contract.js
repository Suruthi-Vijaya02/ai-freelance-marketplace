import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true }, // in cents
  deadline: Date,
  status: { 
    type: String, 
    enum: ['pending', 'funded', 'in_progress', 'submitted', 'approved', 'released', 'disputed'],
    default: 'pending'
  },
  fundedAt: Date,
  submittedAt: Date,
  approvedAt: Date,
  releasedAt: Date,
  escrowTxId: String,
  releaseTxId: String,
  freelancerPayoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  submissionNotes: String,
  submissionFiles: [String] // S3 URLs
}, { _id: true });

const contractSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    terms: { type: String, required: true },
    amount: { type: Number, required: true }, // total in cents
    blockchainHash: String,
    clientSignature: { signed: Boolean, signedAt: Date },
    freelancerSignature: { signed: Boolean, signedAt: Date },
    signatures: {
      client: { signed: { type: Boolean, default: false }, signedAt: Date },
      freelancer: { signed: { type: Boolean, default: false }, signedAt: Date }
    },
    status: { 
      type: String, 
      enum: ['draft', 'pending_signature', 'active', 'completed', 'cancelled', 'disputed'],
      default: 'draft'
    },
    contractTemplateId: String,
    escrowId: String,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
    dispatchStatus: { type: String, enum: ['pending', 'sent', 'delivered'], default: 'pending' },
    
    // NEW FIELDS
    milestones: [milestoneSchema],
    totalReleased: { type: Number, default: 0 }, // cents
    totalInEscrow: { type: Number, default: 0 }, // cents
    messageThreadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    blockchain: {
      verified: { type: Boolean, default: false },
      network: { type: String, default: 'sepolia' },
      txHash: String,
      verifiedAt: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model('Contract', contractSchema);