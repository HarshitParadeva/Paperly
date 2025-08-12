class AuthManager {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        const forms = document.querySelectorAll('.form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });

        // Role toggle animations
        const roleToggles = document.querySelectorAll('.toggle-switch input');
        roleToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => this.handleRoleToggle(e));
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        const activeForm = document.getElementById(tabName);
        activeForm.classList.add('active');

        activeForm.style.transform = 'translateX(-20px)';
        activeForm.style.opacity = '0';

        setTimeout(() => {
            activeForm.style.transform = 'translateX(0)';
            activeForm.style.opacity = '1';
        }, 100);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const formType = form.closest('.auth-form').id;

        const submitBtn = form.querySelector('.auth-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;

        setTimeout(() => {
            this.processAuth(formType, formData);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    processAuth(formType, formData) {
        switch(formType) {
            case 'login':
                this.handleLogin(formData);
                break;
            case 'signup':
                this.handleSignup(formData);
                break;
            case 'forgot':
                this.handleForgotPassword(formData);
                break;
        }
    }

    handleLogin(formData) {
        // CORRECTED: Use proper field names from the FormData object (from name attribute, not ID)
        const email = formData.get('email');      // was: formData.get('login-email')
        const password = formData.get('password'); // was: formData.get('login-password')
        const role = document.getElementById('login-role-toggle').checked ? 'teacher' : 'student'; // unchanged

        fetch('http://localhost:5002/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }) // unchanged
        })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200) {
                localStorage.setItem('token', body.token);
                this.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '../home/home.html';
                }, 1500);
            } else {
                this.showMessage(body.message || 'Login failed', 'error');
            }
        })
        .catch(() => {
            this.showMessage('Server error during login', 'error');
        });
    }

    handleSignup(formData) {
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirm = formData.get('confirmPassword');
        const role = document.getElementById('signup-role-toggle').checked ? 'teacher' : 'student';

        if (password !== confirm) {
            this.showMessage("Passwords don't match", 'error');
            return;
        }

        fetch('http://localhost:5002/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
            if (status === 201) {
                this.showMessage('Account created! Please login.', 'success');
                setTimeout(() => this.switchTab('login'), 1500);
            } else {
                this.showMessage(body.message || 'Signup failed', 'error');
            }
        })
        .catch(() => {
            this.showMessage('Server error during signup', 'error');
        });
    }

    handleForgotPassword(formData) {
        const email = formData.get('forgot-email');
        this.showMessage(`If ${email} exists, a reset link will be sent.`, 'success');
    }

    handleRoleToggle(e) {
        const toggle = e.target;
        const label = toggle.nextElementSibling;
        label.style.transform = 'scale(0.95)';
        setTimeout(() => {
            label.style.transform = 'scale(1)';
        }, 150);
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
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;

        if (!document.querySelector('#message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
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
        }

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                messageEl.remove();
            }, 300);
        }, 3000);
    }
}
// hi
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

document.documentElement.style.scrollBehavior = 'smooth';
