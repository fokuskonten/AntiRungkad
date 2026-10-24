// ══════════════════════════════════════════════════════════════════════════════
// deposit.js — Wallet, Deposit, Withdraw, and History Controller
// FokusKonten Pro — AntiRungkad Ecosystem (Complete Logic & Reactive Balance)
// ══════════════════════════════════════════════════════════════════════════════

import { userDataService } from './services/UserDataService.js';
import { audioService } from './engine/AudioService.js';
import { globalBgm } from './services/GlobalBgmService.js';

class DepositPageApp {
  constructor() {
    this.toastEl = document.getElementById('olympus-toast');
    this.selectedMethod = 'QRIS Instan';
    this.currentHistoryFilter = 'ALL';
    
    this.updateBalanceUI();
    this.renderRegisteredBanks();
    this.renderTransactionHistory();
    this.bindTabs();
    this.bindDepositControls();
    this.bindWithdrawControls();
    this.bindHistoryFilters();

    // Subscribe to reactive balance & transactions
    userDataService.subscribe((event) => {
      if (event === 'BALANCE_UPDATED' || event === 'BANKS_UPDATED') {
        this.updateBalanceUI();
        this.renderRegisteredBanks();
        this.renderTransactionHistory();
      }
    });
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 3200);
  }

  updateBalanceUI() {
    const balEl = document.getElementById('view-wallet-balance');
    if (balEl) {
      balEl.textContent = Number(userDataService.getBalance()).toLocaleString('id-ID');
    }
  }

  renderRegisteredBanks() {
    const select = document.getElementById('select-withdraw-bank');
    if (!select) return;

    const banks = userDataService.getBanks();
    if (banks.length === 0) {
      select.innerHTML = `<option value="">Belum ada rekening terdaftar (Buka menu AKUN)</option>`;
      return;
    }

    select.innerHTML = banks.map(b => `
      <option value="${b.id}">
        ${b.bankName} — ${b.accountNumber} (a/n ${b.accountHolder}) ${b.isPrimary ? '★ UTAMA' : ''}
      </option>
    `).join('');
  }

  renderTransactionHistory() {
    const container = document.getElementById('trx-history-container');
    if (!container) return;

    const trxs = userDataService.getTransactions(this.currentHistoryFilter);
    if (trxs.length === 0) {
      container.innerHTML = `<div style="color: #94a3b8; font-size: 12px; padding: 20px; text-align: center;">Tidak ada riwayat transaksi pada filter ini.</div>`;
      return;
    }

    container.innerHTML = trxs.map(t => {
      let icon = '⚡';
      let iconClass = 'deposit';
      let sign = '+';
      let amountClass = 'positive';

      if (t.type === 'WITHDRAW') {
        icon = '💳';
        iconClass = 'withdraw';
        sign = '-';
        amountClass = 'negative';
      } else if (t.type === 'GAME_WIN') {
        icon = '👑';
        iconClass = 'win';
        sign = '+';
        amountClass = 'positive';
      }

      return `
        <div class="trx-item-card">
          <div class="trx-item-left">
            <div class="trx-type-icon ${iconClass}">${icon}</div>
            <div class="trx-meta">
              <span class="trx-title">${t.title}</span>
              <span class="trx-date">${t.dateStr} • ID: ${t.id}</span>
            </div>
          </div>
          <div class="trx-item-right">
            <span class="trx-amount ${amountClass}">${sign} Rp ${Number(t.amount).toLocaleString('id-ID')}</span>
            <span class="trx-status-tag">${t.status}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  bindTabs() {
    const tabBtns = [
      { btn: document.getElementById('btn-tab-deposit'), panel: document.getElementById('tab-deposit') },
      { btn: document.getElementById('btn-tab-withdraw'), panel: document.getElementById('tab-withdraw') },
      { btn: document.getElementById('btn-tab-history'), panel: document.getElementById('tab-history') }
    ];

    tabBtns.forEach(({ btn, panel }) => {
      if (!btn || !panel) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        audioService.playButtonClick();
        tabBtns.forEach(item => {
          if (item.btn) item.btn.classList.remove('active');
          if (item.panel) item.panel.style.display = 'none';
        });
        btn.classList.add('active');
        panel.style.display = 'block';
      });
    });
  }

  bindDepositControls() {
    // Quick chips
    const chips = document.querySelectorAll('.deposit-chip-btn');
    const inputCustom = document.getElementById('input-deposit-custom');

    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const amount = chip.getAttribute('data-amount');
        if (inputCustom) inputCustom.value = amount;
        audioService.playButtonClick();
      });
    });

    // Payment Methods
    const methodCards = document.querySelectorAll('.method-card');
    methodCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        methodCards.forEach(m => m.classList.remove('active'));
        card.classList.add('active');
        this.selectedMethod = card.getAttribute('data-method');
        audioService.playButtonClick();
      });
    });

    // Form Submit Deposit
    const formDeposit = document.getElementById('form-deposit-action');
    if (formDeposit) {
      formDeposit.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseInt(inputCustom.value, 10);
        if (amount && amount >= 10000) {
          const res = userDataService.addDeposit(amount, this.selectedMethod);
          if (res.success) {
            audioService.playWin(amount);
            this.showToast(`Deposit Rp ${Number(amount).toLocaleString('id-ID')} via ${this.selectedMethod} berhasil!`);
          }
        } else {
          alert('Minimal deposit adalah Rp 10.000');
        }
      });
    }
  }

  bindWithdrawControls() {
    const formWithdraw = document.getElementById('form-withdraw-action');
    if (formWithdraw) {
      formWithdraw.addEventListener('submit', (e) => {
        e.preventDefault();
        const bankId = document.getElementById('select-withdraw-bank').value;
        const amount = parseInt(document.getElementById('input-withdraw-amount').value, 10);
        const pin = document.getElementById('input-withdraw-pin').value;

        if (!bankId) {
          alert('Silakan daftarkan nomor rekening bank terlebih dahulu di halaman AKUN.');
          return;
        }

        const res = userDataService.requestWithdraw(amount, bankId, pin);
        if (res.success) {
          audioService.playButtonClick();
          document.getElementById('input-withdraw-amount').value = '';
          document.getElementById('input-withdraw-pin').value = '';
          this.showToast(res.message);
        } else {
          alert(res.message);
        }
      });
    }
  }

  bindHistoryFilters() {
    const filterBtns = document.querySelectorAll('.btn-filter-pill');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentHistoryFilter = btn.getAttribute('data-filter');
        audioService.playButtonClick();
        this.renderTransactionHistory();
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new DepositPageApp();
});
