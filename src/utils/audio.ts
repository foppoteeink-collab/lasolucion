// Web Audio API Sound Effects Synthesizer for La Solución RPG
// Redesigned for premium, pleasant, and highly polished RPG gamified audio

class SoundFX {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        // Master Bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6; // Global volume reduction for pleasantness
        
        // Gentle master lowpass filter to remove harsh digital highs
        this.masterFilter = this.ctx.createBiquadFilter();
        this.masterFilter.type = 'lowpass';
        this.masterFilter.frequency.value = 12000;
        
        this.masterGain.connect(this.masterFilter);
        this.masterFilter.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Helper for safe audio routing
  private getDestination() {
    return this.masterGain || this.ctx?.destination;
  }

  // Helper to create an envelope and oscillator
  private playTone(
    type: OscillatorType,
    freq: number,
    time: number,
    attack: number,
    decay: number,
    sustainLevel: number,
    release: number,
    peakVol: number = 0.1,
    detune: number = 0
  ) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;

    // ADSR Envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peakVol, time + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(sustainLevel, 0.001), time + attack + decay);
    
    const stopTime = time + attack + decay + release;
    gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

    osc.connect(gain);
    gain.connect(this.getDestination()!);
    
    osc.start(time);
    osc.stop(stopTime + 0.1);
  }

  // 1. CLICK - Sci-Fi Cybernetic UI Click / Micro-blip
  public playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Crisp high-tech transient chirp (1900Hz -> 650Hz fast ramp)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.018);
    
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    
    osc.connect(gain);
    gain.connect(this.getDestination()!);
    osc.start(now);
    osc.stop(now + 0.04);

    // Micro mechanical switch noise burst (5ms) for tactile cyber snap
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.006);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 3500;
      noiseFilter.Q.value = 2;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.006);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.getDestination()!);
      noise.start(now);
    } catch (e) {}
  }

  // 1.1 SUB-BASS CONFIRMATION - Heavy low-end impact for epic milestones, shop buys & Oracle saves
  public playSubBassConfirm() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Deep Sub Drop (65Hz -> 32Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.22);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.35, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    subOsc.connect(subGain);
    subGain.connect(this.getDestination()!);
    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // 2. Punch Transient (Triangle drop for chest impact)
    const punchOsc = this.ctx.createOscillator();
    const punchGain = this.ctx.createGain();
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(140, now);
    punchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

    punchGain.gain.setValueAtTime(0.2, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    punchOsc.connect(punchGain);
    punchGain.connect(this.getDestination()!);
    punchOsc.start(now);
    punchOsc.stop(now + 0.1);
  }

  // 1.2 GLITCH UI - Fast cybernetic data stutter
  public playGlitch() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [0, 0.025, 0.05].forEach((offset, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(400 + Math.random() * 800, now + offset);

      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.02);

      osc.connect(gain);
      gain.connect(this.getDestination()!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.025);
    });
  }

  // 1.25 DAMAGE SOUND - Heavy cybernetic impact with metallic alarm
  public playDamageSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    subOsc.connect(subGain);
    subGain.connect(this.getDestination()!);
    subOsc.start(now);
    subOsc.stop(now + 0.36);

    // Distortion crunch buzz
    const crunchOsc = this.ctx.createOscillator();
    const crunchGain = this.ctx.createGain();
    crunchOsc.type = 'sawtooth';
    crunchOsc.frequency.setValueAtTime(180, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    crunchGain.gain.setValueAtTime(0.18, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    crunchOsc.connect(crunchGain);
    crunchGain.connect(this.getDestination()!);
    crunchOsc.start(now);
    crunchOsc.stop(now + 0.26);

    // Warning distress chime
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const warnOsc = this.ctx.createOscillator();
      const warnGain = this.ctx.createGain();
      warnOsc.type = 'sine';
      warnOsc.frequency.setValueAtTime(440, t);
      warnOsc.frequency.setValueAtTime(370, t + 0.08);
      warnGain.gain.setValueAtTime(0.12, t);
      warnGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      warnOsc.connect(warnGain);
      warnGain.connect(this.getDestination()!);
      warnOsc.start(t);
      warnOsc.stop(t + 0.21);
    }, 120);
  }

  // 1.26 HEAL SOUND - Restorative ethereal upward harmonic chord
  public playHeal() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Harmonic frequencies: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77)
    const freqs = [523.25, 659.25, 783.99, 987.77];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.98, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.getDestination()!);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // 1.3 ORACLE ATMOSPHERE - Dark Sci-Fi Neural Drone & Resonant Frequency Texture
  public playOracleAtmosphere() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual detuned low drones (55Hz / 55.4Hz binaural pulse)
    const drone1 = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    const droneFilter = this.ctx.createBiquadFilter();

    drone1.type = 'sawtooth';
    drone2.type = 'triangle';
    drone1.frequency.value = 55.0; // A1
    drone2.frequency.value = 55.5; // subtle beat frequency

    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(220, now);
    droneFilter.frequency.linearRampToValueAtTime(650, now + 0.8);
    droneFilter.frequency.exponentialRampToValueAtTime(180, now + 2.2);

    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.gain.linearRampToValueAtTime(0.22, now + 0.35);
    droneGain.gain.setValueAtTime(0.20, now + 1.2);
    droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    drone1.connect(droneFilter);
    drone2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.getDestination()!);

    drone1.start(now);
    drone2.start(now);
    drone1.stop(now + 2.5);
    drone2.stop(now + 2.5);

    // Resonant digital sweep (simulating neural synapse scan)
    const sweepOsc = this.ctx.createOscillator();
    const sweepFilter = this.ctx.createBiquadFilter();
    const sweepGain = this.ctx.createGain();

    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.value = 110; // A2

    sweepFilter.type = 'bandpass';
    sweepFilter.Q.value = 6.0;
    sweepFilter.frequency.setValueAtTime(450, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.7);
    sweepFilter.frequency.exponentialRampToValueAtTime(600, now + 1.8);

    sweepGain.gain.setValueAtTime(0.001, now);
    sweepGain.gain.linearRampToValueAtTime(0.12, now + 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(this.getDestination()!);

    sweepOsc.start(now);
    sweepOsc.stop(now + 2.1);

    // High harmonic cyber ping (A5, C#6)
    this.playTone('sine', 880, now + 0.25, 0.02, 0.1, 0.02, 0.6, 0.06);
    this.playTone('sine', 1108.73, now + 0.45, 0.02, 0.1, 0.02, 0.7, 0.05);
  }

  // 2. COIN - Sci-Fi Digital Credit Injection
  public playCoin() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Crystalline dual-frequency optic data blip
    this.playTone('sine', 1760.00, now, 0.005, 0.04, 0.01, 0.22, 0.12); // A6
    this.playTone('sine', 2637.02, now + 0.025, 0.005, 0.05, 0.01, 0.28, 0.10); // E7
  }

  // 3. TASK COMPLETE - Sci-Fi System Execution Confirmation
  public playTaskComplete() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 1. Subtle Sub thud for satisfying tactile weight
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    subGain.gain.setValueAtTime(0.18, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    sub.connect(subGain);
    subGain.connect(this.getDestination()!);
    sub.start(now);
    sub.stop(now + 0.15);

    // 2. Ascending Tech Chime (D5, A5, D6)
    const notes = [587.33, 880.00, 1174.66]; 
    notes.forEach((freq, idx) => {
      const time = now + idx * 0.045;
      this.playTone('sine', freq, time, 0.01, 0.06, 0.02, 0.35, 0.13);
      this.playTone('triangle', freq * 2, time, 0.005, 0.03, 0.005, 0.15, 0.04);
    });
  }

  // 4. LEVEL UP - Triumphant Orchestral Synth Swell
  public playLevelUp() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // C Major Arp + Chord (C4, E4, G4, C5, E5)
    const notes = [
      { f: 261.63, t: 0 },    // C4
      { f: 329.63, t: 0.12 }, // E4
      { f: 392.00, t: 0.24 }, // G4
      { f: 523.25, t: 0.36 }, // C5
      { f: 659.25, t: 0.5 },  // E5 (Hold)
    ];

    notes.forEach(({ f, t }, idx) => {
      const isLast = idx === notes.length - 1;
      const release = isLast ? 1.5 : 0.4;
      const peakVol = isLast ? 0.15 : 0.1;
      
      this.playTone('triangle', f, now + t, 0.05, 0.1, 0.05, release, peakVol);
      // Detuned pair for thickness
      this.playTone('triangle', f, now + t, 0.05, 0.1, 0.05, release, peakVol * 0.5, 7);
      this.playTone('triangle', f, now + t, 0.05, 0.1, 0.05, release, peakVol * 0.5, -7);
    });
  }

  // 5. POMODORO CHIME - Deep Meditation Singing Bowl
  public playPomodoroChime() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Base frequency E4
    const baseFreq = 329.63; 
    
    // Complex harmonics for singing bowl
    const harmonics = [
      { ratio: 1, vol: 0.35, decay: 4.0 },
      { ratio: 2.76, vol: 0.1, decay: 3.0 },
      { ratio: 5.4, vol: 0.05, decay: 2.0 },
      { ratio: 8.9, vol: 0.02, decay: 1.0 }
    ];

    harmonics.forEach(({ ratio, vol, decay }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = baseFreq * ratio;
      
      // Gentle modulation for the "wobble" of a singing bowl
      if (ratio === 1) {
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 4; // 4Hz wobble
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 2; // slight frequency modulation
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + decay);
      }

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.05); // Soft strike
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
      
      osc.connect(gain);
      gain.connect(this.getDestination()!);
      osc.start(now);
      osc.stop(now + decay);
    });
  }

  // 5.1 POMODORO WORK COMPLETE ALARM - 25m Focus Finished (Harmonic Singing Gong & Crystal Chimes)
  public playWorkSessionCompleteAlarm() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Stage 1: Resonant Golden Singing Gong Chord
    const gongPitches = [261.63, 392.00, 523.25, 659.25]; // C4, G4, C5, E5
    gongPitches.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      if (idx === 0) {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 4.5;
        lfoGain.gain.value = 2.5;
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + 4.5);
      }

      const decay = 4.5 - idx * 0.5;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.28 / (idx + 1), now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.getDestination()!);
      osc.start(now);
      osc.stop(now + decay);
    });

    // Stage 2: Ascending Crystal Celebration Chimes
    const chimes = [
      { freq: 523.25, time: 0.25 }, // C5
      { freq: 659.25, time: 0.50 }, // E5
      { freq: 783.99, time: 0.75 }, // G5
      { freq: 1046.50, time: 1.05 } // C6
    ];

    chimes.forEach(({ freq, time }) => {
      if (!this.ctx) return;
      const t = now + time;
      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2.76, t);

      const hGain = this.ctx.createGain();
      hGain.gain.setValueAtTime(0.06, t);
      hGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      harmonic.connect(hGain);
      hGain.connect(gain);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

      osc.connect(gain);
      gain.connect(this.getDestination()!);

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + 2.2);
      harmonic.stop(t + 0.8);
    });
  }

  // 5.2 POMODORO BREAK COMPLETE ALARM - 5m/15m Break Finished (Energetic Rising Wake Arpeggio)
  public playBreakCompleteAlarm() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Upbeat energetic wake sequence (Ding-Ding-Chime!)
    const wakeNotes = [
      { freq: 440.00, time: 0.0, dur: 0.25 },  // A4
      { freq: 554.37, time: 0.18, dur: 0.25 }, // C#5
      { freq: 659.25, time: 0.36, dur: 0.35 }, // E5
      { freq: 880.00, time: 0.58, dur: 1.80 }, // A5
    ];

    wakeNotes.forEach(({ freq, time, dur }) => {
      if (!this.ctx) return;
      const t = now + time;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(freq * 0.5, t);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.08, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      sub.connect(subGain);
      subGain.connect(gain);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(this.getDestination()!);

      osc.start(t);
      sub.start(t);
      osc.stop(t + dur);
      sub.stop(t + 0.3);
    });
  }

  // 6. ADVENTURE START - Warm Synth Horn Fanfare
  public playAdventureStart() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const notes = [
      { freq: 261.63, time: 0, dur: 0.2 },     // C4
      { freq: 392.00, time: 0.2, dur: 0.2 },   // G4
      { freq: 523.25, time: 0.4, dur: 0.2 },   // C5
      { freq: 659.25, time: 0.6, dur: 0.6 },   // E5 (Hold)
    ];

    notes.forEach(({ freq, time, dur }) => {
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc2.detune.value = 12; // slight detune for warmth

      osc1.frequency.value = freq;
      osc2.frequency.value = freq;

      // Filter envelope for brassy sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now + time);
      filter.frequency.linearRampToValueAtTime(3000, now + time + 0.1);
      filter.frequency.exponentialRampToValueAtTime(400, now + time + dur);

      // Volume envelope
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.15, now + time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur + 0.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestination()!);

      osc1.start(now + time);
      osc2.start(now + time);
      osc1.stop(now + time + dur + 0.2);
      osc2.stop(now + time + dur + 0.2);
    });
  }

  // 7. ITEM EQUIP - Clean UI Toggle / Metallic snap
  public playItemEquip() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Quick rising harmonic tap
    this.playTone('sine', 800, now, 0.01, 0.05, 0.01, 0.1, 0.1);
    this.playTone('sine', 1200, now + 0.03, 0.01, 0.05, 0.01, 0.1, 0.08);
  }

  // 8. ATTACK HIT - Soft Impact / Thud
  public playAttackHit() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Pitch drop oscillator (Thump)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.1); // Quick drop

    filter.type = 'lowpass';
    filter.frequency.value = 400;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // Fast release

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination()!);

    osc.start(now);
    osc.stop(now + 0.3);
    
    // Add brief white noise burst for crunch
    const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.getDestination()!);
    
    noiseSource.start(now);
  }

  // 9. BOSS DEFEATED - Grand Major Chord Swell
  public playBossDefeated() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // F Major (F3, C4, F4, A4, C5)
    const notes = [174.61, 261.63, 349.23, 440.00, 523.25];
    
    notes.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      // Slight detune for thickness
      const oscDetuned = this.ctx.createOscillator();
      oscDetuned.type = 'sawtooth';
      oscDetuned.frequency.value = freq;
      oscDetuned.detune.value = 8;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(2500, now + 0.5); // Swell up
      filter.frequency.exponentialRampToValueAtTime(200, now + 2.0); // Swell down

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.5); // Attack swell
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0); // Release

      osc.connect(filter);
      oscDetuned.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestination()!);

      osc.start(now);
      oscDetuned.start(now);
      osc.stop(now + 2.5);
      oscDetuned.stop(now + 2.5);
    });
  }

  // 10. SUCCESS CHIME
  public playSuccess() {
    this.playTaskComplete();
  }

  // 11. AMBIENT NOISE GENERATOR (Rain, Fire, Forest with Birds)
  private activeAmbientSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  private activeAmbientNodes: AudioNode[] = [];
  private ambientIntervals: number[] = [];
  private ambientGainNode: GainNode | null = null;
  private currentAmbientType: 'rain' | 'fire' | 'forest' | 'off' = 'off';

  public startAmbientSound(type: 'rain' | 'fire' | 'forest', volume: number = 0.3) {
    // 1. Immediately kill any current playing ambient sound
    this.stopAmbientSound();
    this.initCtx();
    if (!this.ctx) return;

    this.currentAmbientType = type;
    this.ambientGainNode = this.ctx.createGain();
    this.ambientGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    this.ambientGainNode.connect(this.getDestination()!);

    const sampleRate = this.ctx.sampleRate;
    const now = this.ctx.currentTime;

    if (type === 'rain') {
      // Pink/Brown noise generator for gentle soothing rainfall
      const bufferSize = sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1150;

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 160;

      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(this.ambientGainNode);

      noise.start(0);
      this.activeAmbientSources.push(noise);
      this.activeAmbientNodes.push(highpass, lowpass);

    } else if (type === 'fire') {
      // Warm low hum + authentic crackles & pops
      const bufferSize = sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 1.4;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 420;

      noise.connect(lowpass);
      lowpass.connect(this.ambientGainNode);
      noise.start(0);

      this.activeAmbientSources.push(noise);
      this.activeAmbientNodes.push(lowpass);

      // Random crackles & snaps of burning wood
      const crackleTimer = window.setInterval(() => {
        if (!this.ctx || this.currentAmbientType !== 'fire' || !this.ambientGainNode) return;
        if (Math.random() > 0.35) {
          const nowTime = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
          osc.frequency.setValueAtTime(800 + Math.random() * 2200, nowTime);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1600 + Math.random() * 1200, nowTime);
          filter.Q.value = 3;

          const dur = 0.015 + Math.random() * 0.035;
          gain.gain.setValueAtTime(0.04 + Math.random() * 0.07, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, nowTime + dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ambientGainNode);

          osc.start(nowTime);
          osc.stop(nowTime + dur);

          this.activeAmbientSources.push(osc);
          this.activeAmbientNodes.push(filter, gain);

          setTimeout(() => {
            const idx = this.activeAmbientSources.indexOf(osc);
            if (idx > -1) this.activeAmbientSources.splice(idx, 1);
          }, (dur + 0.1) * 1000);
        }
      }, 130);

      this.ambientIntervals.push(crackleTimer);

    } else if (type === 'forest') {
      // 1. Soothing forest breeze & rustling trees
      const bufferSize = sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (last + (0.025 * white)) / 1.025;
        last = output[i];
        output[i] *= 1.25;
      }

      const windNoise = this.ctx.createBufferSource();
      windNoise.buffer = buffer;
      windNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 750;
      windFilter.Q.value = 0.6;

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.24, now);

      // Slow gentle LFO simulating swaying gusts of wind in the canopy
      const windLfo = this.ctx.createOscillator();
      const windLfoGain = this.ctx.createGain();
      windLfo.frequency.value = 0.15;
      windLfoGain.gain.value = 0.09;
      windLfo.connect(windLfoGain);
      windLfoGain.connect(windGain.gain);

      windNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.ambientGainNode);

      windNoise.start(0);
      windLfo.start(0);

      this.activeAmbientSources.push(windNoise, windLfo);
      this.activeAmbientNodes.push(windFilter, windGain, windLfoGain);

      // 2. Procedural bird songs & cheerful chirps
      const playBirdCall = () => {
        if (!this.ctx || this.currentAmbientType !== 'forest' || !this.ambientGainNode) return;
        const callTime = this.ctx.currentTime;
        const birdPattern = Math.floor(Math.random() * 3);

        const playNote = (startFreq: number, peakFreq: number, endFreq: number, startTime: number, noteDur: number) => {
          if (!this.ctx || !this.ambientGainNode) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(startFreq, startTime);
          osc.frequency.exponentialRampToValueAtTime(peakFreq, startTime + noteDur * 0.4);
          osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + noteDur);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDur);

          osc.connect(gain);
          gain.connect(this.ambientGainNode);

          osc.start(startTime);
          osc.stop(startTime + noteDur);

          this.activeAmbientSources.push(osc);
          this.activeAmbientNodes.push(gain);

          setTimeout(() => {
            const idx = this.activeAmbientSources.indexOf(osc);
            if (idx > -1) this.activeAmbientSources.splice(idx, 1);
          }, (noteDur + 0.1) * 1000);
        };

        if (birdPattern === 0) {
          // Double chirp (Robin call)
          playNote(3400, 4800, 3900, callTime, 0.08);
          playNote(4100, 5400, 3600, callTime + 0.11, 0.11);
        } else if (birdPattern === 1) {
          // Sweet 3-note trill (Songbird)
          playNote(2900, 4100, 3400, callTime, 0.06);
          playNote(3500, 4800, 3700, callTime + 0.08, 0.07);
          playNote(4000, 5500, 3200, callTime + 0.17, 0.13);
        } else {
          // Melodic gentle whistle
          playNote(2800, 3700, 3000, callTime, 0.16);
        }
      };

      // Initial chirp shortly after selection
      const initialTimeout = window.setTimeout(() => {
        if (this.currentAmbientType === 'forest') playBirdCall();
      }, 700);
      this.ambientIntervals.push(initialTimeout);

      // Periodic natural bird songs
      const birdInterval = window.setInterval(() => {
        if (this.currentAmbientType === 'forest') {
          playBirdCall();
        }
      }, 2900);
      this.ambientIntervals.push(birdInterval);
    }
  }

  public setAmbientVolume(vol: number) {
    if (this.ambientGainNode && this.ctx) {
      this.ambientGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public stopAmbientSound() {
    this.currentAmbientType = 'off';

    // 1. Clear all intervals and scheduled timeouts immediately
    this.ambientIntervals.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    this.ambientIntervals = [];

    // 2. Immediately mute master gain and disconnect from output
    if (this.ambientGainNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGainNode.gain.cancelScheduledValues(now);
        this.ambientGainNode.gain.setValueAtTime(0, now);
        this.ambientGainNode.disconnect();
      } catch (e) {}
      this.ambientGainNode = null;
    }

    // 3. Stop and disconnect every active audio source
    this.activeAmbientSources.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
      try {
        src.disconnect();
      } catch (e) {}
    });
    this.activeAmbientSources = [];

    // 4. Disconnect all intermediate filters, LFOs, and gains
    this.activeAmbientNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch (e) {}
    });
    this.activeAmbientNodes = [];
  }

  public getCurrentAmbientType() {
    return this.currentAmbientType;
  }
}

export const soundFX = new SoundFX();
