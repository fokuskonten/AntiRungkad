// ══════════════════════════════════════════════════════════════════════════════
// GlobalBgmService.js — Seamless Cross-Page Synchronized BGM Engine
// AntiRungkad Pro — Persistent Audio State across Login, Game, Lobby & Account
// ══════════════════════════════════════════════════════════════════════════════

class GlobalBgmManager {
  constructor() {
    this.BGM_STATE_KEY = 'antirungkad_bgm_state';
    this.BGM_TIME_KEY = 'antirungkad_bgm_time';
    this.BGM_SRC = './assets/bgm.webm';
    
    this.audio = null;
    this.isPlaying = false;
    this._saveInterval = null;

    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
  }

  init() {
    // Find existing audio element or create dynamically
    this.audio = document.getElementById('bgm-player') || document.getElementById('game-bgm-audio');
    if (!this.audio) {
      this.audio = document.createElement('audio');
      this.audio.id = 'global-bgm-player';
      this.audio.src = this.BGM_SRC;
      this.audio.loop = true;
      this.audio.preload = 'auto';
      document.body.appendChild(this.audio);
    }

    this.audio.volume = 0.45;

    // Check saved state
    const savedState = localStorage.getItem(this.BGM_STATE_KEY);
    const savedTime = parseFloat(sessionStorage.getItem(this.BGM_TIME_KEY) || '0');

    if (savedTime > 0 && !isNaN(savedTime)) {
      try {
        this.audio.currentTime = savedTime;
      } catch(e) {}
    }

    // Auto-resume if user previously started music
    if (savedState === 'PLAYING') {
      this.play(savedTime);
    } else {
      this.updateAllUi(false);
    }

    // Periodically save playback position
    if (this._saveInterval) clearInterval(this._saveInterval);
    this._saveInterval = setInterval(() => {
      if (this.isPlaying && this.audio && !this.audio.paused) {
        sessionStorage.setItem(this.BGM_TIME_KEY, this.audio.currentTime.toString());
      }
    }, 500);

    // Save timestamp on page exit
    window.addEventListener('beforeunload', () => {
      if (this.audio && !this.audio.paused) {
        sessionStorage.setItem(this.BGM_TIME_KEY, this.audio.currentTime.toString());
      }
    });

    // Fallback: unlock audio on first user gesture if blocked by autoplay policy
    const unlockOnGesture = () => {
      if (localStorage.getItem(this.BGM_STATE_KEY) === 'PLAYING') {
        if (!this.isPlaying || (this.audio && this.audio.paused)) {
          const t = parseFloat(sessionStorage.getItem(this.BGM_TIME_KEY) || '0');
          this.play(t);
        }
      }
    };
    window.addEventListener('click', unlockOnGesture, { passive: true, once: true });
    window.addEventListener('touchstart', unlockOnGesture, { passive: true, once: true });

    // Connect any audio toggle buttons present in current DOM
    this.attachUiListeners();
  }

  play(startTime = null) {
    if (!this.audio) return;

    if (startTime !== null && startTime > 0 && !isNaN(startTime)) {
      try {
        this.audio.currentTime = startTime;
      } catch(e) {}
    }

    this.audio.volume = 0.45;
    const promise = this.audio.play();
    if (promise !== undefined) {
      promise.then(() => {
        this.isPlaying = true;
        localStorage.setItem(this.BGM_STATE_KEY, 'PLAYING');
        this.updateAllUi(true);
      }).catch(() => {
        this.isPlaying = false;
        this.updateAllUi(false);
      });
    }
  }

  pause() {
    if (!this.audio) return;
    this.audio.pause();
    this.isPlaying = false;
    localStorage.setItem(this.BGM_STATE_KEY, 'PAUSED');
    if (this.audio.currentTime) {
      sessionStorage.setItem(this.BGM_TIME_KEY, this.audio.currentTime.toString());
    }
    this.updateAllUi(false);
  }

  toggle() {
    if (this.isPlaying && this.audio && !this.audio.paused) {
      this.pause();
    } else {
      const savedTime = parseFloat(sessionStorage.getItem(this.BGM_TIME_KEY) || '0');
      this.play(savedTime);
    }
  }

  attachUiListeners() {
    // 1. Index / Login Toggle Button
    const btnLoginToggle = document.getElementById('btn-audio-toggle');
    if (btnLoginToggle) {
      btnLoginToggle.onclick = (e) => {
        e.preventDefault();
        this.toggle();
      };
    }

    // 2. Game Arena Music Toggle Button
    const btnGameToggle = document.getElementById('btn-game-music-toggle');
    if (btnGameToggle) {
      btnGameToggle.onclick = (e) => {
        e.preventDefault();
        this.toggle();
      };
    }

    // 3. Global Header Toggle Buttons (Lobby, Account, Deposit, Promo)
    const btnGlobalToggle = document.querySelectorAll('.btn-global-bgm-toggle');
    btnGlobalToggle.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        this.toggle();
      };
    });

    this.updateAllUi(this.isPlaying);
  }

  updateAllUi(isPlaying) {
    // 1. Update Index.html Button
    const btnLoginToggle = document.getElementById('btn-audio-toggle');
    const audioIcon = document.getElementById('audio-icon');
    const audioText = document.getElementById('audio-text');
    if (btnLoginToggle) {
      if (isPlaying) {
        btnLoginToggle.classList.add('playing');
        if (audioIcon) audioIcon.textContent = '⏹';
        if (audioText) audioText.textContent = 'STOP';
      } else {
        btnLoginToggle.classList.remove('playing');
        if (audioIcon) audioIcon.textContent = '▶';
        if (audioText) audioText.textContent = 'MUSIK';
      }
    }

    // 2. Update Game.html Button
    const btnGameToggle = document.getElementById('btn-game-music-toggle');
    if (btnGameToggle) {
      if (isPlaying) {
        btnGameToggle.classList.remove('muted');
        btnGameToggle.classList.add('active');
        btnGameToggle.title = 'Hentikan Musik (STOP)';
      } else {
        btnGameToggle.classList.add('muted');
        btnGameToggle.classList.remove('active');
        btnGameToggle.title = 'Putar Musik (PLAY)';
      }
    }

    // 3. Update Global Page Buttons
    const btnGlobalToggles = document.querySelectorAll('.btn-global-bgm-toggle');
    btnGlobalToggles.forEach(btn => {
      const icon = btn.querySelector('.bgm-btn-icon');
      const text = btn.querySelector('.bgm-btn-text');
      if (isPlaying) {
        btn.classList.add('playing');
        if (icon) icon.textContent = '⏹';
        if (text) text.textContent = 'STOP';
      } else {
        btn.classList.remove('playing');
        if (icon) icon.textContent = '▶';
        if (text) text.textContent = 'MUSIK';
      }
    });
  }
}

export const globalBgm = new GlobalBgmManager();
