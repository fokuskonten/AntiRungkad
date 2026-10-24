// ══════════════════════════════════════════════════════════════════════════════
// AudioService.js — High-End Web Audio API Engine (Zero IDM Interception & 0ms Latency)
// FokusKonten Pro — AntiRungkad Ecosystem (Polyphonic AudioBuffer Architecture)
// ══════════════════════════════════════════════════════════════════════════════

export class AudioService {
  constructor() {
    this._isMuted = false;
    this._audioCtx = null;
    this._gainNode = null;
    this._buffers = {};
    this._activeSpinSource = null;
    this._activeSpinGain = null;
    this._activeWinSource = null;
    this._isSpinning = false;

    this.soundPaths = {
      spinRoll:     './assets/sound/spin/snd_reel_roll.mp3',
      reelStop:     './assets/sound/spin/snd_reel_stop.wav',
      crystalBreak: './assets/sound/effects/crystal_shatter.wav',
      thunder:      './assets/audio/real_thunder.ogg',
      winCoins:     './assets/sound/win/win_coins.wav',
      bigWin:       './assets/sound/win/big_win.wav',
      btnClick:     './assets/sound/effects/button.mp3'
    };

    this._initWebAudio();
  }

  _getAudioContext() {
    if (!this._audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this._audioCtx = new AudioCtxClass();
        this._gainNode = this._audioCtx.createGain();
        this._gainNode.connect(this._audioCtx.destination);
      }
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume().catch(() => {});
    }
    return this._audioCtx;
  }

  _initWebAudio() {
    if (typeof window === 'undefined') return;

    // Preload audio files as binary ArrayBuffers (IDM never intercepts ArrayBuffer fetch)
    for (const [key, path] of Object.entries(this.soundPaths)) {
      fetch(path, { cache: 'force-cache' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(arrayBuffer => {
          const ctx = this._getAudioContext();
          if (ctx) {
            return ctx.decodeAudioData(arrayBuffer).then(decoded => {
              this._buffers[key] = decoded;
            });
          }
        })
        .catch(() => {
          // Graceful fallback: sound will be synthesized if file is missing
        });
    }

    // Auto-unlock AudioContext on first user interaction
    const unlock = () => {
      const ctx = this._getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  get isMuted() {
    return this._isMuted;
  }

  setMuted(muted) {
    this._isMuted = !!muted;
    if (this._gainNode) {
      this._gainNode.gain.value = this._isMuted ? 0 : 1;
    }
    if (this._isMuted) {
      this.stopSpinRoll();
    }
  }

  _playBuffer(key, volume = 0.8, loop = false) {
    if (this._isMuted) return null;
    const ctx = this._getAudioContext();
    if (!ctx) return null;

    const buffer = this._buffers[key];
    if (!buffer) {
      // Synthetic fallback chime if buffer not yet decoded
      this._playSyntheticFallback(key, volume);
      return null;
    }

    try {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.loop = loop;
      gain.gain.value = Math.max(0, Math.min(1, volume));

      source.connect(gain);
      gain.connect(this._gainNode || ctx.destination);
      source.start(0);

      return { source, gain };
    } catch (e) {
      return null;
    }
  }

  _playSyntheticFallback(key, volume = 0.5) {
    const ctx = this._getAudioContext();
    if (!ctx || this._isMuted) return;

    try {
      const now = ctx.currentTime;

      if (key === 'thunder') {
        // High-end realistic thunder synthesis (White noise explosion + sub-bass lowpass rumble)
        const bufferSize = ctx.sampleRate * 2.2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 1.6);

        const thunderGain = ctx.createGain();
        thunderGain.gain.setValueAtTime(volume * 1.1, now);
        thunderGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        whiteNoise.connect(filter);
        filter.connect(thunderGain);
        thunderGain.connect(this._gainNode || ctx.destination);
        whiteNoise.start(now);
      } else if (key === 'reelStop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._gainNode || ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
        gain.gain.setValueAtTime(volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (key === 'winCoins' || key === 'bigWin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._gainNode || ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880.00, now + 0.08);
        gain.gain.setValueAtTime(volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (key === 'crystalBreak') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._gainNode || ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (key === 'btnClick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._gainNode || ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
        gain.gain.setValueAtTime(volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {}
  }

  playOneShot(key, volume = 0.75) {
    this._playBuffer(key, volume, false);
  }

  playSpinRoll() {
    if (this._isMuted || this._isSpinning) return;
    this.stopSpinRoll();
    this._isSpinning = true;

    const res = this._playBuffer('spinRoll', 0.8, true);
    if (res) {
      this._activeSpinSource = res.source;
      this._activeSpinGain = res.gain;
    }
  }

  duckSpinRoll(targetVolume = 0.3) {
    if (this._activeSpinGain && this._audioCtx) {
      try {
        const now = this._audioCtx.currentTime;
        this._activeSpinGain.gain.setValueAtTime(this._activeSpinGain.gain.value, now);
        this._activeSpinGain.gain.linearRampToValueAtTime(Math.max(0, targetVolume), now + 0.1);
      } catch (e) {}
    }
  }

  stopSpinRoll() {
    if (this._activeSpinSource) {
      try {
        this._activeSpinSource.stop(0);
        this._activeSpinSource.disconnect();
      } catch (e) {}
      this._activeSpinSource = null;
      this._activeSpinGain = null;
    }
    this._isSpinning = false;
  }

  playReelStop(colIndex = 0) {
    const volMap = [0.82, 0.85, 0.88, 0.92, 0.96];
    const vol = volMap[colIndex] || 0.88;
    this._playBuffer('reelStop', vol, false);
  }

  playShatter() {
    this._playBuffer('crystalBreak', 0.9, false);
  }

  playThunder(volume = 1.0) {
    if (this._isMuted) return;

    const ctx = this._getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Pure WebAudio Buffer Playback (Zero IDM Interception)
    this._playBuffer('thunder', volume, false);
  }

  playWin(amount, isBigWin = false) {
    if (this._activeWinSource) {
      try {
        this._activeWinSource.stop(0);
      } catch (e) {}
      this._activeWinSource = null;
    }

    const key = isBigWin ? 'bigWin' : 'winCoins';
    const vol = isBigWin ? 1.0 : 0.9;
    const res = this._playBuffer(key, vol, false);
    if (res) {
      this._activeWinSource = res.source;
    }
  }

  playButtonClick() {
    this._playBuffer('btnClick', 0.5, false);
  }
}

export const audioService = new AudioService();

