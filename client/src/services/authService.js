import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('svr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
    const onAuthPage = ['/login', '/signup'].includes(window.location.pathname);

    if (status === 401 && !isAuthRequest && !onAuthPage) {
      localStorage.removeItem('svr_user');
      localStorage.removeItem('svr_token');
      window.location.href = '/login';
    }

    const data = error.response?.data;
    return Promise.reject(
      data && typeof data === 'object' ? data : { message: error.message || 'Request failed' }
    );
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Project services
export const projectService = {
  getAll: (params) => api.get('/projects', { params }),
  getProjects: (params) => api.get('/projects', { params }),
  getMyProjects: () => api.get('/projects/my'),
  getHiredProjects: () => api.get('/projects/hired'),
  getById: (id) => api.get(`/projects/${id}`),
  getProject: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  createProject: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Stats services
export const statsService = {
  getStats: () => api.get('/stats'),
};

// Admin services
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getFraudAlerts: () => api.get('/admin/fraud-alerts'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id) => api.patch(`/admin/users/${id}/ban`),
};

// Proposal services
export const proposalService = {
  getMyProposals: () => api.get('/proposals/my'),
  getByProject: (projectId) => api.get(`/proposals/project/${projectId}`),
  getProposalsByProject: (projectId) => api.get(`/proposals/project/${projectId}`),
  getByProjectQuery: (projectId) => api.get(`/proposals`, { params: { project: projectId } }),
  create: (data) => api.post('/proposals', data),
  submitProposal: (data) => api.post('/proposals', data),
  updateProposal: (id, data) => api.patch(`/proposals/${id}`, data),
  updateStatus: (id, status) => api.patch(`/proposals/${id}/status`, { status }),
};

export const interviewService = {
  schedule: (data) => api.post('/interviews/schedule', data),
  getMyInterviews: () => api.get('/interviews/my-interviews'),
  getById: (id) => api.get(`/interviews/${id}`),
  updateStatus: (id, body) => api.patch(`/interviews/${id}/status`, body),
};

// Contract services
export const contractService = {
  getMyContracts: () => api.get('/contracts/my'),
  getById: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  sign: (id) => api.patch(`/contracts/${id}/sign`),
  markCompleted: (id) => api.patch(`/contracts/${id}/complete`),
  updateDispatchStatus: (id, status) => api.patch(`/contracts/${id}/dispatch`, { dispatchStatus: status }),
};

// Message services
export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
  sendMessage: (data) => api.post('/messages', data),
  createConversation: (participantId) => api.post('/messages/conversation', { participantId }),
};

// Payment services
export const paymentService = {
  getEarnings: () => api.get('/payments/my-earnings'),
  getMyEarnings: () => api.get('/payments/my-earnings'),
  getTransactions: (params) => api.get('/payments', { params }),
  getSpent: () => api.get('/payments/spent'),
  createEscrow: (data) => api.post('/payments/escrow', data),
  releasePayment: (milestoneId) => api.post(`/payments/release/${milestoneId}`),
  requestPayout: (data) => api.post('/payments/payout', data),
};

// User services
export const userService = {
  getFreelancers: (params = {}) => api.get('/users/freelancers', { params }),
  getFeaturedFreelancers: (params = {}) => api.get('/users/freelancers', { params: { ...params, featured: true, limit: 6 } }),
  getClients: (params = {}) => api.get('/users/freelancers', { params: { ...params, role: 'client' } }),
  getById: (id) => api.get(`/users/${id}`),
  getUserById: (id) => api.get(`/users/${id}`),
  getReviews: (id) => api.get(`/users/${id}/reviews`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvailability: (id, data) => api.put(`/users/${id}/availability`, data),
  uploadResume: (formData) =>
    api.post('/users/uploadResume', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAiSuggestions: () => api.get('/users/ai-suggestions'),
  applyAiSuggestions: (data) => api.post('/users/ai-suggestions/apply', data),
};

// Notification services
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;