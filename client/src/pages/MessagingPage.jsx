import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, Video, FileText, Paperclip } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/authService';
import { useSocket } from '../hooks/useSocket';
import { formatRelativeTime, cn, getApiErrorMessage } from '../utils/helpers';

function mapApiMessage(msg, currentUserId) {
  const senderId = msg.sender?._id || msg.sender;
  return {
    id: msg._id || msg.id,
    senderId: senderId?.toString() === currentUserId?.toString() ? 'me' : senderId,
    content: msg.content,
    timestamp: msg.createdAt || msg.timestamp,
    sender: msg.sender,
  };
}

export default function MessagingPage() {
  const { conversationId: paramConvId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(paramConvId || '');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const activeConvRef = useRef(activeConv);
  const userId = user?._id || user?.id;

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  const handleNewMessage = useCallback(
    (msg) => {
      if (msg.conversationId !== activeConvRef.current) return;
      setMessages((prev) => {
        const mapped = {
          id: msg.id || msg._id,
          senderId:
            (msg.sender?._id || msg.sender)?.toString() === userId?.toString() ? 'me' : msg.sender?._id,
          content: msg.content,
          timestamp: msg.timestamp || msg.createdAt,
        };
        if (prev.some((m) => m.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
    },
    [userId]
  );

  const handleTyping = useCallback(({ conversationId, userName, typing }) => {
    if (conversationId !== activeConvRef.current) return;
    if (typing) setTypingUser(userName || 'Someone');
    else setTypingUser(null);
  }, []);

  const { connected, joinConversation, emitMessage, emitTypingStart, emitTypingStop } = useSocket(null, {
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
  });

  const activeConversation = conversations.find((c) => c.id === activeConv);

  const loadConversations = useCallback(async (signal) => {
    if (!isAuthenticated) return;
    try {
      setLoadingConvs(true);
      const { data } = await messageService.getConversations();
      if (signal?.aborted) return;
      setConversations(data || []);
      if (data?.length > 0) {
        const target =
          paramConvId && data.some((c) => c.id === paramConvId) ? paramConvId : data[0].id;
        setActiveConv(target);
        if (paramConvId !== target) {
          navigate(`/workspace/${target}`, { replace: true });
        }
      }
    } catch (err) {
      if (!signal?.aborted) toast.error(getApiErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoadingConvs(false);
    }
  }, [isAuthenticated, paramConvId, navigate]);

  const loadMessages = useCallback(async (convId, signal) => {
    if (!convId || !isAuthenticated) return;
    try {
      setLoadingMsgs(true);
      const { data } = await messageService.getMessages(convId);
      if (signal?.aborted) return;
      setMessages((data || []).map((m) => mapApiMessage(m, userId)));
    } catch (err) {
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
        timestamp: data.createdAt,
      });
      setNewMessage('');
      setTypingUser(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const selectConversation = (convId) => {
    setActiveConv(convId);
    navigate(`/workspace/${convId}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <aside className="w-80 border-r border-border bg-card hidden md:flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-text">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted">No conversations yet.</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left hover:bg-surface transition-colors',
                    activeConv === conv.id && 'bg-surface border-l-2 border-primary'
                  )}
                >
                  <img
                    src={conv.participant?.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-text truncate block">{conv.participant?.name}</span>
                    <p className="text-sm text-muted truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <img
                    src={activeConversation.participant?.avatar}
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
                <Button variant="outline" size="sm" disabled title="Coming soon">
                  <Video className="w-4 h-4" /> Video Call
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMsgs ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.senderId === 'me' ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                          msg.senderId === 'me'
                            ? 'bg-gradient-to-r from-secondary to-primary text-white rounded-br-md font-medium'
                            : 'bg-card text-text rounded-bl-md border border-border'
                        )}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            msg.senderId === 'me' ? 'text-white/70' : 'text-muted'
                          )}
                        >
                          {formatRelativeTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <button type="button" className="p-2 text-muted" aria-label="Attach" disabled>
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
                  <Button type="submit">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              {loadingConvs ? 'Loading...' : 'Select a conversation'}
            </div>
          )}
        </main>

        <aside className="w-96 border-l border-border bg-card hidden xl:flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-text">Collaborative Editor</h2>
          </div>
          <div className="flex-1 p-4">
            <Card className="h-full !p-0 overflow-hidden">
              <div className="bg-surface p-3 border-b border-border text-xs text-muted">
                document.md · placeholder
              </div>
              <div className="p-4 font-mono text-sm text-muted min-h-[300px]">
                <p className="text-text"># Project Brief</p>
                <p className="text-primary mt-4">Collaborative editing — coming soon</p>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
