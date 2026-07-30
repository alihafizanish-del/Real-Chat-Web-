import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, getDoc } from 'firebase/firestore';
import { Send, Mic, Square, Users, LogOut, MessageSquare, AlertCircle, Volume2, X, RefreshCw, Code2, Heart, Lock, ShieldCheck, History, ArrowRight, KeyRound, MoreVertical, Menu, Trash2, EyeOff } from 'lucide-react';

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
  const [authError, setAuthError] = useState(null);
  
  const [currentGroup, setCurrentGroup] = useState(null);
  const [displayName, setDisplayName] = useState('');

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
      setUser({ uid: generateId() });
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthError(null);
      } else {
        setUser({ uid: generateId() });
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
          <p className="text-slate-400 font-medium text-center">Connecting to server...</p>
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
  
  const [groupToDelete, setGroupToDelete] = useState(null);

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
    const localList = getLocalHistory();
    setOldGroups(localList);

    if (!user) return;

    try {
      const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata');
      const unsubscribe = onSnapshot(historyRef, (snapshot) => {
        const groupsList = [];
        snapshot.forEach((d) => {
          groupsList.push(d.data());
        });
        
        const currentLocal = getLocalHistory();
        const map = new Map();
        currentLocal.forEach(g => map.set(g.groupName, g));
        groupsList.forEach(g => {
          if (!map.has(g.groupName)) {
            map.set(g.groupName, g);
          } else {
            map.set(g.groupName, { ...map.get(g.groupName), ...g });
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOldGroups(merged);
      }, (err) => console.warn("Old groups history fetch notice:", err));

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore history listener notice:", e);
    }
  }, [user]);

  const saveToLocalHistory = (groupData) => {
    try {
      let list = getLocalHistory();
      const index = list.findIndex(g => g.groupName === groupData.groupName);
      if (index >= 0) {
        list[index] = { ...list[index], ...groupData };
      } else {
        list.unshift(groupData);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      setOldGroups(list);
    } catch (e) {
      console.warn("LocalStorage save warning:", e);
    }
  };

  const handleDeleteOldGroup = async (groupName) => {
    try {
      const groupMetaRef = doc(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata', groupName);
      await deleteDoc(groupMetaRef);

      let list = getLocalHistory();
      list = list.filter(g => g.groupName !== groupName);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      setOldGroups(list);

      setGroupToDelete(null);
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your display name.');
    if (!group.trim()) return setError('Please enter a group name.');
    if (!secretPasscode.trim()) return setError('Please enter your secret passcode.');
    if (group.length > 20) return setError('Group name must be less than 20 characters.');

    const normalizedGroup = group.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    setIsSubmitting(true);
    setError('');

    try {
      const groupMetaRef = doc(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata', normalizedGroup);
      const groupMetaSnap = await getDoc(groupMetaRef);

      if (groupMetaSnap.exists()) {
        const existingMeta = groupMetaSnap.data();
        const currentMembers = existingMeta.members || [];
        if (!currentMembers.includes(name.trim())) {
          await setDoc(groupMetaRef, {
            ...existingMeta,
            members: [...currentMembers, name.trim()]
          }, { merge: true });
        }
      } else {
        await setDoc(groupMetaRef, {
          groupName: normalizedGroup,
          createdBy: name.trim(),
          createdAt: Date.now(),
          createdAtFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          members: [name.trim()]
        });
      }

      saveToLocalHistory({
        groupName: normalizedGroup,
        displayName: name.trim(),
        passcode: secretPasscode.trim(),
        joinedAtFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      setIsSubmitting(false);
      onJoin(normalizedGroup, name.trim());
    } catch (err) {
      console.error("Join group error:", err);
      setIsSubmitting(false);
      onJoin(normalizedGroup, name.trim());
    }
  };

  const handleOldGroupUnlock = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setOldGroupError('Please enter your display name above first!');
    if (!oldGroupPasscode.trim()) return setOldGroupError('Please enter your secret passcode.');

    const foundGroup = oldGroups.find(g => g.groupName === selectedOldGroup.groupName);
    if (foundGroup && foundGroup.passcode && foundGroup.passcode !== oldGroupPasscode.trim()) {
      setOldGroupError('Your passcode is incorrect!');
      return;
    }

    const normalizedGroup = selectedOldGroup.groupName;

    try {
      const groupMetaRef = doc(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata', normalizedGroup);
      const groupMetaSnap = await getDoc(groupMetaRef);

      if (groupMetaSnap.exists()) {
        const existingMeta = groupMetaSnap.data();
        const currentMembers = existingMeta.members || [];
        if (!currentMembers.includes(name.trim())) {
          await setDoc(groupMetaRef, {
            ...existingMeta,
            members: [...currentMembers, name.trim()]
          }, { merge: true });
        }
      }

      saveToLocalHistory({
        groupName: normalizedGroup,
        displayName: name.trim(),
        passcode: oldGroupPasscode.trim(),
        joinedAtFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      setSelectedOldGroup(null);
      setShowOldChatsDrawer(false);
      onJoin(normalizedGroup, name.trim());
    } catch (err) {
      console.error("Old group unlock error:", err);
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
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/30 px-3.5 py-2 rounded-xl transition-all shadow-md group cursor-pointer"
        >
          <History size={18} />
          <span className="text-xs font-semibold">Old Chats</span>
          <MoreVertical size={18} className="text-slate-400 group-hover:text-indigo-400" />
        </button>
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 border-b border-slate-800/80 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4 shadow-sm">
            <Code2 size={13} />
            <span>Developed by Anish</span>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <ShieldCheck size={32} />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Whisper Room</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            Protected group chats crafted with <Heart size={13} className="inline text-red-400 mx-0.5" fill="currentColor" /> by <span className="text-indigo-300 font-semibold">Anish</span>.
          </p>
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
                onChange={(e) => { setName(e.target.value); setError(''); setOldGroupError(''); }}
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
                placeholder="e.g. a1 or random"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Secret Passcode</label>
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="flex items-center gap-2">
                  <History className="text-indigo-400" size={22} />
                  <h2 className="text-xl font-bold text-white">Your Old Chats</h2>
                </div>
                <button onClick={() => setShowOldChatsDrawer(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                  <X size={18} />
                </button>
              </div>

              {oldGroups.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 bg-slate-950/50 rounded-2xl p-6">
                  <History size={36} className="mb-3 opacity-25" />
                  <p className="text-sm font-medium">No old groups found</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {oldGroups.map((g) => (
                    <div key={g.groupName} className="p-4 bg-slate-950/80 hover:bg-indigo-950/30 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
                      <div 
                        onClick={() => {
                          if (!name.trim()) {
                            setError('Please enter your name above first!');
                            setShowOldChatsDrawer(false);
                            return;
                          }
                          setSelectedOldGroup(g);
                        }}
                        className="space-y-1.5 min-w-0 pr-2 flex-1 cursor-pointer"
                      >
                        <span className="font-bold text-white text-base truncate">#{g.groupName}</span>
                        <p className="text-xs text-slate-400">Members: {g.members?.join(', ') || 'Active'}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (!name.trim()) {
                              setError('Please enter your name above first!');
                              setShowOldChatsDrawer(false);
                              return;
                            }
                            setSelectedOldGroup(g);
                          }}
                          className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center cursor-pointer"
                        >
                          <KeyRound size={18} />
                        </button>
                        <button
                          onClick={() => setGroupToDelete(g)}
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
            <h3 className="font-bold text-white">Enter Secret Passcode</h3>
            <form onSubmit={handleOldGroupUnlock} className="space-y-4">
              <input
                type="password"
                value={oldGroupPasscode}
                onChange={(e) => setOldGroupPasscode(e.target.value)}
                placeholder="Passcode..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedOldGroup(null)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatRoom({ user, groupName, displayName, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  
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
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return nameColors[Math.abs(hash) % nameColors.length];
  };

  useEffect(() => {
    if (!user) return;

    const selfMember = {
      id: myMemberId,
      name: displayName,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    };

    setMembers([selfMember]);

    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const updatedSelf = { ...selfMember, lastSeen: now };
      const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
      setDoc(memberDocRef, updatedSelf, { merge: true }).catch(() => {});
    }, 4000);

    let unsubscribeMessages;
    let unsubscribeMembers;

    const setupFirestore = async () => {
      try {
        const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
        await setDoc(memberDocRef, selfMember);

        const membersRef = collection(db, 'artifacts', appId, 'public', 'data', membersColName);
        unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
          const memsMap = new Map();
          snapshot.forEach((d) => {
            const data = d.data();
            memsMap.set(data.id, data);
          });
          setMembers(Array.from(memsMap.values()));
        }, (err) => console.warn("Members error:", err));

        const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', messagesColName);
        unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
          const msgs = [];
          snapshot.forEach((d) => {
            msgs.push(d.data());
          });
          msgs.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(msgs);
        }, (err) => console.warn("Messages error:", err));
      } catch (err) {
        console.error("Firestore setup error:", err);
      }
    };

    setupFirestore();

    return () => {
      clearInterval(heartbeatInterval);
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeMembers) unsubscribeMembers();
    };
  }, [user, groupName, displayName, myMemberId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, deletedForMeIds]);

  const handleLeaveGroup = async () => {
    try {
      const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
      await deleteDoc(memberDocRef);
    } catch (err) {
      console.warn("Leave doc cleanup error:", err);
    }
    onLeave();
  };

  const sendMessage = async (text = null, audioBase64 = null) => {
    if (!text && !audioBase64) return;
    if (!user) return;

    const msgId = generateId();
    const newMsg = {
      id: msgId,
      senderId: myMemberId,
      senderName: displayName,
      text: text || '',
      audioData: audioBase64 || '',
      timestamp: Date.now()
    };

    setInputText('');

    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', messagesColName, msgId);
      await setDoc(msgRef, newMsg);
    } catch (err) {
      console.error("Error sending message to Firebase:", err);
      showError("Failed to send message.");
    }
  };

  // Voice recording handlers
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
      showError("Microphone permission is required for voice notes.");
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

  const isMemberOnline = (member) => {
    if (!member.lastSeen) return true;
    return (Date.now() - member.lastSeen) < 12000;
  };

  const onlineCount = members.filter(isMemberOnline).length;
  const visibleMessages = messages.filter(m => !deletedForMeIds.includes(m.id));

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">
      {errorToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}

      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white leading-tight">#{groupName}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                by Anish
              </span>
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {onlineCount} online ({members.length} total)
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLeaveGroup}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/20 cursor-pointer"
        >
          <LogOut size={16} />
          <span>Leave Group</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {visibleMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                <MessageSquare size={48} className="opacity-20" />
                <p className="text-sm text-center">No messages yet.</p>
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isMe = msg.senderId === myMemberId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className={`text-xs font-semibold mb-1 px-1 ${isMe ? 'text-indigo-400' : getNameColor(msg.senderName)}`}>
                      {msg.senderName} {isMe && '(You)'}
                    </span>
                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'}`}>
                      {msg.text && <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>}
                      {msg.audioData && (
                        <div className="flex items-center gap-2 py-1">
                          <Volume2 size={20} className={isMe ? 'text-indigo-200' : 'text-slate-400'} />
                          <audio controls src={msg.audioData} className="h-8 w-48 sm:w-64 max-w-full" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); if (inputText.trim()) sendMessage(inputText); }}
              className="flex items-end gap-2 max-w-4xl mx-auto"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setInputText(e.target.value);
                  }
                }}
                placeholder={isRecording ? "Recording voice note..." : "Type a message..."}
                disabled={isRecording}
                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:border-indigo-500"
              />

              {inputText.trim() ? (
                <button type="submit" className="h-[52px] w-[52px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center cursor-pointer">
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
                  className={`h-[52px] w-[52px] rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                    isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title="Hold to record voice message"
                >
                  {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-slate-800 font-semibold text-slate-200">
            Group Members ({members.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-300 font-medium flex items-center justify-center">
                  {member.name.charAt(0)}
                </div>
                <p className="text-sm text-slate-200 truncate">{member.name} {member.id === myMemberId && '(You)'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}