// ══════════════════════════════════════════════════════════════════════════════
// promo.js — Promos, Bonuses, and VIP Rewards Controller
// FokusKonten Pro — AntiRungkad Ecosystem (Complete Logic & Reactive Claims)
// ══════════════════════════════════════════════════════════════════════════════

import { userDataService } from './services/UserDataService.js';
import { audioService } from './engine/AudioService.js';
import { globalBgm } from './services/GlobalBgmService.js';

const PROMO_DATA = [
  {
    id: 'PROMO_NEW_MEMBER',
    category: 'NEW',
    badge: 'MEMBER BARU',
    title: 'WELCOME BONUS 100%',
    icon: '🎁',
    desc: 'Dapatkan bonus tambahan 100% instan hingga Rp 100.000 untuk member baru yang baru pertama kali bergabung.',
    terms: 'Min. Deposit: Rp 50.000 • Syarat TO: 3X',
    reward: 100000,
    rewardText: 'BONUS RP 100.000'
  },
  {
    id: 'PROMO_PETIR_500X',
    category: 'SLOT',
    badge: 'EVENT PETIR',
    title: 'EXTRA BONUS PETIR 500X',
    icon: '⚡',
    desc: 'Pecahkan simbol dan dapatkan pengali petir merah 500X di Gates of Olympus untuk klaim hadiah jackpot tambahan!',
    terms: 'Min. Bet: Rp 1.000 • Berlaku Setiap Hari',
    reward: 250000,
    rewardText: 'BONUS RP 250.000'
  },
  {
    id: 'PROMO_CASHBACK_5',
    category: 'CASHBACK',
    badge: 'CASHBACK MINGGUAN',
    title: 'CASHBACK ROLLINGAN 5%',
    icon: '🔄',
    desc: 'Nikmati pengembalian dana kekalahan 5% tanpa batas setiap hari Senin langsung ke dompet saldo Anda.',
    terms: 'Otomatis Dihitung • Tanpa Syarat TO',
    reward: 50000,
    rewardText: 'CASHBACK RP 50.000'
  },
  {
    id: 'PROMO_VIP_SULTAN',
    category: 'VIP',
    badge: 'REWARD EKSKLUSIF',
    title: 'VIP SULTAN TIER BONUS',
    icon: '👑',
    desc: 'Kado apresiasi eksklusif untuk akun member yang telah mencapai status Sultan Level 5 di platform Megawin.',
    terms: 'Khusus Level Sultan • Klaim 1X per Bulan',
    reward: 500000,
    rewardText: 'REWARD RP 500.000'
  }
];

class PromoPageApp {
  constructor() {
    this.toastEl = document.getElementById('olympus-toast');
    this.currentCategory = 'ALL';
    this.renderPromos();
    this.bindCategoryFilters();

    userDataService.subscribe((event) => {
      if (event === 'PROMO_CLAIMED' || event === 'BALANCE_UPDATED') {
        this.renderPromos();
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

  renderPromos() {
    const container = document.getElementById('promo-list-container');
    if (!container) return;

    const filtered = this.currentCategory === 'ALL'
      ? PROMO_DATA
      : PROMO_DATA.filter(p => p.category === this.currentCategory);

    container.innerHTML = filtered.map(p => {
      const isClaimed = userDataService.isPromoClaimed(p.id);

      return `
        <div class="promo-card">
          <div class="promo-banner-art">
            <span class="promo-badge-tag">${p.badge}</span>
            <span class="promo-art-title">${p.title}</span>
            <span class="promo-art-icon">${p.icon}</span>
          </div>
          <div class="promo-content-body">
            <p class="promo-desc-text">${p.desc}</p>
            <div class="promo-terms-box">
              <span>📋 S&K: ${p.terms}</span>
            </div>
            <div class="promo-action-row">
              <span class="promo-reward-tag">${p.rewardText}</span>
              ${isClaimed ? `
                <button type="button" class="btn-claim-promo claimed" disabled>✓ SUDAH DIKLAIM</button>
              ` : `
                <button type="button" class="btn-claim-promo btn-action-claim" data-id="${p.id}" data-amount="${p.reward}" data-title="${p.title}">
                  KLAIM BONUS
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind Claim buttons
    container.querySelectorAll('.btn-action-claim').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const promoId = btn.getAttribute('data-id');
        const amount = parseInt(btn.getAttribute('data-amount'), 10);
        const title = btn.getAttribute('data-title');

        const res = userDataService.claimPromo(promoId, amount, title);
        if (res.success) {
          audioService.playWin(amount);
          this.showToast(res.message);
          this.renderPromos();
        } else {
          alert(res.message);
        }
      });
    });
  }

  bindCategoryFilters() {
    const filterBtns = document.querySelectorAll('.promo-category-bar .btn-filter-pill');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.getAttribute('data-cat');
        audioService.playButtonClick();
        this.renderPromos();
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PromoPageApp();
});
