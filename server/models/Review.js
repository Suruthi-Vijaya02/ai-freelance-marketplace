import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    sentimentScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
