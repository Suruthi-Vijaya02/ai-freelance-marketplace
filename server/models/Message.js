import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{ url: String, name: String, type: String }],
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
