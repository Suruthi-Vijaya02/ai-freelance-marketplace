import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AlertCircle, ArrowUpRight, MessageSquare, Calendar,
  FileText, Briefcase, Clock
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import useRole from '../hooks/useRole';
import {
  proposalService, contractService, interviewService
} from '../services/authService';
import { formatCurrency, getApiErrorMessage } from '../utils/helpers';
import HeroImg from '../assets/img1.png';

/* ── Inline font styles (no tailwind config needed) ── */
const fontDisplay = { fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' };
const fontBody = { fontFamily: '"Inter", system-ui, sans-serif' };

function NoiseOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.025]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

export default function FreelancerDashboard() {
  const { user, profileValidation } = useRole();
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (signal) => {
    try {
      const [proposalsRes, contractsRes, interviewsRes] = await Promise.all([
        proposalService.getMyProposals().catch(() => ({ data: [] })),
        contractService.getMyContracts().catch(() => ({ data: [] })),
        interviewService.getMyInterviews().catch(() => ({ data: [] })),
      ]);
      if (!signal?.aborted) {
        setProposals(Array.isArray(proposalsRes.data) ? proposalsRes.data : []);
        setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
        setInterviews(Array.isArray(interviewsRes.data) ? interviewsRes.data : []);
      }
    } catch (err) {
      if (!signal?.aborted) {
        const msg = getApiErrorMessage(err);
        setError(msg);
        toast.error(msg);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      await loadData(controller.signal);
      if (!controller.signal.aborted) setLoading(false);
    })();
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    api.get('/notifications').then((res) => {
      if (res.data.success) setNotifications(res.data.notifications);
    }).catch(() => { });
  }, []);

  const activeProposals = proposals.filter((p) => p.status === 'pending');
  const activeContracts = contracts.filter((c) => c.status === 'active');
  const upcomingInterviews = interviews
    .filter((i) =>
      ['scheduled', 'accepted'].includes(i.status) &&
      new Date(i.scheduledTime) > new Date()
    )
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── card base classes: white bg, hover shifts to soft tint ── */
  const cardBase =
    'bg-white rounded-2xl p-6 md:p-8 transition-colors duration-300 hover:bg-[#f5f3fb]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-20 md:space-y-28"
      style={fontBody}
    >
      {/* ═══════════════════════════════════════
          HERO — Full background image + overlay
          ═══════════════════════════════════════ */}
      <section className="relative min-h-[420px] md:min-h-[480px] flex items-end md:items-center overflow-hidden rounded-[2rem]">
        {/* Full-bleed image */}
        <div className="absolute inset-0">
          <img
            src={HeroImg}
            alt=""
            className="w-full h-full object-cover object-center"
          />
          {/* Lavender gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ede9f8]/85 via-[#ede9f8]/60 to-[#ede9f8]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ede9f8]/80 via-transparent to-transparent" />
          <NoiseOverlay />
        </div>

        {/* Text content */}
        <div className="relative z-10 w-full px-6 md:px-10 py-12 md:py-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px w-8 bg-[#3d47d4]" />
            <span className="text-[#6b64a8] text-[11px] tracking-[0.25em] uppercase font-semibold">
              {greeting}{user?.name ? `, ${user.name}` : ''}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[2.6rem] sm:text-[3.2rem] md:text-[4rem] text-[#1a1560] leading-[0.95] tracking-tight mb-6"
            style={fontDisplay}
          >
            Your workspace
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-[#6b64a8] text-[15px] leading-[1.7] max-w-md font-medium mb-8"
          >
            Track active contracts, monitor proposals, and manage interviews — everything that moves your work forward.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link to="/projects">
              <Button size="md">Browse Projects</Button>
            </Link>
            <Link to="/my-proposals">
              <Button variant="outline" size="md">My Proposals</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Profile validation banner */}
      {!profileValidation.isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-start gap-4 py-4 px-5 border border-[#ff4d1c]/15 bg-white rounded-2xl hover:bg-[#fff8f6] transition-colors"
        >
          <AlertCircle className="w-5 h-5 text-[#ff4d1c] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#1a1560]">
              Complete your profile to get discovered
            </p>
            <p className="text-[12px] text-[#6b64a8] mt-0.5">
              Missing: {profileValidation.missing.join(', ')}
            </p>
          </div>
          <Link to="/profile/edit">
            <Button size="sm">Complete</Button>
          </Link>
        </motion.div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-5 py-4"
        >
          {error}
        </motion.p>
      )}

      {/* ═══════════════════════════════════════
          NOTIFICATIONS
          ═══════════════════════════════════════ */}
      {notifications.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#3d47d4]" />
            <span className="text-[#ff4d1c] text-[11px] tracking-[0.25em] uppercase font-semibold">
              Notifications
            </span>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden hover:bg-[#f5f3fb] transition-colors">
            {notifications.slice(0, 5).map((n, idx) => (
              <div
                key={n._id}
                className={`flex items-center justify-between py-3.5 px-6 ${idx !== notifications.length - 1 ? 'border-b border-[#ede9f8]' : ''
                  }`}
              >
                <p className="text-[13px] text-[#1a1560] font-medium">{n.message}</p>
                <span className="text-[11px] text-[#6b64a8] shrink-0 ml-4">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══════════════════════════════════════
          MAIN GRID
          ═══════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-10">

          {/* Active Contracts */}
          <div className={cardBase}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-[#3d47d4]" />
              <span className="text-[#ff4d1c] text-[11px] tracking-[0.25em] uppercase font-semibold">
                Active Work
              </span>
            </div>
            <h2
              className="text-[2rem] md:text-[2.4rem] text-[#1a1560] tracking-tight leading-none mb-1"
              style={fontDisplay}
            >
              Contracts
            </h2>
            <p className="text-[#6b64a8] text-[13px] mb-6">
              Work you're delivering now.
            </p>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : activeContracts.length === 0 ? (
              <div className="py-10 text-center border-t border-[#ede9f8]">
                <Briefcase
                  className="w-10 h-10 text-[#1a1560]/8 mx-auto mb-4"
                  strokeWidth={1.2}
                />
                <p className="text-[13px] text-[#6b64a8]">
                  No active contracts yet.
                </p>
                <Link
                  to="/projects"
                  className="inline-block mt-3 text-[13px] text-[#3d47d4] font-semibold hover:underline"
                >
                  Find work &rarr;
                </Link>
              </div>
            ) : (
              <div className="border-t border-[#ede9f8]">
                {activeContracts.map((c) => (
                  <Link
                    key={c._id}
                    to={`/contracts/${c._id}`}
                    className="flex items-center justify-between py-4 px-2 border-b border-[#ede9f8] hover:bg-[#faf8ff] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#3d47d4]/8 flex items-center justify-center shrink-0">
                        <FileText
                          className="w-[18px] h-[18px] text-[#3d47d4]"
                          strokeWidth={1.8}
                        />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#1a1560] group-hover:text-[#3d47d4] transition-colors">
                          {c.project?.title || 'Contract'}
                        </p>
                        <p className="text-[12px] text-[#6b64a8] mt-0.5 font-medium">
                          {formatCurrency(c.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge color="success">{c.status}</Badge>
                      <ArrowUpRight className="w-4 h-4 text-[#1a1560]/0 group-hover:text-[#3d47d4] transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Proposals */}
          <div className={cardBase}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-[#3d47d4]" />
              <span className="text-[#ff4d1c] text-[11px] tracking-[0.25em] uppercase font-semibold">
                Pipeline
              </span>
            </div>
            <h2
              className="text-[2rem] md:text-[2.4rem] text-[#1a1560] tracking-tight leading-none mb-1"
              style={fontDisplay}
            >
              Proposals
            </h2>
            <p className="text-[#6b64a8] text-[13px] mb-6">
              Pending applications and responses.
            </p>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : activeProposals.length === 0 ? (
              <div className="py-10 text-center border-t border-[#ede9f8]">
                <Clock
                  className="w-10 h-10 text-[#1a1560]/8 mx-auto mb-4"
                  strokeWidth={1.2}
                />
                <p className="text-[13px] text-[#6b64a8]">
                  No active proposals.
                </p>
              </div>
            ) : (
              <div className="border-t border-[#ede9f8]">
                {activeProposals.slice(0, 6).map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between py-4 px-2 border-b border-[#ede9f8] hover:bg-[#faf8ff] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#ff4d1c]/8 flex items-center justify-center shrink-0">
                        <FileText
                          className="w-[18px] h-[18px] text-[#ff4d1c]"
                          strokeWidth={1.8}
                        />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#1a1560]">
                          {p.project?.title}
                        </p>
                        <p className="text-[12px] text-[#6b64a8] mt-0.5 font-medium">
                          {p.timeline} · {formatCurrency(p.price)}
                        </p>
                      </div>
                    </div>
                    <Badge color="warning">{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Interviews */}
          <div className={cardBase}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-6 bg-[#3d47d4]" />
              <span className="text-[#6b64a8] text-[11px] tracking-[0.25em] uppercase font-semibold">
                Interviews
              </span>
            </div>

            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : upcomingInterviews.length === 0 ? (
              <div className="py-4 border-t border-[#ede9f8]">
                <div className="flex items-center gap-3">
                  <Calendar
                    className="w-4 h-4 text-[#1a1560]/15"
                    strokeWidth={1.8}
                  />
                  <p className="text-[13px] text-[#6b64a8]">
                    Nothing scheduled.
                  </p>
                </div>
                <Link
                  to="/interviews"
                  className="inline-block mt-3 text-[12px] text-[#3d47d4] font-semibold hover:underline"
                >
                  View all &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-0">
                {upcomingInterviews.slice(0, 4).map((iv) => (
                  <div
                    key={iv._id}
                    className="flex items-start gap-3 py-3.5 border-b border-[#ede9f8] hover:bg-[#faf8ff] transition-colors px-1"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#3d47d4]/8 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar
                        className="w-4 h-4 text-[#3d47d4]"
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1a1560] truncate">
                        {iv.projectId?.title || iv.clientId?.name}
                      </p>
                      <p className="text-[11px] text-[#6b64a8] mt-0.5 font-medium">
                        {new Date(iv.scheduledTime).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge
                      color={iv.status === 'accepted' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {iv.status}
                    </Badge>
                  </div>
                ))}
                <Link
                  to="/interviews"
                  className="inline-block mt-4 text-[12px] text-[#3d47d4] font-semibold hover:underline"
                >
                  See all interviews &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className={cardBase}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-6 bg-[#3d47d4]" />
              <span className="text-[#6b64a8] text-[11px] tracking-[0.25em] uppercase font-semibold">
                Messages
              </span>
            </div>

            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : proposals.length === 0 ? (
              <div className="py-4 border-t border-[#ede9f8]">
                <div className="flex items-center gap-3">
                  <MessageSquare
                    className="w-4 h-4 text-[#1a1560]/15"
                    strokeWidth={1.8}
                  />
                  <p className="text-[13px] text-[#6b64a8]">
                    No conversations yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {proposals.slice(0, 4).map((p) => (
                  <Link
                    key={p._id}
                    to={`/messages/${p._id}`}
                    className="flex items-center gap-3 py-3 border-b border-[#ede9f8] hover:bg-[#faf8ff] transition-colors px-1 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#ede9f8] border border-[#cec8e8]/50 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={
                          p.clientAvatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.clientName || 'user'}`
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1a1560] group-hover:text-[#3d47d4] transition-colors truncate">
                        {p.project?.title}
                      </p>
                      <p className="text-[11px] text-[#6b64a8] capitalize">
                        {p.status}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#1a1560]/0 group-hover:text-[#3d47d4] transition-all shrink-0" />
                  </Link>
                ))}
                <Link
                  to="/messages"
                  className="inline-block mt-4 text-[12px] text-[#3d47d4] font-semibold hover:underline"
                >
                  Open messages &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Navigate */}
          <div className={cardBase}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-6 bg-[#3d47d4]" />
              <span className="text-[#6b64a8] text-[11px] tracking-[0.25em] uppercase font-semibold">
                Navigate
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Earnings', to: '/earnings' },
                { label: 'Contracts', to: '/contracts' },
                { label: 'Profile', to: '/profile' },
              ].map((item) => (
                <Link key={item.to} to={item.to}>
                  <span className="inline-flex items-center px-4 py-2.5 rounded-full border border-[#cec8e8]/70 text-[12px] font-medium text-[#1a1560] bg-white hover:bg-[#f5f3fb] hover:border-[#3d47d4]/30 transition-colors">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}