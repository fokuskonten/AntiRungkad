// ══════════════════════════════════════════════════════════════════════════════
// UserDataService.js — Centralized Reactive User State & Transaction Engine
// FokusKonten Pro — AntiRungkad Ecosystem (Single Source of Truth)
// ══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  PROFILE: 'antirungkad_user_profile',
  BANKS: 'antirungkad_user_banks',
  BALANCE: 'antirungkad_member_balance',
  TRANSACTIONS: 'antirungkad_transactions_history',
  PROMOS: 'antirungkad_claimed_promos'
};

const DEFAULT_PROFILE = {
  uid: 'USR_8892147',
  username: 'SultanOlympus88',
  displayName: 'Sultan Olympus',
  email: 'sultan.olympus@gmail.com',
  phone: '081298765432',
  vipTier: 'VIP SULTAN',
  joinDate: '2026-01-15',
  avatar: './assets/icons/nav_account.png',
  securityPin: '123456'
};

const DEFAULT_BANKS = [
  {
    id: 'bank_1',
    bankName: 'BCA',
    accountNumber: '8830198273',
    accountHolder: 'SULTAN OLYMPUS',
    isPrimary: true
  },
  {
    id: 'bank_2',
    bankName: 'DANA',
    accountNumber: '081298765432',
    accountHolder: 'SULTAN OLYMPUS',
    isPrimary: false
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TRX-98214',
    type: 'DEPOSIT',
    title: 'Deposit QRIS Instan',
    amount: 1000000,
    status: 'SUCCESS',
    timestamp: Date.now() - 3600000 * 2,
    dateStr: 'Hari ini, 10:45 WIB'
  },
  {
    id: 'TRX-98210',
    type: 'GAME_WIN',
    title: 'Kemenangan Slot Olympus (50X Petir)',
    amount: 250000,
    status: 'SUCCESS',
    timestamp: Date.now() - 3600000 * 5,
    dateStr: 'Hari ini, 07:30 WIB'
  },
  {
    id: 'TRX-98190',
    type: 'WITHDRAW',
    title: 'Penarikan Dana ke BCA (8830198273)',
    amount: 500000,
    status: 'SUCCESS',
    timestamp: Date.now() - 86400000,
    dateStr: 'Kemarin, 19:15 WIB'
  }
];

export class UserDataService {
  constructor() {
    this._profile = this._load(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    this._banks = this._load(STORAGE_KEYS.BANKS, DEFAULT_BANKS);
    this._transactions = this._load(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    this._claimedPromos = this._load(STORAGE_KEYS.PROMOS, ['PROMO_NEW_MEMBER']);
    this._listeners = new Set();
  }

  // ── 1. PROFILE MANAGEMENT ──────────────────────────────────────────────────
  getProfile() {
    return { ...this._profile };
  }

  updateProfile({ displayName, email, phone }) {
    if (displayName) this._profile.displayName = displayName.trim();
    if (email) this._profile.email = email.trim();
    if (phone) this._profile.phone = phone.trim();
    this._save(STORAGE_KEYS.PROFILE, this._profile);
    this._notify('PROFILE_UPDATED');
    return { success: true, profile: this.getProfile() };
  }

  updateSecurityPin(oldPin, newPin) {
    if (this._profile.securityPin && this._profile.securityPin !== oldPin) {
      return { success: false, message: 'PIN lama yang Anda masukkan salah.' };
    }
    if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      return { success: false, message: 'PIN baru harus terdiri dari 6 digit angka.' };
    }
    this._profile.securityPin = newPin;
    this._save(STORAGE_KEYS.PROFILE, this._profile);
    this._notify('PIN_UPDATED');
    return { success: true, message: 'PIN keamanan 6-digit berhasil diperbarui!' };
  }

  updatePassword(oldPass, newPass) {
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
    }
    this._profile.passwordChangedAt = Date.now();
    this._save(STORAGE_KEYS.PROFILE, this._profile);
    this._notify('PASSWORD_UPDATED');
    return { success: true, message: 'Kata sandi berhasil diperbarui!' };
  }

  deleteAccount() {
    try {
      localStorage.clear();
    } catch (e) {}
    return { success: true };
  }

  // ── 2. BANK ACCOUNTS MANAGEMENT ───────────────────────────────────────────
  getBanks() {
    return [...this._banks];
  }

  addBank({ bankName, accountNumber, accountHolder }) {
    if (!bankName || !accountNumber || !accountHolder) {
      return { success: false, message: 'Semua kolom rekening wajib diisi.' };
    }

    const cleanNumber = accountNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 8) {
      return { success: false, message: 'Nomor rekening tidak valid (minimal 8 digit).' };
    }

    const newBank = {
      id: `bank_${Date.now()}`,
      bankName: bankName.toUpperCase(),
      accountNumber: cleanNumber,
      accountHolder: accountHolder.toUpperCase(),
      isPrimary: this._banks.length === 0
    };

