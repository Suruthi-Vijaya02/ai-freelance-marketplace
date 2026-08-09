import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Save, Terminal, Code, Users, Wifi } from 'lucide-react';
import Button from '../ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CollaborativeEditor({ roomId, socketHooks, userId, userName }) {
  const [code, setCode] = useState('// Type code here...\n');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSaved, setLastSaved] = useState(null);
  const [otherUserTyping, setOtherUserTyping] = useState('');

  const textareaRef = useRef(null);
  const hasJoined = useRef(false);          // ← GUARD against double-join
  const typingTimerRef = useRef(null);      // ← stable timer ref

  const { joinEditor, emitCodeChange, emitCursorUpdate } = socketHooks;

  // Load session + join room ONCE per roomId
  useEffect(() => {
    let cancelled = false;

    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('svr_token');
        const { data } = await axios.get(`${API_URL}/collaboration/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (data) {
          setCode(data.code || '');
          setLanguage(data.language || 'javascript');
          if (data.updatedAt) setLastSaved(new Date(data.updatedAt));
        }
      } catch (err) {
        console.error('Failed to load collaborative session:', err);
      }
    };

    fetchSession();

    if (!hasJoined.current) {
      joinEditor(roomId, userId, userName);
      hasJoined.current = true;
    }

    return () => {
      cancelled = true;
      // NOTE: Add a leaveEditor() emitter in useSocket if you want clean server-side cleanup
    };
  }, [roomId, userId, userName, joinEditor]);

  // Listeners — depend on socket instance, not the whole hooks object
  useEffect(() => {
    if (!socketHooks.socket?.current) return;
    const socket = socketHooks.socket.current;

    const handleUserJoined = (data) => {
      toast.success(`${data.userName || 'Someone'} joined coding session`);
      setParticipants((prev) => {
        if (prev.some((p) => p.userId === data.userId)) return prev;
        return [...prev, data];
      });
    };

    const handleCodeUpdate = (data) => {
      setCode(data.code);
      if (data.language) setLanguage(data.language);
    };

    const handleCursorUpdate = (data) => {
      setOtherUserTyping(data.userName);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setOtherUserTyping('');
      }, 2000);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('code-update', handleCodeUpdate);
    socket.on('cursor-update', handleCursorUpdate);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('code-update', handleCodeUpdate);
      socket.off('cursor-update', handleCursorUpdate);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [socketHooks.socket]); // ← stable ref, not the whole object

  const handleCodeChange = (e) => {
    const nextCode = e.target.value;
    setCode(nextCode);
    emitCodeChange(roomId, nextCode, language);
    emitCursorUpdate(roomId, e.target.selectionStart, userName);
  };

  const handleLanguageChange = (e) => {
    const nextLang = e.target.value;
    setLanguage(nextLang);
    emitCodeChange(roomId, code, nextLang);
  };

  const saveSessionToDb = async () => {
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('svr_token');
      await axios.post(
        `${API_URL}/collaboration/${roomId}/save`,
        { code, language },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveStatus('saved');
      setLastSaved(new Date());
      toast.success('Code saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
      toast.error('Failed to save code session');
    }
  };

  const lines = code.split('\n');
  const lineNumbers = Array.from({ length: Math.max(15, lines.length) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-[520px] rounded-3xl bg-neutral-900 border border-neutral-800 text-neutral-300 overflow-hidden font-body relative">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-neutral-950/70 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-neutral-800 text-primary">
            <Terminal className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="font-black text-sm text-white tracking-tight uppercase">Collaborative Scratchpad</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-400">
              <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Real-time connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-3 py-1.5 text-xs rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="java">Java</option>
          </select>

          <Button
            size="sm"
            onClick={saveSessionToDb}
            disabled={saveStatus === 'saving'}
            className="!rounded-xl text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 border-none"
          >
            <Save className="w-3.5 h-3.5" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Code'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-12 bg-neutral-950/30 text-right pr-3 select-none text-[11px] font-mono text-neutral-600 py-3 leading-[22px] border-r border-neutral-800">
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          placeholder="// Type your code here..."
          className="flex-1 p-3 bg-neutral-900 text-neutral-100 font-mono text-sm leading-[22px] resize-none focus:outline-none focus:ring-0 overflow-y-auto"
          spellCheck="false"
        />

        {otherUserTyping && (
          <div className="absolute bottom-4 right-4 bg-neutral-950/90 border border-neutral-800 rounded-full px-3 py-1 text-[11px] font-medium text-indigo-300 shadow-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>{otherUserTyping} is typing...</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-6 py-2.5 bg-neutral-950/40 text-xs border-t border-neutral-800 text-neutral-400">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          <span>Active Editors: You {participants.map((p) => p.userName).join(', ') ? `+ ${participants.map((p) => p.userName).join(', ')}` : ''}</span>
        </div>
        <div>
          {lastSaved && <span>Last Saved: {lastSaved.toLocaleTimeString()}</span>}
        </div>
      </div>
    </div>
  );
}