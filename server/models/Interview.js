import mongoose from 'mongoose';
import crypto from 'crypto';

const interviewSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    roomId: { type: String, required: true, unique: true },
    notes: String,
  },
  { timestamps: true }
);

interviewSchema.pre('validate', function assignRoomId() {
  if (!this.roomId) {
    this.roomId = `int_${crypto.randomBytes(12).toString('hex')}`;
  }
});

export default mongoose.model('Interview', interviewSchema);
