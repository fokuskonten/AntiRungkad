// ══════════════════════════════════════════════════════════════════════════════
// PaladinVFXEngine.js — Professional Canvas Frame-by-Frame Spritesheet Player
// FokusKonten Pro — AntiRungkad Ecosystem (High-Impact Holy Burst)
// ══════════════════════════════════════════════════════════════════════════════

export class PaladinVFXEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.frames = [];
    this.activeBursts = [];
    this.totalFrames = 11;
    this.isLoaded = false;
    this.animFrameId = null;

    this.initCanvas();
    this.preloadFrames();
  }

  initCanvas() {
    const frame = document.querySelector('.olympus-gold-frame');
    if (!frame) return;

    let canvas = document.getElementById('vfx-burst-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'vfx-burst-canvas';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '20';
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

  preloadFrames() {
    let loadedCount = 0;
    for (let i = 1; i <= this.totalFrames; i++) {
      const img = new Image();
      img.src = `./assets/vfx/vfx4/paladin_skill4_frame${i}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === this.totalFrames) {
          this.isLoaded = true;
        }
      };
      this.frames.push(img);
    }
  }

  playLandingVFX(colIndex) {
    if (!this.canvas) this.initCanvas();
    const colEl = document.getElementById(`stone-reel-${colIndex}`);
    if (!colEl || !this.canvas) return;

    const frameRect = this.canvas.parentElement.getBoundingClientRect();
    const colRect = colEl.getBoundingClientRect();

    const x = colRect.left - frameRect.left;
    const width = colRect.width;
    const height = colRect.height;

    // Ledakan di area tumpu kolom bawah
    this.activeBursts.push({
      x: x + width / 2,
      y: height * 0.52,
      size: width * 1.6,
      currentFrame: 0,
      frameTimer: 0,
      frameDelay: 2
    });

    if (!this.animFrameId) {
      this.renderLoop();
    }
  }

  renderLoop() {
    if (!this.ctx || !this.canvas) return;

    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    for (let i = this.activeBursts.length - 1; i >= 0; i--) {
      const burst = this.activeBursts[i];
      const frameIdx = Math.floor(burst.currentFrame);

      if (frameIdx < this.totalFrames && this.frames[frameIdx] && this.frames[frameIdx].complete) {
        const img = this.frames[frameIdx];
        const halfSize = burst.size / 2;

        this.ctx.drawImage(
          img,
          burst.x - halfSize,
          burst.y - halfSize,
          burst.size,
          burst.size
        );
      }

      burst.frameTimer++;
      if (burst.frameTimer >= burst.frameDelay) {
        burst.frameTimer = 0;
        burst.currentFrame++;
      }

      if (burst.currentFrame >= this.totalFrames) {
        this.activeBursts.splice(i, 1);
      }
    }

    this.ctx.restore();

    if (this.activeBursts.length > 0) {
      this.animFrameId = requestAnimationFrame(() => this.renderLoop());
    } else {
      this.animFrameId = null;
    }
  }
}

export const paladinVFXEngine = new PaladinVFXEngine();
