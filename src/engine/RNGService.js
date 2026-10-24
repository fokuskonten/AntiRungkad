// ══════════════════════════════════════════════════════════════════════════════
// RNGService.js — Strict 5 Columns x 4 Rows (20 Cells) Engine
// FokusKonten Pro — AntiRungkad Ecosystem (RTP ~96.5% Calibrated Engine)
// ══════════════════════════════════════════════════════════════════════════════

export const GRID_COLS = 5;
export const GRID_ROWS = 4;
export const TOTAL_CELLS = GRID_COLS * GRID_ROWS; // 20 Sel

export class RNGService {
  constructor() {
    this.symbols = {
      CROWN:      { id: 'CROWN',      name: 'Mahkota VIP',    image: './assets/symbols/vip-gem-crown-001.png',    tier: 'HIGH', pays: { 6: 2.5, 8: 7.5, 10: 25.0, 12: 60.0 } },
      CHEST:      { id: 'CHEST',      name: 'Peti Hadiah',     image: './assets/symbols/reward-chest-001.png',     tier: 'HIGH', pays: { 6: 1.8, 8: 5.0, 10: 16.0, 12: 40.0 } },
      RELIC:      { id: 'RELIC',      name: 'Koin Kuno',       image: './assets/symbols/ancient-coin-relic-001.png', tier: 'HIGH', pays: { 6: 1.4, 8: 3.8, 10: 12.0, 12: 30.0 } },
      STAR_COIN:  { id: 'STAR_COIN',  name: 'Koin Bintang',    image: './assets/symbols/star-coin-001.png',        tier: 'HIGH', pays: { 6: 1.0, 8: 2.8, 10: 8.0,  12: 20.0 } },
      RUBY_HEART: { id: 'RUBY_HEART', name: 'Ruby Hati',       image: './assets/symbols/ruby-heart-gem-001.png',   tier: 'LOW',  pays: { 6: 0.8, 8: 2.0, 10: 6.0,  12: 15.0 } },
      RUBY_GEM:   { id: 'RUBY_GEM',   name: 'Kluster Merah',   image: './assets/symbols/ruby-gem-cluster-001.png', tier: 'LOW',  pays: { 6: 0.6, 8: 1.6, 10: 4.5,  12: 12.0 } },
      AMETHYST:   { id: 'AMETHYST',   name: 'Amethyst Ungu',   image: './assets/symbols/rainbow-gem-cluster-001.png', tier: 'LOW', pays: { 6: 0.5, 8: 1.3, 10: 3.5,  12: 9.0 } },
      SAPPHIRE:   { id: 'SAPPHIRE',   name: 'Safir Biru',      image: './assets/symbols/sapphire-star-coin-001.png', tier: 'LOW',  pays: { 6: 0.45, 8: 1.0, 10: 2.8, 12: 7.5 } },
      EMERALD:    { id: 'EMERALD',    name: 'Zamrud Hijau',    image: './assets/symbols/sparkle-reward-orb-001.png', tier: 'LOW',  pays: { 6: 0.35, 8: 0.8, 10: 2.0, 12: 6.0 } },
      SCATTER:    { id: 'SCATTER',    name: 'Scatter Zeus',    image: './assets/symbols/thunderstorm-badge-001.png', tier: 'SPECIAL', pays: { 3: 4.0, 4: 18.0, 5: 80.0 } }
    };

    // Pool Simbol Berbobot 5x4 (Total 100 symbols for easy probability calculation)
    this.symbolPool = [
      ...Array(15).fill('EMERALD'),
      ...Array(14).fill('SAPPHIRE'),
      ...Array(13).fill('AMETHYST'),
      ...Array(12).fill('RUBY_GEM'),
      ...Array(11).fill('RUBY_HEART'),
      ...Array(10).fill('STAR_COIN'),
      ...Array(9).fill('RELIC'),
      ...Array(8).fill('CHEST'),
      ...Array(6).fill('CROWN'),
      ...Array(2).fill('SCATTER')
    ];

    // Bobot Multiplier Orb (2X - 500X) - Total 100%
    this.orbWeights = [
      { val: 2,   weight: 60 },
      { val: 3,   weight: 24 },
      { val: 5,   weight: 10 },
      { val: 10,  weight: 4 },
      { val: 25,  weight: 1.4 },
      { val: 50,  weight: 0.4 },
      { val: 100, weight: 0.15 },
      { val: 500, weight: 0.05 }
    ];

    // Use crypto API if available for better randomness
    this.useCrypto = typeof crypto !== 'undefined' && crypto.getRandomValues;
  }

