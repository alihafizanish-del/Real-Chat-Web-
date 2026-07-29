import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { Send, Mic, Square, Users, LogOut, MessageSquare, AlertCircle, Volume2, X, RefreshCw } from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyBNptcd4OErqpT8CdLpzck5ZVFwqoGgbp8",
      authDomain: "real-chat-59b6a.firebaseapp.com",
      projectId: "real-chat-59b6a",
      storageBucket: "real-chat-59b6a.firebasestorage.app",
      messagingSenderId: "596024439637",
      appId: "1:596024439637:web:7b365931b438d09b7235dc"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Unique ID Generator
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
};

// --- Main Application Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // App State
  const [currentGroup, setCurrentGroup] = useState(null);
  const [displayName, setDisplayName] = useState('');

  // 1. Authenticate user anonymously
  const initAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.error("Auth Error:", error);
      setAuthError("Failed to connect to authentication server. Please refresh the page.");
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthError(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <MessageSquare className="w-12 h-12 text-indigo-500 mb-4 animate-bounce" />
          <p className="text-slate-400 font-medium text-center">Server se connect ho raha hai...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Connection Error</h2>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            {authError}
          </p>
          <button
            onClick={initAuth}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {!currentGroup ? (
        <JoinScreen 
          onJoin={(group, name) => {
            setDisplayName(name);
            setCurrentGroup(group);
          }} 
        />
      ) : (
        <ChatRoom 
          user={user} 
          groupName={currentGroup} 
          displayName={displayName} 
          onLeave={() => setCurrentGroup(null)} 
        />
      )}
    </div>
  );
}

