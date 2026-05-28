export function normalizeConversationId(conversationId) {
  if (!conversationId || typeof conversationId !== 'string') return conversationId;
  return conversationId.startsWith('conv_') ? conversationId.slice(5) : conversationId;
}

export function buildConversationId(userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort((a, b) => a.localeCompare(b)).join('_');
}

export function getConversationIdVariants(conversationId) {
  const normalized = normalizeConversationId(conversationId);
  return [normalized, `conv_${normalized}`];
}
