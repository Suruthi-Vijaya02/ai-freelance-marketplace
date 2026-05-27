import { useState } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Code2, Mail, Briefcase, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { consumeAuthRedirect } from '../hooks/useProtectedAction';
import { cn } from '../utils/helpers';

export default function AuthPage({ mode = 'login' }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const isLogin = mode === 'login';
  const [role, setRole] = useState(searchParams.get('role') || 'client');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectForRole = (userRole) => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'freelancer') return '/dashboard/freelancer';
    return '/dashboard/client';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role };
      const { data } = isLogin
        ? await authService.login(payload)
        : await authService.register(payload);
      login(data.user, data.token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      // If profile seems incomplete, redirect to onboarding for role
      const needsFreelancerOnboard =
        data.user.role === 'freelancer' &&
        (!data.user.skills || data.user.skills.length === 0 || !data.user.bio || !data.user.hourlyRate);
      const needsClientOnboard =
        data.user.role === 'client' && (!data.user.bio || (!data.user.title && !data.user.company));

      if (needsFreelancerOnboard) {
        navigate('/onboarding/freelancer');
      } else if (needsClientOnboard) {
        navigate('/onboarding/client');
      } else {
        const redirect = consumeAuthRedirect();
        const from = location.state?.from?.pathname;
        navigate(redirect || from || redirectForRole(data.user.role));
      }
    } catch (err) {
      const msg = err?.message || 'Authentication failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <Logo size={40} />
            <div className="text-left">
              <span className="font-heading text-xl text-text">Suruthi Vijaya R</span>
              <span className="block text-xs text-muted font-sans">Global Talent Network</span>
            </div>
          </Link>
        </div>

        <Card>
          <h1 className="text-2xl font-bold text-text text-center">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-muted text-center text-sm mt-1 mb-6">
            {isLogin ? 'Sign in to continue' : 'Join the AI-powered marketplace'}
          </p>

          {!isLogin && (
            <div className="mb-6">
              <p className="text-sm font-medium text-text mb-2">I am a</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'client', label: 'Client', icon: Briefcase, desc: 'Hire talent' },
                  { id: 'freelancer', label: 'Freelancer', icon: User, desc: 'Find work' },
                ].map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-all',
                      role === id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted'
                    )}
                  >
                    <Icon className={cn('w-6 h-6 mb-2', role === id ? 'text-primary' : 'text-muted')} />
                    <div className="font-medium text-text">{label}</div>
                    <div className="text-xs text-muted">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Full name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="w-full">
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button" className="w-full">
              <Code2 className="w-5 h-5" /> GitHub
            </Button>
          </div>
          <Button variant="ghost" type="button" className="w-full mt-3">
            <Mail className="w-5 h-5" /> Microsoft
          </Button>

          <p className="text-center text-sm text-muted mt-6">
            {isLogin ? (
              <>
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">Log in</Link>
              </>
            )}
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
