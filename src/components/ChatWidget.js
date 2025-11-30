import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import messageSound from '../sounds/newmessage.mp3';
import '../styles/chatWidget.css';

const STORAGE_KEY = 'moChatSessionId';

const resolveSocketUrl = () => {
  const explicit = (process.env.REACT_APP_SOCKET_URL && process.env.REACT_APP_SOCKET_URL.trim()) || '';
  if (explicit) return explicit;
  const apiBase = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || '';
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      return apiBase.replace(/\/api$/, '');
    }
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
};

const SOCKET_URL = resolveSocketUrl();

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [initializing, setInitializing] = useState(true);

  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  const hasActiveSession = !!session && session.status !== 'closed';

  useEffect(() => {
    const audio = new Audio(messageSound);
    audio.volume = 0.7;
    audioRef.current = audio;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const persistSessionId = (id) => {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // ignore storage errors
    }
  };

  const hydrateSession = async (id) => {
    if (!id) {
      setInitializing(false);
      return;
    }
    try {
      const res = await api.get(`/api/chat/session/${id}`);
      const nextSession = res.data?.session;
      if (!nextSession || nextSession.status === 'closed') {
        persistSessionId(null);
        setSession(null);
        setMessages([]);
      } else {
        setSession(nextSession);
        setMessages(nextSession.messages || []);
        setPhoneNumber(nextSession.customerPhone || '');
      }
    } catch (err) {
      persistSessionId(null);
      setSession(null);
      setMessages([]);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    let storedId = null;
    try {
      storedId = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      storedId = null;
    }
    hydrateSession(storedId);
  }, []);

  useEffect(() => {
    if (!session?._id) return undefined;
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: { sessionId: session._id, role: 'customer' }
    });
    socket.emit('chat:join', { sessionId: session._id });
    socketRef.current = socket;

    socket.on('chat:message', ({ sessionId, message }) => {
      if (sessionId !== session._id || !message) return;
      setMessages((prev) => [...prev, message]);
      if (message.sender === 'admin') {
        playSound();
      }
    });

    socket.on('chat:sessionClosed', ({ sessionId }) => {
      if (sessionId !== session._id) return;
      persistSessionId(null);
      setSession(null);
      setMessages([]);
      setPhoneNumber('');
      setInfo('تم إنهاء المحادثة من قبل فريق الدعم.');
    });

    return () => {
      socket.emit('chat:leave', { sessionId: session._id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?._id]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = async (event) => {
    event.preventDefault();
    if (loading) return;
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (!/^01[0-2,5]\d{8}$/.test(digitsOnly)) {
      setError('أدخل رقماً مصرياً صحيحاً مكوناً من 11 رقم (يبدأ بـ 01).');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const payload = { phoneNumber };
      const res = await api.post('/api/chat/start', payload);
      const nextSession = res.data?.session;
      if (nextSession) {
        setSession(nextSession);
        setMessages(nextSession.messages || []);
        persistSessionId(nextSession._id);
        setPhoneNumber(nextSession.customerPhone || phoneNumber);
        setIsOpen(true);
        setInfo('');
      }
    } catch (err) {
      const response = err.response?.data;
      const message = response?.error || 'تعذر بدء المحادثة، حاول مرة أخرى.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (!socketRef.current || !session?._id) return;
    const trimmed = messageInput.trim();
    if (!trimmed) return;
    socketRef.current.emit('chat:message', {
      sessionId: session._id,
      sender: 'customer',
      text: trimmed
    });
    setMessageInput('');
  };

  const closeChat = async () => {
    if (!session?._id) return;
    setLoading(true);
    setInfo('');
    try {
      await api.post(`/api/chat/session/${session._id}/close`, { by: 'العميل' });
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
      persistSessionId(null);
      setSession(null);
      setMessages([]);
      setMessageInput('');
      setPhoneNumber('');
      setInfo('تم إغلاق المحادثة، يمكنك بدء محادثة جديدة في أي وقت.');
    }
  };

  const toggleWidget = () => {
    setIsOpen((prev) => !prev);
    setInfo('');
    setError('');
  };

  const renderMessages = useMemo(() => {
    if (!hasActiveSession || messages.length === 0) {
      return <div className="chat-empty">ابدأ بكتابة رسالتك وسيقوم فريقنا بالرد قريباً.</div>;
    }
    return messages.map((message, idx) => (
      <div
        key={`${message.createdAt}-${idx}`}
        className={`chat-message ${message.sender === 'customer' ? 'self' : message.sender === 'admin' ? 'agent' : 'system'}`}
      >
        <div className="chat-message-text">{message.text}</div>
        <div className="chat-message-meta">
          {new Date(message.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    ));
  }, [messages, hasActiveSession]);

  if (initializing) return null;

  return (
    <div className="chat-widget">
      <button className="chat-toggle" onClick={toggleWidget}>
        {hasActiveSession ? 'المحادثة' : 'تحدث معنا'}
      </button>
      {isOpen && (
        <div className="chat-panel" dir="rtl">
          <div className="chat-panel-header">
            <div>
              <div className="chat-title">دردشة العملاء</div>
              <div className="chat-subtitle">
                {hasActiveSession ? 'متصل الآن بخدمة العملاء' : 'أدخل رقم هاتفك لبدء الدردشة حتى بدون طلب'}
              </div>
            </div>
            {hasActiveSession && (
              <button className="chat-close" onClick={closeChat} disabled={loading}>
                إنهاء
              </button>
            )}
          </div>

          {!hasActiveSession && (
            <form className="chat-form" onSubmit={startChat}>
              <label>
                رقم الهاتف للتواصل
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  required
                />
              </label>
              {error && <div className="chat-error">{error}</div>}
              {info && <div className="chat-info">{info}</div>}
              <button type="submit" className="chat-submit" disabled={loading}>
                {loading ? 'جاري التحقق...' : 'بدء الدردشة'}
              </button>
            </form>
          )}

          {hasActiveSession && (
            <>
              <div className="chat-messages">
                {renderMessages}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="اكتب رسالتك هنا..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!hasActiveSession}
                />
                <button type="submit" disabled={!messageInput.trim()}>
                  إرسال
                </button>
              </form>
              {info && <div className="chat-info">{info}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
