import mongoose from 'mongoose';

const collaborationSessionSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    code: { type: String, default: '// Start collaborating on code here...\n' },
    language: { type: String, default: 'javascript' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model('CollaborationSession', collaborationSessionSchema);
