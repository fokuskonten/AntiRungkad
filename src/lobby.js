// ══════════════════════════════════════════════════════════════════════════════
// lobby.js — Main Lobby, Sportsbook, and Game Hub Controller
// FokusKonten Pro — AntiRungkad Ecosystem (Complete Logic)
// ══════════════════════════════════════════════════════════════════════════════

import { userDataService } from './services/UserDataService.js';
import { audioService } from './engine/AudioService.js';
import { globalBgm } from './services/GlobalBgmService.js';

class LobbyPageApp {
  constructor() {
    this.updateBalanceUI();
    this.bindEvents();

    userDataService.subscribe((event) => {
      if (event === 'BALANCE_UPDATED') {
        this.updateBalanceUI();
      }
    });
  }

  updateBalanceUI() {
    const balEl = document.getElementById('view-lobby-balance');
    if (balEl) {
      balEl.textContent = Number(userDataService.getBalance()).toLocaleString('id-ID');
    }
  }

  bindEvents() {
    // Sound effect on any card clicks
    document.querySelectorAll('.game-item-card, .btn-slide-action').forEach(el => {
      el.addEventListener('click', () => {
        audioService.playButtonClick();
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new LobbyPageApp();
});
