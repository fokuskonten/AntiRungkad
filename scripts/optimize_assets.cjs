'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_ASSETS = path.join(ROOT_DIR, 'public', 'assets');
const ARSIP_DIR = path.join(ROOT_DIR, '_ARSIP_SEMENTARA', '05_Media_Video_dan_Audio_Standby');
const REDUNDAN_DIR = path.join(ROOT_DIR, '_SIAP_HAPUS_REDUNDAN', '01_Duplikat_dan_Eliminasi_Redundan');

fs.mkdirSync(ARSIP_DIR, { recursive: true });
fs.mkdirSync(REDUNDAN_DIR, { recursive: true });

function moveFile(srcPath, destDir) {
  if (fs.existsSync(srcPath)) {
    const filename = path.basename(srcPath);
    const targetPath = path.join(destDir, filename);
    fs.renameSync(srcPath, targetPath);
    console.log(`[MOVE] ${filename} -> ${path.relative(ROOT_DIR, targetPath)}`);
    return true;
  }
  return false;
}

// ── FASE 1: KARANTINA ASET MATI (TIDAK DIGUNAKAN DI KODE) ──
console.log('=== FASE 1: KARANTINA ASET MATI & TIDAK DIGUNAKAN ===');
const DEAD_FILES = [
  path.join(PUBLIC_ASSETS, 'zeus_win.mp4'),
  path.join(PUBLIC_ASSETS, 'zeus_idle.mp4'),
  path.join(PUBLIC_ASSETS, 'sound', 'effects', 'zeus_thunder_real.wav'),
  path.join(PUBLIC_ASSETS, 'audio', 'thunderclap_nosferatu.wav'),
  path.join(PUBLIC_ASSETS, 'audio', 'thunder_claps.ogg'),
  path.join(PUBLIC_ASSETS, 'sound', 'lose', 'lose_game_over.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'lose', 'gameOver.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'spin', 'spin_thunder_whoosh.wav'),
  path.join(PUBLIC_ASSETS, 'audio', 'spin_sound.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'spin', 'spin_sound.wav'),
  path.join(PUBLIC_ASSETS, 'audio', 'win_sound.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'win', 'win_sound.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'win', 'win_big_orchestral.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'win', 'snd_big_win.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'win', 'win_bonus_feature.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'win', 'Bonus.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'win', 'snd_bonus.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'lose', 'snd_loose.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'lose', 'Loose.wav'),
  path.join(PUBLIC_ASSETS, 'sound', 'lose', 'lose_round_miss.wav')
];

DEAD_FILES.forEach(f => moveFile(f, ARSIP_DIR));

// ── FASE 2: KARANTINA DUPLIKAT BANNER & BACKGROUND ──
console.log('\n=== FASE 2: KARANTINA DUPLIKAT BANNER & BACKGROUND ===');
const DUPLICATE_FILES = [
  path.join(PUBLIC_ASSETS, 'banner_1.png'), // Duplikat banner_1.jpg
  path.join(PUBLIC_ASSETS, 'banner_2.png'), // Duplikat banner_2.jpg
  path.join(PUBLIC_ASSETS, 'backgrounds', 'olympus_bg.jpg') // Duplikat olympus_bg.jpg
];

DUPLICATE_FILES.forEach(f => moveFile(f, REDUNDAN_DIR));

// ── FASE 3: KOMPRESI AUDIO BGM UTAMA (bgm.webm) ──
console.log('\n=== FASE 3: KOMPRESI AUDIO BGM (bgm.webm) ===');
const bgmPath = path.join(PUBLIC_ASSETS, 'bgm.webm');
if (fs.existsSync(bgmPath)) {
  const bgmBak = path.join(ARSIP_DIR, 'bgm_original_4mb.webm');
  fs.copyFileSync(bgmPath, bgmBak);
  const bgmTemp = path.join(PUBLIC_ASSETS, 'bgm_compressed.webm');
  // Kompresi Opus 64 kbps stereo, jernih & hemat memori
  execSync(`ffmpeg -y -i "${bgmBak}" -c:a libopus -b:a 64k -vbr on "${bgmTemp}"`, { stdio: 'inherit' });
  fs.renameSync(bgmTemp, bgmPath);
  const newSize = fs.statSync(bgmPath).size;
  console.log(`[BGM COMPRESSED] bgm.webm -> ${(newSize / 1024).toFixed(1)} KB`);
}

// ── FASE 4: KOMPRESI GAMBAR BANNER & BACKGROUND UTAMA ──
console.log('\n=== FASE 4: KOMPRESI GAMBAR BANNER & BACKGROUND ===');
const LARGE_IMAGES = [
  path.join(PUBLIC_ASSETS, 'banner_1.jpg'),
  path.join(PUBLIC_ASSETS, 'banner_2.jpg'),
  path.join(PUBLIC_ASSETS, 'zeus_god.jpg'),
  path.join(PUBLIC_ASSETS, 'olympus_bg.jpg')
];

LARGE_IMAGES.forEach(imgPath => {
  if (fs.existsSync(imgPath)) {
    const oldSize = fs.statSync(imgPath).size;
    const tempPath = imgPath.replace('.jpg', '_opt.jpg');
    // Resize jika lebar > 1280px dan kompresi JPEG quality 78
    execSync(`ffmpeg -y -i "${imgPath}" -vf "scale='min(1280,iw)':-2" -q:v 3 "${tempPath}"`, { stdio: 'inherit' });
    fs.renameSync(tempPath, imgPath);
    const newSize = fs.statSync(imgPath).size;
    console.log(`[IMG OPT] ${path.basename(imgPath)}: ${(oldSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB`);
  }
});

// ── FASE 5: KOMPRESI 10 SIMBOL GAME AKTIF (.PNG) ──
console.log('\n=== FASE 5: KOMPRESI 10 SIMBOL GAME AKTIF ===');
const SYMBOLS_DIR = path.join(PUBLIC_ASSETS, 'symbols');
if (fs.existsSync(SYMBOLS_DIR)) {
  const symbols = fs.readdirSync(SYMBOLS_DIR).filter(f => f.endsWith('.png'));
  symbols.forEach(symFile => {
    const symPath = path.join(SYMBOLS_DIR, symFile);
    const oldSize = fs.statSync(symPath).size;
    const tempPath = path.join(SYMBOLS_DIR, `opt_${symFile}`);
    // Simbol slot ditampilkan di grid 5x4 maksimal ukuran ~120px di layar HP
    // Scale ke 256x256 (retina 2x), kompresi PNG level 9
    try {
      execSync(`ffmpeg -y -i "${symPath}" -vf "scale='min(256,iw)':-2" "${tempPath}"`, { stdio: 'ignore' });
      if (fs.existsSync(tempPath) && fs.statSync(tempPath).size < oldSize) {
        fs.renameSync(tempPath, symPath);
        const newSize = fs.statSync(symPath).size;
        console.log(`[SYM OPT] ${symFile}: ${(oldSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB`);
      } else if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (_) {}
  });
}

// ── FASE 6: AUDIT TOTAL AKHIR UKURAN ASSETS ──
console.log('\n=== FASE 6: AUDIT TOTAL AKHIR UKURAN ASSETS ===');
function calcDirSize(dir) {
  let total = 0;
  let count = 0;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const sub = calcDirSize(full);
      total += sub.total;
      count += sub.count;
    } else {
      total += stat.size;
      count++;
    }
  });
  return { total, count };
}

const finalStat = calcDirSize(PUBLIC_ASSETS);
console.log(`Hasil Akhir public/assets: ${finalStat.count} berkas, ${(finalStat.total / (1024 * 1024)).toFixed(2)} MB`);
