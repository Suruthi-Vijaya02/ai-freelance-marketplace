import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ['escrow_fund', 'payout', 'commission', 'refund', 'withdrawal', 'subscription'],
      required: true 
    },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for escrow/platform
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for escrow/platform
    amount: { type: Number, required: true }, // in cents, positive
    currency: { type: String, enum: ['USD', 'INR', 'EUR', 'GBP'], default: 'USD' },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
    milestoneId: mongoose.Schema.Types.ObjectId,
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    status: { 
      type: String, 
      enum: ['pending', 'held', 'completed', 'failed', 'refunded', 'escrow', 'released'],
      default: 'pending'
    },
    stripePaymentIntentId: String,
    stripeTransferId: String,
    description: String,
    metadata: mongoose.Schema.Types.Mixed, // extra data
    
    // PRESERVE EXISTING COMPATIBILITY FIELDS:
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    milestone: String,
    paymentMethod: { type: String, enum: ['stripe', 'razorpay', 'offline_escrow'], default: 'stripe' },
    paymentIntentId: String,
    releasedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
