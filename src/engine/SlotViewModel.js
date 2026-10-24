// ══════════════════════════════════════════════════════════════════════════════
// SlotViewModel.js — Master Orchestrator (Clean Architecture & FSM Binding)
// FokusKonten Pro — AntiRungkad Ecosystem (Zero Ambiguity / Zero Race Conditions)
// ══════════════════════════════════════════════════════════════════════════════

import { SlotStateMachine, SlotState } from './SlotStateMachine.js';
import { WalletService } from './WalletService.js';
import { RNGService } from './RNGService.js';
import { audioService } from './AudioService.js';

export class SlotViewModel {
  constructor() {
    this.fsm = new SlotStateMachine(SlotState.IDLE);
    this.wallet = new WalletService(1000000);
    this.rng = new RNGService();
    this.audio = audioService;

    this.betLevels = [400, 800, 1200, 2000, 5000, 10000, 25000, 50000, 100000];
    this.betIndex = 4; // Default Rp 5.000

    this.lastWin = 0;
    this.tumbleWin = 0;
    this.totalWinSession = 0;
    this.currentMultiplier = 1;
    this.isTurbo = false;
    this.isDoubleChance = false;
    this.autoSpins = 0;
    this.currentGrid = this.rng.generateGrid();

    this._listeners = new Set();

    // Dengarkan mutasi saldo dari wallet untuk broadcast ke View
    this.wallet.subscribe(() => this.notify());
    this.fsm.subscribe((from, to) => this.notify({ from, to }));
  }

  get baseBet() {
    return this.betLevels[this.betIndex] || 5000;
  }

  get currentBet() {
    const base = this.baseBet;
    return this.isDoubleChance ? Math.round(base * 1.25) : base;
  }

  get buyFeatureCost() {
    return this.baseBet * 100;
  }

  get balance() {
    return this.wallet.balance;
  }

  get stateName() {
    return this.fsm.current;
  }

  get isIdle() {
    return this.fsm.isIdle;
  }

  get canSpin() {
    return this.fsm.canSpin && this.wallet.hasSufficientBalance(this.currentBet);
  }

  toggleDoubleChance() {
    if (!this.fsm.canChangeBet) return false;
    this.isDoubleChance = !this.isDoubleChance;
    this.audio.playButtonClick();
    this.notify();
    return this.isDoubleChance;
  }

  toggleTurbo() {
    this.isTurbo = !this.isTurbo;
    this.audio.playButtonClick();
    this.notify();
    return this.isTurbo;
  }

  cycleAutoSpin() {
    const options = [0, 10, 25, 50];
    const currIdx = options.indexOf(this.autoSpins);
    const nextIdx = (currIdx + 1) % options.length;
    this.autoSpins = options[nextIdx];
    this.audio.playButtonClick();
    this.notify();
    return this.autoSpins;
  }

  // Kontrol Taruhan (+ / -) dengan Guard Status IDLE
  increaseBet() {
    if (!this.fsm.canChangeBet) return false;
    if (this.betIndex < this.betLevels.length - 1) {
      this.betIndex++;
      this.audio.playButtonClick();
      this.notify();
      return true;
    }
    return false;
  }

  decreaseBet() {
    if (!this.fsm.canChangeBet) return false;
    if (this.betIndex > 0) {
      this.betIndex--;
      this.audio.playButtonClick();
      this.notify();
      return true;
    }
    return false;
  }

  generateRandomGrid() {
    this.currentGrid = this.rng.generateGrid();
    return this.currentGrid;
  }

  // Eksekusi Runtuhan Langkah Tunggal
  evaluateGrid(grid) {
    return this.rng.evaluateStep(grid, this.currentBet);
  }

  applyTumbleGravity(grid, winningCellsMap) {
    const newGrid = this.rng.applyTumble(grid, winningCellsMap);
    this.currentGrid = newGrid;
    return { newGrid };
  }

  subscribe(listener) {
    this._listeners.add(listener);
    listener(this.getSnapshot());
    return () => this._listeners.delete(listener);
  }

  getSnapshot() {
    return {
      state: this.fsm.current,
      isIdle: this.fsm.isIdle,
      balance: this.wallet.balance,
      currentBet: this.currentBet,
      betIndex: this.betIndex,
      lastWin: this.lastWin,
      tumbleWin: this.tumbleWin,
      totalWinSession: this.totalWinSession,
      currentMultiplier: this.currentMultiplier,
      isTurbo: this.isTurbo,
      currentGrid: this.currentGrid
    };
  }

  notify(extra = {}) {
    const snapshot = { ...this.getSnapshot(), ...extra };
    for (const listener of this._listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[SlotViewModel Listener Error]:', err);
      }
    }
  }
}
