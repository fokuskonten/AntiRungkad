// ══════════════════════════════════════════════════════════════════════════════
// SlotView.js — Pure Reactive View for 5 Columns x 4 Rows (20 Cells) Matrix
// FokusKonten Pro — AntiRungkad Ecosystem (Strict Rhythmic Cadence & Audio Sync)
// ══════════════════════════════════════════════════════════════════════════════

import { audioService } from './AudioService.js';
import { GRID_COLS, GRID_ROWS } from './RNGService.js';

export class SlotView {
  constructor(containerId = 'game-canvas-mount', viewModel) {
    this.container = document.getElementById(containerId);
    this.viewModel = viewModel;
    this.initViewStructure();
    this.populateInitialGrid();
  }

  initViewStructure() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="gold-frame-wrapper">
        <div class="olympus-gold-frame">
          <div class="gold-corner-wing top-left"></div>
          <div class="gold-corner-wing top-right"></div>
          <div class="gold-corner-wing bottom-left"></div>
          <div class="gold-corner-wing bottom-right"></div>

          <!-- Pelat Kaca Ungu Solid dengan 5 Kolom Reel x 4 Baris (20 Sel) -->
          <div class="gold-matrix-canvas" id="stone-matrix-grid">
            ${Array(GRID_COLS).fill(0).map((_, c) => `
              <div class="gold-reel-col" id="stone-reel-${c}">
                ${Array(GRID_ROWS).fill(0).map((_, r) => `
                  <div class="gold-symbol-cell" id="stone-cell-${c}-${r}">
                    <img src="./assets/symbols/vip-gem-crown-001.png" alt="Symbol" class="symbol-img" />
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.elGrid = document.getElementById('stone-matrix-grid');
  }

  populateInitialGrid() {
    if (!this.viewModel) return;
    this.renderGrid(this.viewModel.currentGrid);
    const outcome = this.viewModel.evaluateGrid(this.viewModel.currentGrid);
    if (outcome && outcome.nearWinCellsMap && outcome.nearWinCellsMap.size > 0) {
      this.highlightNearWinCells(outcome.nearWinCellsMap);
    }
  }

  renderCellContent(sym) {
    if (!sym) return '';
    let orbBadge = '';
    if (sym.isOrb && sym.multiplier > 1) {
      orbBadge = `<div class="multiplier-orb-badge">${sym.multiplier}X</div>`;
    }
    return `
      <img src="${sym.image}" alt="${sym.name}" class="symbol-img" />
      ${orbBadge}
    `;
  }

  renderGrid(grid) {
    if (!grid) return;
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const cell = document.getElementById(`stone-cell-${c}-${r}`);
        if (cell && grid[c] && grid[c][r]) {
          cell.innerHTML = this.renderCellContent(grid[c][r]);
        }
      }
    }
  }

  renderState(snapshot) {
    if (!snapshot) return;

    // 1. Update Saldo (Balance)
    const elBalance = document.getElementById('hud-val-balance');
    if (elBalance && snapshot.balance !== undefined) {
      elBalance.textContent = 'Rp ' + Number(snapshot.balance).toLocaleString('id-ID');
    }

    // 2. Update Kemenangan (Win Score)
    const elWin = document.getElementById('hud-val-win');
    if (elWin) {
      const displayWin = snapshot.tumbleWin || snapshot.lastWin || 0;
      elWin.textContent = 'Rp ' + Number(displayWin).toLocaleString('id-ID');
      if (displayWin > 0) {
        elWin.style.transform = 'scale(1.15)';
        setTimeout(() => { if (elWin) elWin.style.transform = 'scale(1)'; }, 200);
      }
    }

    // 3. Update Nilai Taruhan (Bet)
    const elBet = document.getElementById('hud-val-bet');
    if (elBet && snapshot.currentBet !== undefined) {
      elBet.textContent = Number(snapshot.currentBet).toLocaleString('id-ID');
    }

    // 4. Update Multiplier Pill
    const multPill = document.getElementById('hud-val-multiplier');
    if (multPill) {
      if (snapshot.currentMultiplier && snapshot.currentMultiplier > 1) {
        multPill.textContent = `${snapshot.currentMultiplier}X`;
        multPill.classList.add('active');
      } else {
        multPill.classList.remove('active');
      }
    }

    // 5. Update Status Tombol Spin & Bet +/- (Disabled saat tidak IDLE)
    const isIdle = snapshot.isIdle;
    const spinBtn = document.getElementById('nav-btn-spin');
    const btnMinus = document.getElementById('btn-bet-minus');
    const btnPlus = document.getElementById('btn-bet-plus');

    if (spinBtn) {
      spinBtn.style.opacity = isIdle ? '1' : '0.75';
      spinBtn.style.pointerEvents = isIdle ? 'auto' : 'none';
    }

    if (btnMinus) {
      btnMinus.style.opacity = isIdle && snapshot.betIndex > 0 ? '1' : '0.4';
      btnMinus.style.pointerEvents = isIdle && snapshot.betIndex > 0 ? 'auto' : 'none';
    }

    if (btnPlus) {
      btnPlus.style.opacity = isIdle && snapshot.betIndex < this.viewModel.betLevels.length - 1 ? '1' : '0.4';
      btnPlus.style.pointerEvents = isIdle && snapshot.betIndex < this.viewModel.betLevels.length - 1 ? 'auto' : 'none';
    }

    // 6. Update Fitur Beli Spin & Double Chance
    const elBuyVal = document.getElementById('feat-val-buy');
    if (elBuyVal && this.viewModel) {
      elBuyVal.textContent = `Rp ${Number(this.viewModel.buyFeatureCost).toLocaleString('id-ID')}`;
    }

    const elDcStatus = document.getElementById('feat-status-dc');
    const btnDc = document.getElementById('btn-dc-toggle');
    if (elDcStatus && btnDc) {
      if (this.viewModel.isDoubleChance) {
        elDcStatus.textContent = 'ON';
        btnDc.classList.add('active');
      } else {
        elDcStatus.textContent = 'OFF';
        btnDc.classList.remove('active');
      }
    }

    // 7. Update Assist Turbo & Auto Spin
    const elTurbo = document.getElementById('label-turbo-status');
    const btnTurbo = document.getElementById('btn-toggle-turbo');
    if (elTurbo && btnTurbo) {
      elTurbo.textContent = this.viewModel.isTurbo ? 'ON' : 'OFF';
      if (this.viewModel.isTurbo) btnTurbo.classList.add('active');
      else btnTurbo.classList.remove('active');
    }

    const elAuto = document.getElementById('label-auto-status');
    const btnAuto = document.getElementById('btn-toggle-auto');
    if (elAuto && btnAuto) {
      elAuto.textContent = this.viewModel.autoSpins > 0 ? `AUTO: ${this.viewModel.autoSpins}X` : 'AUTO SPIN';
      if (this.viewModel.autoSpins > 0) btnAuto.classList.add('active');
      else btnAuto.classList.remove('active');
    }
  }

  async animateReelsSpin(initialGrid, isTurbo = false) {
    const columns = [];
    for (let c = 0; c < GRID_COLS; c++) {
      columns.push(document.getElementById(`stone-reel-${c}`));
    }

    // Validate columns exist
    if (columns.some(col => !col)) {
      console.error('[SlotView] Missing reel columns');
      return;
    }

    document.querySelectorAll('.gold-symbol-cell').forEach(cell => {
      cell.classList.remove('winning-cell', 'near-win-cell', 'shattering');
    });

    // Mulai Animasi Menggulung Vertikal
    columns.forEach(col => {
      if (col) {
        col.classList.remove('landing-vfx');
        col.classList.add('spinning');
      }
    });

    // Durasi dan Cadence Ritmik yang Presisi (520ms -> 700ms -> 880ms -> 1060ms -> 1240ms)
    const baseDuration = isTurbo ? 200 : 520;
    const colStep = isTurbo ? 50 : 180;

    // Calculate precise timing for each reel with micro-adjustments for reel 2 and 3
    const reelTimings = [];
    for (let i = 0; i < GRID_COLS; i++) {
      let timing = baseDuration + (i * colStep);
      // Add micro-adjustments for better sync on reels 2 and 3
      if (i === 2) timing += 15;  // Reel 2: +15ms adjustment
      if (i === 3) timing += 25;  // Reel 3: +25ms adjustment
      if (i === 4) timing += 30;  // Reel 4: +30ms adjustment
      reelTimings.push(timing);
    }

    return new Promise((resolve) => {
      let completedCount = 0;
      let resolved = false;

      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          // Final audio cleanup
          audioService.stopSpinRoll();
          // Clear any remaining audio references
          if (audioService._activeSpinAudio) {
            try {
              audioService._activeSpinAudio.pause();
              audioService._activeSpinAudio.currentTime = 0;
              audioService._activeSpinAudio.volume = 0;
            } catch (e) {}
          }
          resolve();
        }
      };

      const safetyTimer = setTimeout(safeResolve, 5000); // Increased safety timeout

      columns.forEach((col, cIdx) => {
        const timing = reelTimings[cIdx];

        setTimeout(() => {
          if (col) {
            // Play audio FIRST for precise sync
            audioService.playReelStop(cIdx);

            // Immediate visual changes in same frame
            col.classList.remove('spinning');

            // Pasang Simbol Hasil Putaran
            for (let r = 0; r < GRID_ROWS; r++) {
              const cell = document.getElementById(`stone-cell-${cIdx}-${r}`);
              if (cell && initialGrid[cIdx] && initialGrid[cIdx][r]) {
                cell.innerHTML = this.renderCellContent(initialGrid[cIdx][r]);
              }
            }

            // Efek Hentakan Pendaratan Kolom
            col.classList.add('landing-vfx');
            setTimeout(() => col.classList.remove('landing-vfx'), 250);

            // Ketika reel 0 mendarat, kecilkan volume putaran
            if (cIdx === 0) {
              audioService.duckSpinRoll(0.4);
            }

            // Stop spin audio early when we're close to the end (penultimate reel)
            if (cIdx === GRID_COLS - 2) {
              audioService.duckSpinRoll(0.05); // Almost silent
              // Pre-emptive stop preparation
              if (audioService._activeSpinAudio) {
                try {
                  audioService._activeSpinAudio.volume = 0.05;
                } catch (e) {}
              }
            }

            // Ketika reel terakhir mendarat, MATIKAN suara putaran seketika pada frame ini!
            if (cIdx === GRID_COLS - 1) {
              // Multiple aggressive stop techniques
              audioService.stopSpinRoll();

              // Direct DOM manipulation for audio element
              if (audioService._activeSpinAudio) {
                try {
                  audioService._activeSpinAudio.pause();
                  audioService._activeSpinAudio.currentTime = 0;
                  audioService._activeSpinAudio.volume = 0;
                  audioService._activeSpinAudio.muted = true;
                } catch (e) {
                  console.error('[SlotView] Direct audio stop error:', e);
                }
              }

              // Clear any audio pool references
              if (audioService._audioPool && audioService._audioPool['spinRoll']) {
                try {
                  audioService._audioPool['spinRoll'].pause();
                  audioService._audioPool['spinRoll'].currentTime = 0;
                } catch (e) {}
              }
            }
          }

          completedCount++;
          if (completedCount === GRID_COLS) {
            clearTimeout(safetyTimer);
            setTimeout(safeResolve, 60);
          }
        }, timing);
      });
    });
  }

  // Sorot Sel Pemenang dengan Lis Emas Berjalan
  highlightWinningCells(winningCellsMap) {
    if (!winningCellsMap || !(winningCellsMap instanceof Set)) return;

    try {
      winningCellsMap.forEach(key => {
        const [c, r] = key.split('-');
        const cell = document.getElementById(`stone-cell-${c}-${r}`);
        if (cell) cell.classList.add('winning-cell');
      });
    } catch (error) {
      console.error('[SlotView] highlightWinningCells error:', error);
    }
  }

  // Sorot Simbol Mendekati Kemenangan (Near-Win) dengan Lis Emas Berjalan
  highlightNearWinCells(nearWinCellsMap) {
    if (!nearWinCellsMap || !(nearWinCellsMap instanceof Set)) return;

    try {
      nearWinCellsMap.forEach(key => {
        const [c, r] = key.split('-');
        const cell = document.getElementById(`stone-cell-${c}-${r}`);
        if (cell && !cell.classList.contains('winning-cell')) {
          cell.classList.add('near-win-cell');
        }
      });
    } catch (error) {
      console.error('[SlotView] highlightNearWinCells error:', error);
    }
  }

  // ── ZEUS PROCEDURAL LIGHTNING STRIKE (IN-GRID & OUTSIDE-GRID PANORAMIC) ─
  strikeZeusLightning(winningCellsMap) {
    const canvas = document.getElementById('lightning-fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    // Trigger Violent Screen Shake (Smooth Double-Buffer RAF)
    const stageWrapper = document.querySelector('.game-stage-frame-wrapper') || document.getElementById('game-canvas-mount');
    if (stageWrapper) {
      stageWrapper.classList.remove('screen-shake-intense');
      requestAnimationFrame(() => {
        stageWrapper.classList.add('screen-shake-intense');
        setTimeout(() => stageWrapper.classList.remove('screen-shake-intense'), 460);
      });
    }

    // Play Booming Zeus Thunder Audio
    audioService.playThunder(1.0);

    // 1. IN-GRID TARGETS (Winning Cells)
    const inGridTargets = [];
    if (winningCellsMap && winningCellsMap instanceof Set) {
      winningCellsMap.forEach(key => {
        const [c, r] = key.split('-');
        const cell = document.getElementById(`stone-cell-${c}-${r}`);
        if (cell) {
          const cRect = cell.getBoundingClientRect();
          inGridTargets.push({
            x: cRect.left + cRect.width / 2,
            y: cRect.top + cRect.height / 2
          });
        }
      });
    }

    // 2. OUTSIDE-GRID PANORAMIC BOLTS (Flanks, Outer Pillars, Sky Arcs)
    const outsideBolts = [
      // Left Pillar Strike (Sky to Bottom-Left)
      {
        start: { x: w * 0.28, y: 15 },
        end: { x: w * 0.04, y: h * 0.88 },
        steps: 8,
        jitter: 36
      },
      // Right Pillar Strike (Sky to Bottom-Right)
      {
        start: { x: w * 0.72, y: 15 },
        end: { x: w * 0.96, y: h * 0.88 },
        steps: 8,
        jitter: 36
      },
      // Upper Sky Arc (Cross-Screen Lightning)
      {
        start: { x: w * 0.1, y: 35 },
        end: { x: w * 0.9, y: 45 },
        steps: 7,
        jitter: 24
      }
    ];

    const originX = w / 2;
    const originY = 30;
    let frameCount = 0;

    const renderFullLightning = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawBranch = (sx, sy, tx, ty, steps, jitter, mainColor, glowColor, width) => {
        ctx.save();
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = width;
        ctx.globalCompositeOperation = 'lighter'; // GPU Additive Blend
        if (w >= 768) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 14;
        }

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const nx = sx + (tx - sx) * t + (Math.random() - 0.5) * jitter;
          const ny = sy + (ty - sy) * t + (Math.random() - 0.5) * (jitter * 0.6);
          ctx.lineTo(nx, ny);
        }
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.restore();
      };

      // A. Draw In-Grid Strikes to Winning Tiles
      inGridTargets.forEach(target => {
        drawBranch(originX, originY, target.x, target.y, 6, 28, '#FFFFFF', '#FFD700', 3.8);
        drawBranch(originX, originY, target.x, target.y, 6, 20, '#38BDF8', '#38BDF8', 2.2);

        // Tile Impact Sparks
        for (let s = 0; s < 7; s++) {
          ctx.fillStyle = s % 2 === 0 ? '#FFD700' : '#FFFFFF';
          ctx.beginPath();
          ctx.arc(
            target.x + (Math.random() - 0.5) * 36,
            target.y + (Math.random() - 0.5) * 36,
            Math.random() * 3.5 + 1.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      // B. Draw Outside-Grid Panoramic Strikes
      outsideBolts.forEach(bolt => {
        drawBranch(bolt.start.x, bolt.start.y, bolt.end.x, bolt.end.y, bolt.steps, bolt.jitter, '#FFFFFF', '#FFA500', 3.2);
        drawBranch(bolt.start.x, bolt.start.y, bolt.end.x, bolt.end.y, bolt.steps, bolt.jitter * 0.7, '#60A5FA', '#60A5FA', 1.8);

        // Outer ground sparks
        for (let s = 0; s < 5; s++) {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(
            bolt.end.x + (Math.random() - 0.5) * 45,
            bolt.end.y + (Math.random() - 0.5) * 30,
            Math.random() * 3 + 1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      frameCount++;
      if (frameCount < 9) {
        requestAnimationFrame(renderFullLightning);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    renderFullLightning();
  }

  // ── EXPLOSIVE CRYSTAL & GOLD SHARDS PARTICLES ────────────────────────────
  spawnShatterParticles(cell) {
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const colors = ['#FFD700', '#FFF8B0', '#FF4500', '#38BDF8', '#FFFFFF', '#A855F7'];

    for (let i = 0; i < 14; i++) {
      const shard = document.createElement('div');
      shard.className = 'crystal-shard-particle';
      const size = Math.random() * 8 + 4;
      const angle = (Math.PI * 2 / 14) * i + (Math.random() - 0.5) * 0.45;
      const dist = Math.random() * 60 + 30;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const rot = (Math.random() - 0.5) * 360;

      shard.style.width = `${size}px`;
      shard.style.height = `${size * 0.8}px`;
      shard.style.background = colors[Math.floor(Math.random() * colors.length)];
      shard.style.left = `${centerX}px`;
      shard.style.top = `${centerY}px`;
      shard.style.setProperty('--tx', `${tx}px`);
      shard.style.setProperty('--ty', `${ty}px`);
      shard.style.setProperty('--rot', `${rot}deg`);

      document.body.appendChild(shard);
      setTimeout(() => shard.remove(), 600);
    }
  }

  // Efek Pecah & Lenyap Simbol Pemenang (Tumble Shatter dengan Petir & Partikel)
  async shatterWinningCells(winningCellsMap) {
    if (!winningCellsMap || !(winningCellsMap instanceof Set)) return;

    try {
      audioService.playShatter();
      this.strikeZeusLightning(winningCellsMap);

      winningCellsMap.forEach(key => {
        const [c, r] = key.split('-');
        const cell = document.getElementById(`stone-cell-${c}-${r}`);
        if (cell) {
          cell.classList.remove('winning-cell');
          cell.classList.add('shattering');
          this.spawnShatterParticles(cell);
        }
      });

      // Beri jeda 440ms agar pemain melihat ubin meledak dan lenyap sepenuhnya
      return new Promise(resolve => setTimeout(resolve, 440));
    } catch (error) {
      console.error('[SlotView] shatterWinningCells error:', error);
      return Promise.resolve();
    }
  }

  // Efek Simbol Runtuh ke Bawah (Tumble Cascade)
  async animateTumbleDrop(newGrid) {
    try {
      this.renderGrid(newGrid);

      // Mainkan suara landing reel stop
      audioService.playReelStop(2);

      // Animasi Simbol Meluncur Turun dari Atas dengan Hentakan
      document.querySelectorAll('.gold-symbol-cell').forEach(cell => {
        cell.classList.remove('shattering');
        cell.classList.remove('winning-cell');
        cell.classList.add('tumble-drop-in');
      });

      setTimeout(() => {
        document.querySelectorAll('.gold-symbol-cell').forEach(cell => {
          cell.classList.remove('tumble-drop-in');
        });
      }, 460);

      return new Promise(resolve => setTimeout(resolve, 450));
    } catch (error) {
      console.error('[SlotView] animateTumbleDrop error:', error);
      return Promise.resolve();
    }
  }

  celebrateWin(winAmount, multiplierVal = 1, isBigWin = false) {
    try {
      audioService.playWin(winAmount, isBigWin);
    } catch (error) {
      console.error('[SlotView] celebrateWin error:', error);
    }
  }
}