// --- Join Screen Component ---
function JoinScreen({ onJoin }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your display name.');
    if (!group.trim()) return setError('Please enter a group name.');
    if (group.length > 20) return setError('Group name must be less than 20 characters.');
    
    // Normalize group name
    const normalizedGroup = group.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    onJoin(normalizedGroup, name.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-gradient-to-br from-indigo-900/50 to-slate-900">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-6">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Whisper Room</h1>
          <p className="text-slate-400 text-sm">Temporary & real-time group chat. No data is stored permanently.</p>
        </div>
        
        <form onSubmit={handleJoin} className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Ali / Umar / Ahmed"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Group Name</label>
              <input
                type="text"
                value={group}
                onChange={(e) => { setGroup(e.target.value); setError(''); }}
                placeholder="e.g. a1"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600"
                maxLength={20}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            Join / Create Group
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Chat Room Component ---
function ChatRoom({ user, groupName, displayName, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  
  const [joinTime] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const channelRef = useRef(null);

  // Root Collection Paths
  const membersColName = `members_${groupName}`;
  const messagesColName = `messages_${groupName}`;

  // Helper colors for different senders
  const nameColors = ['text-emerald-400', 'text-amber-400', 'text-sky-400', 'text-pink-400', 'text-purple-400', 'text-orange-400'];
  const getNameColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return nameColors[Math.abs(hash) % nameColors.length];
  };

  // 1. Initialize Active User & Presence Tracking
  useEffect(() => {
    if (!user) return;

    const selfMember = {
      id: user.uid,
      name: displayName,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    };

    setMembers([selfMember]);

    // Setup local BroadcastChannel for multi-tab support
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`room_bc_${groupName}`);
      channelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'NEW_MSG') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            const updated = [...prev, payload];
            return updated.sort((a, b) => a.timestamp - b.timestamp);
          });
        } else if (type === 'MEMBER_JOIN' || type === 'HEARTBEAT') {
          setMembers((prev) => {
            const index = prev.findIndex((m) => m.id === payload.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...payload, lastSeen: Date.now() };
              return updated;
            }
            return [...prev, { ...payload, lastSeen: Date.now() }];
          });
        } else if (type === 'MEMBER_LEAVE') {
          setMembers((prev) => prev.filter((m) => m.id !== payload.userId));
        } else if (type === 'PING') {
          bc.postMessage({ type: 'HEARTBEAT', payload: selfMember });
        }
      };

      bc.postMessage({ type: 'MEMBER_JOIN', payload: selfMember });
      bc.postMessage({ type: 'PING' });
    }

    // Heartbeat Interval to broadcast presence
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'HEARTBEAT', payload: { ...selfMember, lastSeen: now } });
      }
      // Update Firestore heartbeat
      const memberRef = doc(db, membersColName, user.uid);
      setDoc(memberRef, { ...selfMember, lastSeen: now }, { merge: true }).catch(() => {});
    }, 5000);

    // Firestore real-time synchronization
    let unsubscribeMessages;
    let unsubscribeMembers;

    const setupFirestore = async () => {
      try {
        const memberRef = doc(db, membersColName, user.uid);
        await setDoc(memberRef, selfMember);

        // Listen for Members
        const membersRef = collection(db, membersColName);
        unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
          setMembers((prevMems) => {
            const memsMap = new Map();
            prevMems.forEach((m) => memsMap.set(m.id, m));
            snapshot.forEach((d) => {
              const data = d.data();
              memsMap.set(data.id, { ...memsMap.get(data.id), ...data });
            });
            return Array.from(memsMap.values());
          });
        }, (err) => console.warn("Firestore members listener notice:", err));

        // Listen for Real-Time Messages
        const messagesRef = collection(db, messagesColName);
        unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
          setMessages((prevMsgs) => {
            const msgMap = new Map();
            prevMsgs.forEach((m) => msgMap.set(m.id, m));
            snapshot.forEach((d) => {
              const data = d.data();
              if (data.timestamp >= joinTime) {
                msgMap.set(data.id, data);
              }
            });
            const sorted = Array.from(msgMap.values());
            return sorted.sort((a, b) => a.timestamp - b.timestamp);
          });
        }, (err) => console.warn("Firestore messages listener notice:", err));
      } catch (err) {
        console.warn("Firestore connection notice:", err);
      }
    };

    setupFirestore();

    const handleBeforeUnload = () => {
      handleLeaveRoom();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeMembers) unsubscribeMembers();
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'MEMBER_LEAVE', payload: { userId: user.uid } });
        channelRef.current.close();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, groupName, displayName, joinTime]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Clean User Data on Exit
  const handleLeaveRoom = async () => {
    if (!user) return;

    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'MEMBER_LEAVE', payload: { userId: user.uid } });
    }

    try {
      const memberRef = doc(db, membersColName, user.uid);
      await deleteDoc(memberRef);

      const messagesRef = collection(db, messagesColName);
      const snapshot = await getDocs(messagesRef);
      
      const deletePromises = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.data().senderId === user.uid) {
          deletePromises.push(deleteDoc(docSnap.ref));
        }
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn("Cleanup notice:", err);
    }
  };

  const triggerLeave = async () => {
    await handleLeaveRoom();
    onLeave();
  };

  // 3. Send Text or Audio Message
  const sendMessage = async (text = null, audioBase64 = null) => {
    if (!text && !audioBase64) return;
    if (!user) return;

    const msgId = generateId();
    const newMsg = {
      id: msgId,
      senderId: user.uid,
      senderName: displayName,
      text: text || '',
      audioData: audioBase64 || '',
      timestamp: Date.now()
    };

    // Immediate local optimistic update
    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      const updated = [...prev, newMsg];
      return updated.sort((a, b) => a.timestamp - b.timestamp);
    });
    setInputText('');

    // Broadcast across tabs
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'NEW_MSG', payload: newMsg });
    }

    // Sync to Firestore
    try {
      const msgRef = doc(db, messagesColName, msgId);
      await setDoc(msgRef, newMsg);
    } catch (err) {
      console.warn("Firestore sync warning:", err);
    }
  };

  // 4. Voice Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result;
          sendMessage(null, base64String);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone permission error", err);
      showError("Microphone permission is required for voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // Check if member is online (active in last 15 seconds)
  const isMemberOnline = (member) => {
    if (!member.lastSeen) return true;
    return (Date.now() - member.lastSeen) < 15000;
  };

  const onlineCount = members.filter(isMemberOnline).length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">
      
      {/* Toast Notification */}
      {errorToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white leading-tight">#{groupName}</h2>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {onlineCount} {onlineCount === 1 ? 'online member' : 'online members'} ({members.length} total)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowMembers(!showMembers)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-lg"
          >
            <Users size={20} />
          </button>
          <button
            onClick={triggerLeave}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-500/20"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Leave Group</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
          
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                <MessageSquare size={48} className="opacity-20" />
                <p className="text-sm text-center">No messages yet. Send the first message!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    {/* ALWAYS SHOW SENDER NAME (WhatsApp Style) */}
                    <span className={`text-xs font-semibold mb-1 px-1 flex items-center gap-1 ${isMe ? 'text-indigo-400' : getNameColor(msg.senderName)}`}>
                      {msg.senderName} {isMe && <span className="text-[10px] text-slate-500 font-normal">(You)</span>}
                    </span>

                    <div 
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm 
                        ${isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                        }`}
                    >
                      {msg.text && <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>}
                      {msg.audioData && (
                        <div className="flex items-center gap-2 py-1">
                          <Volume2 size={20} className={isMe ? 'text-indigo-200' : 'text-slate-400'} />
                          <audio controls src={msg.audioData} className="h-8 w-48 sm:w-64 max-w-full [&::-webkit-media-controls-panel]:bg-slate-100" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); if (inputText.trim()) sendMessage(inputText); }}
              className="flex items-end gap-2 max-w-4xl mx-auto"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isRecording ? "Recording voice message..." : "Type a temporary message..."}
                  disabled={isRecording}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all placeholder:text-slate-500 shadow-inner"
                />
              </div>

              {inputText.trim() ? (
                <button
                  type="submit"
                  className="h-[52px] w-[52px] shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/25"
                >
                  <Send size={20} className="ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`h-[52px] w-[52px] shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40 scale-105' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600'
                  }`}
                  title="Hold or tap to record voice message"
                >
                  {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
                </button>
              )}
            </form>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              All messages are temporary. History will be cleared when you leave the group.
            </p>
          </div>
        </div>

        {/* Members Sidebar */}
        <div className={`
          absolute inset-y-0 right-0 z-20 w-64 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col
          md:relative md:translate-x-0
          ${showMembers ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 backdrop-blur">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Users size={18} className="text-slate-400" /> Group Members ({members.length})
            </h3>
            <button 
              onClick={() => setShowMembers(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-md"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {members.length === 0 ? (
              <p className="text-xs text-slate-500 text-center p-4">Connecting members...</p>
            ) : (
              members.map(member => {
                const online = isMemberOnline(member);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-300 font-medium flex items-center justify-center uppercase border border-indigo-800">
                        {member.name ? member.name.charAt(0) : '?'}
                      </div>
                      {online ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse" title="Online"></span>
                      ) : (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-600 border-2 border-slate-900 rounded-full" title="Offline"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {member.name} {member.id === user.uid && <span className="text-xs text-indigo-400 ml-1">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {online ? <span className="text-green-400">Online</span> : <span>Offline</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Mobile Overlay */}
        {showMembers && (
          <div 
            className="md:hidden absolute inset-0 bg-black/60 z-10 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowMembers(false)}
          />
        )}

      </div>
    </div>
  );
}