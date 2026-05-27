import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { userService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function ProfileEdit() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleFile = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, [key]: reader.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        skills: form.skills || [],
        hourlyRate: form.hourlyRate || 0,
        title: form.title,
        location: form.location,
        avatar: form.avatar,
        portfolio: form.portfolio || [],
      };
      const { data } = await userService.updateProfile(payload);
      login(data, localStorage.getItem('svr_token'));
      navigate(`/profile/${data._id}`);
    } catch (err) {
      // show user friendly error
      try {
        const toast = (await import('react-hot-toast')).default;
        toast.error(err?.message || 'Failed to save profile');
      } catch {}
    }
  };

  if (!form) return null;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card>
          <h1 className="text-2xl font-bold text-text">Edit Profile</h1>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Input label="Full name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Title / Tagline" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Bio" value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <Input label="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input label="Hourly rate" type="number" value={form.hourlyRate || ''} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
            <label className="block text-sm font-medium text-text">Avatar</label>
            <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'avatar')} />
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
