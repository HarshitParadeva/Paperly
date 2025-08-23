class AISummarizerManager {
    constructor() {
        this.currentDocument = null;
        this.summaryHistory = this.loadHistory();
        this.init();
    }

    init() {
        this.initEventListeners();
        this.renderHistory();
    }

    initEventListeners() {
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files[0] && files[0].type === 'application/pdf') {
                this.handleFileUpload(files[0]);
            }
        });

        const summaryTabs = document.querySelectorAll('.summary-tab');
        summaryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchSummaryTab(e.target.dataset.tab);
            });
        });

        uploadArea.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    async handleFileUpload(file) {
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File size should be less than 10MB');
            return;
        }

        this.currentDocument = {
            name: file.name,
            size: file.size,
            uploadDate: new Date()
        };

        this.startProcessing();

        try {
            const API_BASE = "http://localhost:5002"; // ✅ backend URL

            // 1. Upload file
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`${API_BASE}/api/files/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                throw new Error(`Upload failed: ${errText}`);
            }

            const uploadData = await uploadRes.json();
            console.log("✅ Upload response:", uploadData);

            const fileId = uploadData.content?.fileId || uploadData.fileId || uploadData._id;
            if (!fileId) throw new Error("File ID missing from upload response");

            // 2. Analyze PDF
            const analyzeRes = await fetch(`${API_BASE}/api/files/analyze-pdf/${fileId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!analyzeRes.ok) {
                const errText = await analyzeRes.text();
                throw new Error(`Analyze failed: ${errText}`);
            }

            const summaryData = await analyzeRes.json();
            console.log("✅ Analyze response:", summaryData);

            this.showResults(summaryData);
        } catch (err) {
            console.error("❌ Error uploading/analyzing:", err);
            this.showMessage(err.message, "error");

            // fallback to mock data
            const summaryData = this.generateMockSummary();
            this.showResults(summaryData);
        }
    }

    startProcessing() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('processingSection').style.display = 'block';
        this.simulateProcessingSteps();
    }

    simulateProcessingSteps() {
        const steps = document.querySelectorAll('.step');
        let currentStep = 0;

        const processStep = () => {
            if (currentStep > 0) steps[currentStep - 1].classList.remove('active');
            if (currentStep < steps.length) {
                steps[currentStep].classList.add('active');
                currentStep++;
                setTimeout(processStep, 1500);
            }
        };
        processStep();
    }

    showResults(summaryData) {
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';

        this.populateResults(summaryData);
        this.saveToHistory(summaryData);
    }

    populateResults(summaryData) {
        const docInfo = document.getElementById('documentInfo');
        docInfo.innerHTML = `
            <div class="doc-icon">📄</div>
            <div class="doc-details">
                <div class="doc-name">${this.currentDocument.name}</div>
                <div class="doc-meta">
                    <span>Size: ${this.formatFileSize(this.currentDocument.size)}</span>
                    <span>Processed: ${this.formatDate(this.currentDocument.uploadDate)}</span>
                </div>
            </div>
        `;

        document.getElementById('overviewText').textContent = summaryData.overview || "No overview available";

        const keyPointsList = document.getElementById('keyPointsList');
        keyPointsList.innerHTML = (summaryData.key_points || summaryData.keyPoints || []).map(point => `
            <div class="key-point"><div class="key-point-icon">•</div><div class="key-point-text">${point}</div></div>
        `).join('');

        const highlightsList = document.getElementById('highlightsList');
        highlightsList.innerHTML = (summaryData.highlights || []).map(highlight => `
            <div class="highlight"><div class="highlight-text">${highlight}</div></div>
        `).join('');
    }

    // === 🔥 NEW METHODS ADDED BELOW (keep old code intact) ===

    switchSummaryTab(tab) {
        document.querySelectorAll('.summary-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.summary-section').forEach(el => el.style.display = 'none');

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Section`).style.display = 'block';
    }

    saveToHistory(summaryData) {
        this.summaryHistory.push({
            docName: this.currentDocument.name,
            summary: summaryData,
            date: new Date().toISOString()
        });
        localStorage.setItem('summaryHistory', JSON.stringify(this.summaryHistory));
        this.renderHistory();
    }

    renderHistory() {
        const historyEl = document.getElementById('historyList');
        if (!historyEl) return;

        historyEl.innerHTML = this.summaryHistory.map((entry, idx) => `
            <div class="history-item" onclick="aiManager.loadFromHistory(${idx})">
                <div class="history-doc">${entry.docName}</div>
                <div class="history-date">${this.formatDate(new Date(entry.date))}</div>
            </div>
        `).join('');
    }

    loadFromHistory(index) {
        const entry = this.summaryHistory[index];
        if (!entry) return;
        this.currentDocument = { name: entry.docName, size: 0, uploadDate: new Date(entry.date) };
        this.showResults(entry.summary);
    }

    loadHistory() {
        return JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    formatDate(date) {
        return new Date(date).toLocaleString();
    }

    generateMockSummary() {
        return {
            overview: "This is a mock AI-generated summary overview.",
            key_points: [
                "Key point one from mock summary",
                "Key point two from mock summary",
                "Key point three from mock summary"
            ],
            highlights: [
                "Important highlight one.",
                "Important highlight two."
            ]
        };
    }

    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            padding: 12px 20px; border-radius: 8px; color: white;
            font-weight: 500; z-index: 1001; animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        document.body.appendChild(messageEl);
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
}

// Global init
let aiManager;
document.addEventListener('DOMContentLoaded', () => {
    aiManager = new AISummarizerManager();
});
