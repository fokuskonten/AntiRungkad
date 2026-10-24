# AntiRungkad — WebGL Slot Arcade & 60FPS Simulation Game Engine
### Official Open Portfolio & Simulation Engine — FokusKonten Digital

**AntiRungkad** adalah game arcade simulasi kasual berbasis web modern (*browser-based 60FPS game simulation engine*) yang memamerkan kemampuan rekayasa grafis tingkat tinggi menggunakan perpaduan **WebGL**, **Three.js**, **Phaser Engine**, dan **Canvas Partikel Emas Prosedural**.

---

## 1. IKHTISAR TEKNOLOGI & FITUR ENGINE

* **60 FPS Hardware-Accelerated Graphics**: Menggunakan Three.js dan WebGL kanvas untuk efek pencahayaan dinamis dan partikel debu emas (*Gold Dust Physics*).
* **Phaser Game Engine Mechanics**: Logika putaran roda (*reel strip simulation*), perhitungan probabilitas visual acak (*RNG presentation*), dan transisi multiplier combo halus tanpa lag.
* **Progressive Web App (PWA) Offline-First**: Mendukung pemasangan instan di layar utama (*Add to Home Screen*) perangkat Android dan iOS selayaknya aplikasi natif.
* **Virtual Economy Simulation**: Sistem manajemen dompet koin virtual (*100% in-game credits*) dengan pelacakan riwayat skor harian dan penyimpanan state lokal (*LocalStorage / IndexedDB*).
* **Multi-Channel Audio Engine**: Integrasi Web Audio API dengan kontrol latar musik BGM adaptif dan efek suara (*sound FX*) reel spin responsif.

---

## 2. STACK TEKNOLOGI

* **Framework & Bundler**: Vite 6, Vanilla Modern ES Modules (ESM)
* **3D & Visual Physics**: Three.js (`v0.174.0`), Canvas Confetti (`v1.9.4`)
* **Game Engine**: Phaser 2D / 3D Reel Physics Engine
* **Icons & Styling**: Lucide Icons, Pure Modular CSS with GPU-Accelerated Animations
* **Arsitektur**: Client-Side Single Page & Multi-View Hybrid PWA

---

## 3. PANDUAN MENJALANKAN LOKAL

### Prasyarat
* Node.js v18+ atau v20+

### Instalasi Dependensi & Development Server
```bash
# Masuk ke direktori
cd App_Web/AntiRungkad

# Instal paket modul
npm install

# Jalankan server pengembangan
npm run dev
```

Aplikasi akan menyala pada `http://localhost:5174/`.

### Kompilasi Produksi (Production Build)
```bash
npm run build
```
Hasil build teroptimasi siap disajikan langsung dari folder `dist/`.

---

## 4. PENAFIAN HUKUM & ETIKA (LEGAL DISCLAIMER)

Proyek ini adalah **karya perangkat lunak simulasi game kasual dan demonstrasi teknologi grafis WebGL**. 
* **100% Koin Virtual**: Seluruh saldo, poin taruhan virtual, dan hadiah di dalam game ini murni merupakan koin simulasi tanpa nilai tukar mata uang riil.
* **Bebas Perjudian**: Tidak memfasilitasi transaksi uang tunai, deposit perbankan riil, maupun penarikan dana nyata (*No Real-Money Gambling*).
* Dibuat murni sebagai karya portofolio rekayasa grafis dan animasi interaktif web FokusKonten.

---
&copy; 2026 FokusKonten Digital — All Rights Reserved.
