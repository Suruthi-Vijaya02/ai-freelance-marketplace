// server/services/aiMatchingService.js
import { generateJSON } from './geminiService.js';
import { MATCHING_SYSTEM_PROMPT } from './geminiPrompts.js';
import { predictSkillAlignmentTF } from './tfjsService.js';

// Re-export resume parsing functions from the dedicated resume service
export { parseAndEnrichResume, autoSuggestSkills, autoGenerateBio, extractExperienceKeywords } from './resumeParserService.js';

/**
 * Extracts skills and a summary from raw resume text using keyword matching.
 */
export function parseResumeText(text = '') {
  const skillKeywords = [
    'react', 'node', 'python', 'javascript', 'typescript', 'mongodb',
    'aws', 'docker', 'tensorflow', 'figma', 'solidity', 'java',
  ];
  const lower = text.toLowerCase();
  const detected = skillKeywords.filter((k) => lower.includes(k));
  return {
    skills: detected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    summary: text.slice(0, 200) || 'AI-parsed profile summary',
  };
}

/**
 * Helper to ensure string arrays are clean and deduplicated.
 */
function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

/**
 * Helper to safely handle Mongoose documents or plain JavaScript objects.
 */
function extractObjectData(data) {
  if (!data) return {};
  return typeof data.toObject === 'function' ? data.toObject() : data;
}

/**
 * Calculates a rule-based match score between freelancer skills and project requirements.
 */
