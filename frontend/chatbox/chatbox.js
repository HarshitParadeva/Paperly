class ChatboxManager {
    constructor() {
        this.currentChat = null;
        this.currentTab = 'direct';
        this.chats = this.loadChats();
        this.users = this.loadUsers();
        this.messages = this.loadMessages();
        this.init();
    }

    init() {
        this.renderChatList();
        this.initEventListeners();
        this.checkUrlParams();
    }

    initEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.chat-tab');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Search functionality
        document.getElementById('chatSearch').addEventListener('input', (e) => {
            this.searchChats(e.target.value);
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // User search in new chat modal
        document.getElementById('userSearch').addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const groupId = urlParams.get('group');
        
        if (groupId) {
            // Open group chat
            this.openGroupChat(parseInt(groupId));
        }
    }

    loadChats() {
        const savedChats = localStorage.getItem('paperly_chats');
        if (savedChats) {
            return JSON.parse(savedChats);
        }
        
        return [
            {
                id: 1,
                name: 'Alice Johnson',
                avatar: 'AJ',
                type: 'direct',
                lastMessage: 'Hey! Did you finish the physics homework?',
                lastMessageTime: '2 min ago',
                unreadCount: 2,
                isOnline: true
            },
            {
                id: 2,
                name: 'Bob Smith',
                avatar: 'BS',
                type: 'direct',
                lastMessage: 'Thanks for sharing those notes!',
                lastMessageTime: '1 hour ago',
                unreadCount: 0,
                isOnline: false
            },
            {
                id: 101,
                name: 'Advanced Physics',
                avatar: 'AP',
                type: 'group',
                lastMessage: 'Prof. Johnson: Assignment due tomorrow',
                lastMessageTime: '30 min ago',
                unreadCount: 5,
                members: 24
            },
            {
                id: 102,
                name: 'Calculus Study Group',
                avatar: 'CS',
                type: 'group',
                lastMessage: 'Anyone need help with integration?',
                lastMessageTime: '2 hours ago',
                unreadCount: 1,
                members: 18
            }
        ];
    }

    loadUsers() {
        return [
            { id: 3, name: 'Carol Davis', avatar: 'CD', status: 'online' },
            { id: 4, name: 'David Wilson', avatar: 'DW', status: 'offline' },
            { id: 5, name: 'Eva Brown', avatar: 'EB', status: 'online' },
            { id: 6, name: 'Frank Miller', avatar: 'FM', status: 'away' },
            { id: 7, name: 'Grace Lee', avatar: 'GL', status: 'online' }
        ];
    }

    loadMessages() {
        return {
            1: [
                { id: 1, sender: 'Alice Johnson', senderAvatar: 'AJ', text: 'Hey! How are you doing?', time: '2:30 PM', isOwn: false },
                { id: 2, sender: 'You', senderAvatar: 'YO', text: 'Hi Alice! I\'m good, thanks! How about you?', time: '2:31 PM', isOwn: true },
                { id: 3, sender: 'Alice Johnson', senderAvatar: 'AJ', text: 'I\'m doing well! Did you finish the physics homework?', time: '2:32 PM', isOwn: false },
                { id: 4, sender: 'You', senderAvatar: 'YO', text: 'Almost done! Just working on the last problem.', time: '2:35 PM', isOwn: true }
            ],
            2: [
                { id: 5, sender: 'Bob Smith', senderAvatar: 'BS', text: 'Thanks for sharing those notes!', time: '1:00 PM', isOwn: false },
                { id: 6, sender: 'You', senderAvatar: 'YO', text: 'No problem! Happy to help.', time: '1:15 PM', isOwn: true }
            ],
            101: [
                { id: 7, sender: 'Prof. Johnson', senderAvatar: 'PJ', text: 'Don\'t forget the assignment is due tomorrow!', time: '11:30 AM', isOwn: false },
                { id: 8, sender: 'Alice Johnson', senderAvatar: 'AJ', text: 'Thanks for the reminder, professor!', time: '11:35 AM', isOwn: false },
                { id: 9, sender: 'You', senderAvatar: 'YO', text: 'I\'ll submit it by tonight.', time: '11:40 AM', isOwn: true }
            ]
        };
    }

    saveChats() {
        localStorage.setItem('paperly_chats', JSON.stringify(this.chats));
    }

    saveMessages() {
        localStorage.setItem('paperly_messages', JSON.stringify(this.messages));
    }

    switchTab(tabName) {
        document.querySelectorAll('.chat-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;
        this.renderChatList();
    }

    renderChatList() {
        const chatList = document.getElementById('chatList');
        const filteredChats = this.chats.filter(chat => chat.type === this.currentTab);
        
        if (filteredChats.length === 0) {
            chatList.innerHTML = `
                <div class="empty-chat-list">
                    <div class="empty-icon">${this.currentTab === 'direct' ? '💬' : '👥'}</div>
                    <div class="empty-text">No ${this.currentTab === 'direct' ? 'direct messages' : 'group chats'} yet</div>
                </div>
            `;
            return;
        }

        chatList.innerHTML = filteredChats.map(chat => this.createChatItem(chat)).join('');
        this.addChatEventListeners();
    }

    createChatItem(chat) {
        const unreadBadge = chat.unreadCount > 0 ? `<span class="chat-unread">${chat.unreadCount}</span>` : '';
        const statusInfo = chat.type === 'group' ? `${chat.members} members` : 
                          chat.isOnline ? 'Online' : 'Offline';
        
        return `
            <div class="chat-item ${this.currentChat?.id === chat.id ? 'active' : ''}" data-chat-id="${chat.id}">
                <div class="chat-avatar">${chat.avatar}</div>
                <div class="chat-info">
                    <div class="chat-name">${chat.name}</div>
                    <div class="chat-last-message">${chat.lastMessage}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${chat.lastMessageTime}</div>
                    ${unreadBadge}
                </div>
            </div>
        `;
    }

    addChatEventListeners() {
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const chatId = parseInt(e.currentTarget.dataset.chatId);
                this.openChat(chatId);
            });
        });
    }

    openChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            this.currentChat = chat;
            
            // Mark as read
            chat.unreadCount = 0;
            this.saveChats();
            
            // Update UI
            this.renderChatList();
            this.renderChatArea();
            this.showChatInputArea();
        }
    }

    openGroupChat(groupId) {
        // Find or create group chat
        let groupChat = this.chats.find(c => c.id === groupId && c.type === 'group');
        
        if (!groupChat) {
            // Create new group chat
            groupChat = {
                id: groupId,
                name: `Group ${groupId}`,
                avatar: 'GR',
                type: 'group',
                lastMessage: 'Welcome to the group!',
                lastMessageTime: 'now',
                unreadCount: 0,
                members: 1
            };
            this.chats.unshift(groupChat);
            this.saveChats();
        }
        
        // Switch to groups tab and open chat
        this.switchTab('groups');
        this.openChat(groupId);
    }

    renderChatArea() {
        const chatArea = document.getElementById('chatArea');
        const chat = this.currentChat;
        
        if (!chat) {
            chatArea.innerHTML = `
                <div class="chat-welcome">
                    <div class="welcome-icon">💬</div>
                    <h3 class="welcome-title">Welcome to Paperly Chat</h3>
                    <p class="welcome-subtitle">Select a conversation to start messaging</p>
                </div>
            `;
            return;
        }

        const statusText = chat.type === 'group' ? 
            `${chat.members} members` : 
            chat.isOnline ? 'Online' : 'Last seen recently';

        chatArea.innerHTML = `
            <div class="chat-header-active">
                <div class="chat-header-avatar">${chat.avatar}</div>
                <div class="chat-header-info">
                    <div class="chat-header-name">${chat.name}</div>
                    <div class="chat-header-status">${statusText}</div>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages">
                ${this.renderMessages(chat.id)}
            </div>
        `;
        
        this.scrollToBottom();
    }

    renderMessages(chatId) {
        const messages = this.messages[chatId] || [];
        return messages.map(message => this.createMessageElement(message)).join('');
    }

    createMessageElement(message) {
        return `
            <div class="message ${message.isOwn ? 'own' : ''}">
                <div class="message-avatar">${message.senderAvatar}</div>
                <div class="message-content">
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">${message.time}</div>
                </div>
            </div>
        `;
    }

    showChatInputArea() {
        const inputArea = document.getElementById('chatInputArea');
        inputArea.style.display = 'block';
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const messageText = messageInput.value.trim();
        
        if (!messageText || !this.currentChat) return;

        const newMessage = {
            id: Date.now(),
            sender: 'You',
            senderAvatar: 'YO',
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: true
        };

        // Add message to chat
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        this.messages[this.currentChat.id].push(newMessage);
        this.saveMessages();

        // Update chat's last message
        this.currentChat.lastMessage = messageText;
        this.currentChat.lastMessageTime = 'now';
        this.saveChats();

        // Clear input
        messageInput.value = '';

        // Re-render
        this.renderChatArea();
        this.renderChatList();
        
        // Simulate response (in a real app, this would be real-time)
        setTimeout(() => {
            this.simulateResponse();
        }, 1000);
    }

    simulateResponse() {
        if (!this.currentChat) return;
        
        const responses = [
            "That's interesting!",
            "I agree with you.",
            "Thanks for sharing that.",
            "Good point!",
            "I'll think about it.",
            "Sounds good to me."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage = {
            id: Date.now(),
            sender: this.currentChat.name,
            senderAvatar: this.currentChat.avatar,
            text: randomResponse,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: false
        };

        this.messages[this.currentChat.id].push(responseMessage);
        this.saveMessages();

        this.currentChat.lastMessage = randomResponse;
        this.currentChat.lastMessageTime = 'now';
        this.saveChats();

        this.renderChatArea();
        this.renderChatList();
    }

    searchChats(query) {
        const chatItems = document.querySelectorAll('.chat-item');
        
        chatItems.forEach(item => {
            const chatName = item.querySelector('.chat-name').textContent.toLowerCase();
            const lastMessage = item.querySelector('.chat-last-message').textContent.toLowerCase();
            
            if (chatName.includes(query.toLowerCase()) || lastMessage.includes(query.toLowerCase())) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    searchUsers(query) {
        const usersList = document.getElementById('usersList');
        const filteredUsers = this.users.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase())
        );
        
        usersList.innerHTML = filteredUsers.map(user => this.createUserItem(user)).join('');
        this.addUserEventListeners();
    }

    createUserItem(user) {
        const statusColor = {
            online: '#4CAF50',
            offline: '#999',
            away: '#FF9800'
        };
        
        return `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-avatar">${user.avatar}</div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-status" style="color: ${statusColor[user.status]}">${user.status}</div>
                </div>
            </div>
        `;
    }

    addUserEventListeners() {
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId);
                this.startNewChat(userId);
            });
        });
    }

    startNewChat(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            // Check if chat already exists
            let existingChat = this.chats.find(c => c.name === user.name && c.type === 'direct');
            
            if (!existingChat) {
                // Create new chat
                existingChat = {
                    id: Date.now(),
                    name: user.name,
                    avatar: user.avatar,
                    type: 'direct',
                    lastMessage: 'Start a conversation...',
                    lastMessageTime: 'now',
                    unreadCount: 0,
                    isOnline: user.status === 'online'
                };
                this.chats.unshift(existingChat);
                this.saveChats();
            }
            
            // Switch to direct tab and open chat
            this.switchTab('direct');
            this.openChat(existingChat.id);
            this.closeNewChatModal();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    openNewChatModal() {
        const modal = document.getElementById('newChatModal');
        modal.classList.add('active');
        this.renderUsersList();
        document.getElementById('userSearch').focus();
    }

    closeNewChatModal() {
        const modal = document.getElementById('newChatModal');
        modal.classList.remove('active');
        document.getElementById('userSearch').value = '';
    }

    renderUsersList() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = this.users.map(user => this.createUserItem(user)).join('');
        this.addUserEventListeners();
    }

    attachFile() {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,application/pdf,.doc,.docx';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileAttachment(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    handleFileAttachment(file) {
        const fileMessage = `📎 ${file.name}`;
        const messageInput = document.getElementById('messageInput');
        messageInput.value = fileMessage;
        
        // Auto-send file message
        this.sendMessage();
    }
}

// Global functions for HTML onclick handlers
function openNewChatModal() {
    chatboxManager.openNewChatModal();
}

function closeNewChatModal() {
    chatboxManager.closeNewChatModal();
}

function sendMessage() {
    chatboxManager.sendMessage();
}

function attachFile() {
    chatboxManager.attachFile();
}

// Initialize chatbox manager
let chatboxManager;
document.addEventListener('DOMContentLoaded', () => {
    chatboxManager = new ChatboxManager();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeNewChatModal();
    }
});

// Add CSS for empty state
const style = document.createElement('style');
style.textContent = `
    .empty-chat-list {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .empty-icon {
        font-size: 3rem;
        margin-bottom: 15px;
        opacity: 0.5;
    }
    
    .empty-text {
        font-size: 1rem;
        color: #999;
    }
`;
document.head.appendChild(style);