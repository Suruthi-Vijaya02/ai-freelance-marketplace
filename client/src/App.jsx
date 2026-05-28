import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleGuard, FreelancerOnly, ClientOnly, AdminOnly } from './components/RoleGuard';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
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
import PaymentsPage from './pages/PaymentsPage';
import EarningsPage from './pages/EarningsPage';
import MyProposalsPage from './pages/MyProposalsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import InterviewRoom from './pages/InterviewRoom';
import MyInterviewsPage from './pages/MyInterviewsPage';
import SubmitProposalPage from './pages/SubmitProposalPage';
import ProjectProposalsPage from './pages/ProjectProposalsPage';
import DashboardLayout from './components/layout/DashboardLayout';

function ProfileRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${user._id || user.id}`} replace />;
}

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

            {/* Dashboard shell with role-filtered sidebar */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard/freelancer" element={<FreelancerOnly><FreelancerDashboard /></FreelancerOnly>} />
              <Route path="/dashboard/client" element={<ClientOnly><ClientDashboard /></ClientOnly>} />
              <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
              <Route path="/admin/users" element={<AdminOnly><AdminDashboard section="users" /></AdminOnly>} />
              <Route path="/admin/projects" element={<AdminOnly><AdminDashboard section="projects" /></AdminOnly>} />
              <Route path="/admin/transactions" element={<AdminOnly><AdminDashboard section="transactions" /></AdminOnly>} />
              <Route path="/admin/fraud" element={<AdminOnly><AdminDashboard section="fraud" /></AdminOnly>} />
              <Route path="/admin/disputes" element={<AdminOnly><AdminDashboard section="disputes" /></AdminOnly>} />
              <Route path="/admin/analytics" element={<AdminOnly><AdminDashboard section="analytics" /></AdminOnly>} />
              <Route path="/my-proposals" element={<FreelancerOnly><MyProposalsPage /></FreelancerOnly>} />
              <Route path="/earnings" element={<FreelancerOnly><EarningsPage /></FreelancerOnly>} />
              <Route path="/payments" element={<RoleGuard roles={['client', 'freelancer', 'admin']}><PaymentsPage /></RoleGuard>} />
              <Route path="/create-project" element={<ClientOnly><CreateProjectPage /></ClientOnly>} />
              <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
              <Route path="/talent" element={<ProtectedRoute roles={['client', 'admin']}><TalentPage /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
              <Route path="/projects/:id/proposal" element={<FreelancerOnly><SubmitProposalPage /></FreelancerOnly>} />
              <Route path="/projects/:id/proposals" element={<ClientOnly><ProjectProposalsPage /></ClientOnly>} />
              <Route path="/bidding/:id" element={<ProtectedRoute><LiveBiddingPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
              <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
              <Route path="/payments/:projectId" element={<ProtectedRoute roles={['client', 'freelancer', 'admin']}><PaymentPage /></ProtectedRoute>} />
              <Route path="/workspace" element={<Navigate to="/messages" replace />} />
              <Route path="/workspace/:conversationId" element={<Navigate to="/messages/:conversationId" replace />} />
              <Route path="/profile" element={<ProfileRedirect />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/interviews" element={<ProtectedRoute><MyInterviewsPage /></ProtectedRoute>} />
              <Route path="/interviews/:id" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
              <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
            </Route>

            {/* Role-specific public/authenticated pages */}
            {/* These pages now render inside the dashboard shell */}
            <Route
              path="/onboarding/freelancer"
              element={
                <ProtectedRoute roles={['freelancer', 'admin']}>
                  <FreelancerOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/client"
              element={
                <ProtectedRoute roles={['client', 'admin']}>
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
