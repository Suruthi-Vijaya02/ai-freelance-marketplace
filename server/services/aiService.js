// server/services/aiService.js
/**
 * Gemini-first AI service with automatic fallback to the existing
 * rule-based logic so current routes and frontend contracts stay intact.
 */
import { generateJSON, generateText } from './geminiService.js';
import {
  BIO_GENERATOR_SYSTEM_PROMPT,
  PROPOSAL_GENERATOR_SYSTEM_PROMPT,
  RESUME_PARSER_SYSTEM_PROMPT,
} from './geminiPrompts.js';

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

function normalizeResumePayload(data = {}) {
  return {
    skills: normalizeStringArray(data.skills),
    bio: typeof data.bio === 'string' ? data.bio.trim() : '',
    experienceKeywords: normalizeStringArray(data.experienceKeywords),
    title: typeof data.title === 'string' ? data.title.trim() : '',
    summary: typeof data.summary === 'string' ? data.summary.trim() : '',
  };
}

function mapGeminiFailure(result, fallbackSource) {
  return {
    success: false,
    data: null,
    error: result?.error || {
      code: 'GEMINI_UNAVAILABLE',
      message: 'Gemini is unavailable.',
      status: 503,
    },
    source: fallbackSource,
  };
}

// ─── BIO GENERATION ──────────────────────────────────────────────
export async function generateBioWithAI(data) {
  const prompt = [
    `Title: ${data?.title || 'Professional'}`,
    `Tone: ${data?.tone || 'professional'}`,
    `Skills: ${(data?.skills || []).join(', ') || 'Not provided'}`,
    `Experience: ${JSON.stringify(data?.experience || [])}`,
  ].join('\n');

  const geminiResult = await generateText(prompt, {
    systemInstruction: BIO_GENERATOR_SYSTEM_PROMPT,
    temperature: 0.7,
    maxOutputTokens: 220,
  });

  if (geminiResult.success && geminiResult.data?.text?.trim()) {
    return {
      bio: geminiResult.data.text.trim(),
      alternatives: [],
      source: 'gemini',
      info: `Generated using ${geminiResult.model || 'Gemini'}`,
    };
  }

  const { skills = [], experience = [], title = 'Professional', tone = 'professional' } = data;

  const skillStr = skills.slice(0, 4).join(', ') || 'various technologies';
  const expYears = Array.isArray(experience) ? experience.length : (experience || 0);
  const expPhrase = expYears > 0 ? `with ${expYears}+ years of experience` : 'with proven expertise';

  const toneMap = {
    professional: {
      adjs: ['Experienced', 'Dedicated', 'Versatile'],
      focuses: ['delivering high-quality solutions', 'architecting scalable systems', 'optimizing business workflows']
    },
    casual: {
      adjs: ['Passionate', 'Creative', 'Tech-savvy'],
      focuses: ['building cool stuff that works', 'creating engaging user experiences', 'solving complex problems with code']
    },
    confident: {
      adjs: ['Expert', 'Result-driven', 'Strategic'],
      focuses: ['driving exceptional results', 'leading technical innovation', 'transforming ideas into powerful software']
    }
  };

  const t = toneMap[tone] || toneMap.professional;
  const adj = t.adjs[Math.floor(Math.random() * t.adjs.length)];
  const focus = t.focuses[Math.floor(Math.random() * t.focuses.length)];

  // Variety in sentence structure
  const structures = [
    `${adj} ${title} ${expPhrase} specializing in ${skillStr}. My focus is on ${focus}.`,
    `As a ${adj} ${title} ${expPhrase}, I excel at ${focus}, particularly within the ${skillStr} ecosystem.`,
    `${expPhrase.charAt(0).toUpperCase() + expPhrase.slice(1)}, I am a ${adj} ${title} dedicated to ${focus} using ${skillStr}.`
  ];

  const bio = structures[Math.floor(Math.random() * structures.length)];

  return {
    bio: bio || `Skilled ${title} ready to contribute to impactful projects.`,
    alternatives: [],
    source: 'local-ai-template',
    info: 'Generated using your actual skills'
  };
}

