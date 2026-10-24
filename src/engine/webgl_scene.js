import * as THREE from 'three';
import { audioEngine } from './audio_engine';

export class WebGLScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.reels = [];
    this.symbols = [];
    this.loadedImages = {};
    this.isSpinning = false;
    this.spinVelocities = [0, 0, 0];
    this.targetRotations = [0, 0, 0];
    this.currentRotations = [0, 0, 0];
    this.reelStops = [false, false, false];
    this.onSpinComplete = null;

    this.initThree();
    this.initLights();
    this.initEnvironment();
    this.initReels();
    this.initParticles();
    this.updateCamera();
    this.animate();

    window.addEventListener('resize', () => this.updateCamera());
  }

  setSymbols(symbolsList) {
    this.symbols = symbolsList;
    this.updateReelTextures();
  }

  initThree() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    const canvas = this.renderer.domElement;
    canvas.id = 'webgl-canvas';
    this.container.appendChild(canvas);
  }

  updateCamera() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;

    if (aspect < 0.6) {
      this.camera.position.set(0, 0.3, Math.max(13, 6.2 / aspect));
    } else if (aspect < 1.0) {
      this.camera.position.set(0, 0.2, Math.max(11, 5.5 / aspect));
    } else {
      this.camera.position.set(0, 0, 9.8);
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 2.2);
    frontLight.position.set(0, 3, 10);
    this.scene.add(frontLight);

    this.lightCyan = new THREE.PointLight(0x00e5ff, 4, 30);
    this.lightCyan.position.set(-5, 1, 5);
    this.scene.add(this.lightCyan);

    this.lightGold = new THREE.PointLight(0xffd700, 5, 30);
    this.lightGold.position.set(0, -3, 6);
    this.scene.add(this.lightGold);

    this.lightMagenta = new THREE.PointLight(0xff007f, 4, 30);
    this.lightMagenta.position.set(5, 1, 5);
    this.scene.add(this.lightMagenta);
  }

  initEnvironment() {
    this.machineGroup = new THREE.Group();
    this.scene.add(this.machineGroup);

    const gridHelper = new THREE.GridHelper(30, 30, 0x00e5ff, 0x111c38);
    gridHelper.position.y = -3.8;
    this.scene.add(gridHelper);

    const frameGeo = new THREE.BoxGeometry(8.6, 6.0, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x070b18,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x030814,
      emissiveIntensity: 0.5
    });
    this.machineFrame = new THREE.Mesh(frameGeo, frameMat);
    this.machineFrame.position.set(0, 0, -3.2);
    this.machineGroup.add(this.machineFrame);

    // Glowing subtle center line
    const laserGeo = new THREE.BoxGeometry(7.6, 0.04, 0.04);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6 });
    this.paylineLaser = new THREE.Mesh(laserGeo, laserMat);
    this.paylineLaser.position.set(0, 0, 2.7);
    this.machineGroup.add(this.paylineLaser);
  }

  createSymbolTexture(symbols) {
    const numSymbols = symbols.length || 7;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = numSymbols * size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const drawAll = () => {
      ctx.fillStyle = '#060a17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      symbols.forEach((sym, i) => {
        const x = i * size;

        // 1. Radial Neon Glow
        const grad = ctx.createRadialGradient(x + 256, 256, 40, x + 256, 256, 240);
        grad.addColorStop(0, (sym.color || '#00e5ff') + '55');
        grad.addColorStop(0.7, (sym.color || '#00e5ff') + '15');
        grad.addColorStop(1, '#060a17');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, size, size);

        // 2. Tile Card Border
        ctx.strokeStyle = sym.color || '#00e5ff';
        ctx.lineWidth = 6;
        ctx.strokeRect(x + 12, 12, size - 24, size - 24);

        // 3. Rotated Drawing Context so symbols and texts are upright horizontally in 3D
        ctx.save();
        ctx.translate(x + 256, 256);
        ctx.rotate(Math.PI / 2);

        // Draw HD Image if loaded, else fallback to Emoji
        const img = this.loadedImages[sym.id];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -130, -170, 260, 260);
        } else {
          ctx.font = '140px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(sym.icon || '⚡', 0, -40);
        }

        // Draw Symbol Title (Horizontal to the player)
        ctx.font = 'bold 34px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = sym.color || '#00e5ff';
        ctx.shadowBlur = 14;
        ctx.textAlign = 'center';
        ctx.fillText((sym.name || sym.id).toUpperCase(), 0, 140);
        ctx.shadowBlur = 0;

        // Draw Payout Multiplier Badge (Horizontal to the player)
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText((sym.multiplier3x || 10) + 'X WIN', 0, 185);

        ctx.restore();
      });

      if (this.reelTexture) {
        this.reelTexture.needsUpdate = true;
      }
    };

    drawAll();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    this.reelTexture = texture;

    // Preload image assets and trigger re-render once loaded
    symbols.forEach((sym) => {
      if (sym.image && !this.loadedImages[sym.id]) {
        const img = new Image();
        img.src = './assets/symbols/' + sym.image;
        img.onload = () => {
          this.loadedImages[sym.id] = img;
          drawAll();
        };
      }
    });

    return texture;
  }

  initReels() {
    const defaultSymbols = [
      { id: 'CROWN', name: 'Petir Zeus', icon: '👑', image: 'Scatter.png', color: '#FFD700', multiplier3x: 50 },
      { id: 'LIGHTNING', name: 'Topeng Wild', icon: '⚡', image: 'Wild.png', color: '#00E5FF', multiplier3x: 25 },
      { id: 'DIAMOND', name: 'Berlian Cyan', icon: '💎', image: 'Diamond.png', color: '#00B0FF', multiplier3x: 15 },
      { id: 'GOLDEN_BELL', name: 'Cawan Bonus', icon: '🏆', image: 'Bonus.png', color: '#FFC107', multiplier3x: 10 },
      { id: 'CHERRY', name: 'Ruby Heart', icon: '❤️', image: 'Heart.png', color: '#FF1744', multiplier3x: 5 },
      { id: 'STAR', name: 'Perisai Shield', icon: '🛡️', image: 'FreeSpin.png', color: '#FFEA00', multiplier3x: 3 },
      { id: 'LEMON', name: 'Mahkota A', icon: '🅰️', image: 'A.png', color: '#AEEA00', multiplier3x: 2 }
    ];

    this.symbols = defaultSymbols;
    this.reelTexture = this.createSymbolTexture(this.symbols);

    const reelRadius = 2.6;
    const reelWidth = 2.1;
    const segments = 64;

    const reelXPositions = [-2.35, 0, 2.35];

    this.reels = reelXPositions.map((xPos) => {
      const geometry = new THREE.CylinderGeometry(reelRadius, reelRadius, reelWidth, segments, 1, true);
      const material = new THREE.MeshStandardMaterial({
        map: this.reelTexture,
        roughness: 0.15,
        metalness: 0.35,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = Math.PI / 2; // Horizontal cylinder axis
      mesh.position.set(xPos, 0, 0);
      this.machineGroup.add(mesh);
      return mesh;
    });
  }

  updateReelTextures() {
    if (this.symbols && this.symbols.length > 0) {
      this.reelTexture = this.createSymbolTexture(this.symbols);
      this.reels.forEach((mesh) => {
        mesh.material.map = this.reelTexture;
        mesh.material.needsUpdate = true;
      });
    }
  }

  initParticles() {
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x00e5ff);
    const c2 = new THREE.Color(0xffd700);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const mixed = Math.random() > 0.5 ? c1 : c2;
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  // Trigger Spin with Server Target Matrix
  startSpin(serverReelsResult, onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.onSpinComplete = onComplete;
    this.reelStops = [false, false, false];

    const numSymbols = this.symbols.length || 7;
    const step = (Math.PI * 2) / numSymbols;

    serverReelsResult.forEach((reelArray, reelIndex) => {
      const middleSymbol = reelArray[1]; // row 1 (center payline)
      let symIdx = this.symbols.findIndex(s => s.id === middleSymbol.id);
      if (symIdx === -1) symIdx = 0;

      // Calculate target angle to position symbol exactly in center view
      const extraSpins = (reelIndex + 3) * (Math.PI * 2);
      const targetAngle = this.currentRotations[reelIndex] + extraSpins + (symIdx * step);

      this.targetRotations[reelIndex] = targetAngle;
      this.spinVelocities[reelIndex] = 0.5 + (reelIndex * 0.08);
    });

    // Staggered stop timers
    setTimeout(() => { this.reelStops[0] = true; audioEngine.playReelStop(); }, 1200);
    setTimeout(() => { this.reelStops[1] = true; audioEngine.playReelStop(); }, 1800);
    setTimeout(() => { this.reelStops[2] = true; audioEngine.playReelStop(); }, 2400);
  }

  triggerWinEffect(isJackpot = false) {
    this.lightGold.intensity = isJackpot ? 12 : 8;
    this.lightCyan.intensity = isJackpot ? 10 : 7;
    setTimeout(() => {
      this.lightGold.intensity = 5;
      this.lightCyan.intensity = 4;
    }, 1600);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    if (this.particles) {
      this.particles.rotation.y = time * 0.04;
      this.particles.rotation.x = time * 0.02;
    }

    if (this.paylineLaser) {
      this.paylineLaser.material.opacity = 0.4 + Math.sin(time * 3) * 0.2;
    }

    if (this.isSpinning) {
      let allStopped = true;

      for (let i = 0; i < 3; i++) {
        if (!this.reelStops[i]) {
          this.currentRotations[i] += this.spinVelocities[i];
          allStopped = false;
        } else {
          const diff = this.targetRotations[i] - this.currentRotations[i];
          if (diff > 0.04) {
            this.currentRotations[i] += diff * 0.14;
            allStopped = false;
          } else {
            this.currentRotations[i] = this.targetRotations[i];
          }
        }

        this.reels[i].rotation.x = this.currentRotations[i];
      }

      if (allStopped && this.reelStops[2]) {
        this.isSpinning = false;
        if (this.onSpinComplete) {
          this.onSpinComplete();
          this.onSpinComplete = null;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
