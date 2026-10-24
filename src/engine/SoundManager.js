// ══════════════════════════════════════════════════════════════════════════════
// SoundManager.js — Rock-Solid Audio Engine (Pilihan User: snd_reel_roll.mp3)
// FokusKonten Pro — AntiRungkad Ecosystem (Guaranteed Audio Playback & Sync)
// ══════════════════════════════════════════════════════════════════════════════

export class SoundManager {
  constructor() {
    this.isMuted = false;
    this.currentSpinAudio = null;

    this.sounds = {
      spin:     './assets/sound/spin/snd_reel_roll.mp3', // Pilihan User untuk Putaran Reel
      reelStop: './assets/sound/effects/pointer_hit.wav', // Hentakan tajam saat reel berhenti
      win:      './assets/sound/win/win_coins.wav'        // Gemerincing koin emas saat menang
    };
  }

  play(key, volume = 0.75) {
    if (this.isMuted) return;
    const path = this.sounds[key];
    if (!path) return;

    try {
      const audio = new Audio(path);
      audio.volume = volume;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  playReelStart() {
    if (this.isMuted) return;
    this.stopRoll(); // Matikan roll sebelumnya jika masih aktif

    try {
      const audio = new Audio(this.sounds.spin);
      audio.volume = 0.85;
      audio.loop = true;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
      this.currentSpinAudio = audio;
    } catch (e) {}
  }

  playReelStop() {
    this.play('reelStop', 0.6);
  }

  stopRoll() {
    if (this.currentSpinAudio) {
      try {
        this.currentSpinAudio.pause();
        this.currentSpinAudio.currentTime = 0;
      } catch (e) {}
      this.currentSpinAudio = null;
    }
  }

  playWin(amount = 0) {
    this.play('win', 0.85);
  }
}

export const soundManager = new SoundManager();