// ─── RESUME PARSING ────────────────────────────────────────────
export async function parseResumeWithAI(resumeText, userData = {}) {
  if (!resumeText || resumeText.trim().length < 50) {
    return { skills: [], roles: [], yearsExperience: 0, summary: '', source: 'empty' };
  }

  const geminiResult = await generateJSON(
    [
      `User context: ${JSON.stringify(userData || {})}`,
      'Extract the following resume into the required JSON shape.',
      'Resume text:',
      resumeText.substring(0, 12000),
    ].join('\n\n'),
    {
      systemInstruction: RESUME_PARSER_SYSTEM_PROMPT,
      responseSchema: {
        type: 'object',
        properties: {
          skills: { type: 'array', items: { type: 'string' } },
          bio: { type: 'string' },
          experienceKeywords: { type: 'array', items: { type: 'string' } },
          title: { type: 'string' },
          summary: { type: 'string' },
        },
        required: ['skills', 'bio', 'experienceKeywords', 'title', 'summary'],
      },
      temperature: 0.2,
      maxOutputTokens: 1500,
    }
  );

  if (geminiResult.success) {
    const parsed = normalizeResumePayload(geminiResult.data);
    return {
      skills: parsed.skills,
      roles: parsed.title ? [parsed.title] : [],
      yearsExperience: 0,
      summary: parsed.summary || parsed.bio,
      bio: parsed.bio,
      experienceKeywords: parsed.experienceKeywords,
      title: parsed.title,
      source: 'gemini',
    };
  }

  if (!resumeText || resumeText.trim().length < 50) {
    return { skills: [], roles: [], yearsExperience: 0, summary: '', source: 'empty' };
  }

  const lowerText = resumeText.toLowerCase();

  const skillDatabase = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'SQL', 'MongoDB', 'AWS',
    'Docker', 'TypeScript', 'HTML', 'CSS', 'Git', 'Linux', 'PHP', 'Ruby', 'Go',
    'Rust', 'Swift', 'Kotlin', 'C++', 'C#', 'Angular', 'Vue', 'Next.js', 'Express',
    'Django', 'Flask', 'Spring', 'Laravel', 'Rails', 'PostgreSQL', 'MySQL', 'Redis',
    'Kubernetes', 'Terraform', 'Jenkins', 'GraphQL', 'REST API', 'Machine Learning',
    'Data Science', 'AI', 'Blockchain', 'DevOps', 'CI/CD', 'Agile', 'Scrum',
    'Figma', 'Adobe XD', 'Photoshop', 'UI/UX', 'Bootstrap', 'Tailwind CSS',
    'Firebase', 'Supabase', 'Prisma', 'Jest', 'Cypress', 'GitHub Actions'
  ];

  const skills = skillDatabase.filter(skill => lowerText.includes(skill.toLowerCase()));

  const roles = ['Developer', 'Engineer', 'Designer', 'Manager', 'Analyst',
    'Consultant', 'Architect', 'Lead', 'Senior', 'Full Stack', 'Frontend',
    'Backend', 'DevOps', 'Data Scientist'].filter(r => lowerText.includes(r.toLowerCase()));

  const yearMatches = resumeText.match(/(\d+)\+?\s*years?/gi);
  const yearsExperience = yearMatches ? Math.max(...yearMatches.map(m => parseInt(m.match(/\d+/)[0]))) : 0;

  const sentences = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 30);
  const summary = sentences.slice(0, 2).join('. ').substring(0, 300);

  return {
    skills: [...new Set(skills)],
    roles: [...new Set(roles)],
    yearsExperience,
    summary: summary || resumeText.substring(0, 300),
    source: 'local-ai-keyword'
  };
}

