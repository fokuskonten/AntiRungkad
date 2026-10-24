// ══════════════════════════════════════════════════════════════════════════════
// ParticleVFXEngine.js — 60FPS Kenney Particle VFX Engine
// FokusKonten Pro — AntiRungkad Ecosystem (High-End Dynamic Win & Landing VFX)
// ══════════════════════════════════════════════════════════════════════════════

export class ParticleVFXEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.textures = {};
    this.particles = [];
    this.activeHalos = [];
    this.animFrameId = null;

    this.texturePaths = {
      magicHalo:  './assets/vfx/particles/magic_05.png',
      magicRing:  './assets/vfx/particles/magic_03.png',
      spark:      './assets/vfx/particles/spark_06.png',
      star:       './assets/vfx/particles/star_09.png',
      flare:      './assets/vfx/particles/flare_01.png',
      twirl:      './assets/vfx/particles/twirl_02.png'
    };

    this.initCanvas();
    this.preloadTextures();
  }

  initCanvas() {
    const frame = document.querySelector('.olympus-gold-frame');
    if (!frame) return;

    let canvas = document.getElementById('particle-vfx-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'particle-vfx-canvas';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '25';
      frame.appendChild(canvas);
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  preloadTextures() {
    for (const [key, path] of Object.entries(this.texturePaths)) {
      const img = new Image();
      img.src = path;
      this.textures[key] = img;
    }
  }

  // 1. Efek Percikan Cahaya & Bintang Saat Kolom Reel Mendarat
  playLandingSparks(colIndex) {
    if (!this.canvas) this.initCanvas();
    const colEl = document.getElementById(`stone-reel-${colIndex}`);
    if (!colEl || !this.canvas) return;

    const frameRect = this.canvas.parentElement.getBoundingClientRect();
    const colRect = colEl.getBoundingClientRect();

    const cx = (colRect.left - frameRect.left) + colRect.width / 2;
    const cy = colRect.height * 0.55;

    // Tambah 8 partikel bintang/percikan emas
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + (Math.random() * 0.4);
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        type: 'star',
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 20 + Math.random() * 18,
        alpha: 1,
        life: 22,
        maxLife: 22,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    this.startLoop();
  }

  // 2. Efek Cincin Sihir Berputar & Pancaran Kilau Emas Saat Menang (Winning Cluster)
  playWinningHalos(cells) {
    if (!this.canvas) this.initCanvas();
    if (!cells || cells.length === 0) return;

    const frameRect = this.canvas.parentElement.getBoundingClientRect();

    cells.forEach(pos => {
      const cellEl = document.getElementById(`stone-cell-${pos.col}-${pos.row}`);
      if (!cellEl) return;

      const cellRect = cellEl.getBoundingClientRect();
      const cx = (cellRect.left - frameRect.left) + cellRect.width / 2;
      const cy = (cellRect.top - frameRect.top) + cellRect.height / 2;

      this.activeHalos.push({
        x: cx,
        y: cy,
        size: cellRect.width * 1.35,
        rotation: 0,
        rotSpeed: 0.04,
        alpha: 1,
        life: 60, // Aktif selama perayaan menang
        maxLife: 60
      });

      // Munculkan semburan bintang emas di sekitar sel menang
      for (let s = 0; s < 6; s++) {
        this.particles.push({
          type: 'spark',
          x: cx + (Math.random() - 0.5) * 30,
          y: cy + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2.5,
          size: 16 + Math.random() * 14,
          alpha: 1,
          life: 30,
          maxLife: 30,
          rotation: Math.random() * Math.PI,
          rotSpeed: 0.1
        });
      }
    });

    this.startLoop();
  }

  clearHalos() {
    this.activeHalos = [];
  }

  startLoop() {
    if (!this.animFrameId) {
      this.animFrameId = requestAnimationFrame(() => this.renderLoop());
    }
  }

  renderLoop() {
    if (!this.ctx || !this.canvas) return;

    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen'; // Cahaya emas menyala profesional

    // A. Render Cincin Sihir Berputar di Sel Pemenang
    const haloTex = this.textures.magicHalo;
    for (let h = this.activeHalos.length - 1; h >= 0; h--) {
      const halo = this.activeHalos[h];
      halo.rotation += halo.rotSpeed;
      halo.life--;

      if (haloTex && haloTex.complete) {
        this.ctx.save();
        this.ctx.translate(halo.x, halo.y);
        this.ctx.rotate(halo.rotation);
        this.ctx.globalAlpha = Math.min(1, halo.life / 20) * 0.85;

        const half = halo.size / 2;
        this.ctx.drawImage(haloTex, -half, -half, halo.size, halo.size);
        this.ctx.restore();
      }

      if (halo.life <= 0) {
        this.activeHalos.splice(h, 1);
      }
    }

    // B. Render Partikel Bintang & Percikan Emas
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const part = this.particles[p];
      part.x += part.vx;
      part.y += part.vy;
      part.rotation += part.rotSpeed;
      part.life--;
      part.alpha = part.life / part.maxLife;

      const tex = part.type === 'star' ? this.textures.star : this.textures.spark;

      if (tex && tex.complete) {
        this.ctx.save();
        this.ctx.translate(part.x, part.y);
        this.ctx.rotate(part.rotation);
        this.ctx.globalAlpha = part.alpha * 0.9;

        const half = part.size / 2;
        this.ctx.drawImage(tex, -half, -half, part.size, part.size);
        this.ctx.restore();
      }

      if (part.life <= 0) {
        this.particles.splice(p, 1);
      }
    }

    this.ctx.restore();

    if (this.particles.length > 0 || this.activeHalos.length > 0) {
      this.animFrameId = requestAnimationFrame(() => this.renderLoop());
    } else {
      this.animFrameId = null;
    }
  }
}

export const particleVFXEngine = new ParticleVFXEngine();
