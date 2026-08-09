import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, User, Code2, Briefcase, Image, CheckCircle2, ChevronRight, ChevronLeft,
  Sparkles, X, Plus, Loader2, FileText, Camera, Trash2,
  AlertCircle, Zap, Globe, DollarSign
} from 'lucide-react';
import { userService } from '../../services/authService';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// INLINE RESUME PARSER - No external imports needed
// ============================================================================

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
  'Redux', 'Redux Toolkit', 'Socket.IO', 'Stripe', 'Razorpay', 'WebRTC', 'JWT'
];

const EXP_KW = [
  'led', 'managed', 'built', 'designed', 'developed', 'architected',
  'deployed', 'optimized', 'implemented', 'maintained', 'scaled', 'mentored',
  'delivered', 'shipped', 'refactored', 'integrated', 'migrated', 'automated',
  'launched', 'created', 'contributed', 'resolved', 'researched', 'analyzed'
];

function _suggestSkills(text) {
  if (!text || !text.trim()) return [];
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  const found = new Set();
  
  for (let i = 0; i < CANONICAL_SKILLS.length; i++) {
    const s = CANONICAL_SKILLS[i];
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Custom boundaries for special characters like C++, C#, .NET
    const boundary = '(?:^|[\\s,.;:()\\/\\"\\[\\]{}])';
    const endBoundary = '(?:$|[\\s,.;:()\\/\\"\\[\\]{}])';
    
    const primaryRegex = new RegExp(`${boundary}${escaped}${endBoundary}`, 'i');
    
    // Handle variations (React JS, Node.js, etc.)
    const variationRegex = s.includes(' ') || s.includes('.') || s.includes('-')
      ? new RegExp(`${boundary}${escaped.replace(/[\\s.-]/g, '[\\s.-]?')}${endBoundary}`, 'i')
      : null;

    if (primaryRegex.test(normalized) || (variationRegex && variationRegex.test(normalized))) {
      found.add(s);
      continue;
    }

    // Common Aliases
    const aliases = [
      s.toLowerCase().includes('javascript') ? 'js' : null,
      s.toLowerCase().includes('typescript') ? 'ts' : null,
      s === 'C++' ? 'cpp' : null,
      s === 'C#' ? 'csharp' : null,
    ].filter(Boolean);

    for (let j = 0; j < aliases.length; j++) {
      const aliasRegex = new RegExp(`${boundary}${aliases[j]}${endBoundary}`, 'i');
      if (aliasRegex.test(normalized)) {
        found.add(s);
        break;
      }
    }
  }
  return Array.from(found);
}

