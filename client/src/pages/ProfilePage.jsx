import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, MapPin, Clock, Calendar, Save } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [resumeText, setResumeText] = useState('');

  const profileId = id || authUser?._id || authUser?.id;
  const isOwnProfile =
    isAuthenticated &&
    authUser &&
    (authUser._id === profileId || authUser.id === profileId);

  const loadProfile = useCallback(async (signal) => {
    if (!profileId) return;
    try {
      setLoading(true);
      const [userRes, reviewsRes] = await Promise.all([
        userService.getUserById(profileId),
        userService.getReviews(profileId).catch(() => ({ data: [] })),
      ]);
      if (signal?.aborted) return;
      setProfile(userRes.data);
      setReviews(reviewsRes.data || []);
      setEditForm({
        name: userRes.data.name,
        title: userRes.data.title || '',
        bio: userRes.data.bio || '',
        location: userRes.data.location || '',
        hourlyRate: userRes.data.hourlyRate || '',
        skills: (userRes.data.skills || []).join(', '),
      });
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    const controller = new AbortController();
    loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const skills = editForm.skills.split(',').map((s) => s.trim()).filter(Boolean);
      const { data } = await userService.updateProfile({
        name: editForm.name,
        title: editForm.title,
        bio: editForm.bio,
        location: editForm.location,
        hourlyRate: Number(editForm.hourlyRate) || 0,
        skills,
        resumeText: resumeText || undefined,
      });
      setProfile(data);
      setEditing(false);
      setResumeText('');
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const calendarDays = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    available: [5, 6, 7, 12, 13, 14, 19, 20, 21, 26, 27].includes(i + 1),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <Skeleton className="h-64 w-full" />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-text">Profile not found</h1>
          <Link to="/talent" className="inline-block mt-4"><Button>Browse Talent</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const avatar =
    profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
  const cover =
    profile.coverPhoto ||
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop';

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <div className="relative h-48 md:h-64 bg-card overflow-hidden">
        <img src={cover} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <main className="max-w-5xl mx-auto px-4 -mt-16 relative z-10 pb-16 w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <img src={avatar} alt="" className="w-28 h-28 rounded-2xl border-4 border-surface bg-card" />
          <div className="flex-1 pt-2">
            <h1 className="text-3xl font-black text-text">{profile.name}</h1>
            <p className="text-lg text-muted font-light">{profile.title || profile.role}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {profile.rating || 0} ({profile.totalReviews || 0} reviews)
              </span>
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </span>
              )}
              {profile.hourlyRate > 0 && (
                <span className="text-secondary font-medium">
                  {formatCurrency(profile.hourlyRate)}/hr
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              {isOwnProfile ? (
                <Button onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              ) : (
                <>
                  <Button>Hire Now</Button>
                  <Link to="/workspace">
                    <Button variant="outline">Message</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          {profile.availability?.available !== false && (
            <Badge color="success" className="mt-4 md:mt-8">
              <Clock className="w-3 h-3 mr-1 inline" /> Available
            </Badge>
          )}
        </div>

        {editing && isOwnProfile && (
          <Card className="mt-8">
            <h2 className="font-bold text-text mb-4">Edit Profile</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              <Input label="Hourly rate ($)" type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} />
              <div className="md:col-span-2">
                <Input label="Skills (comma-separated)" value={editForm.skills} onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-text">Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-text">Paste resume for AI skill parsing</label>
                <textarea
                  rows={4}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste resume text — AI will extract skills..."
                  className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Card>
        )}

        {profile.bio && <p className="mt-8 text-muted leading-relaxed max-w-3xl font-light">{profile.bio}</p>}

        <div className="flex flex-wrap gap-2 mt-6">
          {(profile.skills || []).map((s) => (
            <Badge key={s} color="primary">{s}</Badge>
          ))}
        </div>

        {(profile.portfolio || []).length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-text mb-6">Portfolio</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {profile.portfolio.map((item, idx) => (
                <Card key={item._id || idx} hover className="!p-0 overflow-hidden">
                  {item.image && (
                    <img src={item.image} alt="" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-text">{item.title}</h3>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <section>
            <h2 className="text-xl font-bold text-text mb-6">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-muted text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <Card key={r.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-text">{r.client}</span>
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted">{r.comment}</p>
                    <p className="text-xs text-muted mt-2">
                      {r.date ? new Date(r.date).toLocaleDateString() : ''}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Availability
            </h2>
            <Card>
              <p className="text-sm text-muted mb-4 font-light">
                {profile.availability?.hoursPerWeek || 40} hrs/week ·{' '}
                {profile.availability?.timezone || 'UTC'}
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} className="text-center text-xs text-muted py-1">{d}</div>
                ))}
                {calendarDays.map(({ day, available }) => (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                      available
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-surface text-muted'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
