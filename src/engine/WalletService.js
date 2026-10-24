// ══════════════════════════════════════════════════════════════════════════════
// WalletService.js — Atomic Balance Management & Persistence Service
// FokusKonten Pro — AntiRungkad Ecosystem (Zero Balance Desync)
// ══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'antirungkad_member_balance';
const DEFAULT_INITIAL_BALANCE = 1000000;

export class WalletService {
  constructor(initialBalance = DEFAULT_INITIAL_BALANCE) {
    this._balance = this._loadBalance(initialBalance);
    this._listeners = new Set();
    this._isLocked = false;
    this._pendingTransaction = false; // Track ongoing transactions
  }

  get balance() {
    return this._balance;
  }

  hasSufficientBalance(amount) {
    return Number.isFinite(amount) && amount > 0 && this._balance >= amount;
  }

  // Debit Taruhan secara Atomik dengan Transaction Lock
  deductBet(betAmount) {
    if (this._pendingTransaction) {
      console.warn('[WalletService] Transaction in progress, deductBet blocked');
      return { success: false, reason: 'TRANSACTION_IN_PROGRESS', currentBalance: this._balance };
    }

    if (!this.hasSufficientBalance(betAmount)) {
      return { success: false, reason: 'INSUFFICIENT_BALANCE', currentBalance: this._balance };
    }

    this._pendingTransaction = true;
    try {
      this._balance -= betAmount;
      this._persistBalance();
      this._notify({ type: 'DEDUCT', amount: betAmount, balance: this._balance });
      return { success: true, balance: this._balance };
    } catch (error) {
      console.error('[WalletService] Deduct transaction error:', error);
      return { success: false, reason: 'TRANSACTION_ERROR', currentBalance: this._balance };
    } finally {
      this._pendingTransaction = false;
    }
  }

  // Kredit Hadiah Kemenangan secara Atomik dengan Transaction Lock
  creditWin(winAmount) {
    if (this._pendingTransaction) {
      console.warn('[WalletService] Transaction in progress, creditWin blocked');
      return { success: false, reason: 'TRANSACTION_IN_PROGRESS', balance: this._balance };
    }

    if (!Number.isFinite(winAmount) || winAmount <= 0) {
      return { success: false, reason: 'INVALID_AMOUNT', balance: this._balance };
    }

    this._pendingTransaction = true;
    try {
      this._balance += winAmount;
      this._persistBalance();
      this._notify({ type: 'CREDIT', amount: winAmount, balance: this._balance });
      return { success: true, balance: this._balance };
    } catch (error) {
      console.error('[WalletService] Credit transaction error:', error);
      return { success: false, reason: 'TRANSACTION_ERROR', balance: this._balance };
    } finally {
      this._pendingTransaction = false;
    }
  }

  // Deposit / Top-up Saldo Instan
  addDeposit(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return { success: false, reason: 'INVALID_AMOUNT' };
    this._balance += amount;
    this._persistBalance();
    this._notify({ type: 'DEPOSIT', amount, balance: this._balance });
    return { success: true, balance: this._balance };
  }

  // Reset Saldo (Untuk testing / deposit ulang)
  resetBalance(amount = DEFAULT_INITIAL_BALANCE) {
    this._balance = Math.max(0, amount);
    this._persistBalance();
    this._notify({ type: 'RESET', amount: this._balance, balance: this._balance });
    return this._balance;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    listener({ type: 'INIT', amount: 0, balance: this._balance });
    return () => this._listeners.delete(listener);
  }

  _persistBalance() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._balance));
      }
    } catch (e) {
      console.warn('[WalletService] Gagal menyimpan saldo ke localStorage:', e);
    }
  }

  _loadBalance(fallback) {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Number.isFinite(parsed) && parsed >= 0) {
            return parsed;
          }
        }
      }
    } catch (e) {}
    return fallback;
  }

  _notify(payload) {
    for (const listener of this._listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('[WalletService Listener Error]:', err);
      }
    }
  }
}