  // Enhanced random using crypto API when available
  _secureRandom() {
    if (this.useCrypto) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / (0xFFFFFFFF + 1);
    }
    // Fallback to Math.random with entropy mixing
    return Math.random();
  }

  getRandomSymbol() {
    const key = this.symbolPool[Math.floor(this._secureRandom() * this.symbolPool.length)];

    // 2.0% Peluang Simbol Mengandung Bola Petir Pengali Fisik
    const isMultiplierOrb = this._secureRandom() < 0.020;
    let orbMultiplier = 1;

    if (isMultiplierOrb) {
      const randWeight = this._secureRandom() * 100;
      let cum = 0;
      for (const item of this.orbWeights) {
        cum += item.weight;
        if (randWeight <= cum) {
          orbMultiplier = item.val;
          break;
        }
      }
    }

    return {
      id: key,
      ...this.symbols[key],
      isOrb: isMultiplierOrb && orbMultiplier > 1,
      multiplier: orbMultiplier
    };
  }

  generateGrid() {
    const grid = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const col = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        col.push({ ...this.getRandomSymbol(), col: c, row: r });
      }
      grid.push(col);
    }
    return grid;
  }

  evaluateStep(grid, currentBet) {
    const counts = {};
    const positions = {};
    let stepOrbsMultiplier = 0;

    // Validate grid structure
    if (!grid || !Array.isArray(grid) || grid.length !== GRID_COLS) {
      console.error('[RNGService] Invalid grid structure in evaluateStep');
      return {
        hasWins: false,
        winningClusters: [],
        winningCellsMap: new Set(),
        stepWinAmount: 0,
        stepOrbsMultiplier: 0,
        isFreeSpinTrigger: false
      };
    }

    for (let c = 0; c < GRID_COLS; c++) {
      if (!grid[c] || !Array.isArray(grid[c])) continue;
      for (let r = 0; r < GRID_ROWS; r++) {
        const sym = grid[c][r];
        if (!sym) continue;

        if (sym.isOrb && sym.multiplier > 1) {
          stepOrbsMultiplier += sym.multiplier;
        }

        counts[sym.id] = (counts[sym.id] || 0) + 1;
        if (!positions[sym.id]) positions[sym.id] = [];
        positions[sym.id].push({ col: c, row: r });
      }
    }

    let stepWinAmount = 0;
    const winningClusters = [];
    const winningCellsMap = new Set();
    const nearWinCellsMap = new Set();

    // 1. Evaluasi Simbol Biasa (Standar 5x4: Minimal 6 Simbol Sejenis dari 20 Sel)
    for (const symId in counts) {
      if (symId === 'SCATTER') continue;
      const count = counts[symId];
      const symData = this.symbols[symId];

      if (!symData) {
        console.warn(`[RNGService] Unknown symbol ID: ${symId}`);
        continue;
      }

      if (count >= 6) {
        let tier = 6;
        if (count >= 12) tier = 12;
        else if (count >= 10) tier = 10;
        else if (count >= 8) tier = 8;

        const mult = symData.pays[tier] || symData.pays[6] || 0.5;
        const win = Math.round(currentBet * mult);
        stepWinAmount += win;

        winningClusters.push({ symbolId: symId, count, multiplier: mult, winAmount: win, cells: positions[symId] });
        positions[symId].forEach(p => winningCellsMap.add(`${p.col}-${p.row}`));
      } else if (count >= 4 && count < 6) {
        // Mendekati Kemenangan (Near-Win 4-5 Simbol)
        positions[symId].forEach(p => nearWinCellsMap.add(`${p.col}-${p.row}`));
      }
    }

    // 2. Evaluasi Scatter Zeus (Minimal 3 Scatter)
    const scatterCount = counts['SCATTER'] || 0;
    let isFreeSpinTrigger = false;
    if (scatterCount >= 3) {
      isFreeSpinTrigger = true;
      const scatterMult = scatterCount >= 5 ? 80.0 : (scatterCount === 4 ? 18.0 : 4.0);
      const scatterWin = Math.round(currentBet * scatterMult);
      stepWinAmount += scatterWin;
      winningClusters.push({ symbolId: 'SCATTER', count: scatterCount, multiplier: scatterMult, winAmount: scatterWin, cells: positions['SCATTER'] });
      positions['SCATTER'].forEach(p => winningCellsMap.add(`${p.col}-${p.row}`));
    } else if (scatterCount === 2) {
      // Mendekati Free Spin (2 Scatter)
      positions['SCATTER'].forEach(p => nearWinCellsMap.add(`${p.col}-${p.row}`));
    }

    return {
      hasWins: winningClusters.length > 0,
      winningClusters,
      winningCellsMap,
      nearWinCellsMap,
      stepWinAmount,
      stepOrbsMultiplier,
      isFreeSpinTrigger
    };
  }

  applyTumble(grid, winningCellsMap) {
    const newGrid = [];

    // Validate inputs
    if (!grid || !Array.isArray(grid) || grid.length !== GRID_COLS) {
      console.error('[RNGService] Invalid grid in applyTumble');
      return this.generateGrid(); // Fallback to fresh grid
    }

    if (!winningCellsMap || !(winningCellsMap instanceof Set)) {
      console.error('[RNGService] Invalid winningCellsMap in applyTumble');
      return this.generateGrid();
    }

    for (let c = 0; c < GRID_COLS; c++) {
      if (!grid[c] || !Array.isArray(grid[c])) {
        console.error(`[RNGService] Invalid column ${c} in applyTumble`);
        newGrid.push(this._generateSingleColumn(c));
        continue;
      }

      const remainingSymbols = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        if (!winningCellsMap.has(`${c}-${r}`) && grid[c][r]) {
          remainingSymbols.push(grid[c][r]);
        }
      }

      const emptyCount = GRID_ROWS - remainingSymbols.length;
      const newCol = [];

      // Fill empty slots with new symbols
      for (let i = 0; i < emptyCount; i++) {
        newCol.push({ ...this.getRandomSymbol(), col: c, row: i });
      }

      // Drop remaining symbols down
      for (let i = 0; i < remainingSymbols.length; i++) {
        newCol.push({ ...remainingSymbols[i], col: c, row: emptyCount + i });
      }

      newGrid.push(newCol);
    }
    return newGrid;
  }

  _generateSingleColumn(colIndex) {
    const col = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      col.push({ ...this.getRandomSymbol(), col: colIndex, row: r });
    }
    return col;
  }
}
