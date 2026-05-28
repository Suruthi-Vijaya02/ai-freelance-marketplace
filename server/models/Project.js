import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  status: { type: String, enum: ['pending', 'escrow', 'released'], default: 'pending' },
  dueDate: Date,
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
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
