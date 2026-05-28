import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import useRole from '../hooks/useRole';
import toast from 'react-hot-toast';
import { ArrowLeft, Video, PhoneOff } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { interviewService, messageService } from '../services/authService';
import { useSocket } from '../hooks/useSocket';
import { getApiErrorMessage, normalizeConversationId } from '../utils/helpers';

export default function InterviewRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const { dashboardPath } = useRole();
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [callState, setCallState] = useState('idle');
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const conversationIdRef = useRef('');

  const userId = user?._id || user?.id;

  const handleNewMessage = useCallback((msg) => {
    const cid = normalizeConversationId(msg.conversationId);
    if (cid !== conversationIdRef.current) return;
    setMessages((prev) => {
      const mid = msg.id || msg._id;
      if (prev.some((m) => m.id === mid)) return prev;
      return [...prev, { id: mid, content: msg.content, senderId: (msg.sender?._id || msg.sender)?.toString() }];
    });
  }, []);

  const { joinConversation, joinInterview, emitOffer, emitAnswer, emitIceCandidate, emitCallEnd } = useSocket(null, {
    onNewMessage: handleNewMessage,
    onOffer: async (payload) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      emitAnswer({ conversationId: conversationIdRef.current, sdp: answer });
      setCallState('open');
    },
    onAnswer: async (payload) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      setCallState('open');
    },
    onIceCandidate: async (payload) => {
      if (peerRef.current && payload.candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    },
    onCallEnd: () => endCall(),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await interviewService.getById(id);
        setInterview(data);
        conversationIdRef.current = normalizeConversationId(data.conversationId);
        joinInterview(data.roomId);
        joinConversation(conversationIdRef.current);
        const msgRes = await messageService.getMessages(conversationIdRef.current);
        setMessages((msgRes.data || []).map((m) => ({
          id: m._id,
          content: m.content,
          senderId: (m.sender?._id || m.sender)?.toString(),
        })));
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, joinConversation, joinInterview]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          emitIceCandidate({ conversationId: conversationIdRef.current, candidate: e.candidate });
        }
      };
      peerRef.current = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      emitOffer({ conversationId: conversationIdRef.current, sdp: offer, callerName: user?.name });
      setCallState('calling');
    } catch {
      toast.error('Could not start video');
    }
  };

  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    emitCallEnd({ conversationId: conversationIdRef.current });
    setCallState('idle');
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !interview) return;
    const otherId =
      interview.clientId._id?.toString() === userId?.toString()
        ? interview.freelancerId._id
        : interview.clientId._id;
    try {
      await messageService.sendMessage({
        conversationId: conversationIdRef.current,
        receiver: otherId,
        content: newMessage.trim(),
      });
      setNewMessage('');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!interview) {
    return <div className="p-8 text-center text-muted">Interview not found</div>;
  }

  const canJoin = new Date(interview.scheduledTime) <= new Date(Date.now() + 15 * 60 * 1000);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <Link to={dashboardPath} className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div>
        <h1 className="text-2xl font-black text-text">Interview Room</h1>
        <p className="text-muted text-sm mt-1">
          {new Date(interview.scheduledTime).toLocaleString()} · {interview.status}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="grid grid-cols-2 gap-1 bg-black min-h-[280px]">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
          <div className="p-4 flex gap-2">
            {canJoin ? (
              callState === 'idle' ? (
                <Button onClick={startCall}><Video className="w-4 h-4" /> Start Video</Button>
              ) : (
                <Button variant="danger" onClick={endCall}><PhoneOff className="w-4 h-4" /> End Call</Button>
              )
            ) : (
              <p className="text-sm text-muted">Video opens 15 minutes before scheduled time.</p>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold text-text mb-3">Interview Chat</h2>
          <div className="h-64 overflow-y-auto space-y-2 mb-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`text-sm px-3 py-2 rounded-lg ${
                  m.senderId === userId?.toString() ? 'bg-primary/15 ml-4' : 'bg-surface mr-4'
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-surface"
              placeholder="Type a message..."
            />
            <Button type="submit" size="sm">Send</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
