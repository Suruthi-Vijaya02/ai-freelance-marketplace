import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    if (error.response?.status === 401) {
      localStorage.removeItem('svr_user');
      localStorage.removeItem('svr_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
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
  updateStatus: (id, status) => api.patch(`/proposals/${id}/status`, { status }),
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
};

// Notification services
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;