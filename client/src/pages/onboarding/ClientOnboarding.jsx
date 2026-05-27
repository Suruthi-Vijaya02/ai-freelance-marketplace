import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { userService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessType: 'individual',
    companyName: user?.title || '',
    interests: user?.skills || [],
    budget: user?.budget || '',
    description: user?.bio || '',
  });

  const next = () => setStep((s) => Math.min(6, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const toggleInterest = (i) => {
    setForm((f) => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i] }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        title: form.companyName,
        skills: form.interests,
        bio: form.description,
        budgetPreference: form.budget,
      };
      const { data } = await userService.updateProfile(payload);
      login(data, localStorage.getItem('svr_token'));
      navigate('/dashboard/client');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit onboarding');
    }
  };

  const interestOptions = ['Web', 'Mobile', 'AI', 'Design', 'Data', 'DevOps'];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card>
          <h1 className="text-2xl font-bold text-text">Client Onboarding</h1>
          <p className="text-sm text-muted mt-1 mb-4">Tell us about your company and hiring needs.</p>

          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text">Business type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, businessType: 'individual' })} className={`px-3 py-1 rounded-full ${form.businessType === 'individual' ? 'bg-gradient-button text-white' : 'bg-card border border-border text-text'}`}>Individual</button>
                <button type="button" onClick={() => setForm({ ...form, businessType: 'company' })} className={`px-3 py-1 rounded-full ${form.businessType === 'company' ? 'bg-gradient-button text-white' : 'bg-card border border-border text-text'}`}>Company</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Input label="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text">What projects do you want to build?</label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((i) => (
                  <button key={i} type="button" onClick={() => toggleInterest(i)} className={`px-3 py-1 rounded-full text-sm ${form.interests.includes(i) ? 'bg-gradient-button text-white' : 'bg-card border border-border text-text'}`}>{i}</button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Input label="Budget preferences" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <Input label="Description of hiring needs" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-text">Review</h3>
              <p className="text-sm text-muted">Confirm your details before submitting.</p>
              <div className="space-y-2">
                <div className="text-text">{form.companyName}</div>
                <div className="text-muted">Interests: {form.interests.join(', ')}</div>
                <div className="text-muted">Budget: {form.budget}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Button variant="outline" onClick={prev}>Back</Button>
            {step < 6 ? (
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
