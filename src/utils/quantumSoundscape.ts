// Quantum Soundscape Procedural Audio Engine (Hybrid Multi-Layer Synthesis)
// Web Audio API implementation: 100% Procedural, 0 KB Network Footprint, Offline Capable.

export type BinauralMode = 'gamma' | 'beta' | 'alpha' | 'theta';
export type NoiseType = 'brown' | 'pink' | 'white';
export type DronePreset = 'deep' | 'subtle' | 'pulsing';

export interface SoundscapeState {
  isPlaying: boolean;
  masterVolume: number;
  channel1Volume: number; // Noise
  channel1Muted: boolean;
  channel2Volume: number; // Binaural
  channel2Muted: boolean;
  channel3Volume: number; // Sci-Fi Drone
  channel3Muted: boolean;
  noiseType: NoiseType;
  binauralMode: BinauralMode;
  dronePreset: DronePreset;
  autoSyncPomodoro: boolean;
}

const STORAGE_KEY = 'quantum_soundscape_settings_v1';

export const BINAURAL_CONFIGS: Record<BinauralMode, { name: string; beatHz: number; carrierHz: number; desc: string; color: string }> = {
  gamma: {
    name: 'Gamma (40 Hz)',
    beatHz: 40,
    carrierHz: 200,
    desc: 'Hiperenfoque analítico, resolución de problemas y síntesis de alto nivel.',
    color: '#d6f421',
  },
  beta: {
    name: 'Beta (15 Hz)',
    beatHz: 15,
    carrierHz: 200,
    desc: 'Atención sostenida, ejecución ágil y combate contra la procrastinación.',
    color: '#00f0ff',
  },
  alpha: {
    name: 'Alpha (10 Hz)',
    beatHz: 10,
    carrierHz: 200,
    desc: 'Flujo creativo relajado, lectura profunda y asimilación sin estrés.',
    color: '#38ef7d',
  },
  theta: {
    name: 'Theta (6 Hz)',
    beatHz: 6,
    carrierHz: 180,
    desc: 'Ideación abstracta, diseño conceptual y pensamiento divergente.',
    color: '#b5179e',
  },
};

export const NOISE_CONFIGS: Record<NoiseType, { name: string; desc: string }> = {
  brown: {
    name: 'Marrón Profundo (1/f²)',
    desc: 'Rumor cavernoso y envolvente. Desactiva la hiperactividad del sistema nervioso.',
  },
  pink: {
    name: 'Rosa Equilibrado (1/f)',
    desc: 'Densidad espectral balanceada. Óptimo para lectura y redacción.',
  },
  white: {
    name: 'Blanco Suave (Plano)',
    desc: 'Máximo aislamiento de ruidos estocásticos y conversaciones externas.',
  },
};

class QuantumSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Channel 1: Noise Masking
  private ch1Gain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  // Channel 2: Binaural Beats
  private ch2Gain: GainNode | null = null;
  private oscLeft: OscillatorNode | null = null;
  private oscRight: OscillatorNode | null = null;
  private binauralFilter: BiquadFilterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;

  // Channel 3: Sci-Fi Procedural Drone
  private ch3Gain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneLfo: OscillatorNode | null = null;
  private droneLfoGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  // State
  private stopTimeoutId: number | null = null;
  private state: SoundscapeState = {
    isPlaying: false,
    masterVolume: 0.75,
    channel1Volume: 0.65,
    channel1Muted: false,
    channel2Volume: 0.55,
    channel2Muted: false,
    channel3Volume: 0.6,
    channel3Muted: false,
    noiseType: 'brown',
    binauralMode: 'beta',
    dronePreset: 'deep',
    autoSyncPomodoro: true,
  };

  private listeners: Set<(state: SoundscapeState) => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed, isPlaying: false };
      }
    } catch (e) {
      console.warn('Failed to load soundscape config', e);
    }
  }

  private persistState() {
    if (typeof window === 'undefined') return;
    try {
      const { isPlaying, ...toSave } = this.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {}
  }

  public subscribe(fn: (state: SoundscapeState) => void): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
    this.persistState();
  }

  public getState(): SoundscapeState {
    return { ...this.state };
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

        // Master gentle low-pass to avoid digital clipping & fatigue
        const masterFilter = this.ctx.createBiquadFilter();
        masterFilter.type = 'lowpass';
        masterFilter.frequency.value = 14000;

        this.masterGain.connect(masterFilter);
        masterFilter.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ==========================================
  // CHANNEL 1: Procedural Noise Synthesis
  // ==========================================
  private createNoiseBuffer(type: NoiseType): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = this.ctx.sampleRate * 5; // 5-second seamless buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      // Brown Noise (1/f² integration with anti-drift decay)
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.2;
      }
    }

    return buffer;
  }

  private startChannel1() {
    if (!this.ctx || !this.masterGain) return;
    this.stopChannel1();

    this.ch1Gain = this.ctx.createGain();
    const targetVol = this.state.channel1Muted ? 0 : this.state.channel1Volume * 0.65;
    this.ch1Gain.gain.setValueAtTime(targetVol, this.ctx.currentTime);

    this.noiseFilter = this.ctx.createBiquadFilter();
    if (this.state.noiseType === 'brown') {
      this.noiseFilter.type = 'lowpass';
      this.noiseFilter.frequency.value = 750;
    } else if (this.state.noiseType === 'pink') {
      this.noiseFilter.type = 'lowpass';
      this.noiseFilter.frequency.value = 2000;
    } else {
      this.noiseFilter.type = 'lowpass';
      this.noiseFilter.frequency.value = 4500;
    }

    const buffer = this.createNoiseBuffer(this.state.noiseType);
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.ch1Gain);
    this.ch1Gain.connect(this.masterGain);

    this.noiseSource.start(0);
  }

  private stopChannel1() {
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch (e) {}
      try { this.noiseSource.disconnect(); } catch (e) {}
      this.noiseSource = null;
    }
    if (this.noiseFilter) {
      try { this.noiseFilter.disconnect(); } catch (e) {}
      this.noiseFilter = null;
    }
    if (this.ch1Gain) {
      try { this.ch1Gain.disconnect(); } catch (e) {}
      this.ch1Gain = null;
    }
  }

  // ==========================================
  // CHANNEL 2: Binaural Beats Engine (Stereo)
  // ==========================================
  private startChannel2() {
    if (!this.ctx || !this.masterGain) return;
    this.stopChannel2();

    this.ch2Gain = this.ctx.createGain();
    const targetVol = this.state.channel2Muted ? 0 : this.state.channel2Volume * 0.45;
    this.ch2Gain.gain.setValueAtTime(targetVol, this.ctx.currentTime);

    const config = BINAURAL_CONFIGS[this.state.binauralMode];
    const carrier = config.carrierHz;
    const delta = config.beatHz;

    // Filter to eliminate harsh digital edges from pure sines
    this.binauralFilter = this.ctx.createBiquadFilter();
    this.binauralFilter.type = 'lowpass';
    this.binauralFilter.frequency.value = 800;

    // Merger creates real Left (Channel 0) and Right (Channel 1) stereo beat
    this.mergerNode = this.ctx.createChannelMerger(2);

    // Left Ear Oscillator
    this.oscLeft = this.ctx.createOscillator();
    this.oscLeft.type = 'sine';
    this.oscLeft.frequency.setValueAtTime(carrier, this.ctx.currentTime);

    // Right Ear Oscillator (Carrier + Delta)
    this.oscRight = this.ctx.createOscillator();
    this.oscRight.type = 'sine';
    this.oscRight.frequency.setValueAtTime(carrier + delta, this.ctx.currentTime);

    // Connect L to ch 0, R to ch 1
    this.oscLeft.connect(this.mergerNode, 0, 0);
    this.oscRight.connect(this.mergerNode, 0, 1);

    this.mergerNode.connect(this.binauralFilter);
    this.binauralFilter.connect(this.ch2Gain);
    this.ch2Gain.connect(this.masterGain);

    this.oscLeft.start(0);
    this.oscRight.start(0);
  }

  private stopChannel2() {
    if (this.oscLeft) {
      try { this.oscLeft.stop(); } catch (e) {}
      try { this.oscLeft.disconnect(); } catch (e) {}
      this.oscLeft = null;
    }
    if (this.oscRight) {
      try { this.oscRight.stop(); } catch (e) {}
      try { this.oscRight.disconnect(); } catch (e) {}
      this.oscRight = null;
    }
    if (this.mergerNode) {
      try { this.mergerNode.disconnect(); } catch (e) {}
      this.mergerNode = null;
    }
    if (this.binauralFilter) {
      try { this.binauralFilter.disconnect(); } catch (e) {}
      this.binauralFilter = null;
    }
    if (this.ch2Gain) {
      try { this.ch2Gain.disconnect(); } catch (e) {}
      this.ch2Gain = null;
    }
  }

  // ==========================================
  // CHANNEL 3: Sci-Fi Spacecraft / Quantum Reactor Drone
  // ==========================================
  private startChannel3() {
    if (!this.ctx || !this.masterGain) return;
    this.stopChannel3();

    this.ch3Gain = this.ctx.createGain();
    const targetVol = this.state.channel3Muted ? 0 : this.state.channel3Volume * 0.55;
    this.ch3Gain.gain.setValueAtTime(targetVol, this.ctx.currentTime);

    // Base drone frequencies (audibly rich on both speakers and headphones)
    let f1 = 110; // A2
    let f2 = 165; // E3 (Perfect fifth harmonic)
    let lfoRate = 0.12;
    let lfoAmp = 0.4;

    if (this.state.dronePreset === 'subtle') {
      f1 = 130.81; // C3
      f2 = 196.0;  // G3
      lfoRate = 0.06;
      lfoAmp = 0.25;
    } else if (this.state.dronePreset === 'pulsing') {
      f1 = 98.0;   // G2
      f2 = 146.83; // D3
      lfoRate = 0.35;
      lfoAmp = 0.65;
    }

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(f1, this.ctx.currentTime);

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(f2, this.ctx.currentTime);
    this.droneOsc2.detune.value = 4; // Warm analog chorus

    // Drone Low-pass Filter
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 340;
    this.droneFilter.Q.value = 3.0;

    // LFO to modulate filter cutoff for breathing spaceship cabin hum
    this.droneLfo = this.ctx.createOscillator();
    this.droneLfo.frequency.value = lfoRate;

    this.droneLfoGain = this.ctx.createGain();
    this.droneLfoGain.gain.value = 120 * lfoAmp;

    this.droneLfo.connect(this.droneLfoGain);
    this.droneLfoGain.connect(this.droneFilter.frequency);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.ch3Gain);
    this.ch3Gain.connect(this.masterGain);

    this.droneOsc1.start(0);
    this.droneOsc2.start(0);
    this.droneLfo.start(0);
  }

  private stopChannel3() {
    if (this.droneOsc1) {
      try { this.droneOsc1.stop(); } catch (e) {}
      try { this.droneOsc1.disconnect(); } catch (e) {}
      this.droneOsc1 = null;
    }
    if (this.droneOsc2) {
      try { this.droneOsc2.stop(); } catch (e) {}
      try { this.droneOsc2.disconnect(); } catch (e) {}
      this.droneOsc2 = null;
    }
    if (this.droneLfo) {
      try { this.droneLfo.stop(); } catch (e) {}
      try { this.droneLfo.disconnect(); } catch (e) {}
      this.droneLfo = null;
    }
    if (this.droneLfoGain) {
      try { this.droneLfoGain.disconnect(); } catch (e) {}
      this.droneLfoGain = null;
    }
    if (this.droneFilter) {
      try { this.droneFilter.disconnect(); } catch (e) {}
      this.droneFilter = null;
    }
    if (this.ch3Gain) {
      try { this.ch3Gain.disconnect(); } catch (e) {}
      this.ch3Gain = null;
    }
  }

  // ==========================================
  // PUBLIC CONTROLS & LIFECYCLE
  // ==========================================

  public start(fadeDuration = 0.5) {
    if (this.stopTimeoutId !== null) {
      window.clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    this.startChannel1();
    this.startChannel2();
    this.startChannel3();

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.01, this.masterGain.gain.value), now);
    this.masterGain.gain.linearRampToValueAtTime(this.state.masterVolume, now + fadeDuration);

    this.state.isPlaying = true;
    this.notify();
  }

  public stop(fadeDuration = 0.4) {
    if (this.stopTimeoutId !== null) {
      window.clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    if (!this.ctx || !this.masterGain || !this.state.isPlaying) {
      this.stopChannel1();
      this.stopChannel2();
      this.stopChannel3();
      this.state.isPlaying = false;
      this.notify();
      return;
    }

    this.state.isPlaying = false;
    this.notify();

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);

    this.stopTimeoutId = window.setTimeout(() => {
      this.stopChannel1();
      this.stopChannel2();
      this.stopChannel3();
      this.stopTimeoutId = null;
    }, (fadeDuration + 0.05) * 1000);
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public setMasterVolume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.state.masterVolume = v;
    if (this.ctx && this.masterGain && this.state.isPlaying) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
    this.notify();
  }

  public setChannel1Volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.state.channel1Volume = v;
    if (v > 0 && this.state.channel1Muted) {
      this.state.channel1Muted = false;
    }
    if (this.ctx && this.ch1Gain && !this.state.channel1Muted) {
      this.ch1Gain.gain.setValueAtTime(v * 0.65, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleChannel1Mute() {
    this.state.channel1Muted = !this.state.channel1Muted;
    if (this.ctx && this.ch1Gain) {
      const v = this.state.channel1Muted ? 0 : this.state.channel1Volume * 0.65;
      this.ch1Gain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
    this.notify();
  }

  public setChannel2Volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.state.channel2Volume = v;
    if (v > 0 && this.state.channel2Muted) {
      this.state.channel2Muted = false;
    }
    if (this.ctx && this.ch2Gain && !this.state.channel2Muted) {
      this.ch2Gain.gain.setValueAtTime(v * 0.45, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleChannel2Mute() {
    this.state.channel2Muted = !this.state.channel2Muted;
    if (this.ctx && this.ch2Gain) {
      const v = this.state.channel2Muted ? 0 : this.state.channel2Volume * 0.45;
      this.ch2Gain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
    this.notify();
  }

  public setChannel3Volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.state.channel3Volume = v;
    if (v > 0 && this.state.channel3Muted) {
      this.state.channel3Muted = false;
    }
    if (this.ctx && this.ch3Gain && !this.state.channel3Muted) {
      this.ch3Gain.gain.setValueAtTime(v * 0.55, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleChannel3Mute() {
    this.state.channel3Muted = !this.state.channel3Muted;
    if (this.ctx && this.ch3Gain) {
      const v = this.state.channel3Muted ? 0 : this.state.channel3Volume * 0.55;
      this.ch3Gain.gain.setValueAtTime(v, this.ctx.currentTime);
    }
    this.notify();
  }

  public setNoiseType(type: NoiseType) {
    this.state.noiseType = type;
    this.state.channel1Muted = false;
    if (!this.state.isPlaying) {
      this.start(0.3);
    } else {
      this.startChannel1();
      this.notify();
    }
  }

  public setBinauralMode(mode: BinauralMode) {
    this.state.binauralMode = mode;
    this.state.channel2Muted = false;
    if (!this.state.isPlaying) {
      this.start(0.3);
    } else {
      this.startChannel2();
      this.notify();
    }
  }

  public setDronePreset(preset: DronePreset) {
    this.state.dronePreset = preset;
    this.state.channel3Muted = false;
    if (!this.state.isPlaying) {
      this.start(0.3);
    } else {
      this.startChannel3();
      this.notify();
    }
  }

  public setAutoSyncPomodoro(enabled: boolean) {
    this.state.autoSyncPomodoro = enabled;
    this.notify();
  }

  // Pre-configured Soundscape Formulas
  public applyFormula(preset: 'hyperfocus' | 'calm_study' | 'void_mask' | 'fusion_core') {
    switch (preset) {
      case 'hyperfocus':
        this.state.noiseType = 'brown';
        this.state.binauralMode = 'beta';
        this.state.dronePreset = 'deep';
        this.state.channel1Volume = 0.65;
        this.state.channel2Volume = 0.6;
        this.state.channel3Volume = 0.5;
        this.state.channel1Muted = false;
        this.state.channel2Muted = false;
        this.state.channel3Muted = false;
        break;
      case 'calm_study':
        this.state.noiseType = 'pink';
        this.state.binauralMode = 'alpha';
        this.state.dronePreset = 'subtle';
        this.state.channel1Volume = 0.55;
        this.state.channel2Volume = 0.5;
        this.state.channel3Volume = 0.35;
        this.state.channel1Muted = false;
        this.state.channel2Muted = false;
        this.state.channel3Muted = false;
        break;
      case 'void_mask':
        this.state.noiseType = 'brown';
        this.state.channel1Volume = 0.85;
        this.state.channel1Muted = false;
        this.state.channel2Muted = true;
        this.state.channel3Muted = true;
        break;
      case 'fusion_core':
        this.state.noiseType = 'pink';
        this.state.binauralMode = 'gamma';
        this.state.dronePreset = 'pulsing';
        this.state.channel1Volume = 0.45;
        this.state.channel2Volume = 0.65;
        this.state.channel3Volume = 0.7;
        this.state.channel1Muted = false;
        this.state.channel2Muted = false;
        this.state.channel3Muted = false;
        break;
    }

    // Always start or refresh audio immediately when a formula is selected
    this.start(0.35);
  }

  // Quantum Bell / Tibetan Chime harmonic completion chime
  public playQuantumChime() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const harmonics = [432, 864, 1296, 2160];
    harmonics.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = 0.15 / (idx + 1);
      const decay = 2.8 / (idx * 0.4 + 1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }
}

export const quantumSoundscape = new QuantumSoundscapeEngine();