export function calculateMatchScore(freelancerSkills = [], projectSkills = []) {
  if (!projectSkills || !projectSkills.length) return 50;

  const normalizedFreelancer = freelancerSkills.map((s) => String(s || '').toLowerCase());
  const normalizedProject = projectSkills.map((s) => String(s || '').toLowerCase());

  const matches = normalizedProject.filter((skill) =>
    normalizedFreelancer.some((fs) => fs.includes(skill) || skill.includes(fs))
  );

  const score = Math.round((matches.length / normalizedProject.length) * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculates a detailed, multi-dimensional match evaluation between freelancer and project.
 * 
 * Returns:
 * {
 *   overallScore,
 *   skillScore,
 *   experienceScore,
 *   descriptionScore,
 *   matchedSkills[],
 *   missingSkills[],
 *   explanation,
 *   source
 * }
 */
export async function matchFreelancerWithProject(freelancer, project) {
  const freelancerData = extractObjectData(freelancer);
  const projectData = extractObjectData(project);

  const fSkills = normalizeStringArray(
    freelancerData.skills ||
    freelancerData.freelancerProfile?.skills ||
    freelancerData.aiSuggestions?.skills || []
  );

  const pSkills = normalizeStringArray(
    projectData.requiredSkills ||
    projectData.skills || []
  );

  // Calculate matched and missing skills
  const matchedSkills = pSkills.filter((ps) =>
    fSkills.some((fs) => fs.toLowerCase().includes(ps.toLowerCase()) || ps.toLowerCase().includes(fs.toLowerCase()))
  );
  const missingSkills = pSkills.filter((ps) => !matchedSkills.includes(ps));

  // Compute component scores deterministically
  const skillScore = pSkills.length > 0 ? Math.round((matchedSkills.length / pSkills.length) * 100) : 75;

  const reqYears = Number(projectData.experienceLevel === 'expert' ? 5 : projectData.experienceLevel === 'intermediate' ? 3 : 1);
  const userYears = Number(freelancerData.yearsExperience || freelancerData.experience || 2);
  const experienceScore = Math.min(100, Math.max(40, Math.round((userYears / reqYears) * 85)));

  const pDesc = (projectData.description || projectData.title || '').toLowerCase();
  const fBio = (freelancerData.bio || freelancerData.title || '').toLowerCase();
  const descKeywordMatches = fSkills.filter((s) => pDesc.includes(s.toLowerCase()));
  const descriptionScore = pDesc.length > 0 ? Math.min(100, Math.max(30, Math.round((descKeywordMatches.length / Math.max(1, fSkills.length)) * 100) + 40)) : 70;

  // Run TensorFlow.js skill alignment neural prediction
  const tfResult = await predictSkillAlignmentTF({
    skillOverlapRatio: pSkills.length ? matchedSkills.length / pSkills.length : 0.5,
    titleMatchRatio: fBio.includes((projectData.category || '').toLowerCase()) ? 1.0 : 0.4,
    experienceRatio: Math.min(1.0, userYears / reqYears),
    categoryMatchRatio: 1.0,
  });

  // Calculate base rule overall score
  const baseOverall = Math.round(
    (skillScore * 0.45) + (experienceScore * 0.25) + (descriptionScore * 0.15) + (tfResult.tfPredictedScore * 0.15)
  );

  // Attempt Gemini enhancement for semantic explanation and dynamic tuning
  // const prompt = [
  //   '=== FREELANCER PROFILE ===',
  //   `Name: ${freelancerData.name || 'Freelancer'}`,
  //   `Title: ${freelancerData.title || 'N/A'}`,
  //   `Bio: ${freelancerData.bio || 'N/A'}`,
  //   `Skills: ${fSkills.join(', ') || 'None specified'}`,
  //   `Experience: ${userYears} years`,
  //   '',
  //   '=== PROJECT DETAILS ===',
  //   `Title: ${projectData.title || 'Untitled Project'}`,
  //   `Description: ${projectData.description || 'N/A'}`,
  //   `Required Skills: ${pSkills.join(', ') || 'None specified'}`,
  //   `Category: ${projectData.category || 'N/A'}`,
  // ].join('\n');

  // const geminiResult = await generateJSON(prompt, {
  //   systemInstruction: `${MATCHING_SYSTEM_PROMPT}\nReturn JSON with keys: overallScore, skillScore, experienceScore, descriptionScore, matchedSkills, missingSkills, explanation.`,
  //   responseSchema: {
  //     type: 'object',
  //     properties: {
  //       overallScore: { type: 'number' },
  //       skillScore: { type: 'number' },
  //       experienceScore: { type: 'number' },
  //       descriptionScore: { type: 'number' },
  //       matchedSkills: { type: 'array', items: { type: 'string' } },
  //       missingSkills: { type: 'array', items: { type: 'string' } },
  //       explanation: { type: 'string' },
  //     },
  //     required: [
  //       'overallScore',
  //       'skillScore',
  //       'experienceScore',
  //       'descriptionScore',
  //       'matchedSkills',
  //       'missingSkills',
  //       'explanation',
  //     ],
  //   },
  //   temperature: 0.3,
  //   maxOutputTokens: 600,
  // });

  // if (geminiResult.success && geminiResult.data) {
  //   const data = geminiResult.data;
  //   const overallScore = Math.min(100, Math.max(0, Math.round(Number(data.overallScore) || baseOverall)));

  //   return {
  //     overallScore,
  //     score: overallScore,
  //     skillScore: Math.min(100, Math.max(0, Math.round(Number(data.skillScore) || skillScore))),
  //     experienceScore: Math.min(100, Math.max(0, Math.round(Number(data.experienceScore) || experienceScore))),
  //     descriptionScore: Math.min(100, Math.max(0, Math.round(Number(data.descriptionScore) || descriptionScore))),
  //     matchedSkills: normalizeStringArray(data.matchedSkills?.length ? data.matchedSkills : matchedSkills),
  //     missingSkills: normalizeStringArray(data.missingSkills?.length ? data.missingSkills : missingSkills),
  //     explanation: data.explanation?.trim() || `Strong compatibility based on ${matchedSkills.length} matched skills.`,
  //     tfPredictedScore: tfResult.tfPredictedScore,
  //     source: 'gemini',
  //   };
  // }

  // Local rule + TF.js fallback
  const explanation = matchedSkills.length > 0
    ? `Strong match because the freelancer has ${matchedSkills.length} of ${pSkills.length} required skill(s) including ${matchedSkills.slice(0, 3).join(', ')}.`
    : `Moderate match. Freelancer possesses relevant background but lacks direct required skills: ${missingSkills.slice(0, 3).join(', ')}.`;

  return {
    overallScore: baseOverall,
    score: baseOverall,
    skillScore,
    experienceScore,
    descriptionScore,
    matchedSkills,
    missingSkills,
    explanation,
    tfPredictedScore: tfResult.tfPredictedScore,
    source: 'tfjs-rule-fallback',
  };
}

/**
 * Ranks freelancers for a project based on match evaluation.
 */
export async function rankFreelancersForProject(freelancers = [], project = {}) {
  if (!Array.isArray(freelancers) || freelancers.length === 0) return [];

  const projectObj = Array.isArray(project) ? { requiredSkills: project } : project;

  const ranked = await Promise.all(
    freelancers.map(async (f) => {
      const fObj = extractObjectData(f);
      try {
        const matchResult = await matchFreelancerWithProject(fObj, projectObj);
        return {
          ...fObj,
          matchScore: matchResult.overallScore,
          matchDetails: matchResult,
        };
      } catch (err) {
        console.error('[aiMatchingService] rankFreelancersForProject error:', err);
        return {
          ...fObj,
          matchScore: 50,
          matchDetails: { overallScore: 50, matchedSkills: [], missingSkills: [], explanation: 'Match calculated via basic fallback.' },
        };
      }
    })
  );

  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Ranks projects for a freelancer based on match evaluation.
 */
export async function rankProjectsForFreelancer(projects = [], freelancer = {}) {
  if (!Array.isArray(projects) || projects.length === 0) return [];

  const fObj = Array.isArray(freelancer) ? { skills: freelancer } : freelancer;

  const ranked = await Promise.all(
    projects.map(async (p) => {
      const pObj = extractObjectData(p);
      try {
        const matchResult = await matchFreelancerWithProject(fObj, pObj);
        return {
          ...pObj,
          matchScore: matchResult.overallScore,
          matchDetails: matchResult,
        };
      } catch (err) {
        console.error('[aiMatchingService] rankProjectsForFreelancer error:', err);
        return {
          ...pObj,
          matchScore: 50,
          matchDetails: { overallScore: 50, matchedSkills: [], missingSkills: [], explanation: 'Match calculated via basic fallback.' },
        };
      }
    })
  );

  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}

export default {
  calculateMatchScore,
  matchFreelancerWithProject,
  rankFreelancersForProject,
  rankProjectsForFreelancer,
  parseResumeText,
};