import { generateProposalWithAI, generateBioWithAI, parseResumeWithAI } from '../services/aiService.js';
import { calculateMatchScore, matchFreelancerWithProject } from '../services/aiMatchingService.js';
import {
  getRecommendedProjectsForFreelancer,
  getRecommendedFreelancersForProject,
  getTopRecommendedFreelancers,
} from '../services/aiRecommendationService.js';

export async function suggestProposal(req, res) {
  try {
    const {
      bio = '',
      skills = [],
      experience = 0,
      projectTitle = '',
      projectDescription = '',
      requiredSkills = [],
      freelancerName = req.user?.name || 'Freelancer',
    } = req.body;

    const result = await generateProposalWithAI(
      projectTitle,
      projectDescription,
      skills.length ? skills : requiredSkills,
      bio,
      freelancerName
    );

    return res.json({
      success: true,
      suggestion: result.coverLetter,
      text: result.coverLetter,
      coverLetter: result.coverLetter,
      estimatedHours: result.estimatedHours,
      timeline: result.timeline,
      priceSuggestion: result.priceSuggestion,
      source: result.source,
    });
  } catch (error) {
    console.error('suggestProposal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function suggestBio(req, res) {
  try {
    const { title, tone, skills, experience } = req.body;
    const result = await generateBioWithAI({
      title: title || req.user?.title || 'Freelancer',
      tone: tone || 'professional',
      skills: skills || req.user?.skills || [],
      experience: experience || req.user?.experience || 0,
    });

    return res.json({
      success: true,
      bio: result.bio,
      suggestion: result.bio,
      text: result.bio,
      alternatives: result.alternatives || [],
      source: result.source,
    });
  } catch (error) {
    console.error('suggestBio error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function parseResume(req, res) {
  try {
    const { resumeText } = req.body;
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'resumeText is required' });
    }

    const parsed = await parseResumeWithAI(resumeText, {
      role: req.user?.role,
      skills: req.user?.skills,
    });

    return res.json({
      success: true,
      data: parsed,
      skills: parsed.skills,
      bio: parsed.summary || parsed.bio,
      experienceKeywords: parsed.experienceKeywords || [],
      source: parsed.source,
    });
  } catch (error) {
    console.error('parseResume error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function matchSkills(req, res) {
  try {
    const { freelancer = {}, project = {}, freelancerSkills = [], projectSkills = [] } = req.body;
    
    // Check if full objects were provided or skill arrays
    const fObj = freelancer.skills ? freelancer : { skills: freelancerSkills, name: req.user?.name };
    const pObj = project.requiredSkills || project.skills ? project : { requiredSkills: projectSkills };

    const matchDetails = await matchFreelancerWithProject(fObj, pObj);

    return res.json({
      success: true,
      overallScore: matchDetails.overallScore,
      score: matchDetails.overallScore,
      matchScore: matchDetails.overallScore,
      skillScore: matchDetails.skillScore,
      experienceScore: matchDetails.experienceScore,
      descriptionScore: matchDetails.descriptionScore,
      matchedSkills: matchDetails.matchedSkills,
      missingSkills: matchDetails.missingSkills,
      explanation: matchDetails.explanation,
      tfPredictedScore: matchDetails.tfPredictedScore,
      source: matchDetails.source,
    });
  } catch (error) {
    console.error('matchSkills error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProjectRecommendations(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required for recommendations' });
    }

    const limit = parseInt(req.query.limit, 10) || 6;
    const recommendations = await getRecommendedProjectsForFreelancer(userId, limit);

    return res.json({
      success: true,
      recommendations,
      projects: recommendations,
    });
  } catch (error) {
    console.error('getProjectRecommendations error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getFreelancerRecommendations(req, res) {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 6;

    let recommendations;
    if (projectId) {
      recommendations = await getRecommendedFreelancersForProject(projectId, limit);
    } else {
      recommendations = await getTopRecommendedFreelancers(limit);
    }

    return res.json({
      success: true,
      recommendations,
      freelancers: recommendations,
    });
  } catch (error) {
    console.error('getFreelancerRecommendations error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  suggestProposal,
  suggestBio,
  parseResume,
  matchSkills,
  getProjectRecommendations,
  getFreelancerRecommendations,
};
