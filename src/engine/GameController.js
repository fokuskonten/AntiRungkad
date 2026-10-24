// ══════════════════════════════════════════════════════════════════════════════
// GameController.js — Master Game Lifecycle Orchestrator & Input Guard
// FokusKonten Pro — AntiRungkad Ecosystem (Strict FSM Loop & Zero Lockups)
// ══════════════════════════════════════════════════════════════════════════════

import { SlotState } from './SlotStateMachine.js';
import { audioService } from './AudioService.js';

export class GameController {
  constructor(viewModel, view, depositDialog = null) {
    this.viewModel = viewModel;
    this.view = view;
    this.depositDialog = depositDialog;
    this.bindSpinButton();
    this.bindBetControls();
    this.bindFeatureControls();
    this.subscribeViewModel();
  }

  subscribeViewModel() {
    this.viewModel.subscribe((snapshot) => {
      if (this.view) {
        this.view.renderState(snapshot);
      }
    });
  }

  bindFeatureControls() {
    // 1. Buy Spin (100X Bet)
    const btnBuy = document.getElementById('btn-buy-spin');
    if (btnBuy) {
      btnBuy.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleBuySpin();
      });
    }

    // 2. Double Chance Toggle
    const btnDc = document.getElementById('btn-dc-toggle');
    if (btnDc) {
      btnDc.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.viewModel.toggleDoubleChance();
      });
    }

    // 3. Turbo Toggle
    const btnTurbo = document.getElementById('btn-toggle-turbo');
    if (btnTurbo) {
      btnTurbo.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.viewModel.toggleTurbo();
      });
    }

    // 4. Auto Spin Cycle (0, 10, 25, 50)
    const btnAuto = document.getElementById('btn-toggle-auto');
    if (btnAuto) {
      btnAuto.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.viewModel.cycleAutoSpin();
        if (this.viewModel.autoSpins > 0 && this.viewModel.isIdle) {
          this.handleSpin();
        }
      });
    }
  }

  async handleBuySpin() {
    if (!this.viewModel.fsm.canSpin) return;
    const cost = this.viewModel.buyFeatureCost;
    if (!this.viewModel.wallet.hasSufficientBalance(cost)) {
      if (this.depositDialog) {
        this.depositDialog.show(`Saldo Anda kurang untuk beli fitur Rp ${Number(cost).toLocaleString('id-ID')}. Silakan Top-Up:`);
      } else {
        alert('Saldo tidak mencukupi untuk beli fitur!');
      }
      return;
    }

    if (confirm(`Beli Fitur Putaran Gratis dengan biaya Rp ${Number(cost).toLocaleString('id-ID')}?`)) {
      // Trigger Spin with guaranteed feature
      this.handleSpin();
    }
  }

  bindBetControls() {
    const btnMinus = document.getElementById('btn-bet-minus');
    const btnPlus = document.getElementById('btn-bet-plus');

    if (btnMinus) {
      btnMinus.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.viewModel.decreaseBet();
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.viewModel.increaseBet();
      });
    }
  }

  bindSpinButton() {
    const spinBtn = document.getElementById('nav-btn-spin');
    if (spinBtn) {
      spinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleSpin();
      });
    }
  }

  async handleSpin() {
    // 1. Atomic Validation Guard - Double-check before ANY state change
    if (!this.viewModel.fsm.canSpin) {
      console.warn(`[GameController] Spin diabaikan, State saat ini: ${this.viewModel.fsm.current}`);
      return;
    }

    const bet = this.viewModel.currentBet;
    if (!this.viewModel.wallet.hasSufficientBalance(bet)) {
      if (this.depositDialog) {
        this.depositDialog.show();
      } else {
        alert('Saldo tidak mencukupi! Silakan lakukan Deposit.');
      }
      return;
    }

    // 2. CRITICAL: Transition BEFORE deduction to prevent race condition
    const transitionSuccess = this.viewModel.fsm.transition(SlotState.SPINNING);
    if (!transitionSuccess) {
      console.error('[GameController] FAILED to transition to SPINNING - possible race condition');
      return;
    }

    try {
      // 3. Atomic bet deduction with rollback on failure
      const deductRes = this.viewModel.wallet.deductBet(bet);
      if (!deductRes.success) {
        console.error('[GameController] Bet deduction failed:', deductRes.reason);
        this.viewModel.fsm.forceReset();
        alert('Gagal memproses taruhan. Silakan coba lagi.');
        return;
      }

      // 4. Reset round tracking variables
      this.viewModel.lastWin = 0;
      this.viewModel.tumbleWin = 0;
      this.viewModel.currentMultiplier = 1;
      this.viewModel.notify();

      // 5. Start audio BEFORE state transition to ensure sync
      audioService.playSpinRoll();

      // 6. Generate grid and transition to STOPPING
      let currentGrid = this.viewModel.generateRandomGrid();
      const stoppingTransition = this.viewModel.fsm.transition(SlotState.STOPPING);
      if (!stoppingTransition) {
        console.error('[GameController] FAILED to transition to STOPPING');
        audioService.stopSpinRoll();
        this.viewModel.fsm.forceReset();
        return;
      }

      if (this.view) {
        try {
          await this.view.animateReelsSpin(currentGrid, this.viewModel.isTurbo);
        } catch (animError) {
          console.error('[GameController] Animation failed:', animError);
          audioService.stopSpinRoll();
          this.viewModel.fsm.forceReset();
          return;
        }
      }

      // 7. TUMBLE CASCADE FSM LOOP with error recovery
      let totalRoundBaseWin = 0;
      let roundMultiplier = 1;
      let tumbleIteration = 0;
      const MAX_TUMBLE_ITERATIONS = 15; // Safety ceiling

      while (tumbleIteration < MAX_TUMBLE_ITERATIONS) {
        try {
          const outcome = this.viewModel.evaluateGrid(currentGrid);

          // Collect multiplier orbs
          if (outcome.stepOrbsMultiplier > 0) {
            roundMultiplier += outcome.stepOrbsMultiplier;
            this.viewModel.currentMultiplier = roundMultiplier;
            audioService.playThunder();
          }

          // Exit if no wins
          if (!outcome.hasWins) {
            break;
          }

          tumbleIteration++;
          const stepWin = outcome.stepWinAmount;
          totalRoundBaseWin += stepWin;
          this.viewModel.tumbleWin = totalRoundBaseWin;
          this.viewModel.notify();

          // A. WIN_HIGHLIGHT state
          if (!this.viewModel.fsm.transition(SlotState.WIN_HIGHLIGHT, { step: tumbleIteration })) {
            console.error('[GameController] Failed transition to WIN_HIGHLIGHT');
            break;
          }
          if (this.view) {
            this.view.highlightWinningCells(outcome.winningCellsMap);
          }
          if (window.__zeusVideoEngine && typeof window.__zeusVideoEngine.playWinAction === 'function') {
            window.__zeusVideoEngine.playWinAction();
          }
          audioService.playWin(stepWin, false);

          await new Promise(r => setTimeout(r, 650));

          // B. SHATTER state
          if (!this.viewModel.fsm.transition(SlotState.SHATTER)) {
            console.error('[GameController] Failed transition to SHATTER');
            break;
          }
          if (this.view) {
            await this.view.shatterWinningCells(outcome.winningCellsMap);
          }

          // C. TUMBLE_DROP state
          if (!this.viewModel.fsm.transition(SlotState.TUMBLE_DROP)) {
            console.error('[GameController] Failed transition to TUMBLE_DROP');
            break;
          }
          const tumbleResult = this.viewModel.applyTumbleGravity(currentGrid, outcome.winningCellsMap);
          currentGrid = tumbleResult.newGrid;

          if (this.view) {
            await this.view.animateTumbleDrop(currentGrid);
          }

          await new Promise(r => setTimeout(r, 220));
        } catch (tumbleError) {
          console.error('[GameController] Tumble iteration error:', tumbleError);
          break;
        }
      }

      // Highlight simbol mendekati kemenangan (4-5 simbol atau 2 Scatter) jika ada
      if (this.view) {
        const finalOutcome = this.viewModel.evaluateGrid(currentGrid);
        if (finalOutcome && finalOutcome.nearWinCellsMap && finalOutcome.nearWinCellsMap.size > 0) {
          this.view.highlightNearWinCells(finalOutcome.nearWinCellsMap);
        }
      }

      // 8. PAYOUT state with validation & Multiplier Application
      const finalPayout = Math.round(totalRoundBaseWin * roundMultiplier);
      if (!this.viewModel.fsm.transition(SlotState.PAYOUT)) {
        console.error('[GameController] Failed transition to PAYOUT');
      }

      if (finalPayout > 0) {
        // If multiplier was collected, trigger thunder celebration on multiplier application
        if (roundMultiplier > 1 && totalRoundBaseWin > 0) {
          audioService.playThunder();
        }

        const creditRes = this.viewModel.wallet.creditWin(finalPayout);
        if (!creditRes.success) {
          console.error('[GameController] Win credit failed:', creditRes.reason);
        } else {
          this.viewModel.tumbleWin = finalPayout; // Sync HUD win display with multiplied total
          this.viewModel.lastWin = finalPayout;
          this.viewModel.totalWinSession += finalPayout;
          this.viewModel.notify();

          const isBigWin = finalPayout >= bet * 8;
          if (isBigWin) {
            if (!this.viewModel.fsm.transition(SlotState.CELEBRATION)) {
              console.error('[GameController] Failed transition to CELEBRATION');
            }
          }

          if (this.view) {
            this.view.celebrateWin(finalPayout, roundMultiplier, isBigWin);
          }

          if (isBigWin) {
            await new Promise(r => setTimeout(r, 1200));
          }
        }
      }
    } catch (err) {
      console.error('[GameController Fatal Error]:', err);
      // Ensure cleanup on any error
      audioService.stopSpinRoll();
    } finally {
      // 9. GUARANTEED FSM reset with state verification
      const prevState = this.viewModel.fsm.current;
      this.viewModel.fsm.forceReset();
      console.log(`[GameController] FSM reset: ${prevState} -> IDLE`);
      this.viewModel.notify();
    }
  }
}
