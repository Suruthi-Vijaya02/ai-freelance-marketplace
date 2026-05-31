import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, MapPin, Clock, Save, AlertCircle, Building2, Upload, FileText, Sparkles, Check, X } from 'lucide-react';
import HireMeModal from '../components/interview/HireMeModal';
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
  const [showHireModal, setShowHireModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [applyingAi, setApplyingAi] = useState(false);
  const resumeInputRef = useRef(null);

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
      const cp = userRes.data.clientProfile || {};
      setEditForm({
        name: userRes.data.name,
        title: userRes.data.title || '',
        bio: userRes.data.bio || '',
        companyName: cp.companyName || userRes.data.title || '',
        companyBio: cp.description || userRes.data.bio || '',
        industry: cp.industry || '',
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

  // Load AI suggestions if viewing own freelancer profile
  useEffect(() => {
    if (isOwnProfile && profile?.role === 'freelancer') {
      userService.getAiSuggestions()
        .then(({ data }) => { if (data?.generatedAt) setAiSuggestions(data); })
        .catch(() => {});
    }
  }, [isOwnProfile, profile?.role]);

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

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF or TXT resume files are accepted');
      return;
    }
    setResumeUploading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const { data } = await userService.uploadResume(form);
      setAiSuggestions(data.aiSuggestions || null);
      if (data.user) setProfile(data.user);
      toast.success('Resume uploaded! AI suggestions are ready.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  const handleApplySuggestions = async ({ acceptSkills, acceptBio }) => {
    setApplyingAi(true);
    try {
      const { data } = await userService.applyAiSuggestions({ acceptSkills, acceptBio });
      if (data.user) {
        setProfile(data.user);
        if (authUser) login(data.user, localStorage.getItem('svr_token'));
        setEditForm((prev) => ({
          ...prev,
          skills: (data.user.skills || []).join(', '),
          bio: data.user.bio || prev.bio,
        }));
      }
      toast.success('AI suggestions applied!');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setApplyingAi(false);
    }
  };

  const handleSaveClientQuick = async () => {
    setSaving(true);
    try {
      const { data } = await userService.updateProfile({
        name: editForm.name,
        title: editForm.companyName || editForm.title,
        bio: editForm.companyBio || editForm.bio,
        location: editForm.location,
        clientProfile: {
          companyName: editForm.companyName || editForm.title,
          description: editForm.companyBio || editForm.bio,
          industry: editForm.industry,
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
  const isProfileFreelancer = profile?.role === 'freelancer';
  const isProfileClient = profile?.role === 'client';
  const profileCheck =
    isOwnProfile && isProfileFreelancer ? validateFreelancerProfile(profile) : { isComplete: true, missing: [] };
  const completion = profile?.profileCompletion ?? 0;
  const clientProfile = profile?.clientProfile || {};
  const freelancerProfile = profile?.freelancerProfile || {};
  const canHire = isClient && isProfileFreelancer && !isOwnProfile;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {isOwnProfile && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted">Profile completion</span>
            <span className="text-text font-medium">{completion}%</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>
      )}

      {isOwnProfile && isProfileFreelancer && !profileCheck.isComplete && (
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
          <p className="text-lg text-muted font-light">
            {isProfileClient
              ? clientProfile.companyName || profile.title
              : profile.title || profile.role}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted">
            {isProfileFreelancer && (
              <>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {profile.rating || 0} ({profile.totalReviews || 0} reviews)
                </span>
                {(freelancerProfile.hourlyRate ?? profile.hourlyRate) > 0 && (
                  <span className="text-secondary font-medium">
                    {formatCurrency(freelancerProfile.hourlyRate ?? profile.hourlyRate)}/hr
                  </span>
                )}
              </>
            )}
            {isProfileClient && clientProfile.industry && (
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" /> {clientProfile.industry}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {profile.location}
              </span>
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
                  {canHire && (
                    <Button onClick={() => setShowHireModal(true)}>Hire Me</Button>
                  )}
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
        {isProfileFreelancer && (
        <div className="flex flex-col items-end gap-2 mt-4 md:mt-8">
          <Badge color={availBadge.color}>
            <Clock className="w-3 h-3 mr-1 inline" /> {availBadge.label}
          </Badge>
          {isOwnProfile && (
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
        )}
      </div>

      {editing && isOwnProfile && isProfileFreelancer && (
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

          {/* Resume Upload */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-sm font-medium text-text mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Upload Resume for AI Enrichment
            </p>
            <p className="text-xs text-muted mb-3">Upload a PDF or TXT resume — AI will suggest skills and a bio.</p>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              id="resume-upload-input"
              onChange={handleResumeUpload}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={resumeUploading}
              onClick={() => resumeInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              {resumeUploading ? 'Uploading...' : (profile?.resumeUrl ? 'Re-upload Resume' : 'Upload Resume')}
            </Button>
            {profile?.resumeUrl && !resumeUploading && (
              <p className="text-xs text-muted mt-2 flex items-center gap-1">
                <Check className="w-3 h-3 text-success" /> Resume on file
              </p>
            )}
          </div>
        </Card>
      )}

      {/* AI Suggestions Panel — shown when suggestions exist and own freelancer profile */}
      {isOwnProfile && isProfileFreelancer && aiSuggestions?.generatedAt && (
        <Card className="border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-text">AI Profile Suggestions</h2>
            <span className="text-xs text-muted ml-auto">
              Generated {new Date(aiSuggestions.generatedAt).toLocaleDateString()}
            </span>
          </div>

          {aiSuggestions.skills?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-text mb-2">Suggested Skills</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {aiSuggestions.skills.map((s) => (
                  <span key={s} className="px-2 py-1 rounded-full text-xs bg-primary/15 text-primary border border-primary/25">{s}</span>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={applyingAi}
                onClick={() => handleApplySuggestions({ acceptSkills: true, acceptBio: false })}
              >
                <Check className="w-3 h-3" /> Accept Skills
              </Button>
            </div>
          )}

          {aiSuggestions.bio && (
            <div className="mb-4">
              <p className="text-sm font-medium text-text mb-2">AI-Generated Bio</p>
              <p className="text-sm text-muted italic leading-relaxed bg-surface rounded-lg p-3 border border-border">
                &ldquo;{aiSuggestions.bio}&rdquo;
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  disabled={applyingAi}
                  onClick={() => handleApplySuggestions({ acceptSkills: false, acceptBio: true })}
                >
                  <Check className="w-3 h-3" /> Use this Bio
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={applyingAi}
                  onClick={() => handleApplySuggestions({ acceptSkills: true, acceptBio: true })}
                >
                  <Sparkles className="w-3 h-3" /> Apply All
                </Button>
              </div>
            </div>
          )}

          {aiSuggestions.experienceKeywords?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text mb-2">Detected Experience Signals</p>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.experienceKeywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded text-xs bg-secondary/10 text-secondary">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {editing && isOwnProfile && isProfileClient && (
        <Card>
          <h2 className="font-bold text-text mb-4">Quick Edit — Company</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <Input
              label="Company name"
              value={editForm.companyName || editForm.title}
              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value, title: e.target.value })}
            />
            <Input label="Industry" value={editForm.industry || ''} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} />
            <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-text">About company</label>
              <textarea
                rows={3}
                value={editForm.companyBio || editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, companyBio: e.target.value, bio: e.target.value })}
                className="w-full mt-1.5 px-4 py-2.5 bg-surface border border-border rounded-lg text-text"
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSaveClientQuick} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Card>
      )}

      {(freelancerProfile.bio || profile.bio || clientProfile.description) && (
        <p className="text-muted leading-relaxed max-w-3xl font-light">
          {isProfileClient ? clientProfile.description || profile.bio : freelancerProfile.bio || profile.bio}
        </p>
      )}

      {isProfileClient && (
        <Card className="mt-6">
          <h2 className="font-bold text-text mb-3">Company Details</h2>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            {clientProfile.companySize && (
              <div><dt className="text-muted">Size</dt><dd className="text-text">{clientProfile.companySize}</dd></div>
            )}
            {clientProfile.companyWebsite && (
              <div><dt className="text-muted">Website</dt><dd className="text-text">{clientProfile.companyWebsite}</dd></div>
            )}
            {clientProfile.budgetRange && (
              <div><dt className="text-muted">Budget</dt><dd className="text-text">{clientProfile.budgetRange}</dd></div>
            )}
          </dl>
        </Card>
      )}

      {isProfileFreelancer && (
        <div className="flex flex-wrap gap-2 mt-4">
          {(freelancerProfile.skills || profile.skills || []).map((s) => (
            <Badge key={s} color="primary">{s}</Badge>
          ))}
        </div>
      )}

      {isProfileFreelancer && (freelancerProfile.portfolio || profile.portfolio || []).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-text mb-4">Portfolio</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(freelancerProfile.portfolio || profile.portfolio).map((item, idx) => (
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

      {showHireModal && canHire && (
        <HireMeModal
          freelancerId={profileId}
          freelancerName={profile.name}
          onClose={() => setShowHireModal(false)}
        />
      )}
    </div>
  );
}
