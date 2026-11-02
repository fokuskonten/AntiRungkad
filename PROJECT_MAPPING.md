# PROJECT_MAPPING.md — Peta Arsitektur Satelit PWA AntiRungkad

> Single Source of Truth (SSOT) teknis arsitektur, aset grafis, audio engine, dan panduan optimasi performa seluler untuk PWA AntiRungkad.

---

## 1. IDENTITAS & REPOSITORI PROYEK

* **Nama Proyek**: AntiRungkad WebGL / PWA Arcade Simulator
* **Lokasi Root**: `D:\AplikasiPWA\AntiRungkad\`
* **Remote Git**: `https://github.com/fokuskonten/AntiRungkad.git` (Branch: `master`)
* **Arsitektur Stack**: HTML5 PWA + Vite 6 + Vanilla JS Modular (MVVM Slot State Machine) + Web Audio API (Polyphonic AudioBuffer) + Canvas 2D VFX Engine.
* **Port Dev Lokal**: Port `5174` (`npm run dev`)
* **Build Target**: `dist/` (Rollup multi-page input: `index`, `lobby`, `game`, `deposit`, `account`, `promo`, `dashboard`)

---

## 2. PETA BERKAS KUNCI (DIRECT-HIT)

* **Halaman Game Utama**:
  - `game.html`: Struktur arena game, 5x4 slot frame mount, scoreboard HUD, dan docked navigation.
  - `src/game.js`: Entry point game, inisialisasi ViewModel, View, Controller, dan `ParticleCanvas`.
* **Engine Game**:
  - `src/engine/SlotViewModel.js`: State machine slot (IDLE, SPINNING, WIN_HIGHLIGHT, SHATTER, TUMBLE_DROP), logika balance & taruhan.
  - `src/engine/SlotView.js`: Rendering DOM grid 5x4, trigger animasi reel, petir prosedural Zeus (`strikeZeusLightning`), dan tumbling.
  - `src/engine/GameController.js`: Koordinasi alur spin, tumble loops, win evaluasi, dan audio cues.
  - `src/engine/RNGService.js`: Random Number Generator, matrix evaluasi 5x4, paytable, Scatter, dan Orb Multiplier.
  - `src/engine/AudioService.js`: Web Audio API `AudioContext` polyphonic non-blocking audio engine.
  - `src/engine/PaladinVFXEngine.js`: Spritesheet frame-by-frame burst canvas.
* **Styling & GPU Optimization**:
  - `src/styles/stone-frame.css`: Frame emas Yunani 5x4, animasi reel vertical scroll hardware-accelerated.
  - `src/styles/game.css`: Tata letak panggung arena game, live video background, HUD, dan tombol fitur.
  - `src/styles/tokens.css` & `style.css`: Palet warna, tipografi, dan komponen global.
* **Aset Multimedia Utama**:
  - `public/assets/olympus_live_bg.mp4`: Background cinematic Olympus 720p (711 KB, zero-audio stream).
  - `public/assets/symbols/`: 10 aset simbol SVG/PNG permata & mahkota resolusi tinggi.
  - `public/assets/sound/`: Koleksi berkas audio efek reel roll, reel stop, win, dan crystal shatter.

---

## 3. DOKTRIN PERFORMA SELULER (ANTI-LAG ZERO COMPOSITING PENALTY)

1. **Video Background Ringan**:
   - `olympus_live_bg.mp4` dikompresi maksimal menggunakan FFmpeg H.264 CRF 27 tanpa trek audio (beban memori < 1 MB).
   - Diisolasi pada GPU layer tersendiri menggunakan `transform: translateZ(0); will-change: transform; backface-visibility: hidden;`.
2. **Haram CSS `filter: blur()` pada Animasi Reel**:
   - Dilarang keras menerapkan CSS `filter: blur()` pada elemen yang bergerak vertikal dengan durasi `0.1s`.
   - Gunakan transisi `opacity: 0.88;` dan `transform: translateY(...) translateZ(0);` agar diproses langsung di GPU tanpa Gaussian rasterization.
3. **Canvas 2D Hardware Additive Blending**:
   - Gunakan `ctx.globalCompositeOperation = 'lighter'` untuk efek glow petir/bintang tanpa memanggil `ctx.shadowBlur` di perangkat HP.
   - Partikel ambient di-throttle ke 30 FPS dan dipangkas jumlahnya menjadi 22 partikel pada layar mobile (`< 768px`).
4. **Zero Layout Thrashing**:
   - Dilarang memicu reflow paksa (`void element.offsetWidth`) di tengah siklus animasi tumbling/petir.
   - Gunakan `requestAnimationFrame` untuk transisi kelas CSS animasi.

---

## 4. SKRIP CEPAT 1-BARIS

* **Jalankan Dev Server**:
  `cd D:\AplikasiPWA\AntiRungkad; npm run dev` (buka `http://localhost:5174/game.html`)
* **Kompilasi Rilis Produksi**:
  `cd D:\AplikasiPWA\AntiRungkad; npm run build`
* **Audit File Size Assets**:
  `Get-ChildItem -Path D:\AplikasiPWA\AntiRungkad\dist\assets\ -Recurse | Select-Object Name, Length`
