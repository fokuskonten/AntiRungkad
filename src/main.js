import { apiClient } from './services/api_client';
import { globalBgm } from './services/GlobalBgmService.js';

// ── 1. FLOATING GOLD & SILVER LUXURY SPARKLE CANVAS ─────────────────────────
class ParticleCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 55;

    this.resize();
    this.initParticles();
    this.animate();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    const colors = [
      { color: '#FFD700', type: 'gold' },
      { color: '#FFF0A8', type: 'gold' },
      { color: '#E5A93B', type: 'gold' },
      { color: '#FFFFFF', type: 'silver' },
      { color: '#E2E8F0', type: 'silver' },
      { color: '#CBD5E1', type: 'silver' }
    ];

    for (let i = 0; i < this.numParticles; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.4 + 1.0,
        color: c.color,
        type: c.type,
        isStar: Math.random() > 0.65,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.7 - 0.2,
        baseAlpha: Math.random() * 0.5 + 0.35,
        twinkleSpeed: Math.random() * 0.04 + 0.015,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  drawStar(cx, cy, outerRadius, innerRadius, color, alpha) {
    const spikes = 4;
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += p.twinkleSpeed;

      const currentAlpha = Math.max(0.1, p.baseAlpha + Math.sin(p.phase) * 0.3);

      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      if (p.isStar) {
        this.drawStar(p.x, p.y, p.radius * 2.2, p.radius * 0.6, p.color, currentAlpha);
      } else {
        this.ctx.save();
        this.ctx.globalAlpha = currentAlpha;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    });

    requestAnimationFrame(() => this.animate());
  }
}

// ── 2. MAIN APP & AUTHENTICATION MANAGER ─────────────────────────────────────
class MegawinApp {
  constructor() {
    this.particleEngine = new ParticleCanvas('particles-canvas');
    this.bindDom();
    this.initEvents();
    this.initSlider();
    this.initAudio();
    this.initPromoModal();
    this.startJackpotTicker();
    this.checkHealth();
  }

  initPromoModal() {
    this.promoModal = document.getElementById('promo-modal');
    this.btnPromoClose = document.getElementById('btn-promo-close');
    this.btnPromoMusic = document.getElementById('btn-promo-music');
    this.btnPromoSkip = document.getElementById('btn-promo-skip');

    if (!this.promoModal) return;

    if (this.btnPromoMusic) {
      this.btnPromoMusic.addEventListener('click', () => {
        this.playAudio();
        this.closePromoModal();
      });
    }

    if (this.btnPromoSkip) {
      this.btnPromoSkip.addEventListener('click', () => {
        this.closePromoModal();
      });
    }

    if (this.btnPromoClose) {
      this.btnPromoClose.addEventListener('click', () => {
        this.closePromoModal();
      });
    }
  }

  closePromoModal() {
    if (this.promoModal) {
      this.promoModal.classList.add('hidden');
    }
  }

  initAudio() {
    // Managed seamlessly by GlobalBgmService across all pages
  }

  toggleAudio() {
    globalBgm.toggle();
  }

  playAudio() {
    globalBgm.play();
  }

  pauseAudio() {
    globalBgm.pause();
  }

  updateAudioUi() {
    globalBgm.updateAllUi(globalBgm.isPlaying);
  }

