export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function mapProposalToBid(proposal) {
  const f = proposal.freelancer || {};
  return {
    id: proposal._id || proposal.id,
    freelancerName: f.name || proposal.freelancerName || 'Freelancer',
    avatar: f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.name || 'user'}`,
    price: proposal.price,
    timeline: proposal.timeline,
    matchScore: proposal.matchScore ?? 0,
    coverLetter: proposal.coverLetter,
    submittedAt: proposal.createdAt || proposal.submittedAt,
    status: proposal.status,
  };
}

export function getApiErrorMessage(err) {
  return err?.message || err?.response?.data?.message || 'Something went wrong';
}
