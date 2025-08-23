class NotesManager {
    constructor() {
        this.notes = this.loadNotes();
        this.currentView = 'grid';
        this.editingNote = null;
        this.init();
    }

    init() {
        this.renderNotes();
        this.initEventListeners();
        this.initSearchAndFilter();
    }

    initEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });

        // Filter functionality
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.filterNotes();
        });

        document.getElementById('tagFilter').addEventListener('change', (e) => {
            this.filterNotes();
        });

        // View toggle
        document.getElementById('viewToggle').addEventListener('click', () => {
            this.toggleView();
        });

        // Note form
        document.getElementById('noteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote();
        });

        // File upload
        document.getElementById('noteFile').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
    }

    initSearchAndFilter() {
        // Real-time search
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchNotes(e.target.value);
            }, 300);
        });
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('paperly_notes');
        if (savedNotes) {
            return JSON.parse(savedNotes);
        }
        
        // Default notes
        return [
            {
                id: 1,
                title: 'Physics Notes - Chapter 5',
                content: 'Key concepts about motion and forces...',
                type: 'text',
                tags: ['physics', 'mechanics'],
                date: new Date().toISOString(),
                author: 'You'
            },
            {
                id: 2,
                title: 'Math Formulas Collection',
                content: 'Important formulas for calculus...',
                type: 'text',
                tags: ['math', 'calculus'],
                date: new Date(Date.now() - 86400000).toISOString(),
                author: 'You'
            },
            {
                id: 3,
                title: 'Biology Diagram',
                content: 'Cell structure diagram',
                type: 'image',
                tags: ['biology', 'cell'],
                date: new Date(Date.now() - 172800000).toISOString(),
                author: 'You',
                file: 'https://images.pexels.com/photos/5726794/pexels-photo-5726794.jpeg?auto=compress&cs=tinysrgb&w=300'
            }
        ];
    }

    saveNotes() {
        localStorage.setItem('paperly_notes', JSON.stringify(this.notes));
    }

    renderNotes(notesToRender = this.notes) {
        const grid = document.getElementById('notesGrid');
        
        if (notesToRender.length === 0) {
            grid.innerHTML = `
                <div class="no-notes">
                    <div class="no-notes-icon">📝</div>
                    <div class="no-notes-text">No notes found</div>
                    <div class="no-notes-subtitle">Create your first note to get started</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = notesToRender.map(note => this.createNoteCard(note)).join('');
        
        // Add event listeners to note cards
        this.addNoteEventListeners();
    }

    createNoteCard(note) {
    const formattedDate = new Date(note.date).toLocaleDateString();
    const tagsHTML = note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('');
    
    let contentHTML = '';
    
    switch (note.type) {
        case 'text':
            contentHTML = `<div class="note-content">${note.content}</div>`;
            break;
        case 'image':
            contentHTML = `
                <img src="${note.file}" alt="${note.title}" class="note-image">
                <div class="note-content">${note.content}</div>
            `;
            break;
        case 'pdf':
            contentHTML = `
                <div class="note-pdf">
                    <embed src="${note.file}" type="application/pdf" width="100%" height="200px" style="border-radius:8px;" />
                    <div class="note-content">${note.content}</div>
                </div>
            `;
            break;
    }

    return `
        <div class="note-card" data-note-id="${note.id}">
            <div class="note-header">
                <div>
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-type">${note.type}</span>
                </div>
                <div class="note-actions">
                    <button class="action-btn edit" onclick="editNote(${note.id})" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="deleteNote(${note.id})" title="Delete">🗑️</button>
                </div>
            </div>
            
            ${contentHTML}
            
            <div class="note-footer">
                <div class="note-tags">${tagsHTML}</div>
            </div>
            
            <div class="note-date">${formattedDate}</div>
        </div>
    `;
}

    addNoteEventListeners() {
        const noteCards = document.querySelectorAll('.note-card');
        noteCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.note-actions')) {
                    this.openNoteDetails(parseInt(card.dataset.noteId));
                }
            });
        });
    }

    openNoteDetails(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            // Create a detailed view modal or navigate to note details
            this.showNoteDetails(note);
        }
    }

    showNoteDetails(note) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${note.title}</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="note-details">
                <div class="note-meta">
                    <span class="note-type">${note.type}</span>
                    <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
                </div>
                <div class="note-content-full">
                    ${note.type === 'image' ? `<img src="${note.file}" alt="${note.title}" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px;">` : ''}
                    ${note.type === 'pdf' ? `<embed src="${note.file}" type="application/pdf" width="100%" height="600px" style="border-radius:8px;" />` : ''}
                    <p>${note.content}</p>
                </div>
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

    searchNotes(query) {
        if (!query.trim()) {
            this.renderNotes();
            return;
        }

        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderNotes(filteredNotes);
    }

    filterNotes() {
        const typeFilter = document.getElementById('typeFilter').value;
        const tagFilter = document.getElementById('tagFilter').value;

        let filteredNotes = this.notes;

        if (typeFilter) {
            filteredNotes = filteredNotes.filter(note => note.type === typeFilter);
        }

        if (tagFilter) {
            filteredNotes = filteredNotes.filter(note => note.tags.includes(tagFilter));
        }

        this.renderNotes(filteredNotes);
    }

    toggleView() {
        const grid = document.getElementById('notesGrid');
        const toggleBtn = document.getElementById('viewToggle');
        
        if (this.currentView === 'grid') {
            grid.classList.add('list-view');
            toggleBtn.innerHTML = '<span class="toggle-icon">☰</span>';
            this.currentView = 'list';
        } else {
            grid.classList.remove('list-view');
            toggleBtn.innerHTML = '<span class="toggle-icon">⊞</span>';
            this.currentView = 'grid';
        }
    }

    saveNote() {
        const title = document.getElementById('noteTitle').value;
        const type = document.getElementById('noteType').value;
        const content = document.getElementById('noteContent').value;
        const tags = document.getElementById('noteTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const fileInput = document.getElementById('noteFile');

        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        const noteData = {
            title: title.trim(),
            type,
            content: content.trim(),
            tags,
            date: new Date().toISOString(),
            author: 'You'
        };

        if (type !== 'text' && fileInput.files[0]) {
            // In a real app, you would upload the file to a server
            // For demo purposes, we'll use a placeholder
            noteData.file = URL.createObjectURL(fileInput.files[0]);
        }

        if (this.editingNote) {
            // Update existing note
            const index = this.notes.findIndex(n => n.id === this.editingNote.id);
            if (index !== -1) {
                this.notes[index] = { ...this.editingNote, ...noteData };
            }
            this.editingNote = null;
        } else {
            // Create new note
            noteData.id = Date.now();
            this.notes.unshift(noteData);
        }

        this.saveNotes();
        this.renderNotes();
        this.closeModal();
    }

    closeModal() {
        const modal = document.getElementById('noteModal');
        modal.classList.remove('active');
        
        // Reset form
        document.getElementById('noteForm').reset();
        document.getElementById('filePreview').classList.remove('active');
        document.getElementById('textGroup').classList.remove('hidden');
        document.getElementById('fileGroup').classList.add('hidden');
        
        this.editingNote = null;
    }

    handleFileUpload(file) {
        const preview = document.getElementById('filePreview');
        
        if (file) {
            preview.classList.add('active');
            
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'preview-image';
                preview.innerHTML = '';
                preview.appendChild(img);
            } else if (file.type === 'application/pdf') {
                preview.innerHTML = `
                    <div class="pdf-preview">
                        <span class="pdf-icon">📄</span>
                        <span>${file.name}</span>
                    </div>
                `;
            }
        } else {
            preview.classList.remove('active');
        }
    }
}

// Global functions for HTML onclick handlers
function openCreateModal() {
    const modal = document.getElementById('noteModal');
    modal.classList.add('active');
    document.getElementById('noteTitle').focus();
}

function closeModal() {
    notesManager.closeModal();
}

function editNote(noteId) {
    const note = notesManager.notes.find(n => n.id === noteId);
    if (note) {
        notesManager.editingNote = note;
        
        // Populate form
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteType').value = note.type;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteTags').value = note.tags.join(', ');
        
        // Update modal title
        document.querySelector('.modal-title').textContent = 'Edit Note';
        
        // Show appropriate content fields
        handleTypeChange();
        
        // Open modal
        openCreateModal();
    }
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        notesManager.notes = notesManager.notes.filter(n => n.id !== noteId);
        notesManager.saveNotes();
        notesManager.renderNotes();
    }
}

function handleTypeChange() {
    const type = document.getElementById('noteType').value;
    const textGroup = document.getElementById('textGroup');
    const fileGroup = document.getElementById('fileGroup');
    const fileInput = document.getElementById('noteFile');
    
    if (type === 'text') {
        textGroup.classList.remove('hidden');
        fileGroup.classList.add('hidden');
        fileInput.accept = '';
    } else if (type === 'image') {
        textGroup.classList.remove('hidden');
        fileGroup.classList.remove('hidden');
        fileInput.accept = '.jpg,.jpeg,.png,.gif';
    } else if (type === 'pdf') {
        textGroup.classList.remove('hidden');
        fileGroup.classList.remove('hidden');
        fileInput.accept = '.pdf';
    }
}

// Initialize notes manager
let notesManager;
document.addEventListener('DOMContentLoaded', () => {
    notesManager = new NotesManager();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') {
            e.preventDefault();
            openCreateModal();
        } else if (e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    }
    
    if (e.key === 'Escape') {
        closeModal();
    }
});