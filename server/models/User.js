import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
    avatar: String,
    coverPhoto: String,
    bio: String,
    title: String,
    location: String,
    hourlyRate: { type: Number, default: 0 },
    skills: [String],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    portfolio: [{ title: String, image: String, url: String }],
    availability: {
      available: { type: Boolean, default: true },
      hoursPerWeek: Number,
      timezone: String,
    },
    isFlagged: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'flagged', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function compare(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
