import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Send, Mic, Square, Users, LogOut, MessageSquare, AlertCircle, Volume2, X, RefreshCw, Code2, Heart, Lock, ShieldCheck, History, ArrowRight, KeyRound, MoreVertical, Trash2, EyeOff, Menu } from 'lucide-react';

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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'real-chat-59b6a';

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [currentGroup, setCurrentGroup] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      setAuthLoading(true);
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <MessageSquare className="w-12 h-12 text-indigo-500 mb-4 animate-bounce" />
          <p className="text-slate-400 font-medium">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {!currentGroup ? (
        <JoinScreen 
          user={user}
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

// ==========================================
// JOIN SCREEN (Home Page)
// ==========================================
function JoinScreen({ user, onJoin }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [secretPasscode, setSecretPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showOldChatsDrawer, setShowOldChatsDrawer] = useState(false);
  const [oldGroups, setOldGroups] = useState([]);
  const [selectedOldGroup, setSelectedOldGroup] = useState(null);
  const [oldGroupPasscode, setOldGroupPasscode] = useState('');
  const [oldGroupError, setOldGroupError] = useState('');

  const LOCAL_STORAGE_KEY = 'whisper_joined_groups_history';

  const getLocalHistory = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    setOldGroups(getLocalHistory());

    if (!user) return;
    
    try {
      const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata');
      const unsubscribe = onSnapshot(historyRef, (snapshot) => {
        const groupsList = [];
        snapshot.forEach((d) => groupsList.push(d.data()));
        
        const currentLocal = getLocalHistory();
        const map = new Map();
        currentLocal.forEach(g => map.set(g.groupName, g));
        groupsList.forEach(g => {
          if (!map.has(g.groupName)) map.set(g.groupName, g);
          else map.set(g.groupName, { ...map.get(g.groupName), ...g });
        });

        const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOldGroups(merged);
      }, (err) => console.warn("Fetch notice:", err));
      
      return () => unsubscribe();
    } catch (e) {
      console.warn("History notice:", e);
    }
  }, [user]);

  const saveToLocalHistory = (groupData) => {
    try {
      let list = getLocalHistory();
      const index = list.findIndex(g => g.groupName === groupData.groupName);
      if (index >= 0) list[index] = { ...list[index], ...groupData };
      else list.unshift(groupData);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      setOldGroups(list);
    } catch (e) {}
  };

  const handleDeleteOldGroup = async (groupName) => {
    try {
      if (user) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata', groupName));
      }
      let list = getLocalHistory().filter(g => g.groupName !== groupName);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      setOldGroups(list);
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.name?.trim && (!name.trim() || !group.trim() || !secretPasscode.trim())) {
      return setError('Please fill all fields completely.');
    }
    
    const normalizedGroup = group.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    setIsSubmitting(true);
    setError('');

    try {
      if (user) {
        const groupMetaRef = doc(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata', normalizedGroup);
        const groupMetaSnap = await getDoc(groupMetaRef);

        if (groupMetaSnap.exists()) {
          const existingMeta = groupMetaSnap.data();
          const currentMembers = existingMeta.members || [];
          if (!currentMembers.includes(name.trim())) {
            await setDoc(groupMetaRef, { members: [...currentMembers, name.trim()] }, { merge: true });
          }
        } else {
          await setDoc(groupMetaRef, {
            groupName: normalizedGroup,
            createdBy: name.trim(),
            createdAt: Date.now(),
            members: [name.trim()]
          });
        }
      }

      saveToLocalHistory({ groupName: normalizedGroup, displayName: name.trim(), passcode: secretPasscode.trim() });
      setIsSubmitting(false);
      onJoin(normalizedGroup, name.trim());
    } catch (err) {
      setIsSubmitting(false);
      onJoin(normalizedGroup, name.trim());
    }
  };

  const handleOldGroupUnlock = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setOldGroupError('Enter your Display Name first!');
    if (!oldGroupPasscode.trim()) return setOldGroupError('Enter passcode!');

    const foundGroup = oldGroups.find(g => g.groupName === selectedOldGroup.groupName);
    if (foundGroup && foundGroup.passcode && foundGroup.passcode !== oldGroupPasscode.trim()) {
      return setOldGroupError('Incorrect passcode!');
    }

    const normalizedGroup = selectedOldGroup.groupName;
    try {
      if (user) {
        const groupMetaRef = doc(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata', normalizedGroup);
        const groupMetaSnap = await getDoc(groupMetaRef);
        if (groupMetaSnap.exists()) {
          const existingMeta = groupMetaSnap.data();
          if (!(existingMeta.members || []).includes(name.trim())) {
            await setDoc(groupMetaRef, { members: [...(existingMeta.members || []), name.trim()] }, { merge: true });
          }
        }
      }
      saveToLocalHistory({ groupName: normalizedGroup, displayName: name.trim(), passcode: oldGroupPasscode.trim() });
      setSelectedOldGroup(null);
      setShowOldChatsDrawer(false);
      onJoin(normalizedGroup, name.trim());
    } catch (err) {
      onJoin(normalizedGroup, name.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-indigo-400" size={24} />
          <span className="font-bold text-white text-lg tracking-tight">Whisper Room</span>
        </div>

        <button
          onClick={() => setShowOldChatsDrawer(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer shadow-md"
        >
          <History size={18} />
          <span className="text-xs font-semibold">Old Chats</span>
        </button>
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <Code2 size={13} />
            <span>Developed by Anish</span>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-4 shadow-lg">
            <ShieldCheck size={32} />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Whisper Room</h1>
          <p className="text-slate-400 text-sm">Protected group chat by <span className="text-indigo-300 font-semibold">Anish</span>.</p>
        </div>
        
        <form onSubmit={handleJoin} className="p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Ali"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Group Name</label>
              <input
                type="text"
                value={group}
                onChange={(e) => { setGroup(e.target.value); setError(''); }}
                placeholder="e.g. family or friends"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Secret Passcode</label>
              <div className="relative">
                <input
                  type="password"
                  value={secretPasscode}
                  onChange={(e) => { setSecretPasscode(e.target.value); setError(''); }}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  maxLength={20}
                />
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            <span>Join / Create Group</span>
          </button>
        </form>
      </div>

      {showOldChatsDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Your Old Chats</h2>
                <button onClick={() => setShowOldChatsDrawer(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {oldGroups.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 bg-slate-950/50 rounded-2xl p-6">
                  <p className="text-sm">No old groups found</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {oldGroups.map((g) => (
                    <div key={g.groupName} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
                      <div 
                        onClick={() => {
                          if (!name.trim()) return setError('Please enter your Name first!');
                          setSelectedOldGroup(g);
                        }}
                        className="space-y-1 min-w-0 pr-2 flex-1 cursor-pointer"
                      >
                        <span className="font-bold text-white text-base">#{g.groupName}</span>
                        <p className="text-xs text-slate-400">Total Members: {g.members?.length || 1}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!name.trim()) return setError('Please enter your Name first!');
                            setSelectedOldGroup(g);
                          }}
                          className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center cursor-pointer"
                        >
                          <KeyRound size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteOldGroup(g.groupName)}
                          className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedOldGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white">Enter Passcode</h3>
            {oldGroupError && <p className="text-xs text-red-400">{oldGroupError}</p>}
            <form onSubmit={handleOldGroupUnlock} className="space-y-4">
              <input
                type="password"
                value={oldGroupPasscode}
                onChange={(e) => { setOldGroupPasscode(e.target.value); setOldGroupError(''); }}
                placeholder="Passcode..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedOldGroup(null)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CHAT ROOM COMPONENT (Fully Synchronized)
// ==========================================
function ChatRoom({ user, groupName, displayName, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMembersMobile, setShowMembersMobile] = useState(false);
  
  const [activeDeleteMsg, setActiveDeleteMsg] = useState(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState([]);

  const myMemberIdRef = useRef(generateId());
  const myMemberId = myMemberIdRef.current;
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const membersColName = `members_${groupName}`;
  const messagesColName = `messages_${groupName}`;

  const nameColors = ['text-emerald-400', 'text-amber-400', 'text-sky-400', 'text-pink-400', 'text-purple-400', 'text-orange-400'];
  const getNameColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return nameColors[Math.abs(hash) % nameColors.length];
  };

  // --- Real-time Firebase Sync for Members & Messages ---
  useEffect(() => {
    if (!user) return;

    const selfMember = {
      id: myMemberId,
      name: displayName,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    };

    let unsubscribeMessages;
    let unsubscribeMembers;
    let heartbeatInterval;

    const setupFirestore = async () => {
      try {
        const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
        await setDoc(memberDocRef, selfMember, { merge: true });

        // Update heartbeat every 4 seconds to maintain accurate online status
        heartbeatInterval = setInterval(() => {
          setDoc(memberDocRef, { lastSeen: Date.now() }, { merge: true }).catch(() => {});
        }, 4000);

        // Listen for all members in real-time
        const membersRef = collection(db, 'artifacts', appId, 'public', 'data', membersColName);
        unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
          const memsMap = new Map();
          snapshot.forEach((d) => memsMap.set(d.id, d.data()));
          setMembers(Array.from(memsMap.values()));
        }, (err) => console.warn("Members listener error:", err));

        // Listen for all messages in real-time
        const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', messagesColName);
        unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
          const msgsMap = new Map();
          snapshot.forEach((d) => msgsMap.set(d.id, d.data()));
          setMessages(Array.from(msgsMap.values()).sort((a, b) => a.timestamp - b.timestamp));
        }, (err) => console.warn("Messages listener error:", err));
      } catch (err) {
        console.error("Firestore setup error:", err);
      }
    };

    setupFirestore();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeMembers) unsubscribeMembers();
    };
  }, [user, groupName, displayName, myMemberId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, deletedForMeIds]);

  const handleLeaveGroup = async () => {
    try {
      if (user) {
        const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
        await deleteDoc(memberDocRef);
      }
    } catch (err) {}
    onLeave();
  };

  const sendMessage = async (text = null, audioBase64 = null) => {
    if (!text && !audioBase64) return;
    
    const msgId = generateId();
    const newMsg = {
      id: msgId,
      senderId: myMemberId,
      senderName: displayName,
      text: text || '',
      audioData: audioBase64 || '',
      timestamp: Date.now()
    };

    // Optimistic UI push
    setMessages(prev => {
      if (prev.some(m => m.id === msgId)) return prev;
      return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp);
    });
    setInputText('');

    if (!user) return;

    // Send to Firestore database immediately so everyone receives it
    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', messagesColName, msgId);
      await setDoc(msgRef, newMsg);
    } catch (err) {
      console.error("Failed to send message to database:", err);
    }
  };

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
          sendMessage(null, reader.result);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone permission is required!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const isMemberOnline = (member) => {
    if (!member.lastSeen) return true;
    return (Date.now() - member.lastSeen) < 10000; // 10 seconds threshold
  };

  const onlineCount = members.filter(isMemberOnline).length;
  const visibleMessages = messages.filter(m => !deletedForMeIds.includes(m.id));

  return (
    <div className="flex h-screen bg-slate-950 relative overflow-hidden">
      
      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] h-full">
        
        {/* HEADER */}
        <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-lg leading-tight">#{groupName}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">by Anish</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {onlineCount} Online | {members.length} Total Members
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setShowMembersMobile(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={handleLeaveGroup}
              className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/20 cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Leave Group</span>
            </button>
          </div>
        </header>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {visibleMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
              <MessageSquare size={48} className="opacity-20" />
              <p className="text-sm">No messages yet. Start chatting!</p>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              const isMe = msg.senderId === myMemberId;
              
              return (
                <div key={msg.id} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className={`text-xs font-semibold mb-1 px-1 ${isMe ? 'text-indigo-400' : getNameColor(msg.senderName)}`}>
                    {msg.senderName} {isMe && '(You)'}
                  </span>

                  <div className={`relative flex items-center gap-2 max-w-[85%] sm:max-w-[70%] group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 shadow-md ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'}`}>
                      {msg.text && <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
                      {msg.audioData && (
                        <div className="flex items-center gap-2 py-1">
                          <Volume2 size={20} className={isMe ? 'text-indigo-200' : 'text-slate-400'} />
                          <audio controls src={msg.audioData} className="h-8 w-48 sm:w-64 max-w-full" />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveDeleteMsg(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-500 hover:text-red-400 bg-slate-900/80 rounded-full border border-slate-800 shrink-0 cursor-pointer"
                      title="Options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); if (inputText.trim()) sendMessage(inputText); }}
            className="flex items-end gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => { if (e.target.value.length <= 500) setInputText(e.target.value); }}
              placeholder={isRecording ? "Recording voice message..." : "Type your message here..."}
              disabled={isRecording}
              className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500"
            />

            {inputText.trim() ? (
              <button type="submit" className="h-[52px] w-[52px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/25 shrink-0">
                <Send size={20} />
              </button>
            ) : (
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`h-[52px] w-[52px] rounded-2xl flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                  isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="Hold to record voice message"
              >
                {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* MEMBERS SIDEBAR (Desktop) */}
      <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col hidden md:flex shrink-0 h-full">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-slate-200">
          <Users size={18} className="text-slate-400" />
          <h3 className="font-semibold text-sm">Group Members ({members.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {members.map(member => {
            const online = isMemberOnline(member);
            const isMe = member.id === myMemberId;
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 font-medium flex items-center justify-center border border-indigo-800/50">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {online ? (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                  ) : (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-600 border-2 border-slate-900 rounded-full"></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">{member.name} {isMe && <span className="text-xs text-indigo-400 ml-1">(You)</span>}</p>
                  <p className="text-[10px] text-slate-500">{online ? <span className="text-green-400">Online</span> : 'Offline'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE MEMBERS DRAWER */}
      {showMembersMobile && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMembersMobile(false)}></div>
          <div className="relative w-64 bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-slate-200">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Users size={18}/> Members ({members.length})</h3>
              <button onClick={() => setShowMembersMobile(false)} className="p-1.5 bg-slate-800 rounded-lg text-slate-400"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {members.map(member => {
                const online = isMemberOnline(member);
                const isMe = member.id === myMemberId;
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 font-medium flex items-center justify-center">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-slate-900 rounded-full ${online ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">{member.name} {isMe && <span className="text-xs text-indigo-400 ml-1">(You)</span>}</p>
                      <p className="text-[10px] text-slate-500">{online ? <span className="text-green-400">Online</span> : 'Offline'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE DELETE MODAL */}
      {activeDeleteMsg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-white text-lg">Delete Message</h3>
            
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setDeletedForMeIds(prev => [...prev, activeDeleteMsg.id]);
                  setActiveDeleteMsg(null);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <EyeOff size={16} /> Delete for Me
              </button>

              {activeDeleteMsg.senderId === myMemberId && (
                <button
                  onClick={async () => {
                    try {
                      if (user) {
                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', messagesColName, activeDeleteMsg.id));
                      }
                    } catch(e){}
                    setActiveDeleteMsg(null);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} /> Delete for Everyone
                </button>
              )}

              <button
                onClick={() => setActiveDeleteMsg(null)}
                className="w-full bg-transparent hover:bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel code
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}