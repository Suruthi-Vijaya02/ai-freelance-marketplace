import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  status: { type: String, enum: ['pending', 'escrow', 'released'], default: 'pending' },
  dueDate: Date,
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  transactionId: String,
});

const deliverableSchema = new mongoose.Schema({
  title: String,
  description: String,
  completed: { type: Boolean, default: false },
});

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    budgetType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    skills: [String],
    category: String,
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: String,
    milestones: [milestoneSchema],
    proposalsCount: { type: Number, default: 0 },
    biddingEnabled: { type: Boolean, default: false },
    hiredFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedProposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
    deliverables: [deliverableSchema],
    startDate: Date,
    endDate: Date,
    completedAt: Date,
    totalSpent: { type: Number, default: 0 },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
