import { useEffect, useRef, useSyncExternalStore } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socketInstance = null;
const connectionSubscribers = new Set();
const socketJoinState = {
  userId: null,
  conversationId: null,
  projectId: null,
  interviewRoomId: null,
};

function rejoinRooms(socket) {
  if (socketJoinState.userId) socket.emit('join_user', socketJoinState.userId);
  if (socketJoinState.conversationId) socket.emit('join_conversation', socketJoinState.conversationId);
  if (socketJoinState.projectId) socket.emit('join_project', socketJoinState.projectId);
  if (socketJoinState.interviewRoomId) socket.emit('join_interview', socketJoinState.interviewRoomId);
}

function notifyConnection(connected) {
  connectionSubscribers.forEach((cb) => cb(connected));
}

function getSocketInstance() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL || undefined, {
      path: '/socket.io',
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      notifyConnection(true);
      rejoinRooms(socketInstance);
    });
    socketInstance.on('disconnect', () => notifyConnection(false));
  }
  return socketInstance;
}

function subscribeConnection(callback) {
  connectionSubscribers.add(callback);
  const socket = getSocketInstance();
  callback(socket.connected);
  return () => connectionSubscribers.delete(callback);
}

function getConnectionSnapshot() {
  return socketInstance?.connected ?? false;
}

export function useSocket(projectId, { onNewBid, onNewMessage, onTyping, onOffer, onAnswer, onIceCandidate, onCallEnd, onProposalUpdated } = {}) {
  const socketRef = useRef(null);
  const onNewBidRef = useRef(onNewBid);
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const onOfferRef = useRef(onOffer);
  const onAnswerRef = useRef(onAnswer);
  const onIceCandidateRef = useRef(onIceCandidate);
  const onCallEndRef = useRef(onCallEnd);
  const onProposalUpdatedRef = useRef(onProposalUpdated);
  const connected = useSyncExternalStore(subscribeConnection, getConnectionSnapshot, () => false);

  useEffect(() => {
    onNewBidRef.current = onNewBid;
  }, [onNewBid]);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    onOfferRef.current = onOffer;
  }, [onOffer]);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    onIceCandidateRef.current = onIceCandidate;
  }, [onIceCandidate]);

  useEffect(() => {
    onCallEndRef.current = onCallEnd;
  }, [onCallEnd]);

  useEffect(() => {
    onProposalUpdatedRef.current = onProposalUpdated;
  }, [onProposalUpdated]);

  useEffect(() => {
    const socket = getSocketInstance();
    socketRef.current = socket;

    const handleNewBid = (bid) => onNewBidRef.current?.(bid);
    const handleNewMessage = (msg) => onNewMessageRef.current?.(msg);
    const handleNewMessageCamel = (msg) => onNewMessageRef.current?.(msg);
    const handleTyping = (payload) => onTypingRef.current?.(payload);
    const handleOffer = (payload) => onOfferRef.current?.(payload);
    const handleAnswer = (payload) => onAnswerRef.current?.(payload);
    const handleIceCandidate = (payload) => onIceCandidateRef.current?.(payload);
    const handleCallEnd = (payload) => onCallEndRef.current?.(payload);
    const handleProposalUpdated = (payload) => onProposalUpdatedRef.current?.(payload);

    socket.on('new_bid', handleNewBid);
    socket.on('new_message', handleNewMessage);
    socket.on('newMessage', handleNewMessageCamel);
    socket.on('typing', handleTyping);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('call_end', handleCallEnd);
    socket.on('proposal_updated', handleProposalUpdated);

    return () => {
      socket.off('new_bid', handleNewBid);
      socket.off('new_message', handleNewMessage);
      socket.off('newMessage', handleNewMessageCamel);
      socket.off('typing', handleTyping);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('call_end', handleCallEnd);
      socket.off('proposal_updated', handleProposalUpdated);
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return undefined;
    const socket = getSocketInstance();
    socketJoinState.projectId = projectId;
    socket.emit('join_project', projectId);
    return undefined;
  }, [projectId]);

  const emitBid = (bidData) => {
    socketRef.current?.emit('submit_bid', { projectId, ...bidData });
  };

  const joinProject = (id) => {
    socketRef.current?.emit('join_project', id);
  };

  const joinConversation = (conversationId) => {
    if (conversationId) {
      socketJoinState.conversationId = conversationId;
      socketRef.current?.emit('join_conversation', conversationId);
    }
  };

  const joinUser = (userId) => {
    if (userId) {
      socketJoinState.userId = String(userId);
      socketRef.current?.emit('join_user', socketJoinState.userId);
    }
  };

  const joinInterview = (roomId) => {
    if (roomId) {
      socketJoinState.interviewRoomId = roomId;
      socketRef.current?.emit('join_interview', roomId);
    }
  };

  const emitMessage = (payload) => {
    socketRef.current?.emit('send_message', payload);
  };

  const emitTypingStart = (payload) => {
    socketRef.current?.emit('typing_start', payload);
  };

  const emitTypingStop = (payload) => {
    socketRef.current?.emit('typing_stop', payload);
  };

  const emitOffer = (payload) => {
    socketRef.current?.emit('webrtc_offer', payload);
  };

  const emitAnswer = (payload) => {
    socketRef.current?.emit('webrtc_answer', payload);
  };

  const emitIceCandidate = (payload) => {
    socketRef.current?.emit('webrtc_ice_candidate', payload);
  };

  const emitCallEnd = (payload) => {
    socketRef.current?.emit('call_end', payload);
  };

  return {
    socket: socketRef,
    connected,
    emitBid,
    joinProject,
    joinConversation,
    joinUser,
    joinInterview,
    emitMessage,
    emitTypingStart,
    emitTypingStop,
    emitOffer,
    emitAnswer,
    emitIceCandidate,
    emitCallEnd,
  };
}

export function useSocketGlobal() {
  const connected = useSyncExternalStore(subscribeConnection, getConnectionSnapshot, () => false);
  return { connected, getSocket: getSocketInstance };
}
