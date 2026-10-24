import confetti from 'canvas-confetti';
import { apiClient } from '../services/api_client';

export class GameHud {
  constructor(onSpinRequested) {
    this.onSpinRequested = onSpinRequested;
    this.currentBet = 2000;
    this.minBet = 1000;
    this.maxBet = 50000;
    this.balance = 100000;
    this.isAutoSpin = false;
    this.autoSpinTimer = null;
    this.lastVerificationData = null;

    this.bindElements();
    this.initEvents();
    this.updateDisplay();
  }

  bindElements() {
    this.balanceEl = document.getElementById('user-balance');
    this.betDisplayEl = document.getElementById('bet-amount-display');
    this.spinBtn = document.getElementById('main-spin-btn');
    this.betMinusBtn = document.getElementById('bet-minus-btn');
    this.betPlusBtn = document.getElementById('bet-plus-btn');
    this.winBanner = document.getElementById('win-banner');
    this.winTitle = document.getElementById('win-title');
    this.winAmount = document.getElementById('win-amount');
    this.userDisplayNameEl = document.getElementById('user-display-name');
    this.provablyModal = document.getElementById('provably-modal');
    this.paytableModal = document.getElementById('paytable-modal');
  }

  initEvents() {
    // Bet Controls
    if (this.betMinusBtn) {
      this.betMinusBtn.addEventListener('click', () => {
        if (this.currentBet > this.minBet) {
          this.currentBet = Math.max(this.minBet, this.currentBet - 1000);
          this.updateDisplay();
        }
      });
    }

    if (this.betPlusBtn) {
      this.betPlusBtn.addEventListener('click', () => {
        if (this.currentBet < this.maxBet) {
          this.currentBet = Math.min(this.maxBet, this.currentBet + 1000);
          this.updateDisplay();
        }
      });
    }

    // Quick Bet Buttons
    document.querySelectorAll('.quick-bet-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-bet'), 10);
        if (val) {
          this.currentBet = val;
          this.updateDisplay();
        }
      });
    });

    // Spin Button
    if (this.spinBtn) {
      this.spinBtn.addEventListener('click', () => this.handleSpinClick());
    }

    // Top-up Button
    const topupBtn = document.getElementById('topup-btn');
    if (topupBtn) {
      topupBtn.addEventListener('click', async () => {
        const res = await apiClient.topup(100000);
        if (res.success) {
          this.setBalance(res.balance);
          this.showNotification('🎉 ' + res.message);
        }
      });
    }

    // Provably Fair Modal
    const provablyBtn = document.getElementById('provably-fair-btn');
    if (provablyBtn) {
      provablyBtn.addEventListener('click', () => this.showProvablyModal());
    }
    const provablyClose = document.getElementById('provably-modal-close');
    if (provablyClose) {
      provablyClose.addEventListener('click', () => {
        if (this.provablyModal) this.provablyModal.style.display = 'none';
      });
    }

    // Paytable Modal
    const paytableBtn = document.getElementById('paytable-btn');
    if (paytableBtn) {
      paytableBtn.addEventListener('click', () => {
        if (this.paytableModal) this.paytableModal.style.display = 'flex';
      });
    }
    const paytableClose = document.getElementById('paytable-modal-close');
    if (paytableClose) {
      paytableClose.addEventListener('click', () => {
        if (this.paytableModal) this.paytableModal.style.display = 'none';
      });
    }
  }

  handleSpinClick() {
    if (this.balance < this.currentBet) {
      this.showNotification('⚠️ Saldo koin tidak cukup. Silakan klik tombol Top-Up Gratis!');
      return;
    }
    this.hideWinBanner();
    this.setSpinningState(true);
    if (this.onSpinRequested) {
      this.onSpinRequested(this.currentBet);
    }
  }

  setSpinningState(isSpinning) {
    if (this.spinBtn) {
      this.spinBtn.disabled = isSpinning;
      this.spinBtn.querySelector('.spin-btn-text').textContent = isSpinning ? 'MEMUTAR...' : 'SPIN PETIR';
    }
    if (this.betMinusBtn) this.betMinusBtn.disabled = isSpinning;
    if (this.betPlusBtn) this.betPlusBtn.disabled = isSpinning;
  }

  setBalance(amount) {
    this.balance = amount;
    this.updateDisplay();
  }

  setUserProfile(user) {
    if (this.userDisplayNameEl) {
      this.userDisplayNameEl.textContent = user ? (user.displayName || user.username) : 'Pemain Tamu';
    }
  }

  updateDisplay() {
    if (this.balanceEl) {
      this.balanceEl.textContent = this.balance.toLocaleString('id-ID');
    }
    if (this.betDisplayEl) {
      this.betDisplayEl.textContent = this.currentBet.toLocaleString('id-ID');
    }
  }

  showWin(totalWin, isJackpot = false) {
    if (this.winBanner) {
      this.winTitle.textContent = isJackpot ? '⚡ JACKPOT PETIR ZEUS ANTI-RUNGKAD! ⚡' : '🎉 MENANG BESAR!';
      this.winAmount.textContent = '+' + totalWin.toLocaleString('id-ID') + ' KOIN';
      this.winBanner.style.display = 'block';

      // Fire Confetti
      confetti({
        particleCount: isJackpot ? 150 : 80,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }

  hideWinBanner() {
    if (this.winBanner) {
      this.winBanner.style.display = 'none';
    }
  }

  setLastVerification(verification) {
    this.lastVerificationData = verification;
  }

  showProvablyModal() {
    if (!this.provablyModal) return;
    this.provablyModal.style.display = 'flex';

    const serverSeedHashEl = document.getElementById('pf-server-hash');
    const clientSeedEl = document.getElementById('pf-client-seed');
    const nonceEl = document.getElementById('pf-nonce');
    const roundHashEl = document.getElementById('pf-round-hash');
    const signatureEl = document.getElementById('pf-signature');

    if (this.lastVerificationData) {
      if (serverSeedHashEl) serverSeedHashEl.textContent = this.lastVerificationData.serverSeedHash;
      if (clientSeedEl) clientSeedEl.textContent = this.lastVerificationData.clientSeed;
      if (nonceEl) nonceEl.textContent = this.lastVerificationData.nonce;
      if (roundHashEl) roundHashEl.textContent = this.lastVerificationData.roundHash;
      if (signatureEl) signatureEl.textContent = this.lastVerificationData.signature;
    } else {
      if (serverSeedHashEl) serverSeedHashEl.textContent = 'Lakukan putaran pertama untuk melihat cryptographic seed.';
    }
  }

  showNotification(msg) {
    alert(msg);
  }
}
