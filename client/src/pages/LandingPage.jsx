import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Users, Briefcase, Globe, ArrowRight,
  Brain, Shield, Zap, Star, Lock,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import LoginModal from '../components/ui/LoginModal';
import { useAuth } from '../context/AuthContext';
import { useProtectedAction } from '../hooks/useProtectedAction';
import { statsService, projectService, userService } from '../services/authService';
import { formatCurrency } from '../utils/helpers';

const steps = [
  { step: 1, title: 'Post or Find Work', desc: 'Clients post projects; freelancers discover AI-matched opportunities.', icon: Briefcase },
  { step: 2, title: 'AI-Powered Matching', desc: 'Our engine scores skills, experience, and availability for perfect fits.', icon: Brain },
  { step: 3, title: 'Collaborate Securely', desc: 'Real-time messaging, video calls, and collaborative workspaces.', icon: Zap },
  { step: 4, title: 'Escrow & Release', desc: 'Milestone-based payments with blockchain-verified contracts.', icon: Shield },
];

const testimonials = [
  { name: 'Ananya K.', role: 'Startup Founder', quote: 'Found our lead developer in 48 hours with a 97% AI match score.' },
  { name: 'Marcus T.', role: 'Full-Stack Freelancer', quote: 'The live bidding feature helped me land three premium clients this month.' },
  { name: 'Elena R.', role: 'Product Manager', quote: 'Escrow payments and real-time messaging made remote collaboration effortless.' },
];

