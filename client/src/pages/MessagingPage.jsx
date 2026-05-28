import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, Paperclip, Video, X, Check, UserPlus, Search, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { messageService, userService } from '../services/authService';
import { useSocket } from '../hooks/useSocket';
import { formatRelativeTime, cn, getApiErrorMessage, normalizeConversationId } from '../utils/helpers';

function mapApiMessage(msg, currentUserId) {
  const senderId = msg.sender?._id || msg.sender;
  return {
    id: msg._id || msg.id,
    senderId: senderId?.toString() === currentUserId?.toString() ? 'me' : senderId,
    content: msg.content,
    timestamp: msg.createdAt || msg.timestamp,
    sender: msg.sender,
    read: msg.read,
  };
}

export default function MessagingPage() {
  const { conversationId: paramConvId } = useParams();
  const normalizedParamConvId = normalizeConversationId(paramConvId);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(normalizedParamConvId || '');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convError, setConvError] = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const typingTimeoutRef = useRef(null);
  const activeConvRef = useRef(activeConv);
  const messagesEndRef = useRef(null);
  const userId = user?._id || user?.id;

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewMessage = useCallback(
    (msg) => {
      const msgConversationId = normalizeConversationId(msg.conversationId);
      // Update conversation list with new last message
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === msgConversationId);
        if (!existing) {
          // New conversation - reload list
          loadConversations();
          return prev;
        }
        return prev.map((c) =>
          c.id === msgConversationId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt || msg.timestamp, unreadCount: c.id === activeConvRef.current ? 0 : (c.unreadCount || 0) + 1 }
            : c
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });

      if (msgConversationId !== activeConvRef.current) return;
      setMessages((prev) => {
        const mapped = {
          id: msg.id || msg._id,
          senderId: (msg.sender?._id || msg.sender)?.toString() === userId?.toString() ? 'me' : msg.sender?._id,
          content: msg.content,
          timestamp: msg.timestamp || msg.createdAt,
          read: msg.read,
        };
        if (prev.some((m) => m.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
    },
    [userId, loadConversations]
  );

  const handleTyping = useCallback(({ conversationId, userName, typing }) => {
    if (normalizeConversationId(conversationId) !== activeConvRef.current) return;
    if (typing) setTypingUser(userName || 'Someone');
    else setTypingUser(null);
  }, []);

  const [callState, setCallState] = useState('idle');
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const incomingOfferRef = useRef(null);

  const handleCallEnd = useCallback((payload) => {
    if (normalizeConversationId(payload.conversationId) !== activeConvRef.current) return;
    cleanupCall('Call ended');
  }, []);

  const handleOffer = useCallback((payload) => {
    if (normalizeConversationId(payload.conversationId) !== activeConvRef.current) return;
    if (callState === 'open' || callState === 'calling') return;
    incomingOfferRef.current = payload;
    setIncomingOffer(payload);
    setCallState('incoming');
    toast.success(`${payload.callerName || 'Contact'} is calling`);
  }, [callState]);

  const handleAnswer = useCallback(async (payload) => {
    if (normalizeConversationId(payload.conversationId) !== activeConvRef.current || !peerRef.current) return;
    try {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      setCallState('open');
    } catch (err) {
      console.error('Failed to process call answer', err);
      toast.error('Could not connect video call');
      cleanupCall();
    }
  }, []);

  const handleIceCandidate = useCallback(async (payload) => {
    if (normalizeConversationId(payload.conversationId) !== activeConvRef.current || !peerRef.current || !payload.candidate) return;
    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch (err) {
      console.warn('Failed to add ice candidate', err);
    }
  }, []);

  const { connected, joinConversation, emitMessage, emitTypingStart, emitTypingStop, emitOffer, emitAnswer, emitIceCandidate, emitCallEnd } = useSocket(null, {
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onOffer: handleOffer,
    onAnswer: handleAnswer,
    onIceCandidate: handleIceCandidate,
    onCallEnd: handleCallEnd,
  });

  const activeConversation = conversations.find((c) => c.id === activeConv);

  const loadConversations = useCallback(async (signal) => {
    if (!isAuthenticated || !userId) return;
    try {
      setLoadingConvs(true);
      setConvError(null);
      const { data } = await messageService.getConversations();
      if (signal?.aborted) return;
      setConversations(data || []);
      if (data?.length > 0 && !activeConv) {
        const target = normalizedParamConvId && data.some((c) => c.id === normalizedParamConvId) ? normalizedParamConvId : data[0].id;
        setActiveConv(target);
        if (normalizedParamConvId && normalizedParamConvId !== target) {
          navigate(`/messages/${target}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Failed getConversations', err);
      setConvError(getApiErrorMessage(err));
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoadingConvs(false);
    }
  }, [isAuthenticated, userId, paramConvId, navigate]);

  const loadMessages = useCallback(async (convId, signal) => {
    if (!convId || !isAuthenticated) return;
    try {
      setLoadingMsgs(true);
      const normalizedId = normalizeConversationId(convId);
      const { data } = await messageService.getMessages(normalizedId);
      if (signal?.aborted) return;
      setMessages((data || []).map((m) => mapApiMessage(m, userId)));
    } catch (err) {
      console.error('Failed getMessages', err);
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoadingMsgs(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    const controller = new AbortController();
    loadConversations(controller.signal);
    return () => controller.abort();
  }, [loadConversations]);

  useEffect(() => {
    const controller = new AbortController();
    if (activeConv) loadMessages(activeConv, controller.signal);
    return () => controller.abort();
  }, [activeConv, loadMessages]);

  useEffect(() => {
    if (activeConv) joinConversation(activeConv);
  }, [activeConv, joinConversation]);

  useEffect(() => {
    if (paramConvId && normalizedParamConvId && paramConvId !== normalizedParamConvId) {
      navigate(`/messages/${normalizedParamConvId}`, { replace: true });
    }
  }, [paramConvId, normalizedParamConvId, navigate]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const cleanupCall = (message) => {
    peerRef.current?.close();
    peerRef.current = null;
    setCallState('idle');
    setIncomingOffer(null);
    incomingOfferRef.current = null;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    if (message) toast(message);
  };

  const createPeerConnection = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const remoteStreamInstance = new MediaStream();
    setRemoteStream(remoteStreamInstance);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStreamInstance.addTrack(track);
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitIceCandidate({
          conversationId: activeConvRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanupCall('Video call ended');
      }
    };

    peerRef.current = pc;
    return pc;
  };

  const startVideoCall = async () => {
    if (!activeConv || !activeConversation) {
      toast.error('Select a conversation first');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Video calling is not supported in this browser');
      return;
    }

    setCallState('calling');
    try {
      const pc = await createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      emitOffer({
        conversationId: activeConv,
        sdp: offer,
        callerName: user?.name,
      });
    } catch (err) {
      console.error('Failed to start video call', err);
      toast.error('Could not start video call');
      cleanupCall();
    }
  };

  const acceptVideoCall = async () => {
    if (!incomingOfferRef.current) return;
    setCallState('open');
    try {
      const pc = await createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      emitAnswer({
        conversationId: activeConvRef.current,
        sdp: answer,
      });
    } catch (err) {
      console.error('Failed to accept video call', err);
      toast.error('Could not join call');
      cleanupCall();
    }
  };

  const declineVideoCall = () => {
    cleanupCall('Call declined');
  };

  const endVideoCall = () => {
    if (activeConvRef.current) {
      emitCallEnd({ conversationId: activeConvRef.current });
    }
    cleanupCall('Call ended');
  };

  const handleTypingInput = () => {
    if (!activeConv) return;
    emitTypingStart({ conversationId: activeConv, userName: user?.name });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop({ conversationId: activeConv });
      setTypingUser(null);
    }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    const receiverId = activeConversation.otherUserId || activeConversation.participant?.id;
    try {
      const { data } = await messageService.sendMessage({
        conversationId: activeConv,
        receiver: receiverId,
        content: newMessage.trim(),
      });
      const mapped = mapApiMessage(data, userId);
      setMessages((prev) => [...prev, mapped]);
      emitMessage({
        conversationId: activeConv,
        id: data._id,
        content: data.content,
        sender: data.sender,
        receiver: data.receiver,
        timestamp: data.createdAt,
      });
      setNewMessage('');
      setTypingUser(null);
    } catch (err) {
      console.error('Failed sendMessage', err);
      toast.error(getApiErrorMessage(err));
    }
  };

  const selectConversation = (convId) => {
    const normalizedId = normalizeConversationId(convId);
    setActiveConv(normalizedId);
    navigate(`/messages/${normalizedId}`);
  };

  const handleRefresh = () => {
    const c = new AbortController();
    loadConversations(c.signal);
  };

  // Search users to start new conversation
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await userService.getFreelancers({ search: searchQuery });
      setSearchResults(Array.isArray(data) ? data : data?.users || []);
    } catch (err) {
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const startNewConversation = async (participantId) => {
    try {
      const { data } = await messageService.createConversation(participantId);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      // Reload conversations and select new one
      await loadConversations();
      selectConversation(data.id);
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-surface">
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Conversations Sidebar */}
        <aside className="w-80 border-r border-border bg-card hidden md:flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between gap-2">
            <h2 className="font-bold text-text">Messages</h2>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={handleRefresh} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewChat(true)} title="New Chat">
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* New Chat Modal */}
          {showNewChat && (
            <div className="p-3 border-b border-border bg-surface">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search users..."
                  className="flex-1 px-3 py-1.5 bg-card border border-border rounded text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button size="sm" onClick={handleSearch} disabled={searching}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {searching ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => startNewConversation(u._id)}
                      className="w-full flex items-center gap-2 p-2 text-left hover:bg-card rounded transition-colors"
                    >
                      <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id}`} alt="" className="w-8 h-8 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text truncate">{u.name}</span>
                        <span className="text-xs text-muted block">{u.role}</span>
                      </div>
                    </button>
                  ))}
                  {searchResults.length === 0 && searchQuery && (
                    <p className="text-xs text-muted p-2">No users found</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-muted text-center">
                <p className="mb-2">No conversations yet.</p>
                <Button size="sm" variant="outline" onClick={() => setShowNewChat(true)}>
                  <UserPlus className="w-4 h-4 mr-1" /> Start New Chat
                </Button>
                {convError && <p className="text-xs text-danger mt-2">Error: {convError}</p>}
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 text-left hover:bg-surface transition-colors relative',
                    activeConv === conv.id && 'bg-surface border-l-2 border-primary'
                  )}
                >
                  <div className="relative">
                    <img
                      src={conv.participant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.participant?.id}`}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text truncate">{conv.participant?.name}</span>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-muted">{formatRelativeTime(conv.lastMessageAt)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <img
                    src={activeConversation.participant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConversation.participant?.id}`}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-text">{activeConversation.participant?.name}</h3>
                    <p className="text-xs text-muted flex items-center gap-2">
                      {connected && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                          Live
                        </span>
                      )}
                      {typingUser ? `${typingUser} is typing...` : connected ? 'Connected' : 'Reconnecting...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {callState === 'incoming' ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={acceptVideoCall}>
                        <Check className="w-4 h-4" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={declineVideoCall}>
                        <X className="w-4 h-4" /> Decline
                      </Button>
                    </>
                  ) : callState === 'calling' ? (
                    <Button size="sm" variant="outline" onClick={endVideoCall}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startVideoCall} title="Start Video Call">
                      <Video className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-3/4" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted">
                    <p className="mb-2">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={cn('flex', msg.senderId === 'me' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                          msg.senderId === 'me'
                            ? 'bg-gradient-to-r from-secondary to-primary text-white rounded-br-md'
                            : 'bg-card text-text rounded-bl-md border border-border'
                        )}
                      >
                        <p>{msg.content}</p>
                        <div className={cn(
                          'flex items-center gap-1 text-xs mt-1',
                          msg.senderId === 'me' ? 'text-white/70' : 'text-muted'
                        )}>
                          <span>{formatRelativeTime(msg.timestamp)}</span>
                          {msg.senderId === 'me' && (
                            <span>{msg.read ? '✓✓' : '✓'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <button type="button" className="p-2 text-muted hover:text-text transition-colors" aria-label="Attach" disabled>
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTypingInput();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>

              {/* Video Call Overlay */}
              {callState !== 'idle' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                  <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <div>
                        <h3 className="font-semibold text-text">Video Call with {activeConversation?.participant?.name}</h3>
                        <p className="text-sm text-muted">
                          {callState === 'calling' && 'Calling...'}
                          {callState === 'incoming' && 'Incoming call'}
                          {callState === 'open' && 'In call'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={endVideoCall}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 p-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-black/90 overflow-hidden relative">
                        <video ref={localVideoRef} autoPlay muted playsInline className="h-64 w-full object-cover" />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">You</div>
                      </div>
                      <div className="rounded-2xl bg-black/90 overflow-hidden relative">
                        <video ref={remoteVideoRef} autoPlay playsInline className="h-64 w-full object-cover" />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">Remote</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 border-t border-border p-4">
                      {callState === 'incoming' ? (
                        <>
                          <Button variant="secondary" onClick={acceptVideoCall} className="gap-2">
                            <Check className="w-5 h-5" /> Accept
                          </Button>
                          <Button variant="outline" onClick={declineVideoCall} className="gap-2">
                            <X className="w-5 h-5" /> Decline
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" onClick={endVideoCall} className="gap-2 text-danger border-danger hover:bg-danger/10">
                          <X className="w-5 h-5" /> End Call
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted p-8">
              {loadingConvs ? (
                <div className="space-y-3 w-64">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-surface border-2 border-border flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-muted" />
                  </div>
                  <p className="text-lg font-medium mb-1">Select a conversation</p>
                  <p className="text-sm text-center max-w-xs mb-4">Choose a chat from the sidebar or start a new conversation with a freelancer or client.</p>
                  <Button variant="outline" onClick={() => setShowNewChat(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Start New Chat
                  </Button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}