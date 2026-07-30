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

  // Authenticate user anonymously
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

// --- Join Screen Component with Personal Passcodes & 3-Dots Old Chats Drawer ---
function JoinScreen({ user, onJoin }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [secretPasscode, setSecretPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drawer and Old Groups History State
  const [showOldChatsDrawer, setShowOldChatsDrawer] = useState(false);
  const [oldGroups, setOldGroups] = useState([]);
  const [selectedOldGroup, setSelectedOldGroup] = useState(null);
  const [oldGroupPasscode, setOldGroupPasscode] = useState('');
  const [oldGroupError, setOldGroupError] = useState('');
  
  // Group deletion confirmation modal state
  const [groupToDelete, setGroupToDelete] = useState(null);

  const LOCAL_STORAGE_KEY = 'whisper_joined_groups_history';

  // Load Old Groups History
  useEffect(() => {
    if (!user) return;

    const historyRef = collection(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata');
    const unsubscribe = onSnapshot(historyRef, (snapshot) => {
      const groupsList = [];
      snapshot.forEach((d) => {
        groupsList.push(d.data());
      });
      groupsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOldGroups(groupsList);
    }, (err) => console.warn("Old groups history fetch notice:", err));

    return () => unsubscribe();
  }, [user]);

  const saveToLocalHistory = (groupData) => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      let list = saved ? JSON.parse(saved) : [];
      const index = list.findIndex(g => g.groupName === groupData.groupName && g.displayName === groupData.displayName);
      if (index >= 0) {
        list[index] = { ...list[index], ...groupData };
      } else {
        list.unshift(groupData);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("LocalStorage save warning:", e);
    }
  };

  // Delete an entire old group chat history
  const handleDeleteOldGroup = async (groupName) => {
    try {
      // 1. Delete group metadata
      const groupMetaRef = doc(db, 'artifacts', appId, 'public', 'data', 'all_groups_metadata', groupName);
      await deleteDoc(groupMetaRef);

      // 2. Remove from local storage history
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        let list = JSON.parse(saved);
        list = list.filter(g => g.groupName !== groupName);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      }

      setGroupToDelete(null);
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  // Handle Form Submit for Join/Create
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your display name.');
    if (!group.trim()) return setError('Please enter a group name.');
    if (!secretPasscode.trim()) return setError('Please enter your personal secret passcode.');
    if (group.length > 20) return setError('Group name must be less than 20 characters.');

    const normalizedGroup = group.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const normalizedName = name.trim().toLowerCase();
    setIsSubmitting(true);
    setError('');

    try {
      const credentialDocId = `${normalizedGroup}_${normalizedName}`;
      const credDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_credentials', credentialDocId);
      const credSnap = await getDoc(credDocRef);

      if (credSnap.exists()) {
        const existingCred = credSnap.data();
        if (existingCred.passcode !== secretPasscode.trim()) {
          setError('Your Passcode is Incorrect!');
          setIsSubmitting(false);
          return;
        }
      } else {
        await setDoc(credDocRef, {
          groupName: normalizedGroup,
          displayName: name.trim(),
          passcode: secretPasscode.trim(),
          joinedAt: Date.now()
        });
      }

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
      setError("Error joining group. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Quick Unlock Old Group
  const handleOldGroupUnlock = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setOldGroupError('Please enter Your Display Name above first!');
    if (!oldGroupPasscode.trim()) return setOldGroupError('Please enter your personal secret passcode.');

    const normalizedGroup = selectedOldGroup.groupName;
    const normalizedName = name.trim().toLowerCase();

    try {
      const credentialDocId = `${normalizedGroup}_${normalizedName}`;
      const credDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_credentials', credentialDocId);
      const credSnap = await getDoc(credDocRef);

      if (credSnap.exists()) {
        const existingCred = credSnap.data();
        if (existingCred.passcode !== oldGroupPasscode.trim()) {
          setOldGroupError('Your Code is Incorrect!');
          return;
        }
      } else {
        await setDoc(credDocRef, {
          groupName: normalizedGroup,
          displayName: name.trim(),
          passcode: oldGroupPasscode.trim(),
          joinedAt: Date.now()
        });
      }

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
      setOldGroupError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      
      {/* Top Bar with 3-Dots Menu Button */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-indigo-400" size={24} />
          <span className="font-bold text-white text-lg tracking-tight">Whisper Room</span>
        </div>

        {/* 3-DOTS MENU BUTTON */}
        <button
          onClick={() => setShowOldChatsDrawer(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/30 px-3.5 py-2 rounded-xl transition-all shadow-md group cursor-pointer"
          title="Open Your Old Group Chats"
        >
          <History size={18} />
          <span className="text-xs font-semibold">Old Chats</span>
          <MoreVertical size={18} className="text-slate-400 group-hover:text-indigo-400" />
        </button>
      </div>

      {/* Join / Create Form Card */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
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
            Protected group chats with your personal passcode crafted with <Heart size={13} className="inline text-red-400 mx-0.5" fill="currentColor" /> by <span className="text-indigo-300 font-semibold">Anish</span>.
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleJoin} className="p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm animate-shake">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Name (Display Name)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); setOldGroupError(''); }}
                placeholder="e.g. Ali / Umar / Anish"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600"
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Group Name</label>
              <input
                type="text"
                value={group}
                onChange={(e) => { setGroup(e.target.value); setError(''); }}
                placeholder="e.g. academy-friends / bmw"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600"
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
                  placeholder="e.g. 1122 or secret123"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  maxLength={20}
                />
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Set your personal secret code. Re-use this code when you rejoin.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            <span>Join / Create Group</span>
          </button>
        </form>

        {/* Footer Credit */}
        <div className="py-3 bg-slate-950/80 text-center border-t border-slate-800/50">
          <p className="text-[11px] text-slate-500">
            Powered by Anish • Protected Messaging
          </p>
        </div>
      </div>

      {/* --- YOUR OLD GROUP CHATS DRAWER --- */}
      {showOldChatsDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
            
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <History className="text-indigo-400" size={22} />
                  <h2 className="text-xl font-bold text-white">Your Old Group Chats</h2>
                </div>
                <button
                  onClick={() => setShowOldChatsDrawer(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Choose any group to rejoin. You can also delete any group chat history from the list.
              </p>

              {oldGroups.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800/50 p-6">
                  <History size={36} className="mb-3 opacity-25" />
                  <p className="text-sm font-medium">No old groups found</p>
                  <p className="text-xs text-slate-600 mt-1">Create or join a group above to save it here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {oldGroups.map((g) => (
                    <div 
                      key={g.groupName}
                      className="p-4 bg-slate-950/80 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition-all flex items-center justify-between shadow-md"
                    >
                      <div 
                        onClick={() => {
                          if (!name.trim()) {
                            setError('Please enter Your Display Name in the form above first!');
                            setShowOldChatsDrawer(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }
                          setSelectedOldGroup(g);
                          setOldGroupPasscode('');
                          setOldGroupError('');
                        }}
                        className="space-y-1.5 min-w-0 pr-2 flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors truncate">
                            #{g.groupName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            {g.createdAtFormatted || 'Active'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                          <Users size={14} className="text-slate-500 shrink-0" />
                          <span className="truncate">
                            {g.members && g.members.length > 0 
                              ? g.members.join(', ') 
                              : 'Members active'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons: Key & Delete Group */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (!name.trim()) {
                              setError('Please enter Your Display Name in the form above first!');
                              setShowOldChatsDrawer(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              return;
                            }
                            setSelectedOldGroup(g);
                            setOldGroupPasscode('');
                            setOldGroupError('');
                          }}
                          className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                          title="Rejoin Group"
                        >
                          <KeyRound size={18} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToDelete(g);
                          }}
                          className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                          title="Delete Old Group Chat"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowOldChatsDrawer(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <h3 className="font-bold text-white text-lg">Delete Old Group Chat?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="text-indigo-400 font-bold">#{groupToDelete.groupName}</span> from your old chats history list?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setGroupToDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOldGroup(groupToDelete.groupName)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passcode Modal for Old Group */}
      {selectedOldGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="text-indigo-400" size={20} />
                <h3 className="font-bold text-white">Enter Your Secret Code</h3>
              </div>
              <button 
                onClick={() => setSelectedOldGroup(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Rejoining <span className="text-indigo-400 font-bold">#{selectedOldGroup.groupName}</span> as <span className="text-indigo-300 font-semibold">{name}</span>. Enter <span className="text-indigo-300 font-semibold">your secret passcode</span>.
            </p>

            {oldGroupError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{oldGroupError}</span>
              </div>
            )}

            <form onSubmit={handleOldGroupUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Your Personal Passcode</label>
                <input
                  type="password"
                  value={oldGroupPasscode}
                  onChange={(e) => { setOldGroupPasscode(e.target.value); setOldGroupError(''); }}
                  placeholder="e.g. 1122 or secret123"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOldGroup(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
                >
                  Unlock & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Chat Room Component with Delete for Me & Delete for Everyone ---
function ChatRoom({ user, groupName, displayName, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  
  // State for message deletion menu modal
  const [activeDeleteMsg, setActiveDeleteMsg] = useState(null);
  
  // Local state for "Delete For Me" message IDs
  const [deletedForMeIds, setDeletedForMeIds] = useState([]);

  // Unique member session ID per tab/device
  const myMemberIdRef = useRef(generateId());
  const myMemberId = myMemberIdRef.current;

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const channelRef = useRef(null);

  // Firestore path collections
  const membersColName = `members_${groupName}`;
  const messagesColName = `messages_${groupName}`;

  // Unique text colors for members
  const nameColors = ['text-emerald-400', 'text-amber-400', 'text-sky-400', 'text-pink-400', 'text-purple-400', 'text-orange-400'];
  const getNameColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return nameColors[Math.abs(hash) % nameColors.length];
  };

  // Presence & Real-Time Sync
  useEffect(() => {
    if (!user) return;

    const selfMember = {
      id: myMemberId,
      name: displayName,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    };

    setMembers([selfMember]);

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
        } else if (type === 'DELETE_MSG_EVERYONE') {
          setMessages((prev) => prev.filter(m => m.id !== payload.msgId));
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
          setMembers((prev) => prev.filter((m) => m.id !== payload.memberId));
        } else if (type === 'PING') {
          bc.postMessage({ type: 'HEARTBEAT', payload: { ...selfMember, lastSeen: Date.now() } });
        }
      };

      bc.postMessage({ type: 'MEMBER_JOIN', payload: selfMember });
      bc.postMessage({ type: 'PING' });
    }

    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const updatedSelf = { ...selfMember, lastSeen: now };

      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'HEARTBEAT', payload: updatedSelf });
      }

      const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
      setDoc(memberDocRef, updatedSelf, { merge: true }).catch(() => {});
    }, 4000);

    let unsubscribeMessages;
    let unsubscribeMembers;

    const setupFirestore = async () => {
      try {
        const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
        await setDoc(memberDocRef, selfMember);

        // Listen for Members
        const membersRef = collection(db, 'artifacts', appId, 'public', 'data', membersColName);
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

        // Listen for Permanent Messages
        const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', messagesColName);
        unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
          setMessages((prevMsgs) => {
            const msgMap = new Map();
            prevMsgs.forEach((m) => msgMap.set(m.id, m));
            snapshot.forEach((d) => {
              const data = d.data();
              msgMap.set(data.id, data);
            });
            const sorted = Array.from(msgMap.values());
            return sorted.sort((a, b) => a.timestamp - b.timestamp);
          });
        }, (err) => console.warn("Firestore messages listener notice:", err));
      } catch (err) {
        console.warn("Firestore setup notice:", err);
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
        channelRef.current.postMessage({ type: 'MEMBER_LEAVE', payload: { memberId: myMemberId } });
        channelRef.current.close();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, groupName, displayName, myMemberId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, deletedForMeIds]);

  // Handle Delete Message for Me
  const handleDeleteForMe = (msgId) => {
    setDeletedForMeIds(prev => [...prev, msgId]);
    setActiveDeleteMsg(null);
  };

  // Handle Delete Message for Everyone
  const handleDeleteForEveryone = async (msgId) => {
    // 1. Delete locally from state
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setActiveDeleteMsg(null);

    // 2. Broadcast via channel
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'DELETE_MSG_EVERYONE', payload: { msgId } });
    }

    // 3. Delete from Firestore permanently
    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', messagesColName, msgId);
      await deleteDoc(msgRef);
    } catch (err) {
      console.warn("Error deleting message from firestore:", err);
    }
  };

  // Leave Room
  const handleLeaveRoom = async () => {
    if (!user) return;

    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'MEMBER_LEAVE', payload: { memberId: myMemberId } });
    }

    try {
      const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', membersColName, myMemberId);
      await deleteDoc(memberDocRef);
    } catch (err) {
      console.warn("Leave notice:", err);
    }
  };

  const triggerLeave = async () => {
    await handleLeaveRoom();
    onLeave();
  };

  // Send Message
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

    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      const updated = [...prev, newMsg];
      return updated.sort((a, b) => a.timestamp - b.timestamp);
    });
    setInputText('');

    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'NEW_MSG', payload: newMsg });
    }

    try {
      const msgRef = doc(db, 'artifacts', appId, 'public', 'data', messagesColName, msgId);
      await setDoc(msgRef, newMsg);
    } catch (err) {
      console.warn("Firestore message sync notice:", err);
    }
  };

  // Voice Recording Logic
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

  const isMemberOnline = (member) => {
    if (!member.lastSeen) return true;
    return (Date.now() - member.lastSeen) < 12000;
  };

  const onlineCount = members.filter(isMemberOnline).length;
  const visibleMessages = messages.filter(m => !deletedForMeIds.includes(m.id));

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
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white leading-tight">#{groupName}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                by Anish
              </span>
            </div>
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
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-500/20 cursor-pointer"
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
            {visibleMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                <MessageSquare size={48} className="opacity-20" />
                <p className="text-sm text-center">No messages yet. Send the first message!</p>
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isMe = msg.senderId === myMemberId;
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                    <span className={`text-xs font-semibold mb-1 px-1 flex items-center gap-1 ${isMe ? 'text-indigo-400' : getNameColor(msg.senderName)}`}>
                      {msg.senderName} {isMe && <span className="text-[10px] text-slate-500 font-normal">(You)</span>}
                    </span>

                    <div className="relative flex items-center gap-2 group">
                      {/* Delete button option */}
                      {isMe && (
                        <button
                          onClick={() => setActiveDeleteMsg(msg)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-500 hover:text-red-400 bg-slate-900/80 rounded-lg border border-slate-800 cursor-pointer"
                          title="Delete options"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

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

                      {!isMe && (
                        <button
                          onClick={() => setActiveDeleteMsg(msg)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-500 hover:text-red-400 bg-slate-900/80 rounded-lg border border-slate-800 cursor-pointer"
                          title="Delete for me"
                        >
                          <Trash2 size={14} />
                        </button>
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
                  placeholder={isRecording ? "Recording voice message..." : "Type a message..."}
                  disabled={isRecording}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all placeholder:text-slate-500 shadow-inner"
                />
              </div>

              {inputText.trim() ? (
                <button
                  type="submit"
                  className="h-[52px] w-[52px] shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer"
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
                  className={`h-[52px] w-[52px] shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
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
              Protected Messaging • Developed by <span className="text-slate-400 font-medium">Anish</span>.
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
                const isMe = member.id === myMemberId;
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
                        {member.name} {isMe && <span className="text-xs text-indigo-400 ml-1">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {online ? <span className="text-green-400 font-medium">Online</span> : <span>Offline</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Delete Message Options Modal */}
        {activeDeleteMsg && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>

              <h3 className="font-bold text-white text-lg">Delete Message</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose how you want to delete this message.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleDeleteForMe(activeDeleteMsg.id)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <EyeOff size={16} /> Delete for Me
                </button>

                {activeDeleteMsg.senderId === myMemberId && (
                  <button
                    onClick={() => handleDeleteForEveryone(activeDeleteMsg.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete for Everyone
                  </button>
                )}

                <button
                  onClick={() => setActiveDeleteMsg(null)}
                  className="w-full bg-transparent hover:bg-slate-800 text-slate-400 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
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