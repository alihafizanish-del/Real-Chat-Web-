import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Square, Users, LogOut, MessageSquare, AlertCircle, Volume2, X, RefreshCw, Code2, Heart, Lock, ShieldCheck, History, ArrowRight, KeyRound, MoreVertical, Trash2, EyeOff, Menu, PlusCircle, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_GROUPS_KEY = 'whisper_room_all_groups_v3';
const LOCAL_STORAGE_HISTORY_KEY = 'whisper_room_my_history_v3';

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
};

export default function App() {
  const [currentGroup, setCurrentGroup] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [memberId, setMemberId] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {!currentGroup ? (
        <HomeScreen 
          onJoin={(group, name, mId) => {
            setDisplayName(name);
            setCurrentGroup(group);
            setMemberId(mId);
          }} 
        />
      ) : (
        <ChatRoom 
          groupName={currentGroup} 
          displayName={displayName} 
          memberId={memberId}
          onLeave={() => setCurrentGroup(null)} 
        />
      )}
    </div>
  );
}

// ==========================================
// HOME SCREEN (Modern Form & Old Chats)
// ==========================================
function HomeScreen({ onJoin }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'old'
  
  const [oldGroups, setOldGroups] = useState([]);
  const [selectedOldGroup, setSelectedOldGroup] = useState(null);
  const [rejoinPasscode, setRejoinPasscode] = useState('');
  const [rejoinError, setRejoinError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (saved) setOldGroups(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const saveToHistory = (groupName, pass) => {
    try {
      let list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY) || '[]');
      if (!list.some(g => g.groupName === groupName)) {
        list.unshift({ groupName, passcode: pass, createdAt: Date.now() });
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(list));
        setOldGroups(list);
      }
    } catch (e) {}
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !group.trim() || !passcode.trim()) {
      return setError('Please fill in all fields completely.');
    }

    const normGroup = group.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const mId = generateId();

    // Save or update global groups database
    try {
      let allGroups = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY) || '{}');
      if (!allGroups[normGroup]) {
        allGroups[normGroup] = {
          password: passcode.trim(),
          members: [],
          messages: []
        };
      } else if (allGroups[normGroup].password !== passcode.trim()) {
        return setError('Incorrect passcode for this existing group!');
      }
      localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(allGroups));
    } catch (e) {}

    saveToHistory(normGroup, passcode.trim());
    onJoin(normGroup, name.trim(), mId);
  };

  const handleOldGroupUnlock = (e) => {
    e.preventDefault();
    if (!name.trim()) return setRejoinError('Please enter your name in the form above first!');
    if (!rejoinPasscode.trim()) return setRejoinError('Please enter the secret passcode.');

    try {
      let allGroups = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY) || '{}');
      const targetGroup = allGroups[selectedOldGroup.groupName];

      if (targetGroup && targetGroup.password === rejoinPasscode.trim()) {
        saveToHistory(selectedOldGroup.groupName, rejoinPasscode.trim());
        setSelectedOldGroup(null);
        onJoin(selectedOldGroup.groupName, name.trim(), generateId());
      } else {
        setRejoinError('Incorrect passcode!');
      }
    } catch (e) {
      setRejoinError('Verification error.');
    }
  };

  const deleteFromHistory = (groupName, e) => {
    e.stopPropagation();
    try {
      let list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY) || '[]');
      list = list.filter(g => g.groupName !== groupName);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(list));
      setOldGroups(list);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header Branding */}
        <div className="p-6 text-center bg-gradient-to-b from-indigo-600/20 to-transparent border-b border-slate-800/80">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-3 shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Whisper Room</h1>
          <p className="text-slate-400 text-xs mt-1">Secure & Real-time Encrypted Group Chats</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 mx-6 mt-6 rounded-2xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'create' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle size={15} /> Join / Create Group
          </button>
          <button
            onClick={() => setActiveTab('old')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'old' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History size={15} /> Old Chats ({oldGroups.length})
          </button>
        </div>

        {/* Tab 1: Create / Join Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                <AlertCircle size={16} shrink="0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Ali"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
              <input
                type="text"
                value={group}
                onChange={(e) => { setGroup(e.target.value); setError(''); }}
                placeholder="e.g. a1 or study_group"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Secret Passcode</label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-indigo-500"
                  maxLength={20}
                />
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
            >
              <ArrowRight size={18} /> Enter Room
            </button>
          </form>
        )}

        {/* Tab 2: Old Chats List */}
        {activeTab === 'old' && (
          <div className="p-6 space-y-3 max-h-[350px] overflow-y-auto">
            {oldGroups.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <History size={36} className="mx-auto opacity-30" />
                <p className="text-xs">No saved group history found.</p>
              </div>
            ) : (
              oldGroups.map((g) => (
                <div key={g.groupName} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between shadow-sm hover:border-indigo-500/50 transition-all">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-white text-sm">#{g.groupName}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tap key to rejoin</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (!name.trim()) return alert('Please enter your Name in the form tab first!');
                        setSelectedOldGroup(g);
                        setRejoinPasscode(g.passcode || '');
                        setRejoinError('');
                      }}
                      className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Rejoin with Key"
                    >
                      <KeyRound size={17} />
                    </button>
                    <button
                      onClick={(e) => deleteFromHistory(g.groupName, e)}
                      className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Rejoin Popup Modal */}
      {selectedOldGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Rejoin #{selectedOldGroup.groupName}</h3>
            <p className="text-xs text-slate-400">Verify your passcode to restore chat history.</p>
            {rejoinError && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{rejoinError}</p>}
            
            <form onSubmit={handleOldGroupUnlock} className="space-y-3">
              <input
                type="password"
                value={rejoinPasscode}
                onChange={(e) => { setRejoinPasscode(e.target.value); setRejoinError(''); }}
                placeholder="Secret Passcode..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm"
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSelectedOldGroup(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer">Verify & Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CHAT ROOM (Real-time Sync, Members & Voice)
// ==========================================
function ChatRoom({ groupName, displayName, memberId, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMembersMobile, setShowMembersMobile] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const nameColors = ['text-emerald-400', 'text-amber-400', 'text-sky-400', 'text-pink-400', 'text-purple-400', 'text-orange-400'];
  const getNameColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return nameColors[Math.abs(hash) % nameColors.length];
  };

  // Sync with LocalStorage Database in Real-time
  useEffect(() => {
    const loadGroupData = () => {
      try {
        let allGroups = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY) || '{}');
        let group = allGroups[groupName];
        if (group) {
          // Register / Update self in members list
          if (!group.members) group.members = [];
          let selfMember = group.members.find(m => m.id === memberId);
          if (!selfMember) {
            group.members.push({ id: memberId, name: displayName, lastSeen: Date.now() });
          } else {
            selfMember.lastSeen = Date.now();
          }

          // Filter out inactive members older than 15 seconds
          const now = Date.now();
          group.members = group.members.filter(m => m.id === memberId || (now - m.lastSeen) < 15000);

          allGroups[groupName] = group;
          localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(allGroups));

          setMessages(group.messages || []);
          setMembers(group.members || []);
        }
      } catch (e) {}
    };

    loadGroupData();
    const interval = setInterval(loadGroupData, 1500);

    return () => clearInterval(interval);
  }, [groupName, displayName, memberId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLeaveGroup = () => {
    try {
      let allGroups = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY) || '{}');
      if (allGroups[groupName] && allGroups[groupName].members) {
        allGroups[groupName].members = allGroups[groupName].members.filter(m => m.id !== memberId);
        localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(allGroups));
      }
    } catch (e) {}
    onLeave();
  };

  const sendMessage = (text = null, audioBase64 = null) => {
    if (!text && !audioBase64) return;

    const newMsg = {
      id: generateId(),
      senderId: memberId,
      senderName: displayName,
      text: text || '',
      audioData: audioBase64 || '',
      timestamp: Date.now()
    };

    try {
      let allGroups = JSON.parse(localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY) || '{}');
      if (allGroups[groupName]) {
        if (!allGroups[groupName].messages) allGroups[groupName].messages = [];
        allGroups[groupName].messages.push(newMsg);
        localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(allGroups));
        setMessages([...allGroups[groupName].messages]);
      }
    } catch (e) {}

    setInputText('');
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
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
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const onlineCount = members.length;

  return (
    <div className="flex h-screen bg-slate-950 relative overflow-hidden">
      
      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b1329] h-full">
        
        {/* HEADER */}
        <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base leading-tight">#{groupName}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">Secure Room</span>
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {onlineCount} Active Member{onlineCount !== 1 ? 's' : ''} Online
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMembersMobile(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={handleLeaveGroup}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold border border-red-500/20 cursor-pointer transition-colors"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Leave Group</span>
            </button>
          </div>
        </header>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
              <MessageSquare size={48} className="opacity-20" />
              <p className="text-xs font-medium">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === memberId;
              
              return (
                <div key={msg.id} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[11px] font-semibold mb-1 px-1 ${isMe ? 'text-indigo-400' : getNameColor(msg.senderName)}`}>
                    {msg.senderName} {isMe && '(You)'}
                  </span>

                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/80'}`}>
                    {msg.text && <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
                    {msg.audioData && (
                      <div className="flex items-center gap-2 py-1">
                        <Volume2 size={18} className={isMe ? 'text-indigo-200' : 'text-slate-400'} />
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
              placeholder={isRecording ? "Recording voice message... Click stop when done." : "Type your message here..."}
              disabled={isRecording}
              className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            />

            {inputText.trim() ? (
              <button type="submit" className="h-[46px] w-[46px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/25 shrink-0 transition-colors">
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleRecording}
                className={`h-[46px] w-[46px] rounded-2xl flex items-center justify-center cursor-pointer transition-all shrink-0 select-none ${
                  isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title={isRecording ? "Click to stop recording" : "Click to record voice message"}
              >
                {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* MEMBERS SIDEBAR (Desktop) */}
      <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col hidden md:flex shrink-0 h-full">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-slate-200">
          <Users size={16} className="text-indigo-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider">Group Members ({members.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {members.map(member => {
            const isMe = member.id === memberId;
            return (
              <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition-colors">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-800/50">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Online"></span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{member.name} {isMe && <span className="text-[10px] text-indigo-400">(You)</span>}</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Online</p>
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
          <div className="relative w-64 bg-slate-900 h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-slate-200">
              <h3 className="font-bold text-xs flex items-center gap-2 uppercase"><Users size={16}/> Members ({members.length})</h3>
              <button onClick={() => setShowMembersMobile5(false) || setShowMembersMobile(false)} className="p-1.5 bg-slate-800 rounded-lg text-slate-400"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {members.map(member => {
                const isMe = member.id === memberId;
                return (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/50">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-300 font-bold flex items-center justify-center text-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{member.name} {isMe && <span className="text-[10px] text-indigo-400">(You)</span>}</p>
                      <p className="text-[10px] text-emerald-400">Online</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}