// ─── PROPOSAL GENERATION ───────────────────────────────────────
export async function generateProposalWithAI(projectTitle, projectDescription, freelancerSkills, freelancerBio, freelancerName) {
  const geminiResult = await generateJSON(
    [
      `Project title: ${projectTitle || ''}`,
      `Project description: ${projectDescription || ''}`,
      `Freelancer name: ${freelancerName || 'Your Name'}`,
      `Freelancer skills: ${(freelancerSkills || []).join(', ')}`,
      `Freelancer bio: ${freelancerBio || ''}`,
    ].join('\n'),
    {
      systemInstruction: PROPOSAL_GENERATOR_SYSTEM_PROMPT,
      responseSchema: {
        type: 'object',
        properties: {
          coverLetter: { type: 'string' },
          estimatedHours: { type: 'number' },
          timeline: { type: 'string' },
          priceSuggestion: { type: 'number' },
        },
        required: ['coverLetter', 'estimatedHours', 'timeline', 'priceSuggestion'],
      },
      temperature: 0.5,
      maxOutputTokens: 1000,
    }
  );

  if (geminiResult.success && geminiResult.data) {
    return {
      coverLetter: geminiResult.data.coverLetter?.trim() || '',
      estimatedHours: Number(geminiResult.data.estimatedHours) || 0,
      timeline: geminiResult.data.timeline?.trim() || '',
      priceSuggestion: Number(geminiResult.data.priceSuggestion) || 0,
      source: 'gemini',
      info: `Generated using ${geminiResult.model || 'Gemini'}`,
    };
  }

  const skills = freelancerSkills || [];
  const skillStr = skills.slice(0, 3).join(', ') || 'relevant technologies';
  const desc = (projectDescription || '').substring(0, 300);
  const name = freelancerName || 'Your Name';

  const wordCount = desc.split(/\s+/).filter(w => w.length > 0).length;
  let estimatedHours, timeline, priceSuggestion;

  if (wordCount < 30) { estimatedHours = 20; timeline = '1 week'; priceSuggestion = 500; }
  else if (wordCount < 100) { estimatedHours = 40; timeline = '2 weeks'; priceSuggestion = 1000; }
  else if (wordCount < 300) { estimatedHours = 80; timeline = '1 month'; priceSuggestion = 2000; }
  else { estimatedHours = 120; timeline = '6 weeks'; priceSuggestion = 3000; }

  const coverLetter = `Dear Hiring Manager,

I am excited to submit my proposal for "${projectTitle}". With strong expertise in ${skillStr}, I am confident I can deliver exceptional results.

${desc ? `I have reviewed your requirements involving ${desc.toLowerCase().substring(0, 120)}...` : 'I have reviewed your project requirements and am ready to deliver high-quality work.'}

My approach focuses on clean, scalable solutions with clear communication throughout the project lifecycle.

${freelancerBio ? `About me: ${freelancerBio.substring(0, 150)}...` : ''}

I look forward to discussing how my skills in ${skillStr} can contribute to your success.

Best regards,
${name}`;

  return {
    coverLetter,
    estimatedHours,
    timeline,
    priceSuggestion,
    source: 'local-ai',
    info: 'Personalized using your skills and project description'
  };
}

export async function parseResumeWithGemini(resumeText, userData = {}) {
  const result = await parseResumeWithAI(resumeText, userData);
  if (result?.source === 'gemini') {
    return {
      success: true,
      data: normalizeResumePayload(result),
      error: null,
      source: 'gemini',
    };
  }
  return mapGeminiFailure(null, result?.source || 'local-ai-keyword');
}

// ─── PROFILE SUGGESTIONS ──────────────────────────────────────
export async function generateProfileSuggestions(user) {
  const suggestions = [];

  if (!user.bio || user.bio.length < 80) {
    suggestions.push({
      type: 'bio',
      message: `Your bio is ${user.bio?.length || 0} chars. Add 80+ chars describing your expertise.`,
      priority: 'high',
      action: 'generateBio'
    });
  }

  if (!user.skills || user.skills.length < 3) {
    suggestions.push({
      type: 'skills',
      message: `You have ${user.skills?.length || 0} skills. Add 3-5 relevant skills.`,
      priority: 'high',
      action: 'addSkills'
    });
  }

  if (!user.title) {
    suggestions.push({
      type: 'title',
      message: 'Set a professional title (e.g., "Full Stack Developer").',
      priority: 'high',
      action: 'setTitle'
    });
  }

  if (!user.portfolio || user.portfolio.length === 0) {
    suggestions.push({
      type: 'portfolio',
      message: 'Adding portfolio items increases hiring chances by 70%.',
      priority: 'medium',
      action: 'addPortfolio'
    });
  }

  if (!user.hourlyRate) {
    suggestions.push({
      type: 'rate',
      message: 'Set your hourly rate to appear in search results.',
      priority: 'medium',
      action: 'setRate'
    });
  }

  return suggestions;
}

export default { generateBioWithAI, parseResumeWithAI, generateProposalWithAI, generateProfileSuggestions };