function _generateBio(text, skills) {
  if (!text || !text.trim()) {
    return skills.length > 0
      ? 'Experienced professional skilled in ' + skills.slice(0, 3).join(', ') + '.'
      : 'Skilled professional ready to contribute to impactful projects.';
  }

  const sentences = text
    .replace(/[\r\n]+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      const lo = s.toLowerCase();
      const isHeader = lo.length < 25 && (
        lo.includes('summary') || 
        lo.includes('objective') || 
        lo.includes('contact') || 
        lo.includes('experience') ||
        lo.includes('education')
      );
      return s.length > 30 && s.length < 350 && !isHeader;
    });

  const allKw = CANONICAL_SKILLS.map((s) => s.toLowerCase()).concat(EXP_KW);
  const scored = sentences.map((sentence) => {
    const lo = sentence.toLowerCase();
    let score = 0;
    for (let i = 0; i < allKw.length; i++) {
      try {
        const regex = new RegExp(`\\b${allKw[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lo)) score++;
      } catch (e) {
        if (lo.indexOf(allKw[i]) !== -1) score++;
      }
    }
    return { sentence, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, 5);
  // Shuffle top candidates
  for (let i = topSentences.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topSentences[i], topSentences[j]] = [topSentences[j], topSentences[i]];
  }

  const selected = topSentences.slice(0, 2).map((x) => x.sentence);

  if (selected.length === 0) {
    const snip = text.slice(0, 200).trim();
    return snip.length > 50 ? snip : 'Dedicated professional with a passion for building great software.';
  }

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

function parseResumeContent(text) {
  const skills = _suggestSkills(text || '');
  const tokens = (text || '').toLowerCase().split(/\s+/);
  const tokenSet = new Set(tokens);
  const experienceKeywords = EXP_KW.filter(function(kw) { return tokenSet.has(kw); });
  const bio = _generateBio(text || '', skills);
  return { skills: skills, experienceKeywords: experienceKeywords, bio: bio };
}

// ============================================================================
// SKILL CATEGORIES
// ============================================================================

const SKILL_CATEGORIES = {
  'Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala'],
  'Frontend': ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'Remix', 'Tailwind CSS', 'CSS', 'SASS', 'Bootstrap', 'Material UI'],
  'Backend': ['Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Rails', 'ASP.NET'],
  'Databases': ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase', 'DynamoDB'],
  'Cloud & DevOps': ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'CI/CD', 'Vercel', 'Netlify'],
  'AI & Data': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Machine Learning', 'Deep Learning', 'NLP', 'Data Analysis', 'Pandas', 'NumPy'],
  'Design': ['Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator'],
  'APIs': ['GraphQL', 'REST', 'gRPC', 'WebSocket', 'Socket.io'],
  'Blockchain': ['Solidity', 'Ethereum', 'Web3.js', 'Hardhat', 'IPFS'],
  'Tools': ['Git', 'Linux', 'Jest', 'Cypress', 'Playwright', 'Jira', 'Notion', 'Agile', 'Scrum']
};

const TIMEZONES = [
  'UTC', 'UTC-8 (PST)', 'UTC-5 (EST)', 'UTC+0 (GMT)', 'UTC+1 (CET)',
  'UTC+3 (EAT)', 'UTC+5:30 (IST)', 'UTC+8 (CST)', 'UTC+9 (JST)', 'UTC+10 (AEST)'
];

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const STEPS = [
  { id: 0, label: 'Resume', icon: FileText },
  { id: 1, label: 'Identity', icon: User },
  { id: 2, label: 'Skills', icon: Code2 },
  { id: 3, label: 'Experience', icon: Briefcase },
  { id: 4, label: 'Portfolio', icon: Image },
  { id: 5, label: 'Review', icon: CheckCircle2 }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FreelancerOnboarding() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [applyingAi, setApplyingAi] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    tagline: user?.title || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    years: user?.experience || 0,
    english: user?.english || 'fluent',
    timezone: 'UTC+5:30 (IST)',
    hourlyRate: user?.hourlyRate || '',
    availability: user?.availability?.available ? 'full-time' : 'full-time',
    portfolio: user?.portfolio || [],
    avatar: user?.avatar || '',
    githubUrl: user?.socialLinks?.github || '',
    linkedinUrl: user?.socialLinks?.linkedin || '',
    websiteUrl: user?.socialLinks?.website || '',
  });

  const [skillSearch, setSkillSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Languages');

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(5, s + 1));
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.skills.length > 0;
    if (step === 3) return form.hourlyRate !== '' && Number(form.hourlyRate) >= 0;
    return true;
  };

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill]
    }));
  };

  const handleFile = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (key === 'avatar') {
        setForm((f) => ({ ...f, avatar: reader.result }));
      } else {
        setForm((f) => ({
          ...f,
          portfolio: [...f.portfolio, { title: file.name, category: '', image: reader.result }]
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setIsParsing(true);
    setUploadProgress(0);
    setAiApplied(false);
    setResumeData(null);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const { data } = await userService.uploadResume(formData, (p) => setUploadProgress(p));
      const suggestions = data?.aiSuggestions || {};
      const parsedData = {
        skills: data?.skills || suggestions.skills || [],
        bio: data?.bio || suggestions.bio || '',
        experienceKeywords: data?.experienceKeywords || suggestions.experienceKeywords || [],
        aiSource: data?.aiSource || 'fallback',
        generatedAt: suggestions.generatedAt || new Date().toISOString(),
      };

      setResumeData(parsedData);
      setForm((f) => ({
        ...f,
        skills: parsedData.skills.length > 0 ? parsedData.skills : f.skills,
        bio: parsedData.bio || f.bio,
        years: parsedData.experienceKeywords?.length
          ? Math.max(Number(f.years) || 0, Math.min(parsedData.experienceKeywords.length, 10))
          : f.years,
      }));

      if (data?.user) {
        login(data.user, localStorage.getItem('svr_token'));
      }

      if (parsedData.skills.length > 0) {
        toast.success(`AI autofill complete. Found ${parsedData.skills.length} skills!`);
      } else {
        toast.success('Resume uploaded. Review AI suggestions below.');
      }
    } catch (err) {
      console.error('handleResumeUpload error:', err);
      toast.error(err?.message || 'Failed to parse resume');
    } finally {
      setIsParsing(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      handleResumeUpload(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        title: form.tagline,
        bio: form.bio,
        skills: form.skills,
        experience: Number(form.years) || 0,
        english: form.english,
        hourlyRate: Number(form.hourlyRate) || 0,
        availability: { available: form.availability !== 'unavailable', type: form.availability },
        portfolio: form.portfolio,
        avatar: form.avatar,
        timezone: form.timezone,
        socialLinks: { github: form.githubUrl, linkedin: form.linkedinUrl, website: form.websiteUrl },
      };
      const { data } = await userService.updateProfile(payload);
      login(data, localStorage.getItem('svr_token'));
      toast.success('Profile launched successfully!');
      navigate('/dashboard/freelancer');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allSkills = Object.values(SKILL_CATEGORIES).flat();
  const filteredSkills = allSkills.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  );
  const categorySkills = SKILL_CATEGORIES[activeCategory] || [];
  const displayedSkills = skillSearch
    ? filteredSkills
    : categorySkills;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-200/25 blur-3xl rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-100/20 blur-3xl rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-100/15 blur-3xl rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B2E]">
            {step === 0 ? 'Upload Your Resume' : step === 5 ? 'Review & Submit' : 'Freelancer Onboarding'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {step === 0 && 'Let AI extract your skills and experience'}
            {step === 1 && 'Tell us about yourself'}
            {step === 2 && 'Showcase your technical expertise'}
            {step === 3 && 'Define your work preferences'}
            {step === 4 && 'Display your best work'}
            {step === 5 && 'Almost there! Review your profile'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="relative">
            {/* Connector line background */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 rounded-full" />
            {/* Connector line fill */}
            <motion.div
              className="absolute top-4 left-4 h-0.5 bg-indigo-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / (STEPS.length - 1)) * 92}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Step circles */}
            <div className="relative flex justify-between">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isDone = i < step;
                const isActive = i === step;
                return (
                  <div key={s.id} className="flex flex-col items-center">
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isDone
                          ? 'bg-indigo-700 border-indigo-700 text-white'
                          : isActive
                          ? 'bg-indigo-700 border-indigo-700 text-white scale-110'
                          : 'bg-white border-gray-200 text-gray-400'
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Icon size={14} />
                      )}
                    </motion.div>
                    <span className={`text-[10px] font-semibold mt-2 hidden sm:block ${isActive ? 'text-indigo-700' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              variants={{
                enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
                center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }),
              }}
            >
              {/* STEP 0: Resume Upload */}
              {step === 0 && (
                <div className="space-y-6">
                  {!resumeData ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        className="hidden"
                        onChange={(e) => handleResumeUpload(e.target.files?.[0])}
                      />
                      {isParsing ? (
                        <div className="flex flex-col items-center w-full max-w-sm mx-auto">
                          <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
                          <p className="text-gray-600 font-medium">Parsing with AI…</p>
                          <p className="text-sm text-gray-400 mt-1 mb-4">Extracting skills and generating bio</p>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all"
                              style={{ width: `${uploadProgress || 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">{uploadProgress || 0}%</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="text-indigo-600" size={28} />
                          </div>
                          <h3 className="text-lg font-semibold text-[#1E1B2E]">Upload your resume</h3>
                          <p className="text-sm text-gray-500 mt-1">Drag & drop or click to browse</p>
                          <p className="text-xs text-gray-400 mt-2">Supports PDF and TXT files</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="text-green-600 shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-green-800 truncate">AI autofill complete!</p>
                          <p className="text-xs text-green-700 truncate">
                            Found {resumeData.skills?.length ?? 0} skills and {resumeData.experienceKeywords?.length ?? 0} experience signals.
                          </p>
                        </div>
                      </div>

                      {resumeData && (
                        <div className="p-4 rounded-xl bg-white border border-gray-200">
                          <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" /> Extracted Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(resumeData.skills || []).length === 0 ? (
                              <span className="text-xs text-gray-500">No skills detected</span>
                            ) : (
                              resumeData.skills.slice(0, 12).map((s) => (
                                <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                                  {s}
                                </span>
                              ))
                            )}
                            {(resumeData.skills || []).length > 12 && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                +{resumeData.skills.length - 12} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {resumeData && (
                        <div className="p-4 rounded-xl bg-white border border-gray-200">
                          <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Generated Bio
                          </p>
                          <p className="text-sm text-gray-600 italic leading-relaxed">
                            &ldquo;{resumeData.bio || 'No bio generated'}&rdquo;
                          </p>
                        </div>
                      )}

                      {resumeData && (
                        <div className="p-4 rounded-xl bg-white border border-gray-200">
                          <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" /> Experience Keywords
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(resumeData.experienceKeywords || []).length === 0 ? (
                              <span className="text-xs text-gray-500">No experience keywords detected</span>
                            ) : (
                              resumeData.experienceKeywords.map((kw) => (
                                <span key={kw} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                                  {kw}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {aiApplied ? (
                          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4" /> Applied Successfully
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60"
                            onClick={async () => {
                              setApplyingAi(true);
                              try {
                                const { data } = await userService.applyAiSuggestions({
                                  acceptSkills: true,
                                  acceptBio: true,
                                });
                                const appliedSkills = data?.skills || resumeData.skills || [];
                                const appliedBio = data?.bio || resumeData.bio || '';
                                setForm((f) => ({
                                  ...f,
                                  skills: appliedSkills.length ? appliedSkills : f.skills,
                                  bio: appliedBio || f.bio,
                                  years: resumeData.experienceKeywords?.length
                                    ? Math.max(Number(f.years) || 0, Math.min(resumeData.experienceKeywords.length, 10))
                                    : f.years,
                                }));
                                if (data?.user) {
                                  login(data.user, localStorage.getItem('svr_token'));
                                }
                                setAiApplied(true);
                                toast.success('AI Suggestions applied!');
                              } catch (e) {
                                console.error(e);
                                toast.error(e?.message || 'Failed to apply AI suggestions');
                              } finally {
                                setApplyingAi(false);
                              }
                            }}
                            disabled={applyingAi}
                          >
                            {applyingAi ? 'Applying...' : '✓ Accept AI Suggestions'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setResumeData(null);
                            setAiApplied(false);
                            setForm((f) => ({ ...f, skills: [], bio: '', years: 0 }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-5 py-2.5 text-sm text-gray-500 hover:text-indigo-600 font-medium underline decoration-dotted underline-offset-4"
                        >
                          Remove & upload different file
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 1: Identity */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-xl border-2 border-dashed ${form.avatar ? 'border-indigo-300' : 'border-gray-300'} overflow-hidden bg-gray-50`}>
                        {form.avatar ? (
                          <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="text-gray-400" size={28} />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-800 transition-colors shadow-md">
                        <Camera size={14} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'avatar')} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E1B2E]">Profile Photo</p>
                      <p className="text-xs text-gray-500">Recommended: 400×400px square image</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Sarah Johnson"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Professional Tagline</label>
                    <input
                      type="text"
                      value={form.tagline}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                      placeholder="e.g. Full-Stack Developer | React & Node.js Expert"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Shown under your name on your public profile</p>
                  </div>

                  {/* Bio */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="block text-sm font-semibold text-[#1E1B2E]">Bio</label>
                      {resumeData && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          <Sparkles size={10} /> AI-generated
                        </span>
                      )}
                    </div>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Describe your experience, expertise, and what makes you unique..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm resize-none"
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs ${form.bio.length >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                        {form.bio.length} / 100 min chars
                      </span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Social Links (Optional)</p>
                    <div className="space-y-3">
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="url"
                          value={form.githubUrl}
                          onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                          placeholder="GitHub URL"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="url"
                          value={form.linkedinUrl}
                          onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                          placeholder="LinkedIn URL"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="url"
                          value={form.websiteUrl}
                          onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                          placeholder="Personal Website"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Skills */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Selected Skills */}
                  {form.skills.length > 0 && (
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-indigo-600 mb-2">Selected Skills ({form.skills.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {form.skills.map((s) => (
                          <span key={s} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                            {s}
                            <button
                              type="button"
                              onClick={() => toggleSkill(s)}
                              className="hover:bg-indigo-500 rounded-full p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search */}
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                  />

                  {/* Category Tabs */}
                  {!skillSearch && (
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(SKILL_CATEGORIES).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                            activeCategory === cat
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Skill Grid */}
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                    {displayedSkills.map((s) => (
                      <motion.button
                        key={s}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => toggleSkill(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                          form.skills.includes(s)
                            ? 'bg-indigo-700 text-white border-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        {form.skills.includes(s) && '✓ '}
                        {s}
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    {form.skills.length} skill{form.skills.length !== 1 ? 's' : ''} selected · Select at least 1 to continue
                  </p>
                </div>
              )}

              {/* STEP 3: Experience & Rates */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Years of Experience */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-[#1E1B2E]">Years of Experience</label>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-full">
                        {form.years}{form.years >= 20 ? '+' : ''} yrs
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={form.years}
                      onChange={(e) => setForm({ ...form, years: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-400">0</span>
                      <span className="text-xs text-gray-400">5</span>
                      <span className="text-xs text-gray-400">10</span>
                      <span className="text-xs text-gray-400">15</span>
                      <span className="text-xs text-gray-400">20+</span>
                    </div>
                  </div>

                  {/* English Proficiency */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">English Proficiency</label>
                    <div className="flex flex-wrap gap-2">
                      {['basic', 'conversational', 'fluent', 'native'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setForm({ ...form, english: level })}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                            form.english === level
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Hourly Rate (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        value={form.hourlyRate}
                        onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                        placeholder="50"
                        min="0"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">Availability</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'full-time', label: 'Full-time', sub: '40h/week' },
                        { value: 'part-time', label: 'Part-time', sub: '20h/week' },
                        { value: 'contract', label: 'Contract', sub: 'Project-based' },
                        { value: 'unavailable', label: 'Not available', sub: '' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, availability: opt.value })}
                          className={`p-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                            form.availability === opt.value
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          <div>{opt.label}</div>
                          {opt.sub && <div className={`text-xs mt-0.5 ${form.availability === opt.value ? 'text-indigo-200' : 'text-gray-400'}`}>{opt.sub}</div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Timezone</label>
                    <select
                      value={form.timezone}
                      onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 4: Portfolio */}
              {step === 4 && (
                <div className="space-y-5">
                  {/* Upload Zone */}
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files).slice(0, 6 - form.portfolio.length);
                      files.forEach((file) => {
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setForm((f) => ({
                              ...f,
                              portfolio: [...f.portfolio, { title: file.name, category: '', image: reader.result }]
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors"
                  >
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plus className="text-indigo-600" size={20} />
                    </div>
                    <p className="text-sm font-semibold text-[#1E1B2E]">Add Portfolio Items</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Drag & drop images or click to browse ({form.portfolio.length}/6 added)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        Array.from(e.target.files).slice(0, 6 - form.portfolio.length).forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setForm((f) => ({
                              ...f,
                              portfolio: [...f.portfolio, { title: file.name, category: '', image: reader.result }]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </div>

                  {form.portfolio.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                      <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
                      <p className="text-sm text-amber-800">Portfolio is optional but strongly recommended to showcase your work.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {form.portfolio.map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 group">
                          <div className="relative h-28">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setForm((f) => ({
                                ...f,
                                portfolio: f.portfolio.filter((_, idx) => idx !== i)
                              }))}
                              className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} className="text-white" />
                            </button>
                          </div>
                          <div className="p-2 space-y-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => setForm((f) => ({
                                ...f,
                                portfolio: f.portfolio.map((p, idx) => idx === i ? { ...p, title: e.target.value } : p)
                              }))}
                              placeholder="Project title"
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={item.category || ''}
                              onChange={(e) => setForm((f) => ({
                                ...f,
                                portfolio: f.portfolio.map((p, idx) => idx === i ? { ...p, category: e.target.value } : p)
                              }))}
                              placeholder="Category (e.g. Web Dev)"
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Review & Submit */}
              {step === 5 && (
                <div className="space-y-6">
                  {/* Profile Preview Card */}
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl overflow-hidden">
                    <div className="h-16" />
                    <div className="px-6 pb-6 pt-0 relative">
                      <div className="flex items-end -mt-8 mb-4">
                        <div className="w-16 h-16 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-white">
                          {form.avatar ? (
                            <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <User className="text-gray-400" size={28} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 mb-1">
                          <h3 className="text-lg font-bold text-white">{form.name || 'Your Name'}</h3>
                          <p className="text-sm text-indigo-200">{form.tagline || 'Your tagline'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/80 line-clamp-3 mb-4">
                        {form.bio || 'Your bio will appear here...'}
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-indigo-200">Experience</p>
                          <p className="text-lg font-bold text-white">{form.years}+ yrs</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-indigo-200">Hourly Rate</p>
                          <p className="text-lg font-bold text-white">${form.hourlyRate || '0'}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-indigo-200">Availability</p>
                          <p className="text-sm font-bold text-white capitalize">{form.availability?.replace('-', ' ') || 'N/A'}</p>
                        </div>
                      </div>
                      {form.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {form.skills.slice(0, 10).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium rounded-full">
                              {s}
                            </span>
                          ))}
                          {form.skills.length > 10 && (
                            <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium rounded-full">
                              +{form.skills.length - 10} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completion Checklist */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1E1B2E]">Profile Completion</p>
                    {[
                      { label: 'Profile photo', done: !!form.avatar },
                      { label: 'Name & tagline', done: !!form.name && !!form.tagline },
                      { label: 'Bio written', done: form.bio.length >= 50, recommended: true },
                      { label: 'Skills added', done: form.skills.length >= 3 },
                      { label: 'Portfolio items', done: form.portfolio.length >= 3, recommended: true },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500' : 'bg-amber-100'}`}>
                          {item.done ? (
                            <CheckCircle2 size={14} className="text-white" />
                          ) : (
                            <AlertCircle size={14} className="text-amber-600" />
                          )}
                        </div>
                        <span className={`text-sm ${item.done ? 'text-gray-700' : 'text-gray-500'}`}>
                          {item.label}
                          {item.recommended && !item.done && (
                            <span className="text-xs text-amber-600 ml-1">(recommended)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="border-t border-gray-100 mt-8 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                  step === 0
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft size={16} />
                Back
              </button>
              {step === 0 && (
                <button
                  type="button"
                  onClick={() => next()}
                  className="text-sm text-gray-500 hover:text-indigo-600 underline"
                >
                  Skip for now
                </button>
              )}
            </div>
            {step < 5 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canProceed()}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-150 ${
                  canProceed()
                    ? 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-indigo-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all duration-150 bg-[#C4714A] hover:bg-[#b5623c] shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Launch my profile
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}