    this._banks.push(newBank);
    this._save(STORAGE_KEYS.BANKS, this._banks);
    this._notify('BANKS_UPDATED');
    return { success: true, bank: newBank };
  }

  deleteBank(bankId) {
    this._banks = this._banks.filter(b => b.id !== bankId);
    if (this._banks.length > 0 && !this._banks.some(b => b.isPrimary)) {
      this._banks[0].isPrimary = true;
    }
    this._save(STORAGE_KEYS.BANKS, this._banks);
    this._notify('BANKS_UPDATED');
    return { success: true };
  }

  setPrimaryBank(bankId) {
    this._banks.forEach(b => {
      b.isPrimary = (b.id === bankId);
    });
    this._save(STORAGE_KEYS.BANKS, this._banks);
    this._notify('BANKS_UPDATED');
    return { success: true };
  }

  // ── 3. BALANCE & TRANSACTION MANAGEMENT ────────────────────────────────────
  getBalance() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {}
    return 1000000;
  }

  addDeposit(amount, method = 'QRIS Instan') {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Nominal deposit tidak valid.' };
    }

    const currentBal = this.getBalance();
    const newBal = currentBal + amount;
    this._save(STORAGE_KEYS.BALANCE, newBal);

    const now = new Date();
    const dateStr = `Hari ini, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this._addTransaction({
      id: `DEP-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'DEPOSIT',
      title: `Deposit (${method})`,
      amount: amount,
      status: 'SUCCESS',
      timestamp: Date.now(),
      dateStr: dateStr
    });

    this._notify('BALANCE_UPDATED');
    return { success: true, balance: newBal };
  }

  requestWithdraw(amount, bankId, pin) {
    if (this._profile.securityPin && pin !== this._profile.securityPin) {
      return { success: false, message: 'PIN keamanan 6-digit salah.' };
    }

    const currentBal = this.getBalance();
    if (amount < 25000) {
      return { success: false, message: 'Minimal penarikan adalah Rp 25.000.' };
    }
    if (currentBal < amount) {
      return { success: false, message: 'Saldo Anda tidak mencukupi untuk penarikan ini.' };
    }

    const bank = this._banks.find(b => b.id === bankId) || this._banks.find(b => b.isPrimary) || this._banks[0];
    const bankDesc = bank ? `${bank.bankName} (${bank.accountNumber})` : 'Rekening Utama';

    const newBal = currentBal - amount;
    this._save(STORAGE_KEYS.BALANCE, newBal);

    const now = new Date();
    const dateStr = `Hari ini, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    this._addTransaction({
      id: `WD-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'WITHDRAW',
      title: `Penarikan Dana ke ${bankDesc}`,
      amount: amount,
      status: 'SUCCESS',
      timestamp: Date.now(),
      dateStr: dateStr
    });

    this._notify('BALANCE_UPDATED');
    return { success: true, balance: newBal, message: 'Penarikan dana berhasil diproses ke rekening Anda!' };
  }

  getTransactions(filter = 'ALL') {
    if (filter === 'DEPOSIT') {
      return this._transactions.filter(t => t.type === 'DEPOSIT');
    }
    if (filter === 'WITHDRAW') {
      return this._transactions.filter(t => t.type === 'WITHDRAW');
    }
    if (filter === 'WIN') {
      return this._transactions.filter(t => t.type === 'GAME_WIN');
    }
    return [...this._transactions];
  }

  _addTransaction(trx) {
    this._transactions.unshift(trx);
    if (this._transactions.length > 50) {
      this._transactions = this._transactions.slice(0, 50);
    }
    this._save(STORAGE_KEYS.TRANSACTIONS, this._transactions);
  }

  // ── 4. PROMO CLAIMS ────────────────────────────────────────────────────────
  claimPromo(promoId, rewardAmount, promoTitle) {
    if (this._claimedPromos.includes(promoId)) {
      return { success: false, message: 'Anda sudah mengklaim promo ini sebelumnya.' };
    }

    this._claimedPromos.push(promoId);
    this._save(STORAGE_KEYS.PROMOS, this._claimedPromos);

    if (rewardAmount > 0) {
      this.addDeposit(rewardAmount, `Bonus Promo: ${promoTitle}`);
    }

    this._notify('PROMO_CLAIMED');
    return { success: true, message: `Selamat! Bonus ${promoTitle} sebesar Rp ${Number(rewardAmount).toLocaleString('id-ID')} telah ditambahkan ke saldo Anda!` };
  }

  isPromoClaimed(promoId) {
    return this._claimedPromos.includes(promoId);
  }

  // ── 5. REACTIVE LISTENER & STORAGE HELPERS ─────────────────────────────────
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(event) {
    for (const listener of this._listeners) {
      try {
        listener(event, {
          profile: this.getProfile(),
          balance: this.getBalance(),
          banks: this.getBanks()
        });
      } catch (e) {
        console.error('[UserDataService Notify Error]', e);
      }
    }
  }

  _save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  _load(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return fallback;
  }
}

export const userDataService = new UserDataService();
