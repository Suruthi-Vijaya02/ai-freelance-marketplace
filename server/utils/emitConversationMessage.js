import { normalizeConversationId } from './conversationId.js';

export function conversationRoom(conversationId) {
  const normalized = normalizeConversationId(conversationId);
  return `conversation:${normalized}`;
}

/** Emit to conversation room with both event names for backward compatibility */
export function emitConversationMessage(io, conversationId, payload) {
  const room = conversationRoom(conversationId);
  io.to(room).emit('newMessage', payload);
  io.to(room).emit('new_message', payload);
}
