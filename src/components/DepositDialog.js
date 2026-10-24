// ══════════════════════════════════════════════════════════════════════════════
// DepositDialog.js — Authentic Megawin / Olympus Gold Top-Up & Wallet Dialog
// FokusKonten Pro — AntiRungkad Ecosystem (Strict Design Token Harmonization)
// ══════════════════════════════════════════════════════════════════════════════

import { audioService } from '../engine/AudioService.js';

export class DepositDialog {
  constructor(walletService) {
    this.wallet = walletService;
    this.overlay = null;
    this._initDom();
    this._bindEvents();
  }

  _initDom() {
    let existing = document.getElementById('deposit-modal-overlay');
    if (existing) {
      this.overlay = existing;
      return;
    }

    const currentBalanceFormatted = this.wallet 
      ? Number(this.wallet.balance).toLocaleString('id-ID')
      : '0';

    const overlay = document.createElement('div');
    overlay.id = 'deposit-modal-overlay';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `
      <div class="modal-card gold-modal-box">
        <button type="button" class="modal-close-btn" id="btn-close-deposit" aria-label="Tutup">✕</button>
        
        <div class="modal-header">
          <div class="modal-icon-badge">
            <img src="./assets/icons/nav_deposit.png" alt="Deposit" class="modal-icon" />
          </div>
          <h3 class="modal-title">TOP UP SALDO</h3>
        </div>

        <div class="current-balance-bar">
          <span class="bal-label">SALDO SAAT INI</span>
          <div class="bal-val-group">
            <span class="bal-curr">Rp</span>
            <span class="bal-val" id="dialog-current-balance">${currentBalanceFormatted}</span>
          </div>
        </div>

        <p class="modal-desc" id="deposit-modal-desc">
          Saldo Anda tidak mencukupi untuk taruhan saat ini. Pilih nominal isi ulang instan di bawah:
        </p>
        
        <div class="nominal-grid">
          <button type="button" class="btn-nominal" data-amount="50000">
            <span class="nom-currency">Rp</span>
            <span class="nom-val">50.000</span>
          </button>
          <button type="button" class="btn-nominal" data-amount="100000">
            <span class="nom-currency">Rp</span>
            <span class="nom-val">100.000</span>
          </button>
          <button type="button" class="btn-nominal" data-amount="500000">
            <span class="nom-currency">Rp</span>
            <span class="nom-val">500.000</span>
          </button>
          <button type="button" class="btn-nominal gold-vip" data-amount="1000000">
            <span class="nom-currency">Rp</span>
            <span class="nom-val">1.000.000</span>
            <span class="vip-tag">VIP</span>
          </button>
        </div>

        <form class="custom-topup-section" id="form-custom-deposit">
          <input 
            type="number" 
            class="input-custom-deposit" 
            id="input-deposit-amount" 
            placeholder="Nominal lain (Rp)..." 
            min="10000" 
            step="5000"
          />
          <button type="submit" class="btn-submit-deposit">ISI</button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  _bindEvents() {
    if (!this.overlay) return;

    // Close button
    const btnClose = this.overlay.querySelector('#btn-close-deposit');
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.preventDefault();
        audioService.playButtonClick();
        this.hide();
      });
    }

    // Click outside backdrop to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // Quick Nominal Buttons
    const nominalBtns = this.overlay.querySelectorAll('.btn-nominal');
    nominalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = parseInt(btn.getAttribute('data-amount'), 10);
        this._processDeposit(amount);
      });
    });

    // Custom Deposit Form
    const form = this.overlay.querySelector('#form-custom-deposit');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.overlay.querySelector('#input-deposit-amount');
        if (input) {
          const val = parseInt(input.value, 10);
          if (val && val >= 10000) {
            this._processDeposit(val);
            input.value = '';
          }
        }
      });
    }

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  _processDeposit(amount) {
    if (amount > 0 && this.wallet) {
      this.wallet.addDeposit(amount);
      audioService.playWin(amount);
      this.hide();
    }
  }

  show(customMessage = null) {
    if (!this.overlay) return;

    // Update real-time balance display
    if (this.wallet) {
      const balEl = this.overlay.querySelector('#dialog-current-balance');
      if (balEl) {
        balEl.textContent = Number(this.wallet.balance).toLocaleString('id-ID');
      }
    }

    if (customMessage) {
      const desc = this.overlay.querySelector('#deposit-modal-desc');
      if (desc) desc.textContent = customMessage;
    }

    audioService.playButtonClick();
    this.overlay.classList.remove('hidden');
  }

  hide() {
    if (!this.overlay) return;
    this.overlay.classList.add('hidden');
  }
}
