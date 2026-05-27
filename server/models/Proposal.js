import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: { type: String, required: true },
    price: { type: Number, required: true },
    timeline: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    matchScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

proposalSchema.index({ project: 1, freelancer: 1 }, { unique: true });

export default mongoose.model('Proposal', proposalSchema);
