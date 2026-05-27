export const ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin',
};

export const PROJECT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  ESCROW: 'escrow',
  RELEASED: 'released',
  REFUNDED: 'refunded',
};

export const API_BASE = import.meta.env?.VITE_API_URL || '/api';
