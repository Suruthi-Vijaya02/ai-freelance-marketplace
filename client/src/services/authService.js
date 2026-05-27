import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const statsService = {
  getStats: () => api.get('/stats'),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getById: (id) => api.get(`/users/${id}`),
  getUserById: (id) => api.get(`/users/${id}`),
  getReviews: (id) => api.get(`/users/${id}/reviews`),
  getFreelancers: (params) => api.get('/users/freelancers', { params }),
  getFeaturedFreelancers: (params) =>
    api.get('/users/freelancers', { params: { featured: true, role: 'freelancer', ...params } }),
};

export const projectService = {
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  getMyProjects: () => api.get('/projects/my'),
  getMyActiveProjects: (params) => api.get('/projects', { params: { status: 'in_progress', ...params } }),
};

export const proposalService = {
  byProject: (id) => api.get(`/proposals/project/${id}`),
  submit: (data) => api.post('/proposals', data),
  getProposalsByProject: (id) => api.get(`/proposals/project/${id}`),
  submitProposal: (data) => api.post('/proposals', data),
};

export const paymentService = {
  escrow: (data) => api.post('/payments/escrow', data),
  release: (id) => api.post(`/payments/release/${id}`),
  list: (params) => api.get('/payments', { params }),
  createEscrow: (data) => api.post('/payments/escrow', data),
  releasePayment: (id) => api.post(`/payments/release/${id}`),
  getTransactions: (params) => api.get('/payments', { params }),
  getMyEarnings: () => api.get('/payments/my-earnings'),
  getProjectPayments: (projectId) => api.get('/payments', { params: { project: projectId } }),
};

export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
  sendMessage: (data) => api.post('/messages', data),
};

export const adminService = {
  stats: () => api.get('/admin/stats'),
  fraudAlerts: () => api.get('/admin/fraud-alerts'),
  users: (params) => api.get('/admin/users', { params }),
  getStats: () => api.get('/admin/stats'),
  getFraudAlerts: () => api.get('/admin/fraud-alerts'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id) => api.patch(`/admin/users/${id}/ban`),
};
