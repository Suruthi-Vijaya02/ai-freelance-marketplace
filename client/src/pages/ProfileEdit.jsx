import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { userService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import useRole from '../hooks/useRole';
import { ALL_SKILLS } from '../data/skillsData';
import { ALL_COUNTRIES } from '../data/countriesData';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney',
];

const SKILL_OPTIONS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'MongoDB', 'AWS',
  'UI/UX Design', 'Machine Learning', 'DevOps', 'GraphQL', 'Vue.js',
];

export default function ProfileEdit() {
  const { user, login } = useAuth();
  const { isFreelancer } = useRole();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        title: user.title || '',
        bio: user.bio || '',
        location: user.location || '',
        hourlyRate: user.hourlyRate || '',
        skills: user.skills || [],
        timezone: user.availability?.timezone || 'UTC',
        availabilityStatus: user.availability?.status || 'full-time',
        portfolioUrls: (user.portfolio || []).map((p) => p.url || '').join('\n'),
        avatar: user.avatar,
      });
    }
  }, [user]);

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills?.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...(f.skills || []), skill],
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = 'Name is required';
    if (isFreelancer) {
      if (!form.title?.trim()) next.title = 'Title is required';
      if (!form.bio || form.bio.length < 50) next.bio = 'Bio must be at least 50 characters';
      if (!form.hourlyRate || Number(form.hourlyRate) <= 0) next.hourlyRate = 'Hourly rate is required';
      if (!form.skills || form.skills.length < 3) next.skills = 'Select at least 3 skills';
      if (!form.timezone) next.timezone = 'Timezone is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatar: reader.result }));
    reader.readAsDataURL(file);
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

      const payload = {
        name: form.name,
        bio: form.bio,
        skills: form.skills || [],
        hourlyRate: Number(form.hourlyRate) || 0,
        title: form.title,
        location: form.location,
        avatar: form.avatar,
        portfolio,
        availability: {
          status: form.availabilityStatus,
          timezone: form.timezone,
          available: form.availabilityStatus !== 'not-available',
        },
      };
      const { data } = await userService.updateProfile(payload);
      login(data, localStorage.getItem('svr_token'));
      toast.success('Profile saved!');
      navigate(`/profile/${data._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!form.name && !user) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text">Edit Profile</h1>
        <p className="text-muted mt-1 font-light">Update your professional information</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Full name"
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Title / Tagline"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={errors.title}
          />
          <div>
            <label className="text-sm font-medium text-text">Bio (min 50 characters)</label>
            <textarea
              rows={4}
              value={form.bio || ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors.bio && <p className="text-xs text-error mt-1">{errors.bio}</p>}
          </div>
          <Input
            label="Location"
            value={form.location || ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          {isFreelancer && (
            <>
              <Input
                label="Hourly rate ($)"
                type="number"
                value={form.hourlyRate || ''}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                error={errors.hourlyRate}
              />
              <div>
                <label className="text-sm font-medium text-text">Skills (select at least 3)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        form.skills?.includes(skill)
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : 'bg-surface text-muted border-border hover:border-primary/30'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                {errors.skills && <p className="text-xs text-error mt-1">{errors.skills}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-text">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
                >
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
                {errors.timezone && <p className="text-xs text-error mt-1">{errors.timezone}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-text">Availability</label>
                <select
                  value={form.availabilityStatus}
                  onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
                >
                  <option value="full-time">Available (Full-time)</option>
                  <option value="part-time">Part-time</option>
                  <option value="not-available">Not Available</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text">Portfolio URLs (one per line)</label>
                <textarea
                  rows={3}
                  value={form.portfolioUrls || ''}
                  onChange={(e) => setForm({ ...form, portfolioUrls: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Resume / Avatar upload</label>
            <input type="file" accept="image/*,.pdf" onChange={handleFile} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
        </div>
      </Card>
    </div>
  );
}
