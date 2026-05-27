import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FreelancerDashboard, { freelancerSidebarLinks } from './pages/FreelancerDashboard';
import ClientDashboard, { clientSidebarLinks } from './pages/ClientDashboard';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import TalentPage from './pages/TalentPage';
import LiveBiddingPage from './pages/LiveBiddingPage';
import MessagingPage from './pages/MessagingPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEdit from './pages/ProfileEdit';
import FreelancerOnboarding from './pages/onboarding/FreelancerOnboarding';
import ClientOnboarding from './pages/onboarding/ClientOnboarding';
import PaymentPage from './pages/PaymentPage';
import AdminDashboard, { adminSidebarLinks } from './pages/AdminDashboard';
import DashboardLayout from './components/layout/DashboardLayout';
import { LayoutDashboard, Shield } from 'lucide-react';

function ProfileRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${user._id || user.id}`} replace />;
}

const adminLinks = [
  ...adminSidebarLinks,
  { to: '/dashboard/client', label: 'Client View', icon: LayoutDashboard },
  { to: '/dashboard/freelancer', label: 'Freelancer View', icon: Shield },
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#262626',
                border: '1px solid #dbdbdb',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/talent" element={<TalentPage />} />

            <Route
              element={
                <ProtectedRoute roles={['freelancer', 'admin']}>
                  <DashboardLayout sidebarLinks={freelancerSidebarLinks} sidebarTitle="Freelancer" />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard/freelancer" element={<FreelancerDashboard />} />
            </Route>

            <Route
              element={
                <ProtectedRoute roles={['client', 'admin']}>
                  <DashboardLayout sidebarLinks={clientSidebarLinks} sidebarTitle="Client" />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard/client" element={<ClientDashboard />} />
            </Route>

            <Route
              element={
                <ProtectedRoute roles={['admin']}>
                  <DashboardLayout sidebarLinks={adminLinks} sidebarTitle="Admin" />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bidding/:id"
              element={
                <ProtectedRoute>
                  <LiveBiddingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace/:conversationId?"
              element={
                <ProtectedRoute>
                  <MessagingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/:projectId"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<ProfileRedirect />} />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/freelancer"
              element={
                <ProtectedRoute>
                  <FreelancerOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/client"
              element={
                <ProtectedRoute>
                  <ClientOnboarding />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
