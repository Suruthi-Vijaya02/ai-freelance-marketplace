import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, Target, CreditCard, CheckCircle2, ChevronRight, ChevronLeft,
  AlertCircle, Loader2, Camera, Building2, Globe, DollarSign, Clock, Star, Zap, X
} from 'lucide-react';
import { userService } from '../../services/authService';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const STEPS = [
  { id: 0, label: 'Company', icon: Building2 },
  { id: 1, label: 'Projects', icon: Target },
  { id: 2, label: 'Budget', icon: CreditCard },
  { id: 3, label: 'Review', icon: CheckCircle2 }
];

// ============================================================================
// OPTIONS
// ============================================================================

const WORK_TYPES = [
  'Web Development', 'Mobile Apps', 'UI/UX Design', 'Data Science',
  'DevOps', 'AI/ML', 'Blockchain', 'Content Writing',
  'Digital Marketing', 'Video & Animation', 'Graphic Design', 'Cybersecurity'
];

const PROJECT_DURATIONS = [
  { value: 'less-than-1-week', label: 'Less than 1 week' },
  { value: '1-4-weeks', label: '1–4 weeks' },
  { value: '1-3-months', label: '1–3 months' },
  { value: '3-months-plus', label: '3+ months' }
];

const TEAM_SIZES = [
  { value: '1', label: 'Just 1' },
  { value: '2-5', label: '2–5' },
  { value: '5-10', label: '5–10' },
  { value: '10+', label: '10+' }
];

const BUDGET_RANGES = [
  { value: 'under-500', label: 'Under $500' },
  { value: '500-2k', label: '$500–$2K' },
  { value: '2k-10k', label: '$2K–$10K' },
  { value: '10k-50k', label: '$10K–$50K' },
  { value: '50k-plus', label: '$50K+' },
  { value: 'varies', label: 'Varies' }
];

const PAYMENT_MODELS = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'milestone', label: 'Milestone-based' }
];

const HIRING_URGENCIES = [
  { value: 'asap', label: 'ASAP (within 24h)' },
  { value: 'within-week', label: 'Within a week' },
  { value: 'within-month', label: 'Within a month' },
  { value: 'no-rush', label: 'No rush' }
];

const INTERVIEW_PREFERENCES = [
  { value: 'yes-always', label: 'Yes always' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'no-hire-profile', label: 'No — hire based on profile' }
];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'Singapore', 'UAE', 'Other'
];

