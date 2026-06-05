// Calculate matching score based on shared skills between freelancer and project
/** Calculates a match score between freelancer skills and project requirements. */
export function calculateMatchScore(freelancerSkills = [], projectSkills = []) {
  if (!projectSkills.length) return 50;
  const normalizedFreelancer = freelancerSkills.map((s) => s.toLowerCase());
  const normalizedProject = projectSkills.map((s) => s.toLowerCase());
  const matches = normalizedProject.filter((skill) =>
    normalizedFreelancer.some((fs) => fs.includes(skill) || skill.includes(fs))
  );
  const score = Math.round((matches.length / normalizedProject.length) * 100);
  return Math.min(100, Math.max(0, score));
}

// Rank freelancers by their matching score for a specific project
/** Ranks a list of freelancers based on their skill match with a project. */
export function rankFreelancersForProject(freelancers, projectSkills) {
  return freelancers
    .map((f) => ({
      ...f.toObject?.() ?? f,
      matchScore: calculateMatchScore(f.skills, projectSkills),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// Rank projects by their matching score for a specific freelancer
/** Ranks a list of projects based on their skill match with a freelancer. */
export function rankProjectsForFreelancer(projects, freelancerSkills) {
  return projects
    .map((p) => ({
      ...p.toObject?.() ?? p,
      matchScore: calculateMatchScore(freelancerSkills, p.skills),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// Parse raw resume text to extract skills and summary using keyword matching
/** Extracts skills and a summary from raw resume text using keyword matching. */
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

// Re-export AI resume enrichment functions from the dedicated service
export { parseAndEnrichResume, autoSuggestSkills, autoGenerateBio, extractExperienceKeywords } from './resumeParserService.js';
