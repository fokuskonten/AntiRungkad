// ══════════════════════════════════════════════════════════════════════════════
// game.js — Standalone Slot Game Arena Entry Point (Pure Decoupled Logic)
// FokusKonten Pro — AntiRungkad Masterpiece
// ══════════════════════════════════════════════════════════════════════════════

import { SlotViewModel } from './engine/SlotViewModel.js';
import { SlotView } from './engine/SlotView.js';
import { GameController } from './engine/GameController.js';
import { DepositDialog } from './components/DepositDialog.js';
import { globalBgm } from './services/GlobalBgmService.js';

// ── 1. FLOATING LUXURY SPARKLE PARTICLES ──────────────────────────────────────
class ParticleCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;
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
        vy: -Math.random() * 0.5 - 0.2,
        baseAlpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.04 + 0.015,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  drawStar(cx, cy, outerRadius, innerRadius, color, alpha) {
    const rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / 4;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < 4; i++) {
      x = cx + Math.cos(rot + i * step * 2) * outerRadius;
      y = cy + Math.sin(rot + i * step * 2) * outerRadius;
      this.ctx.lineTo(x, y);
      x = cx + Math.cos(rot + i * step * 2 + step) * innerRadius;
      y = cy + Math.sin(rot + i * step * 2 + step) * innerRadius;
      this.ctx.lineTo(x, y);
    }
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

// ── 2. STANDALONE GAME ORCHESTRATOR ──────────────────────────────────────────
class StandaloneGameApp {
  constructor() {
    console.log('[StandaloneGameApp] Initializing game arena...');
    this.particleEngine = new ParticleCanvas('particles-canvas');
    this.viewModel = new SlotViewModel();
    this.view = new SlotView('game-canvas-mount', this.viewModel);
    this.depositDialog = new DepositDialog(this.viewModel.wallet);
    this.controller = new GameController(this.viewModel, this.view, this.depositDialog);

    // Global BGM seamlessly handles cross-page persistent state
    globalBgm.attachUiListeners();
    console.log('[StandaloneGameApp] Game initialized successfully with 100% preserved logic');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new StandaloneGameApp();
});
