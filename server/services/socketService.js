import { calculateMatchScore } from './aiMatchingService.js';

export function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      socket.emit('joined', { projectId });
    });

    socket.on('submit_bid', (data) => {
      const bid = {
        id: `bid_${Date.now()}`,
        projectId: data.projectId,
        freelancerName: data.freelancerName || 'Anonymous Bidder',
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        price: data.price,
        timeline: data.timeline || '6 weeks',
        matchScore: data.matchScore || calculateMatchScore(data.skills || [], data.projectSkills || []),
        coverLetter: data.coverLetter || '',
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };
      io.to(`project:${data.projectId}`).emit('new_bid', bid);
    });

    socket.on('send_message', (data) => {
      io.to(`conversation:${data.conversationId}`).emit('new_message', {
        ...data,
        id: data.id || `msg_${Date.now()}`,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      socket.emit('joined_conversation', { conversationId });
    });

    socket.on('typing_start', ({ conversationId, userName }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, userName, typing: true });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, typing: false });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
