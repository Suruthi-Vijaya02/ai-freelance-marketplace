import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    terms: { type: String, required: true },
    amount: { type: Number, required: true },
    blockchainHash: String,
    clientSignature: { signed: Boolean, signedAt: Date },
    freelancerSignature: { signed: Boolean, signedAt: Date },
    status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
    contractTemplateId: String,
    escrowId: String,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
    dispatchStatus: { type: String, enum: ['pending', 'sent', 'delivered'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model('Contract', contractSchema);
