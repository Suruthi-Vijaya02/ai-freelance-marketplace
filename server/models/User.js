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
      status: {
        type: String,
        enum: ['full-time', 'part-time', 'not-available'],
        default: 'full-time',
      },
      available: { type: Boolean, default: true },
      hoursPerWeek: Number,
      timezone: String,
    },
    isFlagged: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'flagged', 'suspended'], default: 'active' },
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    freelancerProfile: {
      skills: [String],
      hourlyRate: Number,
      bio: String,
      experience: [{ title: String, company: String, years: Number, description: String }],
      portfolio: [{ title: String, image: String, url: String }],
      certifications: [{ name: String, issuer: String, year: Number }],
    },
    clientProfile: {
      companyName: String,
      companySize: String,
      companyWebsite: String,
      description: String,
      industry: String,
      budgetRange: String,
      hiringPreference: { type: String, enum: ['hourly', 'fixed', 'both'], default: 'both' },
      hiringHistory: String,
    },
    resumeUrl: String,
    resumeText: String,
    aiSuggestions: {
      skills: [String],
      bio: String,
      experienceKeywords: [String],
      generatedAt: Date,
    },
  },
  { timestamps: true }
);

function calcProfileCompletion(user) {
  if (user.role === 'freelancer') {
    const fp = user.freelancerProfile || {};
    const checks = [
      user.name,
      user.title || fp.bio,
      (fp.bio || user.bio)?.length >= 50,
      (fp.hourlyRate ?? user.hourlyRate) > 0,
      (fp.skills || user.skills || []).length >= 3,
      user.location,
      user.availability?.timezone,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
  if (user.role === 'client') {
    const cp = user.clientProfile || {};
    const checks = [
      user.name,
      cp.companyName || user.title,
      cp.description || user.bio,
      cp.industry,
      user.location,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
  return user.profileCompletion || 0;
}

userSchema.methods.syncRoleProfile = function syncRoleProfile() {
  if (this.role === 'freelancer') {
    if (!this.freelancerProfile) this.freelancerProfile = {};
    if (this.skills?.length) this.freelancerProfile.skills = this.skills;
    if (this.hourlyRate) this.freelancerProfile.hourlyRate = this.hourlyRate;
    if (this.bio) this.freelancerProfile.bio = this.bio;
    if (this.portfolio?.length) this.freelancerProfile.portfolio = this.portfolio;
    if (this.title) this.title = this.title;
  }
  if (this.role === 'client') {
    if (!this.clientProfile) this.clientProfile = {};
    if (this.title && !this.clientProfile.companyName) {
      this.clientProfile.companyName = this.title;
    }
    if (this.bio && !this.clientProfile.description) {
      this.clientProfile.description = this.bio;
    }
  }
  this.profileCompletion = calcProfileCompletion(this);
};

userSchema.pre('save', async function preSave() {
  this.syncRoleProfile();
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = function compare(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
