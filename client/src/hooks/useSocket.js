import { useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socketInstance = null;
const connectionSubscribers = new Set();

const socketJoinState = {
  userId: null,
  conversationId: null,
  projectId: null,
  interviewRoomId: null,
  editorRoomId: null,
  editorUserId: null,
  editorUserName: null,
};

function rejoinRooms(socket) {
  if (!socket || !socket.connected) return;
  if (socketJoinState.userId) socket.emit('join_user', socketJoinState.userId);
  if (socketJoinState.conversationId) socket.emit('join_conversation', socketJoinState.conversationId);
  if (socketJoinState.projectId) socket.emit('join_project', socketJoinState.projectId);
  if (socketJoinState.interviewRoomId) socket.emit('join_interview', socketJoinState.interviewRoomId);
  if (socketJoinState.editorRoomId) {
    socket.emit('join-editor', {
      roomId: socketJoinState.editorRoomId,
      userId: socketJoinState.editorUserId,
      userName: socketJoinState.editorUserName,
    });
  }
}

function notifyConnection(connected) {
  connectionSubscribers.forEach((cb) => {
    try { cb(connected); } catch (e) { console.error('[Socket] subscriber error:', e); }
  });
}

function getSocketInstance() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      notifyConnection(true);
      rejoinRooms(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      notifyConnection(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error?.message || error);
      notifyConnection(false);
    });
  }
  return socketInstance;
}

function subscribeConnection(callback) {
  connectionSubscribers.add(callback);
  const socket = getSocketInstance();
  callback(socket.connected);
  return () => { connectionSubscribers.delete(callback); };
}

function getConnectionSnapshot() {
  return socketInstance?.connected ?? false;
}

export function useSocket(
  projectId,
  {
    onNewBid,
    onNewMessage,
    onTyping,
    onOffer,
    onAnswer,
    onIceCandidate,
    onCallEnd,
    onProposalUpdated,
    onUserJoined,
    onCodeUpdate,
    onCursorUpdate,
  } = {}
) {
  const socketRef = useRef(null);

  // Callback refs
  const onNewBidRef = useRef(onNewBid);
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const onOfferRef = useRef(onOffer);
  const onAnswerRef = useRef(onAnswer);
  const onIceCandidateRef = useRef(onIceCandidate);
  const onCallEndRef = useRef(onCallEnd);
  const onProposalUpdatedRef = useRef(onProposalUpdated);
  const onUserJoinedRef = useRef(onUserJoined);
  const onCodeUpdateRef = useRef(onCodeUpdate);
  const onCursorUpdateRef = useRef(onCursorUpdate);

  const connected = useSyncExternalStore(subscribeConnection, getConnectionSnapshot, () => false);

  // Keep refs updated
  useEffect(() => { onNewBidRef.current = onNewBid; }, [onNewBid]);
  useEffect(() => { onNewMessageRef.current = onNewMessage; }, [onNewMessage]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);
  useEffect(() => { onOfferRef.current = onOffer; }, [onOffer]);
  useEffect(() => { onAnswerRef.current = onAnswer; }, [onAnswer]);
  useEffect(() => { onIceCandidateRef.current = onIceCandidate; }, [onIceCandidate]);
  useEffect(() => { onCallEndRef.current = onCallEnd; }, [onCallEnd]);
  useEffect(() => { onProposalUpdatedRef.current = onProposalUpdated; }, [onProposalUpdated]);
  useEffect(() => { onUserJoinedRef.current = onUserJoined; }, [onUserJoined]);
  useEffect(() => { onCodeUpdateRef.current = onCodeUpdate; }, [onCodeUpdate]);
  useEffect(() => { onCursorUpdateRef.current = onCursorUpdate; }, [onCursorUpdate]);

  // Register listeners once
  useEffect(() => {
    const socket = getSocketInstance();
    socketRef.current = socket;

    const handlers = {
      new_bid: (bid) => onNewBidRef.current?.(bid),
      new_message: (msg) => onNewMessageRef.current?.(msg),
      newMessage: (msg) => onNewMessageRef.current?.(msg),
      typing: (payload) => onTypingRef.current?.(payload),
      webrtc_offer: (payload) => onOfferRef.current?.(payload),
      webrtc_answer: (payload) => onAnswerRef.current?.(payload),
      webrtc_ice_candidate: (payload) => onIceCandidateRef.current?.(payload),
      call_end: (payload) => onCallEndRef.current?.(payload),
      proposal_updated: (payload) => onProposalUpdatedRef.current?.(payload),
      'user-joined': (payload) => onUserJoinedRef.current?.(payload),
      'code-update': (payload) => onCodeUpdateRef.current?.(payload),
      'cursor-update': (payload) => onCursorUpdateRef.current?.(payload),
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      socketRef.current = null;
    };
  }, []);

  // Auto-join project room
  useEffect(() => {
    if (!projectId) return;
    const socket = getSocketInstance();
    socketJoinState.projectId = String(projectId);
    if (socket.connected) {
      socket.emit('join_project', String(projectId));
    }
  }, [projectId]);

  // ===== STABILIZED CALLBACKS =====
  const emitBid = useCallback((bidData) => {
    if (!socketRef.current) return;
    socketRef.current.emit('submit_bid', { projectId, ...bidData });
  }, [projectId]);

  const joinProject = useCallback((id) => {
    if (!id || !socketRef.current) return;
    socketJoinState.projectId = String(id);
    socketRef.current.emit('join_project', String(id));
  }, []);

  const joinConversation = useCallback((conversationId) => {
    if (!conversationId || !socketRef.current) return;
    socketJoinState.conversationId = String(conversationId);
    socketRef.current.emit('join_conversation', String(conversationId));
  }, []);

  const joinUser = useCallback((userId) => {
    if (!userId || !socketRef.current) return;
    socketJoinState.userId = String(userId);
    socketRef.current.emit('join_user', socketJoinState.userId);
  }, []);

  const joinInterview = useCallback((roomId) => {
    if (!roomId || !socketRef.current) return;
    socketJoinState.interviewRoomId = String(roomId);
    socketRef.current.emit('join_interview', String(roomId));
  }, []);

  const joinEditor = useCallback((roomId, userId, userName) => {
    if (!roomId || !socketRef.current) return;
    socketJoinState.editorRoomId = String(roomId);
    socketJoinState.editorUserId = userId ? String(userId) : null;
    socketJoinState.editorUserName = userName || null;
    socketRef.current.emit('join-editor', {
      roomId: String(roomId),
      userId: userId ? String(userId) : null,
      userName: userName || null,
    });
  }, []);

  const emitCodeChange = useCallback((roomId, code, language) => {
    if (!socketRef.current) return;
    socketRef.current.emit('code-change', { roomId, code, language });
  }, []);

  const emitCursorUpdate = useCallback((roomId, cursor, userName) => {
    if (!socketRef.current) return;
    socketRef.current.emit('cursor-update', { roomId, cursor, userName });
  }, []);

  const emitMessage = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_message', payload);
  }, []);

  const emitTypingStart = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_start', payload);
  }, []);

  const emitTypingStop = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_stop', payload);
  }, []);

  const emitOffer = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('webrtc_offer', payload);
  }, []);

  const emitAnswer = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('webrtc_answer', payload);
  }, []);

  const emitIceCandidate = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('webrtc_ice_candidate', payload);
  }, []);

  const emitCallEnd = useCallback((payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('call_end', payload);
  }, []);

  return {
    socket: socketRef,
    connected,
    emitBid,
    joinProject,
    joinConversation,
    joinUser,
    joinInterview,
    joinEditor,
    emitCodeChange,
    emitCursorUpdate,
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