function FeaturedOverlay({ onLogin, label = 'Login to view' }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-surface/80 backdrop-blur-sm border border-border">
      <Lock className="w-8 h-8 text-primary mb-2" />
      <p className="text-sm text-text font-medium mb-3">{label}</p>
      <Button size="sm" onClick={onLogin}>Log In to Continue</Button>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { requireAuth, showLoginModal, closeLoginModal } = useProtectedAction();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const loadFeatured = useCallback(async () => {
    try {
      setLoadingFeatured(true);
      const [statsRes, projectsRes, freelancersRes] = await Promise.all([
        statsService.getStats(),
        projectService.getProjects({ limit: 6, status: 'open' }),
        userService.getFeaturedFreelancers(),
      ]);
      setStats(statsRes.data);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setFreelancers(Array.isArray(freelancersRes.data) ? freelancersRes.data : []);
    } catch {
      /* landing page degrades gracefully */
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  const statItems = stats
    ? [
        { label: 'Active Freelancers', value: stats.totalFreelancers?.toLocaleString(), icon: Users },
        { label: 'Projects Posted', value: stats.totalProjects?.toLocaleString(), icon: Briefcase },
        { label: 'Registered Users', value: stats.totalUsers?.toLocaleString(), icon: Globe },
        { label: 'Completed Projects', value: stats.completedProjects?.toLocaleString(), icon: Brain },
      ]
    : [];

  const visibleProjects = isAuthenticated ? projects : projects.slice(0, 3);
  const lockedProjects = !isAuthenticated ? projects.slice(3, 6) : [];
  const visibleFreelancers = isAuthenticated ? freelancers.slice(0, 6) : freelancers.slice(0, 3);
  const lockedFreelancers = !isAuthenticated ? freelancers.slice(3, 6) : [];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <LoginModal open={showLoginModal} onClose={closeLoginModal} />

      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge color="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1 inline" /> Global Talent Network
            </Badge>
            <h1 className="font-heading text-4xl md:text-6xl text-text leading-tight max-w-4xl mx-auto">
              Hire World-Class Talent with{' '}
              <span className="text-gradient-primary">AI Precision</span>
            </h1>
            <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
              Suruthi Vijaya R connects businesses with elite freelancers worldwide.
              Smart matching, secure escrow, and real-time collaboration — all in one platform.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/projects">
                    <Button size="lg">Browse Projects <ArrowRight className="w-5 h-5" /></Button>
                  </Link>
                  <Link to="/dashboard/client">
                    <Button variant="outline" size="lg">Go to Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg">Get Started <ArrowRight className="w-5 h-5" /></Button>
                  </Link>
                  <Link to="/signup?role=freelancer">
                    <Button variant="outline" size="lg">Join as Freelancer</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="bg-card/50 py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-heading text-text text-center mb-2">How It Works</h2>
          <p className="text-muted text-center mb-12 max-w-xl mx-auto">
            From discovery to delivery — a seamless AI-enhanced workflow
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-button flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-secondary tracking-wider">STEP {step}</span>
                <h3 className="font-semibold text-text mt-2">{title}</h3>
                <p className="text-sm text-muted mt-2">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {(isAuthenticated || projects.length > 0 || freelancers.length > 0) && (
        <section id="featured" className="max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="text-center mb-10">
            <h2 className="font-heading text-text">Featured Opportunities</h2>
            <p className="text-muted mt-1">
              {isAuthenticated ? 'Live projects and top talent' : 'Preview — log in to see full listings'}
            </p>
          </div>

          {loadingFeatured ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : (
            <>
              <h3 className="font-heading text-lg text-text mb-4">Projects</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {visibleProjects.map((p) => (
                  <Card key={p._id} hover className="flex flex-col h-full">
                    <h4 className="font-semibold text-text line-clamp-2">{p.title}</h4>
                    <p className="text-sm text-muted line-clamp-2 mt-2 flex-1">{p.description}</p>
                    <p className="text-sm text-primary font-medium mt-3">{formatCurrency(p.budget)}</p>
                    <Button
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => requireAuth(`/projects/${p._id}`)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
                {lockedProjects.map((p) => (
                  <div key={p._id} className="relative">
                    <Card className="blur-sm pointer-events-none select-none h-full opacity-60">
                      <h4 className="font-semibold text-text">{p.title}</h4>
                      <p className="text-sm text-muted mt-2">{p.description}</p>
                    </Card>
                    <FeaturedOverlay onLogin={() => requireAuth(`/projects/${p._id}`)} label="Login to see more" />
                  </div>
                ))}
              </div>

              <h3 className="font-heading text-lg text-text mb-4">Top Freelancers</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {visibleFreelancers.map((f) => (
                  <Card key={f._id} hover>
                    <div className="flex items-start gap-3">
                      <img
                        src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.name}`}
                        alt=""
                        className="w-12 h-12 rounded-full bg-card"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-text truncate">{f.name}</h4>
                        <p className="text-sm text-muted truncate">{f.title || 'Freelancer'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                          <span className="text-sm text-text">{f.rating || 0}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => requireAuth(`/profile/${f._id}`)}
                    >
                      View Profile
                    </Button>
                  </Card>
                ))}
                {lockedFreelancers.map((f) => (
                  <div key={f._id} className="relative">
                    <Card className="blur-sm pointer-events-none opacity-60">
                      <h4 className="font-semibold text-text">{f.name}</h4>
                      <p className="text-sm text-muted">{f.title}</p>
                    </Card>
                    <FeaturedOverlay onLogin={() => requireAuth(`/profile/${f._id}`)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {isAuthenticated && statItems.length > 0 && (
        <section className="border-y border-border bg-card/30 py-10">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            {statItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon className="w-7 h-7 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-text">{value ?? '—'}</div>
                <div className="text-sm text-muted">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="pricing" className="py-16 bg-surface">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading text-text mb-2">Simple, Transparent Pricing</h2>
          <p className="text-muted mb-8">10% platform fee on completed projects. No hidden costs.</p>
          <Card className="inline-block text-left max-w-sm w-full">
            <Badge color="primary" className="mb-3">Most Popular</Badge>
            <p className="font-heading text-3xl text-text">10%</p>
            <p className="text-muted text-sm mt-1">per successful project</p>
            <ul className="mt-4 space-y-2 text-sm text-text">
              <li>✓ AI-powered matching</li>
              <li>✓ Escrow protection</li>
              <li>✓ Real-time messaging</li>
            </ul>
            {!isAuthenticated && (
              <Link to="/signup" className="block mt-6">
                <Button className="w-full">Get Started Free</Button>
              </Link>
            )}
          </Card>
        </div>
      </section>

      <section className="py-16 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-heading text-text text-center mb-10">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <p className="text-text text-sm italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 font-semibold text-text">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
