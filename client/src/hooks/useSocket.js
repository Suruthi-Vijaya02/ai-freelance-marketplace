import { useEffect, useRef, useSyncExternalStore } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socketInstance = null;
const connectionSubscribers = new Set();

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

    socketInstance.on('connect', () => notifyConnection(true));
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

export function useSocket(projectId, { onNewBid, onNewMessage, onTyping, onOffer, onAnswer, onIceCandidate, onCallEnd } = {}) {
  const socketRef = useRef(null);
  const onNewBidRef = useRef(onNewBid);
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const onOfferRef = useRef(onOffer);
  const onAnswerRef = useRef(onAnswer);
  const onIceCandidateRef = useRef(onIceCandidate);
  const onCallEndRef = useRef(onCallEnd);
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
    const socket = getSocketInstance();
    socketRef.current = socket;

    const handleNewBid = (bid) => onNewBidRef.current?.(bid);
    const handleNewMessage = (msg) => onNewMessageRef.current?.(msg);
    const handleTyping = (payload) => onTypingRef.current?.(payload);
    const handleOffer = (payload) => onOfferRef.current?.(payload);
    const handleAnswer = (payload) => onAnswerRef.current?.(payload);
    const handleIceCandidate = (payload) => onIceCandidateRef.current?.(payload);
    const handleCallEnd = (payload) => onCallEndRef.current?.(payload);

    socket.on('new_bid', handleNewBid);
    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('call_end', handleCallEnd);

    return () => {
      socket.off('new_bid', handleNewBid);
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('call_end', handleCallEnd);
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return undefined;
    const socket = getSocketInstance();
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
      socketRef.current?.emit('join_conversation', conversationId);
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
