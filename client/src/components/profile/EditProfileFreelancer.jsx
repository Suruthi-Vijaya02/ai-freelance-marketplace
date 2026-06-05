import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SkillsSelector from './SkillsSelector';
import { userService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { ALL_COUNTRIES } from '../../data/countriesData';
import { Zap, Shield, HelpCircle, Award } from 'lucide-react';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney',
];

export default function EditProfileFreelancer() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fp = user.freelancerProfile || {};
    setForm({
      name: user.name || '',
      title: user.title || '',
      bio: fp.bio || user.bio || '',
      location: user.location || '',
      hourlyRate: fp.hourlyRate ?? user.hourlyRate ?? '',
      skills: fp.skills?.length ? fp.skills : user.skills || [],
      timezone: user.availability?.timezone || 'UTC',
      availabilityStatus: user.availability?.status || 'full-time',
      portfolioUrls: (fp.portfolio || user.portfolio || []).map((p) => p.url || '').join('\n'),
      certificationsText: (fp.certifications || [])
        .map((c) => `${c.name}|${c.issuer || ''}|${c.year || ''}`)
        .join('\n'),
      experienceText: (fp.experience || [])
        .map((e) => `${e.title}|${e.company || ''}|${e.years || ''}|${e.description || ''}`)
        .join('\n'),
      avatar: user.avatar,
      // Bank details:
      accountHolderName: user.bankAccount?.accountHolderName || '',
      bankName: user.bankAccount?.bankName || '',
      accountNumber: user.bankAccount?.accountNumber || '',
      ifscCode: user.bankAccount?.ifscCode || '',
    });
  }, [user]);

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = 'Name is required';
    if (!form.title?.trim() || form.title.length < 5) next.title = 'Title is required (min 5 chars)';
    if (!form.bio || form.bio.length < 50) next.bio = 'Bio must be at least 50 characters';
    if (!form.hourlyRate || Number(form.hourlyRate) <= 0) next.hourlyRate = 'Hourly rate is required';
    if (!form.skills || form.skills.length < 3) next.skills = 'Select at least 3 skills';
    if (form.skills?.length > 15) next.skills = 'Maximum 15 skills';
    if (!form.location) next.location = 'Country is required';
    if (!form.timezone) next.timezone = 'Timezone is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlanChange = async (tier) => {
    try {
      const { data } = await userService.updateProfile({
        subscription: {
          tier,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      login(data, localStorage.getItem('svr_token'));
      toast.success(`Plan updated to ${tier.toUpperCase()} successfully!`);
    } catch (err) {
      toast.error('Failed to change subscription plan');
    }
  };

  const save = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }
    setSaving(true);
    try {
      const portfolio = (form.portfolioUrls || '')
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, i) => ({ title: `Portfolio ${i + 1}`, url }));

      const experience = (form.experienceText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [title, company, years, description] = line.split('|');
          return {
            title: title?.trim(),
            company: company?.trim(),
            years: years ? Number(years) : undefined,
            description: description?.trim(),
          };
        });

      const certifications = (form.certificationsText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, issuer, year] = line.split('|');
          return { name: name?.trim(), issuer: issuer?.trim(), year: year ? Number(year) : undefined };
        });

      const { data } = await userService.updateProfile({
        name: form.name,
        title: form.title,
        bio: form.bio,
        location: form.location,
        hourlyRate: Number(form.hourlyRate),
        skills: form.skills,
        avatar: form.avatar,
        portfolio,
        availability: {
          status: form.availabilityStatus,
          timezone: form.timezone,
          available: form.availabilityStatus !== 'not-available',
        },
        freelancerProfile: {
          skills: form.skills,
          hourlyRate: Number(form.hourlyRate),
          bio: form.bio,
          portfolio,
          experience,
          certifications,
        },
        // Save bank account info:
        bankAccount: {
          accountHolderName: form.accountHolderName,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode,
        }
      });
      login(data, localStorage.getItem('svr_token'));
      toast.success('Profile saved!');
      navigate(`/profile/${data._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const currentTier = user.subscription?.tier || 'free';

  return (
    <div className="max-w-3xl space-y-8 pb-12 font-body">
      <div>
        <h1 className="text-2xl font-black text-text">Edit Freelancer Profile</h1>
        <p className="text-muted mt-1 font-light">Showcase your skills, experience, and subscription tier</p>
      </div>

      {/* Subscription Plans Card */}
      <Card className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-text">Select Subscription Plan</h2>
          <p className="text-xs text-muted mt-0.5">Choose your tier to decrease project fees and unlock premium tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Tier */}
          <div className={`p-4 rounded-3xl border-2 flex flex-col justify-between space-y-4 ${
            currentTier === 'free' ? 'border-primary bg-primary/5' : 'border-border bg-white'
          }`}>
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text">Free</span>
                {currentTier === 'free' && <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">Active</span>}
              </div>
              <p className="text-2xl font-black text-text mt-2">$0 <span className="text-xs font-normal text-muted">/ mo</span></p>
              <ul className="text-xs text-muted space-y-1.5 mt-4">
                <li>• 10% milestone commission</li>
                <li>• 5 proposals per month</li>
                <li>• Basic profile tools</li>
              </ul>
            </div>
            {currentTier !== 'free' && (
              <Button size="sm" variant="outline" className="w-full" onClick={() => handlePlanChange('free')}>
                Downgrade to Free
              </Button>
            )}
          </div>

          {/* Pro Tier */}
          <div className={`p-4 rounded-3xl border-2 flex flex-col justify-between space-y-4 ${
            currentTier === 'pro' ? 'border-primary bg-primary/5' : 'border-border bg-white'
          }`}>
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> Pro</span>
                {currentTier === 'pro' && <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">Active</span>}
              </div>
              <p className="text-2xl font-black text-text mt-2">$19 <span className="text-xs font-normal text-muted">/ mo</span></p>
              <ul className="text-xs text-muted space-y-1.5 mt-4">
                <li>• 5% milestone commission</li>
                <li>• Unlimited proposals</li>
                <li>• Featured profile badge</li>
                <li>• Priority matching</li>
              </ul>
            </div>
            {currentTier !== 'pro' && (
              <Button size="sm" className="w-full" onClick={() => handlePlanChange('pro')}>
                Upgrade to Pro
              </Button>
            )}
          </div>

          {/* Elite Tier */}
          <div className={`p-4 rounded-3xl border-2 flex flex-col justify-between space-y-4 ${
            currentTier === 'elite' ? 'border-indigo-700 bg-indigo-50/10' : 'border-border bg-white'
          }`}>
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-700 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-600" /> Elite</span>
                {currentTier === 'elite' && <span className="text-[10px] uppercase font-bold text-indigo-700 px-2 py-0.5 rounded-full bg-indigo-150">Active</span>}
              </div>
              <p className="text-2xl font-black text-indigo-700 mt-2">$49 <span className="text-xs font-normal text-muted">/ mo</span></p>
              <ul className="text-xs text-muted space-y-1.5 mt-4">
                <li>• 0% milestone commission</li>
                <li>• Unlimited proposals</li>
                <li>• All Pro features</li>
                <li>• AI tools + Video interviews</li>
              </ul>
            </div>
            {currentTier !== 'elite' && (
              <Button size="sm" className="w-full bg-indigo-700 text-white hover:bg-indigo-800" onClick={() => handlePlanChange('elite')}>
                Upgrade to Elite
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-4">
          <Input label="Full name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Professional title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} />
          <div>
            <label className="text-sm font-medium text-text">About you (min 50 characters)</label>
            <textarea rows={4} value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-primary" />
            {errors.bio && <p className="text-xs text-error mt-1">{errors.bio}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-text">Country</label>
            <select value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm">
              <option value="">Select country</option>
              {ALL_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.location && <p className="text-xs text-error mt-1">{errors.location}</p>}
          </div>
          <Input label="Hourly rate ($)" type="number" value={form.hourlyRate || ''} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} error={errors.hourlyRate} />
          <SkillsSelector value={form.skills || []} onChange={(skills) => setForm({ ...form, skills })} error={errors.skills} />
          <div>
            <label className="text-sm font-medium text-text">Timezone</label>
            <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            {errors.timezone && <p className="text-xs text-error mt-1">{errors.timezone}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-text">Experience (title|company|years|description per line)</label>
            <textarea rows={3} value={form.experienceText || ''} onChange={(e) => setForm({ ...form, experienceText: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Certifications (name|issuer|year per line)</label>
            <textarea rows={2} value={form.certificationsText || ''} onChange={(e) => setForm({ ...form, certificationsText: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Portfolio URLs (one per line)</label>
            <textarea rows={3} value={form.portfolioUrls || ''} onChange={(e) => setForm({ ...form, portfolioUrls: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none" />
          </div>
        </div>
      </Card>

      {/* Bank Account Settings Card */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text">Bank Account for Payouts</h2>
          <p className="text-xs text-muted mt-0.5">Please provide your bank details below to enable withdrawals.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Account Holder Name" 
            value={form.accountHolderName || ''} 
            onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} 
          />
          <Input 
            label="Bank Name" 
            value={form.bankName || ''} 
            onChange={(e) => setForm({ ...form, bankName: e.target.value })} 
          />
          <Input 
            label="Account Number" 
            value={form.accountNumber || ''} 
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} 
          />
          <Input 
            label="Routing / IFSC Code" 
            value={form.ifscCode || ''} 
            onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} 
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </div>
    </div>
  );
}
