/**
 * AI Resume Parser Service
 *
 * Uses a canonical skills list + keyword-embedding simulation
 * (cosine similarity on bag-of-words vectors) as a lightweight,
 * zero-training "pretrained" approach.
 * No TensorFlow / no custom model training required.
 */

// ---------------------------------------------------------------------------
// Canonical skill list (normalized reference)
// ---------------------------------------------------------------------------
const CANONICAL_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++', 'C#',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'Elixir', 'Haskell',
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'Remix',
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Spring Boot', 'Laravel', 'Rails', 'ASP.NET',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch',
  'Firebase', 'Supabase', 'DynamoDB', 'Cassandra',
  'AWS', 'GCP', 'Azure', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
  'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'GitHub Actions', 'CI/CD',
  'GraphQL', 'REST', 'gRPC', 'WebSocket', 'Socket.io',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenCV', 'Keras', 'Hugging Face',
  'Solidity', 'Ethereum', 'Web3.js', 'Hardhat', 'IPFS',
  'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
  'Tailwind CSS', 'CSS', 'SASS', 'Bootstrap', 'Material UI',
  'Git', 'Linux', 'Nginx', 'Apache', 'Jest', 'Cypress', 'Playwright',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'Data Analysis', 'Pandas', 'NumPy', 'Tableau', 'Power BI',
  'Agile', 'Scrum', 'Jira', 'Confluence', 'Notion',
];

// ---------------------------------------------------------------------------
// Experience-level keywords
// ---------------------------------------------------------------------------
const EXPERIENCE_KEYWORDS = [
  'led', 'managed', 'built', 'designed', 'developed', 'architected', 'deployed',
  'optimized', 'implemented', 'maintained', 'scaled', 'mentored', 'collaborated',
  'delivered', 'shipped', 'refactored', 'integrated', 'migrated', 'automated',
  'launched', 'created', 'contributed', 'resolved', 'researched', 'analyzed',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tokenize text to a lowercase word set.
 */
function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s.#+]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
}

/**
 * Lightweight cosine-similarity between two word sets (bag-of-words).
 * Returns a value between 0 and 1.
 */
function bagCosineSimilarity(setA, setB) {
  const intersection = [...setA].filter((w) => setB.has(w));
  if (!setA.size || !setB.size) return 0;
  return intersection.length / Math.sqrt(setA.size * setB.size);
}

/**
 * Normalize a detected skill token to its canonical form.
 * Uses cosine similarity on tokenized skill names.
 */