const HEAR_ABOUT_OPTIONS = [
  'Search engine', 'Social media', 'Friend referral', 'LinkedIn', 'Other'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    jobTitle: user?.jobTitle || '',
    website: '',
    country: 'India',
    avatar: user?.avatar || '',
    workTypes: [],
    projectDuration: '',
    teamSize: '',
    hearAboutUs: '',
    budgetRange: '',
    paymentModel: '',
    hiringUrgency: '',
    interviewPreference: '',
  });

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(3, s + 1));
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const canProceed = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.workTypes.length > 0;
    return true;
  };

  const toggleWorkType = (type) => {
    setForm((f) => ({
      ...f,
      workTypes: f.workTypes.includes(type)
        ? f.workTypes.filter((t) => t !== type)
        : [...f.workTypes, type]
    }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        company: form.company,
        jobTitle: form.jobTitle,
        website: form.website,
        country: form.country,
        avatar: form.avatar,
        preferences: {
          workTypes: form.workTypes,
          projectDuration: form.projectDuration,
          teamSize: form.teamSize,
          budgetRange: form.budgetRange,
          paymentModel: form.paymentModel,
          hiringUrgency: form.hiringUrgency,
          interviewPreference: form.interviewPreference,
        },
      };
      const { data } = await userService.updateProfile(payload);
      login(data, localStorage.getItem('svr_token'));
      toast.success('Profile created successfully!');
      navigate('/dashboard/client');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {step === 0 ? 'Company & Identity' : step === 3 ? 'Review & Submit' : 'Client Onboarding'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {step === 0 && 'Tell us about yourself and your organization'}
            {step === 1 && 'What type of work do you need?'}
            {step === 2 && 'Define your budget and hiring style'}
            {step === 3 && 'Almost there! Review your profile'}
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
              {/* STEP 0: Company & Identity */}
              {step === 0 && (
                <div className="space-y-6">
                  {/* Avatar/Logo Upload */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-xl border-2 border-dashed ${form.avatar ? 'border-indigo-300' : 'border-gray-300'} overflow-hidden bg-gray-50`}>
                        {form.avatar ? (
                          <img src={form.avatar} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="text-gray-400" size={28} />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-800 transition-colors shadow-md">
                        <Camera size={14} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E1B2E]">Company Logo / Profile Photo</p>
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
                      placeholder="e.g. John Smith"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Company / Organisation</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="e.g. Acme Corp"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Job Title / Role</label>
                    <input
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                      placeholder="e.g. Product Manager, CTO, Startup Founder"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Country</label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 1: Project Preferences */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Work Types */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">
                      What type of work do you hire for? <span className="text-red-500">*</span>
                    </label>
                    {form.workTypes.length > 0 && (
                      <div className="bg-indigo-50 rounded-xl p-3 mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {form.workTypes.map((t) => (
                            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                              {t}
                              <button
                                type="button"
                                onClick={() => toggleWorkType(t)}
                                className="hover:bg-indigo-500 rounded-full p-0.5"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {WORK_TYPES.map((type) => (
                        <motion.button
                          key={type}
                          type="button"
                          whileTap={{ scale: 0.93 }}
                          onClick={() => toggleWorkType(type)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                            form.workTypes.includes(type)
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {form.workTypes.includes(type) && '✓ '}
                          {type}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Project Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">Typical project duration</label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_DURATIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, projectDuration: opt.value })}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                            form.projectDuration === opt.value
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team Size */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">
                      Team size (freelancers typically hired at once)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_SIZES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, teamSize: opt.value })}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                            form.teamSize === opt.value
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* How did you hear about us */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">How did you hear about us?</label>
                    <select
                      value={form.hearAboutUs}
                      onChange={(e) => setForm({ ...form, hearAboutUs: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 transition-all duration-200 text-sm"
                    >
                      <option value="">Select an option</option>
                      {HEAR_ABOUT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: Budget & Hiring Style */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Budget Range */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">Typical project budget range</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGET_RANGES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, budgetRange: opt.value })}
                          className={`p-3 rounded-xl text-sm font-semibold border transition-all duration-150 text-left ${
                            form.budgetRange === opt.value
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Model */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">Preferred payment model</label>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_MODELS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, paymentModel: opt.value })}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                            form.paymentModel === opt.value
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hiring Urgency */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">How urgently do you typically hire?</label>
                    <div className="flex flex-wrap gap-2">
                      {HIRING_URGENCIES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, hiringUrgency: opt.value })}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                            form.hiringUrgency === opt.value
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interview Preference */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B2E] mb-3">
                      Do you prefer to interview freelancers before hiring?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTERVIEW_PREFERENCES.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, interviewPreference: opt.value })}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                            form.interviewPreference === opt.value
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Submit */}
              {step === 3 && (
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
                              <Building2 className="text-gray-400" size={28} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 mb-1">
                          <h3 className="text-lg font-bold text-white">{form.name || 'Your Name'}</h3>
                          <p className="text-sm text-indigo-200">
                            {form.jobTitle || 'Your job title'}
                            {form.company && ` at ${form.company}`}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-indigo-200">Country</p>
                          <p className="text-sm font-bold text-white">{form.country}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-indigo-200">Budget</p>
                          <p className="text-sm font-bold text-white">
                            {BUDGET_RANGES.find((b) => b.value === form.budgetRange)?.label || 'Not set'}
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                          <p className="text-xs text-indigo-200">Work Type</p>
                          <p className="text-sm font-bold text-white">{form.workTypes.length} selected</p>
                        </div>
                      </div>
                      {form.workTypes.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {form.workTypes.slice(0, 3).map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium rounded-full">
                              {t}
                            </span>
                          ))}
                          {form.workTypes.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium rounded-full">
                              +{form.workTypes.length - 3} more
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
                      { label: 'Profile photo / logo', done: !!form.avatar },
                      { label: 'Name set', done: !!form.name },
                      { label: 'Work type selected', done: form.workTypes.length > 0 },
                      { label: 'Budget range selected', done: !!form.budgetRange },
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
            {step < 3 ? (
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all duration-150 bg-indigo-700 hover:bg-indigo-800 shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Start hiring talent
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