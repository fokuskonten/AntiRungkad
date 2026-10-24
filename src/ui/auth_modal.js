import { apiClient } from '../services/api_client';

export class AuthModal {
  constructor(onAuthChanged) {
    this.onAuthChanged = onAuthChanged;
    this.modalEl = document.getElementById('login-modal');
    this.formEl = document.getElementById('login-form');
    this.usernameInput = document.getElementById('login-username');
    this.passwordInput = document.getElementById('login-password');
    this.statusMessageEl = document.getElementById('login-status-msg');
    this.submitBtn = document.getElementById('login-submit-btn');

    this.initEvents();
  }

  initEvents() {
    if (this.formEl) {
      this.formEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    const closeBtn = document.getElementById('login-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const guestBtn = document.getElementById('login-guest-btn');
    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        apiClient.logout();
        this.hide();
        if (this.onAuthChanged) this.onAuthChanged(null);
      });
    }
  }

  show() {
    if (this.modalEl) {
      this.modalEl.style.display = 'flex';
      this.statusMessageEl.textContent = '';
      this.usernameInput.focus();
    }
  }

  hide() {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
  }

  async handleLogin() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;

    if (!username || !password) {
      this.showStatus('Harap isi username dan password.', 'error');
      return;
    }

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Memverifikasi...';
    this.showStatus('Menghubungkan ke Server Port 8090...', 'info');

    const result = await apiClient.login(username, password);
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Masuk Sekarang';

    if (result.success) {
      this.showStatus('Login Berhasil!', 'success');
      setTimeout(() => {
        this.hide();
        if (this.onAuthChanged) this.onAuthChanged(result.user);
      }, 500);
    } else {
      this.showStatus(result.message || 'Gagal login. Periksa username dan password.', 'error');
    }
  }

  showStatus(msg, type) {
    if (!this.statusMessageEl) return;
    this.statusMessageEl.textContent = msg;
    this.statusMessageEl.style.color = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#38bdf8');
  }
}