function normalizeSkill(rawSkill) {
  const rawTokens = tokenize(rawSkill);
  let best = null;
  let bestScore = 0;

  for (const canonical of CANONICAL_SKILLS) {
    const score = bagCosineSimilarity(rawTokens, tokenize(canonical));
    if (score > bestScore) {
      bestScore = score;
      best = canonical;
    }
  }

  // Require a minimum similarity threshold to accept normalization
  return bestScore >= 0.4 ? best : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract skills from resume text.
 * Scans for canonical skill mentions (substring match + normalization).
 * Returns a deduplicated array of canonical skill names.
 */
export function autoSuggestSkills(text = '') {
  if (!text.trim()) return [];

  // Normalize text for matching: replace weird quotes, handle newlines
  const normalizedText = text
    .toLowerCase()
    .replace(/[\u201C\u201D\u2018\u2019]/g, '"') 
    .replace(/\s+/g, ' ');

  const found = new Set();

  for (const skill of CANONICAL_SKILLS) {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    /**
     * SENIOR AI ENGINEER FIX:
     * Standard \b word boundaries fail for skills like C++, C#, .NET, Node.js
     * We use a custom boundary check that looks for start/end of string or 
     * common delimiters (space, comma, dot, slash, parens, etc.)
     */
    const boundary = '(?:^|[\\s,.;:()\\/\\"\\[\\]{}])';
    const endBoundary = '(?:$|[\\s,.;:()\\/\\"\\[\\]{}])';
    
    // Primary match: Canonical name with flexible boundaries
    const primaryRegex = new RegExp(`${boundary}${escapedSkill}${endBoundary}`, 'i');
    
    // Secondary match: Handle common variations (ReactJS, Node JS, etc)
    const variationRegex = skill.includes(' ') || skill.includes('.') || skill.includes('-')
      ? new RegExp(`${boundary}${escapedSkill.replace(/[\\s.-]/g, '[\\s.-]?')}${endBoundary}`, 'i')
      : null;

    if (primaryRegex.test(normalizedText) || (variationRegex && variationRegex.test(normalizedText))) {
      found.add(skill);
      continue;
    }

    // Tertiary match: Check common aliases with strict boundaries
    const aliases = [
      skill.toLowerCase().includes('javascript') ? 'js' : null,
      skill.toLowerCase().includes('typescript') ? 'ts' : null,
      skill === 'C++' ? 'cpp' : null,
      skill === 'C#' ? 'csharp' : null,
      skill === 'Python' ? 'py' : null,
    ].filter(Boolean);

    for (const alias of aliases) {
      const aliasRegex = new RegExp(`${boundary}${alias}${endBoundary}`, 'i');
      if (aliasRegex.test(normalizedText)) {
        found.add(skill);
        break;
      }
    }
  }

  return [...found];
}

/**
 * Extract experience keywords detected in the resume text.
 */
export function extractExperienceKeywords(text = '') {
  if (!text.trim()) return [];
  const tokens = tokenize(text);
  return EXPERIENCE_KEYWORDS.filter((kw) => tokens.has(kw));
}

/**
 * Generate a 2-3 sentence AI-style profile summary from resume text.
 * Uses extractive summarization (picks the most info-dense sentences).
 */
export function autoGenerateBio(text = '', skills = []) {
  if (!text.trim()) {
    return skills.length
      ? `Experienced professional skilled in ${skills.slice(0, 3).join(', ')}.`
      : 'Skilled professional ready to contribute to impactful projects.';
  }

  // Split into sentences
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    // Filter out common header/noise sentences
    .filter((s) => {
      const lower = s.toLowerCase();
      const isHeader = lower.length < 25 && (
        lower.includes('summary') || 
        lower.includes('objective') || 
        lower.includes('contact') || 
        lower.includes('experience') ||
        lower.includes('education')
      );
      return s.length > 30 && s.length < 350 && !isHeader;
    });

  // Score each sentence by how many canonical skills / experience words it contains
  const allKeywords = [
    ...CANONICAL_SKILLS.map((s) => s.toLowerCase()),
    ...EXPERIENCE_KEYWORDS,
  ];

  const scored = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    // Use word boundaries for scoring too
    const score = allKeywords.filter((kw) => {
      try {
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(lower);
      } catch (e) {
        return lower.includes(kw);
      }
    }).length;
    return { sentence, score };
  });

  // Sort by score and randomize slightly among top results to avoid same bio every time
  scored.sort((a, b) => b.score - a.score);
  
  const topSentences = scored.slice(0, 5);
  // Fisher-Yates shuffle for the top few candidates
  for (let i = topSentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topSentences[i], topSentences[j]] = [topSentences[j], topSentences[i]];
  }

  const selected = topSentences.slice(0, 2).map((s) => s.sentence);

  if (selected.length === 0) {
    const snippet = text.slice(0, 200).trim();
    return snippet.length > 50 ? snippet : 'Dedicated professional with a passion for building great software.';
  }

  // Professional narrative templates for variety
  const templates = [
    (bio, skillsList) => `${bio} Expertly leverages ${skillsList.slice(0, 3).join(', ')} to drive innovation.`,
    (bio, skillsList) => `With a deep focus on ${skillsList[0] || 'technology'}, ${bio.charAt(0).toLowerCase() + bio.slice(1)}`,
    (bio, skillsList) => `${bio} Committed to delivering high-quality solutions using ${skillsList.slice(0, 4).join(', ')}.`,
  ];

  const templateIdx = Math.floor(Math.random() * templates.length);
  const finalBio = skills.length >= 3 
    ? templates[templateIdx](selected.join(' '), skills)
    : selected.join(' ');

  return finalBio.length > 450 ? finalBio.slice(0, 447) + '...' : finalBio;
}

/**
 * Full resume parse pipeline:
 * 1. Extract skills (canonical)
 * 2. Extract experience keywords
 * 3. Generate bio summary
 * Returns { skills, experienceKeywords, bio }
 */
export function parseAndEnrichResume(text = '') {
  const skills = autoSuggestSkills(text);
  const experienceKeywords = extractExperienceKeywords(text);
  const bio = autoGenerateBio(text, skills);
  return { skills, experienceKeywords, bio };
}
