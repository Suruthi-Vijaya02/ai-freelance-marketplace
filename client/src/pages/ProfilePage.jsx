import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, MapPin, Clock, Save, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { userService, messageService } from '../services/authService';
import { formatCurrency, getApiErrorMessage, normalizeConversationId } from '../utils/helpers';
import { getAvailabilityBadge, validateFreelancerProfile } from '../utils/permissions';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney',
];

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Available (Full-time)' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'not-available', label: 'Not Available' },
];

export default function ProfilePage() {
  const { id } = useParams();
  const { user: authUser, isAuthenticated, isFreelancer, isClient } = useRole();
  const { login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [editForm, setEditForm] = useState({});

  const profileId = id || authUser?._id || authUser?.id;
  const navigate = useNavigate();
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
        timezone: userRes.data.availability?.timezone || 'UTC',
        availabilityStatus: userRes.data.availability?.status || 'full-time',
        portfolioUrls: (userRes.data.portfolio || []).map((p) => p.url || '').join('\n'),
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

  const handleAvailabilityChange = async (status) => {
    if (!isOwnProfile) return;
    setUpdatingAvailability(true);
    try {
      const { data } = await userService.updateAvailability(profileId, { status });
      setProfile(data);
      if (authUser) login(data, localStorage.getItem('svr_token'));
      toast.success('Availability updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleSave = async () => {
    const skills = editForm.skills.split(',').map((s) => s.trim()).filter(Boolean);
    const errors = [];
    if (isFreelancer) {
      if (!editForm.title?.trim()) errors.push('Title is required');
      if (!editForm.bio || editForm.bio.length < 50) errors.push('Bio must be at least 50 characters');
      if (!editForm.hourlyRate || Number(editForm.hourlyRate) <= 0) errors.push('Hourly rate is required');
      if (skills.length < 3) errors.push('At least 3 skills required');
      if (!editForm.timezone) errors.push('Timezone is required');
    }
    if (errors.length) {
      toast.error(errors.join('. '));
      return;
    }

    setSaving(true);
    try {
      const portfolio = editForm.portfolioUrls
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, i) => ({ title: `Portfolio ${i + 1}`, url }));

      const { data } = await userService.updateProfile({
        name: editForm.name,
        title: editForm.title,
        bio: editForm.bio,
        location: editForm.location,
        hourlyRate: Number(editForm.hourlyRate) || 0,
        skills,
        portfolio,
        availability: {
          status: editForm.availabilityStatus,
          timezone: editForm.timezone,
          available: editForm.availabilityStatus !== 'not-available',
        },
      });
      setProfile(data);
      if (authUser) login(data, localStorage.getItem('svr_token'));
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-text">Profile not found</h1>
        <Link to="/talent" className="inline-block mt-4"><Button>Browse Talent</Button></Link>
      </div>
    );
  }

  const avatar = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
  const availStatus = profile.availability?.status || (profile.availability?.available !== false ? 'full-time' : 'not-available');
  const availBadge = getAvailabilityBadge(availStatus);
  const profileCheck = isFreelancer && isOwnProfile ? validateFreelancerProfile(profile) : { isComplete: true, missing: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {isOwnProfile && isFreelancer && !profileCheck.isComplete && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-text">Complete your profile to apply for projects</p>
            <p className="text-sm text-muted mt-1">Missing: {profileCheck.missing.join(', ')}</p>
            <Link to="/profile/edit" className="inline-block mt-2">
              <Button size="sm" variant="outline">Complete Profile</Button>
            </Link>
          </div>
        </div>
      )}

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
              <span className="text-secondary font-medium">{formatCurrency(profile.hourlyRate)}/hr</span>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            {isOwnProfile ? (
              <>
                <Button onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
                <Link to="/profile/edit">
                  <Button variant="outline">Full Edit</Button>
                </Link>
              </>
            ) : (
                <>
                  {isClient && <Button>Hire Now</Button>}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const { data } = await messageService.createConversation(profileId);
                        const target = normalizeConversationId(data.id || data.conversationId || data.conversation || data.conversation_id);
                        navigate(`/messages/${target}`);
                      } catch (err) {
                        toast.error(err?.response?.data?.message || 'Failed to start conversation');
                      }
                    }}
                  >
                    Message
                  </Button>
                </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 mt-4 md:mt-8">
          <Badge color={availBadge.color}>
            <Clock className="w-3 h-3 mr-1 inline" /> {availBadge.label}
          </Badge>
          {isOwnProfile && isFreelancer && (
            <select
              value={availStatus}
              onChange={(e) => handleAvailabilityChange(e.target.value)}
              disabled={updatingAvailability}
              className="text-sm px-3 py-1.5 bg-surface border border-border rounded-lg text-text"
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {editing && isOwnProfile && (
        <Card>
          <h2 className="font-bold text-text mb-4">Quick Edit</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            <Input label="Hourly rate ($)" type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} />
            <div className="md:col-span-2">
              <Input label="Skills (comma-separated, min 3)" value={editForm.skills} onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Timezone</label>
              <select
                value={editForm.timezone}
                onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
              >
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-text">Availability</label>
              <select
                value={editForm.availabilityStatus}
                onChange={(e) => setEditForm({ ...editForm, availabilityStatus: e.target.value })}
                className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
              >
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-text">Bio (min 50 chars)</label>
              <textarea
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-text">Portfolio URLs (one per line)</label>
              <textarea
                rows={3}
                value={editForm.portfolioUrls}
                onChange={(e) => setEditForm({ ...editForm, portfolioUrls: e.target.value })}
                className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Card>
      )}

      {profile.bio && <p className="text-muted leading-relaxed max-w-3xl font-light">{profile.bio}</p>}

      <div className="flex flex-wrap gap-2">
        {(profile.skills || []).map((s) => (
          <Badge key={s} color="primary">{s}</Badge>
        ))}
      </div>

      {(profile.portfolio || []).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-text mb-4">Portfolio</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {profile.portfolio.map((item, idx) => (
              <Card key={item._id || idx} hover className="!p-4">
                <h3 className="font-medium text-text">{item.title}</h3>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                    View project
                  </a>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-text mb-4">Reviews</h2>
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
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
