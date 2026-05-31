import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{ url: String, name: String, type: String }],
    read: { type: Boolean, default: false },
    messageType: { type: String, enum: ['text', 'file', 'audio', 'video'], default: 'text' },
    readAt: Date,
    deliveredAt: Date,
    reactions: [reactionSchema],
    edited: {
      isEdited: { type: Boolean, default: false },
      editedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
