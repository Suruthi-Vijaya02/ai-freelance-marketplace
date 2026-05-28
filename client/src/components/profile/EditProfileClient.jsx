import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { userService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { ALL_COUNTRIES } from '../../data/countriesData';

export default function EditProfileClient() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const cp = user.clientProfile || {};
    setForm({
      name: user.name || '',
      companyName: cp.companyName || user.title || '',
      companySize: cp.companySize || '',
      companyWebsite: cp.companyWebsite || '',
      description: cp.description || user.bio || '',
      industry: cp.industry || '',
      budgetRange: cp.budgetRange || '',
      hiringPreference: cp.hiringPreference || 'both',
      hiringHistory: cp.hiringHistory || '',
      location: user.location || '',
      avatar: user.avatar,
    });
  }, [user]);

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = 'Name is required';
    if (!form.companyName?.trim()) next.companyName = 'Company name is required';
    if (!form.description || form.description.length < 50) next.description = 'Company description must be at least 50 characters';
    if (!form.location) next.location = 'Country is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }
    setSaving(true);
    try {
      const { data } = await userService.updateProfile({
        name: form.name,
        title: form.companyName,
        bio: form.description,
        location: form.location,
        avatar: form.avatar,
        clientProfile: {
          companyName: form.companyName,
          companySize: form.companySize,
          companyWebsite: form.companyWebsite,
          description: form.description,
          industry: form.industry,
          budgetRange: form.budgetRange,
          hiringPreference: form.hiringPreference,
          hiringHistory: form.hiringHistory,
        },
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

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text">Edit Client Profile</h1>
        <p className="text-muted mt-1 font-light">Your company and hiring preferences</p>
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-4">
          <Input label="Your name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Company name" value={form.companyName || ''} onChange={(e) => setForm({ ...form, companyName: e.target.value })} error={errors.companyName} />
          <Input label="Company size" value={form.companySize || ''} onChange={(e) => setForm({ ...form, companySize: e.target.value })} placeholder="e.g. 11-50 employees" />
          <Input label="Website" value={form.companyWebsite || ''} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} placeholder="https://" />
          <Input label="Industry" value={form.industry || ''} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Input label="Typical budget range" value={form.budgetRange || ''} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} placeholder="e.g. $5k - $25k" />
          <div>
            <label className="text-sm font-medium text-text">Hiring preference</label>
            <select
              value={form.hiringPreference}
              onChange={(e) => setForm({ ...form, hiringPreference: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
            >
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed price</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text">Hiring history</label>
            <textarea
              rows={2}
              value={form.hiringHistory || ''}
              onChange={(e) => setForm({ ...form, hiringHistory: e.target.value })}
              className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm"
              placeholder="Past hires, teams built, etc."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text">About company (min 50 characters)</label>
            <textarea rows={4} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text" />
            {errors.description && <p className="text-xs text-error mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-text">Country</label>
            <select value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text">
              <option value="">Select country</option>
              {ALL_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.location && <p className="text-xs text-error mt-1">{errors.location}</p>}
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