  initSlider() {
    this.sliderTrack = document.getElementById('slider-track');
    this.sliderWrapper = document.getElementById('hero-slider');
    this.sliderDots = document.querySelectorAll('.slider-dot');
    this.currentSlide = 0;
    this.totalSlides = 3;

    if (!this.sliderTrack) return;

    this.sliderDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
        this.goToSlide(idx);
        this.restartSliderTimer();
      });
    });

    // Touch Swipe Gesture for Android / Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    if (this.sliderWrapper) {
      this.sliderWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      this.sliderWrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diffX = touchStartX - touchEndX;
        if (Math.abs(diffX) > 40) {
          if (diffX > 0) {
            this.goToSlide(this.currentSlide + 1);
          } else {
            this.goToSlide(this.currentSlide - 1);
          }
          this.restartSliderTimer();
        }
      }, { passive: true });
    }

    this.startSliderTimer();
  }

  goToSlide(index) {
    this.currentSlide = (index + this.totalSlides) % this.totalSlides;
    if (this.sliderTrack) {
      this.sliderTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }
    this.sliderDots.forEach((dot, idx) => {
      if (idx === this.currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  startSliderTimer() {
    this.sliderInterval = setInterval(() => {
      this.goToSlide(this.currentSlide + 1);
    }, 4000);
  }

  restartSliderTimer() {
    if (this.sliderInterval) clearInterval(this.sliderInterval);
    this.startSliderTimer();
  }

  bindDom() {
    this.tabLoginBtn = document.getElementById('tab-login-btn');
    this.tabRegisterBtn = document.getElementById('tab-register-btn');
    this.formLogin = document.getElementById('form-login');
    this.formRegister = document.getElementById('form-register');
    this.loginFeedback = document.getElementById('login-feedback');
    this.registerFeedback = document.getElementById('register-feedback');
    this.jackpotDisplay = document.getElementById('jackpot-display');
  }

  initEvents() {
    // Tab Switching
    if (this.tabLoginBtn && this.tabRegisterBtn) {
      this.tabLoginBtn.addEventListener('click', () => this.switchTab('login'));
      this.tabRegisterBtn.addEventListener('click', () => this.switchTab('register'));
    }

    // Login Form Submit
    if (this.formLogin) {
      this.formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    // Register Form Submit
    if (this.formRegister) {
      this.formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister();
      });
    }

    // DEV MODE: Skip Login Button
    const skipLoginBtn = document.getElementById('btn-skip-login');
    if (skipLoginBtn) {
      skipLoginBtn.addEventListener('click', () => {
        console.log('[DEV MODE] Skipping login...');
        window.location.href = './game.html';
      });
    }
  }

  switchTab(tab) {
    if (tab === 'login') {
      this.tabLoginBtn.classList.add('active');
      this.tabRegisterBtn.classList.remove('active');
      this.formLogin.style.display = 'flex';
      this.formRegister.style.display = 'none';
    } else {
      this.tabRegisterBtn.classList.add('active');
      this.tabLoginBtn.classList.remove('active');
      this.formRegister.style.display = 'flex';
      this.formLogin.style.display = 'none';
    }
  }

  async checkHealth() {
    try {
      const res = await apiClient.checkServerHealth();
      if (this.serverPillText) {
        if (res.success || res.serverStatus === 'ONLINE') {
          this.serverPillText.textContent = 'Port 8090 ONLINE';
        } else {
          this.serverPillText.textContent = 'Port 8090 Standby';
        }
      }
    } catch {
      if (this.serverPillText) this.serverPillText.textContent = 'Port 8090 Standby';
    }
  }

  async handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('btn-submit-login');

    if (!username || !password) {
      this.showFeedback(this.loginFeedback, 'Harap isi username dan password.', '#EF4444');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'MEMPROSES...';
    this.showFeedback(this.loginFeedback, 'Memverifikasi ke server...', '#D4AF37');

    const result = await apiClient.login(username, password);
    submitBtn.disabled = false;
    submitBtn.textContent = 'MASUK';

    if (result.success) {
      this.showFeedback(this.loginFeedback, 'Login Berhasil! Mengalihkan...', '#10B981');
      setTimeout(() => {
        window.location.href = './game.html';
      }, 400);
    } else {
      this.showFeedback(this.loginFeedback, result.message || 'Username atau Password salah.', '#EF4444');
    }
  }

  async handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const whatsapp = document.getElementById('reg-whatsapp').value.trim();
    const bankName = document.getElementById('reg-bank').value;
    const accountName = document.getElementById('reg-acc-name').value.trim();
    const accountNumber = document.getElementById('reg-acc-number').value.trim();
    const password = document.getElementById('reg-password').value;
    const repassword = document.getElementById('reg-repassword').value;
    const submitBtn = document.getElementById('btn-submit-register');

    if (!username || !whatsapp || !accountName || !accountNumber || !password) {
      this.showFeedback(this.registerFeedback, 'Semua field wajib diisi lengkap.', '#EF4444');
      return;
    }

    if (password !== repassword) {
      this.showFeedback(this.registerFeedback, 'Konfirmasi password tidak cocok.', '#EF4444');
      return;
    }

    if (password.length < 6) {
      this.showFeedback(this.registerFeedback, 'Password minimal 6 karakter.', '#EF4444');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'MEMPROSES...';

    try {
      const res = await fetch('/api/v1/auth/register-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: 'antirungkad',
          username,
          displayName: whatsapp,
          password,
          shopName: bankName,
          accountName,
          accountNumber
        })
      });
      const data = await res.json();
      submitBtn.disabled = false;
      submitBtn.textContent = 'DAFTAR';

      if (data.success) {
        this.showFeedback(this.registerFeedback, 'Pendaftaran Berhasil! Silakan Masuk.', '#10B981');
        setTimeout(() => {
          this.switchTab('login');
          document.getElementById('login-username').value = username;
          document.getElementById('login-password').value = password;
        }, 1000);
      } else {
        this.showFeedback(this.registerFeedback, data.message || 'Gagal mendaftar akun.', '#EF4444');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'DAFTAR';
      this.showFeedback(this.registerFeedback, 'Terjadi gangguan jaringan server.', '#EF4444');
    }
  }

  showFeedback(el, msg, color) {
    if (!el) return;
    el.textContent = msg;
    el.style.color = color;
  }

  startJackpotTicker() {
    let baseJackpot = 8842619450;
    setInterval(() => {
      baseJackpot += Math.floor(Math.random() * 25000 + 5000);
      if (this.jackpotDisplay) {
        this.jackpotDisplay.textContent = 'IDR ' + baseJackpot.toLocaleString('id-ID');
      }
    }, 2000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // DEV MODE: Auto-redirect to dashboard if URL has ?dev=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') === 'true') {
    console.log('[DEV MODE] Auto-redirecting to dashboard...');
    window.location.href = './dashboard.html';
    return;
  }

  new MegawinApp();
});
