import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { userService } from '../../services/authService';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

export default function FreelancerOnboarding() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '',
    tagline: user?.title || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    years: user?.experience || 0,
    english: user?.english || 'fluent',
    hourlyRate: user?.hourlyRate || 0,
    availability: user?.availability?.available ? 'available' : 'unavailable',
    portfolio: user?.portfolio || [],
    avatar: user?.avatar || '',
  });

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const toggleSkill = (skill) => {
    setForm((f) => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill] }));
  };

  const handleFile = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (key === 'avatar') setForm((f) => ({ ...f, avatar: reader.result }));
      else setForm((f) => ({ ...f, portfolio: [...f.portfolio, { title: file.name, image: reader.result }] }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: form.name,
        title: form.tagline,
        bio: form.bio,
        skills: form.skills,
        hourlyRate: Number(form.hourlyRate) || 0,
        availability: { available: form.availability === 'available' },
        portfolio: form.portfolio,
        avatar: form.avatar,
      };
      const { data } = await userService.updateProfile(payload);
      login(data, localStorage.getItem('svr_token'));
      navigate('/dashboard/freelancer');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit onboarding');
    }
  };

  const skillOptions = ['JavaScript', 'React', 'Node.js', 'Python', 'Design', 'Data Science'];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card>
          <h1 className="text-2xl font-bold text-text">Freelancer Onboarding</h1>
          <p className="text-sm text-muted mt-1 mb-4">Tell us about your skills and experience.</p>

          {step === 1 && (
            <div className="space-y-3">
              <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              <Input label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text">Skills</label>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSkill(s)} className={`px-3 py-1 rounded-full border text-sm ${form.skills.includes(s) ? 'bg-gradient-button text-white border-transparent' : 'bg-card border-border text-text'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <Input label="Years of experience" type="number" value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} />
              <Input label="English proficiency" value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Input label="Hourly Rate (USD)" type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
              <label className="block text-sm font-medium text-text">Availability</label>
              <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text">
                <option value="available">Available</option>
                <option value="unavailable">Not available</option>
              </select>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text">Profile photo</label>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'avatar')} />
              <label className="block text-sm font-medium text-text mt-3">Portfolio (3–6 items)</label>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'portfolio')} />
              <div className="grid grid-cols-3 gap-3 mt-3">
                {form.portfolio.map((p, i) => (
                  <div key={i} className="p-2 rounded-lg bg-card border border-border">
                    <img src={p.image} alt={p.title} className="w-full h-24 object-cover rounded" />
                    <div className="text-sm text-text mt-1 truncate">{p.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-text">Review</h3>
              <p className="text-sm text-muted">Confirm your details before submitting.</p>
              <div className="space-y-2">
                <div className="text-text">{form.name}</div>
                <div className="text-muted">{form.tagline}</div>
                <div className="text-muted">Skills: {form.skills.join(', ')}</div>
                <div className="text-muted">Hourly: ${form.hourlyRate}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Button variant="outline" onClick={prev}>Back</Button>
            {step < 5 ? (
              <Button onClick={next}>Next</Button>
            ) : (
              <Button onClick={handleSubmit}>Submit</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
