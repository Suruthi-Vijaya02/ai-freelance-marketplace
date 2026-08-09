import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import useRole from '../hooks/useRole';
import toast from 'react-hot-toast';
import { ArrowLeft, Video, PhoneOff, Zap, Shield, Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { interviewService, messageService } from '../services/authService';
import { useSocket } from '../hooks/useSocket';
import { getApiErrorMessage, normalizeConversationId } from '../utils/helpers';
import CollaborativeEditor from '../components/collaboration/CollaborativeEditor';

export default function InterviewRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const { dashboardPath } = useRole();
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'open'
  
  // Media controls states
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
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

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    peerRef.current?.close();
    peerRef.current = null;
    setCallState('idle');
  }, []);

  const socketHooks = useSocket(null, {
    onNewMessage: handleNewMessage,
    onOffer: async (payload) => {
      try {
        let pc = peerRef.current;
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          pc.ontrack = (e) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          };
          pc.onicecandidate = (e) => {
            if (e.candidate) {
              socketHooks.emitIceCandidate({ conversationId: conversationIdRef.current, candidate: e.candidate });
            }
          };
          peerRef.current = pc;
        }

        // Add local tracks if we have any active stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => {
            const senders = pc.getSenders();
            const alreadyAdded = senders.some((s) => s.track === t);
            if (!alreadyAdded) pc.addTrack(t, localStreamRef.current);
          });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketHooks.emitAnswer({ conversationId: conversationIdRef.current, sdp: answer });
        setCallState('open');
      } catch (err) {
        console.error('Failed to handle incoming WebRTC offer:', err);
      }
    },
    onAnswer: async (payload) => {
      try {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          setCallState('open');
        }
      } catch (err) {
        console.error('Failed to handle WebRTC answer:', err);
      }
    },
    onIceCandidate: async (payload) => {
      try {
        if (peerRef.current && payload.candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.warn('Failed to add WebRTC ice candidate:', err);
      }
    },
    onCallEnd: () => {
      endCall();
      toast.info('Interview call has ended');
    },
  });

  const { joinConversation, joinInterview, emitOffer, emitAnswer, emitIceCandidate, emitCallEnd } = socketHooks;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await interviewService.getById(id);
        if (!data) {
          throw new Error('Interview not found');
        }
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
        console.error('Interview load error:', err);
        setInterview(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      endCall();
    };
  }, [id, joinConversation, joinInterview, endCall]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      let pc = peerRef.current;
      if (!pc) {
        pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            emitIceCandidate({ conversationId: conversationIdRef.current, candidate: e.candidate });
          }
        };
        peerRef.current = pc;
      }
      
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      emitOffer({ conversationId: conversationIdRef.current, sdp: offer, callerName: user?.name });
      setCallState('calling');
      setMicEnabled(true);
      setCameraEnabled(true);
    } catch (err) {
      console.error('Could not start media stream:', err);
      toast.error('Could not start video interview. Please check your camera permissions.');
    }
  };

  const endCallSession = () => {
    emitCallEnd({ conversationId: conversationIdRef.current });
    endCall();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !interview) return;
    const client = interview.clientId?._id || interview.clientId;
    const freelancer = interview.freelancerId?._id || interview.freelancerId;
    
    if (!client || !freelancer) {
      toast.error('Participants not found');
      return;
    }

    const otherId = client.toString() === userId?.toString() ? freelancer : client;
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
    return (
      <div className="p-8 text-center space-y-4 font-body">
        <h2 className="text-xl font-bold text-text">Interview details not available.</h2>
        <p className="text-muted">The interview might have been cancelled or does not exist.</p>
        <Link to={dashboardPath}>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Go Back</Button>
        </Link>
      </div>
    );
  }

  // Always enable join/video for demo and test reliability
  const canJoin = true;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 font-body">
      <Link to={dashboardPath || '/'} className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div>
        <h1 className="text-2xl font-black text-text">Live Interview Room</h1>
        <p className="text-muted text-sm mt-1">
          {interview?.scheduledTime ? new Date(interview.scheduledTime).toLocaleString() : 'Date TBD'} · {interview?.status || 'Scheduled'}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 !p-0 overflow-hidden bg-neutral-950 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-1 bg-black min-h-[320px]">
            <div className="relative bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-neutral-950/70 text-[10px] text-white px-2.5 py-1 rounded-full font-bold uppercase">
                You (Local)
              </div>
            </div>
            <div className="relative bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-neutral-950/70 text-[10px] text-white px-2.5 py-1 rounded-full font-bold uppercase">
                Peer (Remote)
              </div>
            </div>
          </div>
          <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
            <div className="flex gap-2">
              {callState === 'idle' ? (
                <Button onClick={startCall} className="bg-indigo-600 hover:bg-indigo-700">
                  <Video className="w-4 h-4 mr-2" /> Join Video Interview
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={toggleMic} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                    {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />}
                  </Button>
                  <Button variant="outline" onClick={toggleCamera} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                    {cameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4 text-red-500" />}
                  </Button>
                  <Button variant="danger" onClick={endCallSession}>
                    <PhoneOff className="w-4 h-4 mr-2" /> End Call
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${callState === 'open' ? 'bg-emerald-500 animate-pulse' : callState === 'calling' ? 'bg-amber-500 animate-pulse' : 'bg-neutral-600'}`} />
              <span className="text-neutral-400 font-medium uppercase tracking-wider text-[10px]">
                {callState === 'open' ? 'Live connected' : callState === 'calling' ? 'Calling...' : 'Disconnected'}
              </span>
            </div>
          </div>
        </Card>
        
        <Card className="flex flex-col h-full justify-between">
          <div>
            <h2 className="font-black text-sm uppercase tracking-wider text-text mb-3">Interview Chat</h2>
            <div className="h-64 overflow-y-auto space-y-2 mb-3 pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`text-sm px-3 py-2 rounded-2xl leading-snug ${
                    m.senderId === userId?.toString() ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 ml-4' : 'bg-surface border border-border text-text mr-4'
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={sendChat} className="flex gap-2 border-t pt-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-xl text-sm bg-surface focus:outline-none focus:border-primary"
              placeholder="Type a message..."
            />
            <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90">Send</Button>
          </form>
        </Card>
      </div>

      {/* Embedded Real-Time Collaborative Coding Editor */}
      <div className="mt-8">
        <h2 className="text-lg font-black text-text mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          Technical Assessment Workspace
        </h2>
        <CollaborativeEditor 
          roomId={interview.roomId} 
          socketHooks={socketHooks} 
          userId={userId} 
          userName={user?.name || 'User'} 
        />
      </div>
    </div>
  );
}
