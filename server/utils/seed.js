import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Proposal from '../models/Proposal.js';
import Transaction from '../models/Transaction.js';
import Review from '../models/Review.js';
import Message from '../models/Message.js';
import { buildConversationId } from '../controllers/messageController.js';

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Proposal.deleteMany({}),
    Transaction.deleteMany({}),
    Review.deleteMany({}),
    Message.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@suruthiviayar.com',
    password: 'admin123',
    role: 'admin',
  });

  const client = await User.create({
    name: 'TechVentures Inc.',
    email: 'client@demo.com',
    password: 'demo1234',
    role: 'client',
    bio: 'Global technology company seeking AI talent.',
  });

  const freelancer = await User.create({
    name: 'Priya Sharma',
    email: 'freelancer@demo.com',
    password: 'demo1234',
    role: 'freelancer',
    title: 'Full-Stack AI Engineer',
    bio: 'Passionate AI engineer with 8+ years of experience.',
    location: 'Bangalore, India',
    hourlyRate: 85,
    skills: ['React', 'Node.js', 'Python', 'TensorFlow', 'AWS', 'MongoDB'],
    rating: 4.9,
    totalReviews: 127,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    coverPhoto: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop',
    portfolio: [
      { title: 'E-Commerce AI Engine', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop' },
    ],
    availability: { available: true, hoursPerWeek: 40, timezone: 'IST (UTC+5:30)' },
  });

  await User.create({
    name: 'Marcus Chen',
    email: 'marcus@demo.com',
    password: 'demo1234',
    role: 'freelancer',
    title: 'ML Specialist',
    skills: ['Python', 'PyTorch', 'NLP', 'AWS'],
    hourlyRate: 120,
    rating: 4.8,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
  });

  const project = await Project.create({
    title: 'AI-Powered E-Commerce Recommendation Engine',
    description: 'Build a machine learning recommendation system with real-time personalization.',
    budget: 15000,
    skills: ['Python', 'TensorFlow', 'React', 'AWS'],
    category: 'AI/ML',
    status: 'open',
    client: client._id,
    duration: '8 weeks',
    proposalsCount: 1,
    milestones: [
      { title: 'Milestone 1 — Architecture', amount: 3750, status: 'released' },
      { title: 'Milestone 2 — ML Pipeline', amount: 3750, status: 'escrow' },
      { title: 'Milestone 3 — Integration', amount: 3750, status: 'pending' },
      { title: 'Milestone 4 — Deployment', amount: 3750, status: 'pending' },
    ],
  });

  await Project.create({
    title: 'MERN Stack Freelance Platform MVP',
    description: 'Full-featured marketplace with JWT auth and real-time bidding.',
    budget: 25000,
    skills: ['React', 'Node.js', 'MongoDB', 'Socket.IO'],
    category: 'Web Development',
    client: client._id,
    duration: '12 weeks',
  });

  await Proposal.create({
    project: project._id,
    freelancer: freelancer._id,
    coverLetter: 'I have built 3 similar recommendation engines for e-commerce platforms.',
    price: 14500,
    timeline: '7 weeks',
    matchScore: 96,
  });

  await Transaction.create({
    project: project._id,
    client: client._id,
    freelancer: freelancer._id,
    milestone: 'Milestone 2 — ML Pipeline',
    amount: 3750,
    status: 'escrow',
    paymentMethod: 'stripe',
    paymentIntentId: 'mock_pi_seed',
  });

  await Review.create({
    project: project._id,
    reviewer: client._id,
    reviewee: freelancer._id,
    rating: 5,
    comment: 'Exceptional work on our ML pipeline.',
    sentimentScore: 0.95,
  });

  const convId = buildConversationId(client._id, freelancer._id);
  await Message.insertMany([
    {
      conversationId: convId,
      sender: freelancer._id,
      receiver: client._id,
      content: 'Hi! I have started on the recommendation engine architecture.',
    },
    {
      conversationId: convId,
      sender: client._id,
      receiver: freelancer._id,
      content: 'Great! Please share the initial wireframes when ready.',
    },
    {
      conversationId: convId,
      sender: freelancer._id,
      receiver: client._id,
      content: "I've uploaded the latest prototype for review.",
    },
  ]);

  console.log('Seed complete.');
  console.log('Conversation ID:', convId);
  console.log('Project ID:', project._id.toString());

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
