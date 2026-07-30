<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat and Group Management System</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome for Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
        }
        .hidden-section {
            display: none;
        }
    </style>
</head>
<body class="bg-gray-100 h-screen flex flex-col">

    <!-- Main Container -->
    <div id="app" class="flex flex-col h-full max-w-4xl mx-auto w-full bg-white shadow-xl overflow-hidden">
        
        <!-- Header -->
        <header class="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md">
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-comments text-2xl"></i>
                <h1 class="text-xl font-bold">Live Chat & Group System</h1>
            </div>
            <div id="user-info" class="text-sm bg-indigo-700 px-3 py-1 rounded-full">
                <i class="fa-solid fa-user ml-1"></i> <span id="current-username">Guest User</span>
            </div>
        </header>

        <!-- Main Dashboard (Home / Old Chats List) -->
        <main id="main-dashboard" class="flex-1 p-6 overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Available Groups & Old Chats</h2>
                <div class="flex gap-2">
                    <button onclick="showCreateGroupModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Create New Group
                    </button>
                    <button onclick="loadOldChats()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left"></i> Old Chats
                    </button>
                </div>
            </div>

            <!-- Groups Container -->
            <div id="groups-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Group cards will be rendered here -->
            </div>
        </main>

        <!-- Chat Room Section -->
        <section id="chat-room" class="flex-1 flex flex-col hidden-section bg-gray-50">
            <!-- Chat Header -->
            <div class="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm">
                <div>
                    <h3 id="active-group-title" class="font-bold text-lg text-gray-800">Group Name</h3>
                    <p class="text-xs text-gray-500">
                        Total Members: <span id="total-members-count">0</span> | 
                        Online/Active: <span id="active-members-count" class="text-green-600 font-bold">0</span>
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="leaveGroup()" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                        <i class="fa-solid fa-right-from-bracket mr-1"></i> Leave Group
                    </button>
                </div>
            </div>

            <!-- Messages Area -->
            <div id="messages-container" class="flex-1 p-4 overflow-y-auto space-y-3">
                <!-- Messages will show here -->
            </div>

            <!-- Message Input Box -->
            <div class="bg-white border-t p-3 flex items-center gap-2">
                <input type="text" id="message-input" placeholder="Type your message here..." class="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <button onclick="sendMessage()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </section>

    </div>

    <!-- Popup Modal: Old Details / Key Verification -->
    <div id="old-details-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden-section z-50">
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl mx-4">
            <h3 class="text-xl font-bold text-gray-800 mb-2">Enter Old Details (Key Verification)</h3>
            <p class="text-xs text-gray-500 mb-4">Enter your previous credentials to regain access to your old group.</p>
            
            <form id="verification-form" onsubmit="verifyAndJoinGroup(event)" class="space-y-4">
                <input type="hidden" id="modal-group-id">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Your Old Username</label>
                    <input type="text" id="modal-username" required class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter your previous name">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Group Name</label>
                    <input type="text" id="modal-groupname" required class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Group name">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Password (Key)</label>
                    <input type="password" id="modal-password" required class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Group password">
                </div>
                <div id="modal-error-msg" class="text-red-500 text-xs hidden"></div>
                
                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" onclick="closeModal('old-details-modal')" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">Cancel</button>
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Join Group</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Group Modal -->
    <div id="create-group-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden-section z-50">
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl mx-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Create New Group</h3>
            <form onsubmit="createNewGroup(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Your Name</label>
                    <input type="text" id="new-admin-name" required class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter your name">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Group Title</label>
                    <input type="text" id="new-group-title" required class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter group name">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Group Password (Key)</label>
                    <input type="password" id="new-group-password" required class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Set a password">
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button type="button" onclick="closeModal('create-group-modal')" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">Cancel</button>
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Create Group</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Custom Alert Modal -->
    <div id="custom-alert-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden-section z-50">
        <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl text-center mx-4">
            <div id="alert-icon" class="text-4xl text-indigo-600 mb-3"><i class="fa-solid fa-circle-info"></i></div>
            <h4 id="alert-title" class="text-lg font-bold text-gray-800 mb-1">Notice</h4>
            <p id="alert-message" class="text-sm text-gray-600 mb-5">Message goes here</p>
            <button onclick="closeModal('custom-alert-modal')" class="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-lg text-sm font-medium transition">OK</button>
        </div>
    </div>

    <!-- JavaScript Logic -->
    <script>
        let groups = JSON.parse(localStorage.getItem('chat_groups')) || [
            {
                id: 'g1',
                title: 'Friends Chat Club',
                admin: 'Ali Khan',
                password: '123',
                totalMembers: 12,
                activeMembers: 5,
                messages: [
                    { sender: 'Ali Khan', text: 'Hello friends! How are you?', time: '10:00 AM' },
                    { sender: 'Ahmad', text: 'Walaikum Assalam! Everything is fine.', time: '10:02 AM' }
                ]
            },
            {
                id: 'g2',
                title: 'Discussion Group',
                admin: 'Sara Ahmad',
                password: '456',
                totalMembers: 8,
                activeMembers: 3,
                messages: [
                    { sender: 'Sara Ahmad', text: 'What is today\'s topic?', time: '09:30 AM' }
                ]
            }
        ];

        let currentActiveGroup = null;
        let currentUser = null;

        window.onload = function() {
            renderGroupsList();
        };

        function showAlert(title, message, isError = false) {
            document.getElementById('alert-title').innerText = title;
            document.getElementById('alert-message').innerText = message;
            const icon = document.getElementById('alert-icon');
            if(isError) {
                icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-red-500"></i>';
            } else {
                icon.innerHTML = '<i class="fa-solid fa-circle-check text-green-500"></i>';
            }
            document.getElementById('custom-alert-modal').classList.remove('hidden-section');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden-section');
        }

        function renderGroupsList() {
            const container = document.getElementById('groups-container');
            container.innerHTML = '';

            if (groups.length === 0) {
                container.innerHTML = `<div class="col-span-2 text-center py-10 text-gray-500">No old groups or chats available.</div>`;
                return;
            }

            groups.forEach(group => {
                const card = document.createElement('div');
                card.className = 'bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between';
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-lg text-gray-800">${group.title}</h3>
                            <span class="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">Admin: ${group.admin}</span>
                        </div>
                        <p class="text-xs text-gray-500 mb-4">Members: Total (${group.totalMembers}) | Active (${group.activeMembers})</p>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t">
                        <button onclick="openKeyModal('${group.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1">
                            <i class="fa-solid fa-key"></i> Join via Key
                        </button>
                        <button onclick="deleteGroup('${group.id}')" class="text-red-500 hover:text-red-700 p-1.5 rounded-lg text-xs font-medium transition" title="Delete Group">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function loadOldChats() {
            renderGroupsList();
            showAlert('Old Chats', 'All previous groups have been loaded. Click on any group key to restore chats.');
        }

        function openKeyModal(groupId) {
            const group = groups.find(g => g.id === groupId);
            if (!group) return;

            document.getElementById('modal-group-id').value = group.id;
            document.getElementById('modal-groupname').value = group.title;
            document.getElementById('modal-username').value = '';
            document.getElementById('modal-password').value = '';
            document.getElementById('modal-error-msg').classList.add('hidden-section');
            document.getElementById('old-details-modal').classList.remove('hidden-section');
        }

        function verifyAndJoinGroup(event) {
            event.preventDefault();
            const groupId = document.getElementById('modal-group-id').value;
            const username = document.getElementById('modal-username').value.trim();
            const groupname = document.getElementById('modal-groupname').value.trim();
            const password = document.getElementById('modal-password').value.trim();

            const group = groups.find(g => g.id === groupId);
            const errorDiv = document.getElementById('modal-error-msg');

            if (!group) {
                errorDiv.innerText = 'Group not found!';
                errorDiv.classList.remove('hidden-section');
                return;
            }

            if (group.password === password && group.title === groupname) {
                closeModal('old-details-modal');
                currentUser = username;
                document.getElementById('current-username').innerText = currentUser;
                openChatRoom(group);
            } else {
                errorDiv.innerText = 'Incorrect password or group name!';
                errorDiv.classList.remove('hidden-section');
            }
        }

        function openChatRoom(group) {
            currentActiveGroup = group;
            document.getElementById('main-dashboard').classList.add('hidden-section');
            document.getElementById('chat-room').classList.remove('hidden-section');
            
            document.getElementById('active-group-title').innerText = group.title;
            document.getElementById('total-members-count').innerText = group.totalMembers;
            document.getElementById('active-members-count').innerText = group.activeMembers;

            renderMessages();
        }

        function renderMessages() {
            const container = document.getElementById('messages-container');
            container.innerHTML = '';

            if (!currentActiveGroup || !currentActiveGroup.messages) return;

            currentActiveGroup.messages.forEach(msg => {
                const isMe = msg.sender === currentUser;
                const msgDiv = document.createElement('div');
                msgDiv.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;
                
                msgDiv.innerHTML = `
                    <div class="max-w-xs md:max-w-md rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}">
                        <div class="text-[10px] opacity-75 mb-0.5 font-bold">${msg.sender}</div>
                        <div>${msg.text}</div>
                        <div class="text-[9px] opacity-70 text-right mt-1">${msg.time}</div>
                    </div>
                `;
                container.appendChild(msgDiv);
            });
            container.scrollTop = container.scrollHeight;
        }

        function sendMessage() {
            const input = document.getElementById('message-input');
            const text = input.value.trim();
            if (!text || !currentActiveGroup) return;

            const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            currentActiveGroup.messages.push({
                sender: currentUser,
                text: text,
                time: timeNow
            });

            input.value = '';
            saveToLocalStorage();
            renderMessages();
        }

        function leaveGroup() {
            currentActiveGroup = null;
            document.getElementById('chat-room').classList.add('hidden-section');
            document.getElementById('main-dashboard').classList.remove('hidden-section');
            renderGroupsList();
        }

        function deleteGroup(groupId) {
            groups = groups.filter(g => g.id !== groupId);
            saveToLocalStorage();
            renderGroupsList();
            showAlert('Deleted', 'Group has been deleted successfully.');
        }

        function showCreateGroupModal() {
            document.getElementById('new-admin-name').value = '';
            document.getElementById('new-group-title').value = '';
            document.getElementById('new-group-password').value = '';
            document.getElementById('create-group-modal').classList.remove('hidden-section');
        }

        window.createNewGroup = function(event) {
            event.preventDefault();
            const admin = document.getElementById('new-admin-name').value.trim();
            const title = document.getElementById('new-group-title').value.trim();
            const password = document.getElementById('new-group-password').value.trim();

            const newGroup = {
                id: 'g_' + Date.now(),
                title: title,
                admin: admin,
                password: password,
                totalMembers: 1,
                activeMembers: 1,
                messages: [
                    { sender: admin, text: 'Group created successfully and previous chats restored.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                ]
            };

            groups.push(newGroup);
            saveToLocalStorage();
            closeModal('create-group-modal');
            renderGroupsList();
            showAlert('Success', 'New group created successfully!');
        }

        function saveToLocalStorage() {
            localStorage.setItem('chat_groups', JSON.stringify(groups));
        }
    </script>

</body>
</html>