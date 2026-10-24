// ══════════════════════════════════════════════════════════════════════════════
// account.js — Account Profile & Menu List Controller
// FokusKonten Pro — AntiRungkad Ecosystem (Clean Menu Architecture)
// ══════════════════════════════════════════════════════════════════════════════

import { userDataService } from './services/UserDataService.js';
import { audioService } from './engine/AudioService.js';
import { globalBgm } from './services/GlobalBgmService.js';

class AccountPageApp {
  constructor() {
    this.toastEl = document.getElementById('olympus-toast');
    this.initProfile();
    this.bindEvents();
    
    // Subscribe to reactive user data changes
    userDataService.subscribe((event) => {
      if (event === 'PROFILE_UPDATED' || event === 'BANKS_UPDATED') {
        this.initProfile();
      }
    });
  }

  showToast(message) {
    if (!this.toastEl) {
      alert(message);
      return;
    }
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 3200);
  }

  initProfile() {
    const profile = userDataService.getProfile();
    const displayNameEl = document.getElementById('view-display-name');
    const uidEl = document.getElementById('view-uid');
    const vipPillEl = document.getElementById('view-vip-pill');

    if (displayNameEl) displayNameEl.textContent = profile.displayName || profile.username || 'Sultan Olympus';
    if (uidEl) uidEl.textContent = `ID: #${profile.uid || 'USR_8892147'}`;
    if (vipPillEl) vipPillEl.textContent = `👑 ${profile.vipTier || 'VIP SULTAN'} LEVEL 5`;
  }

  bindEvents() {
    // 1. Keamanan & PIN Modal / Action
    const menuSec = document.getElementById('menu-security-pin');
    if (menuSec) {
      menuSec.addEventListener('click', (e) => {
        e.preventDefault();
        audioService.playButtonClick();
        const pin = prompt('Masukkan PIN Baru 6-Digit Anda:', '123456');
        if (pin && pin.length === 6 && /^\d+$/.test(pin)) {
          userDataService.setPin(pin);
          this.showToast('✅ PIN Keamanan 6-Digit berhasil diperbarui!');
        } else if (pin) {
          alert('PIN harus tepat 6 digit angka!');
        }
      });
    }

    // 2. Pusat Bantuan
    const menuHelp = document.getElementById('menu-help-center');
    if (menuHelp) {
      menuHelp.addEventListener('click', (e) => {
        e.preventDefault();
        audioService.playButtonClick();
        this.showToast('💬 Layanan Customer Service 24 Jam siap membantu Anda!');
      });
    }

    // 3. Tombol Logout
    const btnLogout = document.getElementById('btn-action-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        audioService.playButtonClick();
        if (confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
          this.showToast('Berhasil keluar. Mengalihkan ke lobi...');
          setTimeout(() => {
            window.location.href = './lobby.html';
          }, 800);
        }
      });
    }

    // 4. Click sound on all menu items
    document.querySelectorAll('.account-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        audioService.playButtonClick();
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new AccountPageApp();
});
