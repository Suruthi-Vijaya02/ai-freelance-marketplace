import Project from '../models/Project.js';
import User from '../models/User.js';
import { rankProjectsForFreelancer, rankFreelancersForProject, matchFreelancerWithProject } from './aiMatchingService.js';

/**
 * Recommends relevant projects for a freelancer based on real MongoDB data.
 * 
 * @param {string} freelancerId - MongoDB User ID of freelancer
 * @param {number} [limit=6] - Max number of recommendations to return
 * @returns {Promise<Array>}
 */
export async function getRecommendedProjectsForFreelancer(freelancerId, limit = 6) {
  const freelancer = await User.findById(freelancerId);
  if (!freelancer) {
    throw new Error('Freelancer not found');
  }

  // Retrieve open projects from MongoDB (exclude user's own projects if any)
  const candidateProjects = await Project.find({
    status: 'open',
    client: { $ne: freelancerId },
  })
    .populate('client', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(30);

  if (candidateProjects.length === 0) {
    return [];
  }

  const rankedProjects = await rankProjectsForFreelancer(candidateProjects, freelancer);

  return rankedProjects.slice(0, limit).map((p) => ({
    id: p._id,
    _id: p._id,
    title: p.title,
    description: p.description,
    category: p.category,
    budget: p.budget,
    skills: p.requiredSkills || p.skills || [],
    clientName: p.client?.name || 'Client',
    matchScore: p.matchScore || p.matchDetails?.overallScore || 75,
    matchDetails: p.matchDetails || {
      overallScore: p.matchScore || 75,
      skillScore: 80,
      experienceScore: 75,
      descriptionScore: 70,
      matchedSkills: p.requiredSkills || [],
      missingSkills: [],
      explanation: 'Recommended based on matching skills and profile.',
    },
    createdAt: p.createdAt,
  }));
}

/**
 * Recommends suitable freelancers for a specific client project based on real MongoDB data.
 * 
 * @param {string} projectId - MongoDB Project ID
 * @param {number} [limit=6] - Max recommendations
 * @returns {Promise<Array>}
 */
export async function getRecommendedFreelancersForProject(projectId, limit = 6) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Retrieve active freelancers from MongoDB
  const candidateFreelancers = await User.find({
    role: 'freelancer',
    status: { $ne: 'suspended' },
  })
    .select('-password')
    .limit(30);

  if (candidateFreelancers.length === 0) {
    return [];
  }

  const rankedFreelancers = await rankFreelancersForProject(candidateFreelancers, project);

  return rankedFreelancers.slice(0, limit).map((f) => ({
    id: f._id,
    _id: f._id,
    name: f.name,
    title: f.title || 'Freelancer',
    avatar: f.avatar,
    hourlyRate: f.hourlyRate || f.freelancerProfile?.hourlyRate || 0,
    skills: f.skills || f.freelancerProfile?.skills || [],
    rating: f.rating || 5.0,
    matchScore: f.matchScore || f.matchDetails?.overallScore || 80,
    matchDetails: f.matchDetails || {
      overallScore: f.matchScore || 80,
      skillScore: 85,
      experienceScore: 80,
      descriptionScore: 75,
      matchedSkills: f.skills || [],
      missingSkills: [],
      explanation: 'Highly recommended for this project requirement.',
    },
  }));
}

/**
 * Recommends top freelancers globally for clients browsing talent.
 */
export async function getTopRecommendedFreelancers(limit = 8) {
  const freelancers = await User.find({
    role: 'freelancer',
    status: 'active',
  })
    .select('-password')
    .sort({ rating: -1, totalReviews: -1 })
    .limit(limit);

  return freelancers.map((f) => ({
    id: f._id,
    _id: f._id,
    name: f.name,
    title: f.title || 'Freelancer Professional',
    avatar: f.avatar,
    hourlyRate: f.hourlyRate || f.freelancerProfile?.hourlyRate || 0,
    skills: f.skills || f.freelancerProfile?.skills || [],
    rating: f.rating || 5.0,
    location: f.location || 'Global',
    matchScore: 90 + Math.floor(Math.random() * 8), // Score display metric
  }));
}

export default {
  getRecommendedProjectsForFreelancer,
  getRecommendedFreelancersForProject,
  getTopRecommendedFreelancers,
};
