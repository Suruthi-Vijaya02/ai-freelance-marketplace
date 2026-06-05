import { calculateMatchScore } from './aiMatchingService.js';
import { normalizeConversationId } from '../utils/conversationId.js';
import { emitConversationMessage } from '../utils/emitConversationMessage.js';

// Helper to format room name for a conversation
/** Formats a standardized room name for a specific conversation ID. */
function convRoom(conversationId) {
  return `conversation:${normalizeConversationId(conversationId)}`;
}

// Initialize socket handlers and define event listeners for real-time features
/** Sets up Socket.IO event listeners for real-time collaboration and messaging. */
export function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      socket.emit('joined', { projectId });
    });

    // Bids must be created via REST /api/proposals — no phantom socket bids
    socket.on('submit_bid', () => {
      socket.emit('bid_error', { message: 'Use POST /api/proposals to submit a proposal' });
    });

    socket.on('send_message', async (data) => {
      if (!data?.conversationId) return;
      const payload = {
        ...data,
        conversationId: normalizeConversationId(data.conversationId),
        id: data.id || data._id || `msg_${Date.now()}`,
        timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
      };
      emitConversationMessage(io, payload.conversationId, payload);

      // Persist notification for the message recipient 
      try { 
        const Notification = (await import('../models/Notification.js')).default; 
        await Notification.create({ 
          user: data.receiverId || data.receiver, 
          message: `New message from ${data.senderName || 'a user'}`, 
          type: 'message', 
        }); 
      } catch (err) { 
        // Non-blocking — notification failure should not affect message delivery 
      } 
    });

    socket.on('join_user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
      socket.emit('joined_user', { userId });
    });

    // Freelancers can join the freelancers room for broadcast notifications
    socket.on('join_freelancers', () => {
      socket.join('freelancers');
      socket.emit('joined_freelancers');
    });

    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) return;
      const normalized = conversationId.startsWith('conv_')
        ? conversationId.slice(5)
        : conversationId;
      socket.join(`conversation:${normalized}`);
      socket.emit('joined_conversation', { conversationId: normalized });
    });

    socket.on('join_interview', (roomId) => {
      if (roomId) socket.join(`interview:${roomId}`);
      socket.emit('joined_interview', { roomId });
    });

    socket.on('typing_start', ({ conversationId, userName }) => {
      if (!conversationId) return;
      const normalized = normalizeConversationId(conversationId);
      socket.to(convRoom(normalized)).emit('typing', { conversationId: normalized, userName, typing: true });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      const normalized = normalizeConversationId(conversationId);
      socket.to(convRoom(normalized)).emit('typing', { conversationId: normalized, typing: false });
    });

    socket.on('webrtc_offer', (data) => {
      if (!data?.conversationId) return;
      socket.to(convRoom(data.conversationId)).emit('webrtc_offer', {
        ...data,
        conversationId: normalizeConversationId(data.conversationId),
      });
    });

    socket.on('webrtc_answer', (data) => {
      if (!data?.conversationId) return;
      socket.to(convRoom(data.conversationId)).emit('webrtc_answer', {
        ...data,
        conversationId: normalizeConversationId(data.conversationId),
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      if (!data?.conversationId) return;
      socket.to(convRoom(data.conversationId)).emit('webrtc_ice_candidate', {
        ...data,
        conversationId: normalizeConversationId(data.conversationId),
      });
    });

    socket.on('call_end', (data) => {
      if (!data?.conversationId) return;
      socket.to(convRoom(data.conversationId)).emit('call_end', {
        ...data,
        conversationId: normalizeConversationId(data.conversationId),
      });
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
}
