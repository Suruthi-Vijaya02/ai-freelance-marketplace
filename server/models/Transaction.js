import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    milestone: String,
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'escrow', 'released', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String, enum: ['stripe', 'razorpay'], default: 'stripe' },
    paymentIntentId: String,
    releasedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
