class GroupsManager {
    constructor() {
        this.myGroups = this.loadMyGroups();
        this.discoverGroups = this.loadDiscoverGroups();
        this.currentTab = 'my-groups';
        this.init();
    }

    init() {
        this.renderMyGroups();
        this.renderDiscoverGroups();
        this.initEventListeners();
    }

    initEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Search functionality
        document.getElementById('discoverSearch').addEventListener('input', (e) => {
            this.searchGroups(e.target.value);
        });

        // Filter functionality
        document.getElementById('subjectFilter').addEventListener('change', (e) => {
            this.filterGroups(e.target.value);
        });

        // Form submissions
        document.getElementById('createGroupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGroup();
        });

        document.getElementById('joinGroupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinGroup();
        });
    }

    loadMyGroups() {
        const savedGroups = localStorage.getItem('paperly_my_groups');
        if (savedGroups) {
            return JSON.parse(savedGroups);
        }
        
        return [
            {
                id: 1,
                name: 'Advanced Physics',
                subject: 'physics',
                description: 'Discussion group for advanced physics topics and problem solving',
                members: 24,
                notes: 156,
                privacy: 'public',
                role: 'member',
                avatar: 'AP',
                joinDate: '2024-01-15'
            },
            {
                id: 2,
                name: 'Calculus Study Group',
                subject: 'mathematics',
                description: 'Weekly calculus study sessions and homework help',
                members: 18,
                notes: 89,
                privacy: 'private',
                role: 'admin',
                avatar: 'CS',
                joinDate: '2024-01-10'
            }
        ];
    }

    loadDiscoverGroups() {
        return [
            {
                id: 101,
                name: 'Biology Lab Reports',
                subject: 'biology',
                description: 'Share and discuss biology lab reports and experimental procedures',
                members: 45,
                notes: 203,
                privacy: 'public',
                avatar: 'BL'
            },
            {
                id: 102,
                name: 'Chemistry Reactions',
                subject: 'chemistry',
                description: 'Understanding chemical reactions and molecular structures',
                members: 32,
                notes: 127,
                privacy: 'public',
                avatar: 'CR'
            },
            {
                id: 103,
                name: 'Data Structures & Algorithms',
                subject: 'computer-science',
                description: 'Programming challenges and algorithm discussions',
                members: 67,
                notes: 245,
                privacy: 'public',
                avatar: 'DS'
            }
        ];
    }

    saveMyGroups() {
        localStorage.setItem('paperly_my_groups', JSON.stringify(this.myGroups));
    }

    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    renderMyGroups() {
        const grid = document.getElementById('myGroupsGrid');
        
        if (this.myGroups.length === 0) {
            grid.innerHTML = this.createEmptyState('my-groups');
            return;
        }

        grid.innerHTML = this.myGroups.map(group => this.createGroupCard(group, true)).join('');
        this.addGroupEventListeners();
    }

    renderDiscoverGroups() {
        const grid = document.getElementById('discoverGroupsGrid');
        grid.innerHTML = this.discoverGroups.map(group => this.createGroupCard(group, false)).join('');
        this.addGroupEventListeners();
    }

    createGroupCard(group, isMyGroup) {
        const groupId = group._id || group.id;
        const memberCount = Array.isArray(group.members) ? group.members.length : group.members;
        const actionButtons = isMyGroup ? `
            <button class="action-btn primary" onclick="openGroupDetails('${groupId}', true)">
                View Details
            </button>
            <button class="action-btn" onclick="openGroupChat('${groupId}')">
                💬 Chat
            </button>
            <button class="action-btn" onclick="deleteGroup('${groupId}'); event.stopPropagation();">${group.role === 'admin' ? 'Delete' : 'Leave'}</button>
        ` : `
            <button class="action-btn primary" onclick="joinGroupById('${groupId}')">
                Join Group
            </button>
            <button class="action-btn" onclick="openGroupDetails('${groupId}', false)">
                View Details
            </button>
        `;

        return `
            <div class="group-card" data-group-id="${groupId}">
                <div class="group-privacy">${group.privacy}</div>
                <div class="group-header">
                    <div class="group-avatar">${group.avatar}</div>
                    <div class="group-info">
                        <h3 class="group-name">${group.name}</h3>
                        <span class="group-subject">${group.subject}</span>
                    </div>
                </div>

                <p class="group-description">${group.description}</p>

                <div class="group-stats">
                    <div class="stat-item">
                        <span class="stat-icon">👥</span>
                        <span>${memberCount} members</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">📝</span>
                        <span>${group.notes || 0} notes</span>
                    </div>
                </div>

                <div class="group-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }

    createEmptyState(type) {
        const messages = {
            'my-groups': {
                icon: '👥',
                title: 'No groups yet',
                subtitle: 'Join or create a group to start collaborating',
                action: 'Create Group',
                onclick: 'openCreateModal()'
            },
            'discover': {
                icon: '🔍',
                title: 'No groups found',
                subtitle: 'Try adjusting your search or filter criteria',
                action: 'Clear Filters',
                onclick: 'clearFilters()'
            }
        };

        const message = messages[type];
        return `
            <div class="empty-state">
                <div class="empty-icon">${message.icon}</div>
                <div class="empty-title">${message.title}</div>
                <div class="empty-subtitle">${message.subtitle}</div>
                <button class="empty-action" onclick="${message.onclick}">${message.action}</button>
            </div>
        `;
    }

    addGroupEventListeners() {
        const groupCards = document.querySelectorAll('.group-card');
        groupCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.group-actions')) {
                    const groupId = card.dataset.groupId;
                    const isMyGroup = this.myGroups.some(g => (g._id || g.id) === groupId);
                    this.openGroupDetails(groupId, isMyGroup);
                }
            });
        });
    }

    searchGroups(query) {
        if (!query.trim()) {
            this.renderDiscoverGroups();
            return;
        }

        const filteredGroups = this.discoverGroups.filter(group => 
            group.name.toLowerCase().includes(query.toLowerCase()) ||
            group.description.toLowerCase().includes(query.toLowerCase()) ||
            group.subject.toLowerCase().includes(query.toLowerCase())
        );

        const grid = document.getElementById('discoverGroupsGrid');
        if (filteredGroups.length === 0) {
            grid.innerHTML = this.createEmptyState('discover');
        } else {
            grid.innerHTML = filteredGroups.map(group => this.createGroupCard(group, false)).join('');
            this.addGroupEventListeners();
        }
    }

    filterGroups(subject) {
        let filteredGroups = this.discoverGroups;

        if (subject) {
            filteredGroups = filteredGroups.filter(group => group.subject === subject);
        }

        const grid = document.getElementById('discoverGroupsGrid');
        if (filteredGroups.length === 0) {
            grid.innerHTML = this.createEmptyState('discover');
        } else {
            grid.innerHTML = filteredGroups.map(group => this.createGroupCard(group, false)).join('');
            this.addGroupEventListeners();
        }
    }

async createGroup() {
  const name = document.getElementById('groupName').value;
  const description = document.getElementById('groupDescription').value;
  const privacy = document.getElementById('groupPrivacy').value; // "public" | "private"

  if (!name.trim()) {
    alert('Please enter a group name');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    let classroomId = localStorage.getItem('selectedClassroomId');

    // Fallback: try to pick the first classroom the user belongs to
    if (!classroomId) {
      const resp = await fetch('http://localhost:5002/api/classrooms/my', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clsData = await resp.json();

      if (!resp.ok || !clsData.classrooms || !clsData.classrooms.length) {
        alert('Please create or join a classroom first, then create a group.');
        return;
      }

      classroomId = clsData.classrooms[0]._id;
      localStorage.setItem('selectedClassroomId', classroomId);
    }

    const response = await fetch('http://localhost:5002/api/groups/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: name,
        classroomId: classroomId,
        description: description,
        groupType: privacy === 'private' ? 'private' : 'public'
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to create group');

    const newGroup = {
      ...data.group,
      role: 'admin',
      avatar: name.substring(0, 2).toUpperCase(),
      joinDate: new Date().toISOString().split('T')[0],
    };

    this.myGroups.unshift(newGroup);
    this.saveMyGroups();
    this.renderMyGroups();
    this.closeCreateModal();
    this.showMessage('Group created successfully!');
  } catch (err) {
    console.error(err);
    alert(err.message || 'Failed to create group');
  }
}

// async createGroup() {
//     const name = document.getElementById('groupName').value;
//     const description = document.getElementById('groupDescription').value;
//     const subject = document.getElementById('groupSubject').value;
//     const privacy = document.getElementById('groupPrivacy').value;

//     if (!name.trim() || !subject) {
//         alert('Please fill in all required fields');
//         return;
//     }

//     try {
//         const token = localStorage.getItem('token');
//         const classroomId = localStorage.getItem('selectedClassroomId'); // 👈 Required

//         const response = await fetch('http://localhost:5002/api/groups/create', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({
//                 name: name, 
//                 classroomId: classroomId, 
//                 description: description,
//                 groupType: privacy === 'private' ? 'private' : 'public',
                
                
//             })
//         });

//         const data = await response.json();

//         if (!response.ok) throw new Error(data.error || 'Failed to create group');

//         const newGroup = {
//             ...data.group,
//             role: 'admin',
//             avatar: name.substring(0, 2).toUpperCase(),
//             joinDate: new Date().toISOString().split('T')[0]
//         };

//         this.myGroups.unshift(newGroup);
//         this.saveMyGroups();
//         this.renderMyGroups();
//         this.closeCreateModal();
//         this.showMessage('Group created successfully!', 'success');

//     } catch (err) {
//         console.error('Error creating group:', err);
//         this.showMessage('Failed to create group. Please try again.', 'error');
//     }
// }


    async joinGroup() {
        const groupCode = document.getElementById('groupCode').value;

        if (!groupCode.trim()) {
            alert('Please enter a group code');
            return;
        }

        const success = await this.joinGroupById(groupCode.trim());
        if (success) {
            this.closeJoinModal();
        }
    }

    async joinGroupById(groupIdOrCode) {
        try {
            const payload = isNaN(Number(groupIdOrCode))
                ? { joinCode: groupIdOrCode }
                : { groupId: groupIdOrCode };

            const token = localStorage.getItem('token');
            const response = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to join group');
            }

            const group = data.group || data;
            const newGroup = {
                ...group,
                role: 'member',
                joinDate: new Date().toISOString().split('T')[0]
            };

            this.myGroups.unshift(newGroup);
            this.saveMyGroups();
            this.renderMyGroups();

            this.showMessage(`Successfully joined ${group.name}!`, 'success');
            return true;
        } catch (err) {
            console.error('Error joining group:', err);
            this.showMessage(err.message || 'Invalid group code. Please try again.', 'error');
            return false;
        }
    }

    async deleteGroup(groupId) {
        const group = this.myGroups.find(g => (g._id || g.id) === groupId);
        const isAdmin = group?.role === 'admin';
        const confirmMsg = isAdmin ? 'Are you sure you want to delete this group?' : 'Leave this group?';
        if (!confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('token');
            const url = isAdmin ? `/api/groups/${groupId}` : `/api/groups/${groupId}/leave`;
            const method = isAdmin ? 'DELETE' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || (isAdmin ? 'Failed to delete group' : 'Failed to leave group'));

            this.myGroups = this.myGroups.filter(g => (g._id || g.id) !== groupId);
            this.saveMyGroups();
            this.renderMyGroups();
            this.showMessage(isAdmin ? 'Group deleted successfully!' : 'Left group successfully!', 'success');
        } catch (err) {
            console.error('Delete group error:', err);
            this.showMessage(err.message || 'Error processing group', 'error');
        }
    }

    openGroupDetails(groupId, isMyGroup) {
        const group = isMyGroup ?
            this.myGroups.find(g => (g._id || g.id) === groupId) :
            this.discoverGroups.find(g => (g._id || g.id) === groupId);

        if (group) {
            this.showGroupDetails(group, isMyGroup);
        }
    }

    showGroupDetails(group, isMyGroup) {
        const modal = document.getElementById('groupDetailsModal');
        const content = document.getElementById('groupDetailsContent');

        const memberCount = Array.isArray(group.members) ? group.members.length : group.members;
        const gid = group._id || group.id;
        content.innerHTML = `
            <div class="group-details-header">
                <div class="group-details-avatar">${group.avatar}</div>
                <div class="group-details-info">
                    <h3>${group.name}</h3>
                    <p>${group.description}</p>
                    <div class="group-stats">
                        <div class="stat-item">
                            <span class="stat-icon">👥</span>
                            <span>${memberCount} members</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📝</span>
                            <span>${group.notes || 0} notes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">🔒</span>
                            <span>${group.privacy}</span>
                        </div>
                        ${group.joinCode ? `<div class="stat-item"><span class="stat-icon">🔗</span><span>Code: ${group.joinCode}</span></div>` : ''}
                    </div>
                </div>
            </div>

            <div class="group-members">
                <h4>Recent Members</h4>
                ${this.generateMockMembers(memberCount)}
            </div>

            <div class="group-actions">
                ${isMyGroup ? `
                    <button class="action-btn primary" onclick="openGroupChat('${gid}')">
                        💬 Open Chat
                    </button>
                    <button class="action-btn" onclick="shareNoteToGroup('${gid}')">
                        📝 Share Note
                    </button>
                ` : `
                    <button class="action-btn primary" onclick="joinGroupById('${gid}'); closeGroupDetails();">
                        Join Group
                    </button>
                `}
            </div>
        `;
        
        modal.classList.add('active');
    }

    generateMockMembers(totalMembers) {
        const mockNames = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Brown'];
        const roles = ['Admin', 'Member', 'Member', 'Member', 'Moderator'];
        
        return mockNames.slice(0, Math.min(5, totalMembers)).map((name, index) => `
            <div class="member-item">
                <div class="member-avatar">${name.split(' ').map(n => n[0]).join('')}</div>
                <div class="member-info">
                    <div class="member-name">${name}</div>
                    <div class="member-role">${roles[index]}</div>
                </div>
            </div>
        `).join('');
    }

    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                messageEl.remove();
            }, 300);
        }, 3000);
    }

    closeCreateModal() {
        document.getElementById('createGroupModal').classList.remove('active');
        document.getElementById('createGroupForm').reset();
    }

    closeJoinModal() {
        document.getElementById('joinGroupModal').classList.remove('active');
        document.getElementById('joinGroupForm').reset();
    }

    closeGroupDetails() {
        document.getElementById('groupDetailsModal').classList.remove('active');
    }
}

// Global functions for HTML onclick handlers
function openCreateModal() {
    document.getElementById('createGroupModal').classList.add('active');
    document.getElementById('groupName').focus();
}

function openJoinModal() {
    document.getElementById('joinGroupModal').classList.add('active');
    document.getElementById('groupCode').focus();
}

function closeCreateModal() {
    groupsManager.closeCreateModal();
}

function closeJoinModal() {
    groupsManager.closeJoinModal();
}

function closeGroupDetails() {
    groupsManager.closeGroupDetails();
}

function openGroupDetails(groupId, isMyGroup) {
    groupsManager.openGroupDetails(groupId, isMyGroup);
}

function joinGroupById(groupId) {
    groupsManager.joinGroupById(groupId);
}

function deleteGroup(groupId) {
    groupsManager.deleteGroup(groupId);
}

function openGroupChat(groupId) {
    // Redirect to chatbox with group selected
    window.location.href = `../chatbox/chatbox.html?group=${groupId}`;
}

function shareNoteToGroup(groupId) {
    // This would open a note sharing modal
    alert('Note sharing functionality would be implemented here');
}

function clearFilters() {
    document.getElementById('discoverSearch').value = '';
    document.getElementById('subjectFilter').value = '';
    groupsManager.renderDiscoverGroups();
}

// Initialize groups manager
let groupsManager;
document.addEventListener('DOMContentLoaded', () => {
    groupsManager = new GroupsManager();
});

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'createGroupModal') closeCreateModal();
        if (e.target.id === 'joinGroupModal') closeJoinModal();
        if (e.target.id === 'groupDetailsModal') closeGroupDetails();
    }
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);