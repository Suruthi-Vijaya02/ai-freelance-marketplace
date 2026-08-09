import mongoose from 'mongoose';

const fraudEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: { type: String, default: 'Anonymous / Guest' },
    userEmail: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    eventType: {
      type: String,
      required: true,
      enum: [
        'rapid_requests',
        'excessive_proposals',
        'suspicious_project',
        'failed_payments',
        'high_activity_spike',
        'anomaly',
      ],
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    reasons: [String],
    mlConfidence: { type: Number, default: 0.85 }, // TensorFlow.js prediction confidence
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

export default mongoose.model('FraudEvent', fraudEventSchema);
