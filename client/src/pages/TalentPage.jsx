import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Users, Star, MapPin } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import LoginModal from '../components/ui/LoginModal';
import { useProtectedAction } from '../hooks/useProtectedAction';
import { userService } from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';

export default function TalentPage() {
  const { requireAuth, showLoginModal, closeLoginModal } = useProtectedAction();
  const [talent, setTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadTalent = useCallback(async (signal) => {
    try {
      setLoading(true);
      const { data } = await userService.getFreelancers({ search });
      if (!signal?.aborted) setTalent(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    loadTalent(controller.signal);
    return () => controller.abort();
  }, [loadTalent]);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <LoginModal open={showLoginModal} onClose={closeLoginModal} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-text">Browse Talent</h1>
          <p className="text-muted mt-1 font-light">Discover top-rated freelancers, ranked by AI match</p>
        </div>

        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or skill..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : talent.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted text-lg">No freelancers found.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talent.map((f) => (
              <motion.div key={f._id} whileHover={{ y: -2 }}>
                <Card hover className="h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.name}`}
                      alt=""
                      className="w-14 h-14 rounded-full bg-surface flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text truncate">{f.name}</h3>
                      <p className="text-sm text-muted truncate font-light">{f.title || f.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-text">{f.rating || 0}</span>
                        <span className="text-xs text-muted">({f.totalReviews || 0})</span>
                      </div>
                    </div>
                    {f.matchScore > 0 && <Badge color="primary">{f.matchScore}%</Badge>}
                  </div>

                  {f.bio && (
                    <p className="text-xs text-muted line-clamp-2 mb-3 font-light">{f.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(f.skills || []).slice(0, 3).map((s) => (
                      <Badge key={s} color="muted">{s}</Badge>
                    ))}
                    {f.skills?.length > 3 && (
                      <Badge color="muted">+{f.skills.length - 3}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border text-xs text-muted">
                    <span className="flex items-center gap-1">
                      {f.location && <><MapPin className="w-3 h-3" />{f.location}</>}
                    </span>
                    {f.hourlyRate > 0 && (
                      <span className="text-secondary font-medium">{formatCurrency(f.hourlyRate)}/hr</span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => requireAuth(`/profile/${f._id}`)}
                  >
                    View Profile
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
