// Procedural Web Audio API Music Sequencer & Runner Sound Effects Engine

class RunnerAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private musicMode: 'runner' | 'monster' = 'runner';
  private isMusicPlaying: boolean = false;
  private schedulerId: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private intensity: number = 1.0; // Scales with speed (1.0 -> 1.35)
  private coinStreak: number = 0;
  private lastCoinTime: number = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master compressor/limiter prevents clipping & saturation when music + SFX overlap
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(18, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.soundEnabled ? 0.72 : 0;
      this.masterGain.connect(this.compressor);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.22 : 0;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(enabled ? 0.72 : 0, this.ctx.currentTime, 0.04);
    }
    if (!enabled) {
      this.stopMusic();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.22 : 0, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicMode(mode: 'runner' | 'monster') {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    this.currentStep = 0;
  }

  public setIntensity(speedMultiplier: number) {
    this.intensity = Math.max(0.85, Math.min(1.35, speedMultiplier));
  }

  public startMusic() {
    if (!this.soundEnabled || !this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;

    const scheduleAheadTime = 0.14;
    const lookaheadMs = 35;

    const scheduler = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      // Classic Nightcore Hands-Up tempo: 168-176 BPM (Monster boss bumps +8 BPM for peak intensity!)
      const baseBpm = this.musicMode === 'monster' ? 176 : 168;
      const tempoBpm = baseBpm + (this.intensity - 1.0) * 18;
      const stepDuration = 60 / tempoBpm / 4; // 16th notes

      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
        if (this.musicMode === 'monster') {
          this.scheduleMonsterNightcoreStep(this.currentStep, this.nextStepTime, stepDuration);
        } else {
          this.scheduleMusicStep(this.currentStep, this.nextStepTime, stepDuration);
        }
        this.nextStepTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 64; // 4-bar Nightcore phrase (64 steps)
      }
      this.schedulerId = window.setTimeout(scheduler, lookaheadMs);
    };

    scheduler();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.schedulerId !== null) {
      clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private scheduleMonsterNightcoreStep(step: number, time: number, stepDur: number) {
    if (!this.ctx || !this.musicGain || !this.soundEnabled || !this.musicEnabled) return;

    const barIdx = Math.floor(step / 16); // 0..3 -> Dm -> Bb -> Gm -> A

    // 1. Driving Double-Kick Nightcore Rock/Rave Pattern
    const isDoubleKick =
      step % 4 === 0 || (step % 16 === 6) || (step % 16 === 14);
    if (isDoubleKick) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, time);
      osc.frequency.exponentialRampToValueAtTime(46, time + 0.085);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(step % 4 === 0 ? 0.36 : 0.26, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.11);
    }

    // 2. Fierce High-Energy Snare / Clap + Double-Time Crash Accent
    const isMonsterFill = step >= 58;
    if (step % 8 === 4 || isMonsterFill) {
      const dur = isMonsterFill ? 0.05 : 0.095;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.7);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isMonsterFill ? 2600 : 2100, time);
      filter.Q.setValueAtTime(0.95, time);

      const gain = this.ctx.createGain();
      const level = isMonsterFill ? 0.075 + (step - 58) * 0.015 : 0.145;
      gain.gain.setValueAtTime(level, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
    }

    // 3. Aggressive Driving 16th-Note "Monster" Bassline (Dm -> Bb -> Gm -> A)
    const monsterRoots = [73.42, 58.27, 98.0, 55.0]; // D2, Bb1, G2, A1
    const rootFreq = monsterRoots[barIdx];
    {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      const octaveJump = step % 4 === 2 ? 2 : 1;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(rootFreq * octaveJump, time);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(2.2, time);
      filter.frequency.setValueAtTime(octaveJump === 2 ? 1280 : 620, time);
      filter.frequency.exponentialRampToValueAtTime(190, time + stepDur * 0.88);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(octaveJump === 2 ? 0.145 : 0.11, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + stepDur * 0.95);
    }

    // 4. Dramatic Nightcore "Monster" Pitched-Up Choir/Supersaw Hook Melody
    const monsterMelody: Array<number | null> = [
      // Bar 1 (Dm): Iconic urgent rising minor hook ("The monster inside of me!")
      1174.66, null, 1174.66, 1046.5, 1174.66, null, 1396.91, null,
      1318.51, null, 1174.66, null, 1046.5, null, 880.0, null,
      // Bar 2 (Bb): Soaring emotional lift
      932.33, null, 1174.66, null, 1396.91, null, 1318.51, null,
      1174.66, null, 1046.5, null, 932.33, null, 880.0, null,
      // Bar 3 (Gm): Intense climax octave jump
      783.99, null, 1174.66, null, 1567.98, null, 1396.91, null,
      1318.51, 1174.66, 1046.5, null, 1174.66, null, 1318.51, null,
      // Bar 4 (A): Harmonic minor tension turnaround (C#6 -> A6!)
      1108.73, null, 1318.51, null, 1760.0, null, 1661.22, null,
      1318.51, null, 1108.73, null, 1174.66, 1318.51, 1396.91, 1318.51,
    ];
    const mNote = monsterMelody[step];
    if (mNote) {
      const oscA = this.ctx.createOscillator();
      const oscB = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      oscA.type = 'sawtooth';
      oscB.type = 'square';
      oscA.frequency.setValueAtTime(mNote * 0.995, time);
      oscB.frequency.setValueAtTime(mNote * 1.005, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3400, time);
      filter.Q.setValueAtTime(1.0, time);

      const noteLen = stepDur * 1.65;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.056, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + noteLen);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      oscA.start(time);
      oscB.start(time);
      oscA.stop(time + noteLen + 0.02);
      oscB.stop(time + noteLen + 0.02);
    }
  }

  private scheduleMusicStep(step: number, time: number, stepDur: number) {
    if (!this.ctx || !this.musicGain || !this.soundEnabled || !this.musicEnabled) return;

    const barIdx = Math.floor(step / 16); // 0..3 -> F#m, D, A, E

    // 1. Tight Punchy Nightcore Four-on-the-Floor Kick
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(175, time);
      osc.frequency.exponentialRampToValueAtTime(48, time + 0.095);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.36, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.115);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.125);
    }

    // 2. Classic Nightcore Off-Beat Open/Closed Hi-Hat
    if (step % 2 === 1 || step % 4 === 2) {
      const isOffBeatAccent = step % 4 === 2;
      const dur = isOffBeatAccent ? 0.048 : 0.024;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.3);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(isOffBeatAccent ? 6800 : 8800, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isOffBeatAccent ? 0.065 : 0.028, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
    }

    // 3. Hands-Up Eurodance Clap (beats 2 & 4) + 16th-Note Phrase-End Snare Roll
    const isSnareFill = step >= 60;
    if (step % 8 === 4 || isSnareFill) {
      const dur = isSnareFill ? 0.055 : 0.085;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.9);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSnareFill ? 2400 : 1950, time);
      filter.Q.setValueAtTime(1.1, time);

      const gain = this.ctx.createGain();
      const level = isSnareFill ? 0.07 + (step - 60) * 0.02 : 0.13;
      gain.gain.setValueAtTime(level, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
    }

    // 4. Driving Off-Beat Eurodance Octave Bass (F#m -> D -> A -> E)
    const bassRoots = [92.5, 73.42, 110.0, 82.41];
    const baseBass = bassRoots[barIdx];
    const isOffBeatBass = step % 4 === 2;
    const isRootPulse = step % 4 === 0;

    if (isOffBeatBass || isRootPulse) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isOffBeatBass ? baseBass * 2 : baseBass, time);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(1.8, time);
      filter.frequency.setValueAtTime(isOffBeatBass ? 1150 * this.intensity : 420, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + stepDur * 1.6);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(isOffBeatBass ? 0.15 : 0.08, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 1.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + stepDur * 1.8);
    }

    // 5. Sparkling 16th-Note Nightcore Trance Chord Arpeggio
    const arpChords: Array<[number, number, number, number]> = [
      [369.99, 440.0, 554.37, 739.99], // F#m: F#4, A4, C#5, F#5
      [293.66, 369.99, 440.0, 587.33], // D:   D4, F#4, A4, D5
      [440.0, 554.37, 659.25, 880.0],  // A:   A4, C#5, E5, A5
      [329.63, 415.3, 493.88, 659.25], // E:   E4, G#4, B4, E5
    ];
    const arpFreq = arpChords[barIdx][step % 4];
    {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(arpFreq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.032, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 0.9);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + stepDur * 0.95);
    }

    // 6. Pitched-Up Nightcore "GO! GO! GO!" Dual-Detuned Supersaw Hook Melody
    const melodyPattern: Array<number | null> = [
      // Bar 1 (F#m): "GO! GO! GO!" triple punch + uplifting run
      1108.73, null, 1108.73, null, 1318.51, null, 1174.66, null,
      1108.73, 987.77, 880.0, null, 987.77, null, 1108.73, null,
      // Bar 2 (D): "GO! GO! GO!" higher lift
      1174.66, null, 1174.66, null, 1479.98, null, 1318.51, null,
      1174.66, 1108.73, 880.0, null, 880.0, null, 987.77, null,
      // Bar 3 (A): "GO! GO! GO!" soaring peak
      1318.51, null, 1318.51, null, 1760.0, null, 1661.22, null,
      1318.51, 1108.73, 1318.51, null, 1108.73, null, 987.77, null,
      // Bar 4 (E): Energetic turnaround back to "GO! GO! GO!"
      987.77, null, 1108.73, null, 1318.51, null, 830.61, null,
      987.77, null, 1318.51, null, 1479.98, 1318.51, 1108.73, 987.77,
    ];
    const note = melodyPattern[step];
    if (note) {
      const oscA = this.ctx.createOscillator();
      const oscB = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      oscA.type = 'sawtooth';
      oscB.type = 'triangle';
      oscA.frequency.setValueAtTime(note * 0.996, time); // -7 cents supersaw detune
      oscB.frequency.setValueAtTime(note * 1.004, time); // +7 cents supersaw detune

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, time);
      filter.Q.setValueAtTime(0.8, time);

      // Punchier staccato attack on the "GO! GO! GO!" triple hits (steps 0,2,4 of each bar)
      const isStab = step % 16 <= 4;
      const noteLen = isStab ? stepDur * 1.35 : stepDur * 1.75;

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(isStab ? 0.068 : 0.055, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, time + noteLen);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      oscA.start(time);
      oscB.start(time);
      oscA.stop(time + noteLen + 0.02);
      oscB.stop(time + noteLen + 0.02);
    }
  }

  public playJump() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.16);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Ignore audio errors
    }
  }

  public playRoll() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // Ignore audio errors
    }
  }

  public playLaneSwitch() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(510, now + 0.065);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore audio errors
    }
  }

  public playCoin() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      if (now - this.lastCoinTime < 0.7) {
        this.coinStreak = Math.min(8, this.coinStreak + 1);
      } else {
        this.coinStreak = 0;
      }
      this.lastCoinTime = now;

      const pitchMult = Math.pow(1.05946, this.coinStreak);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77 * pitchMult, now); // B5
      osc.frequency.setValueAtTime(1318.51 * pitchMult, now + 0.055); // E6

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // Ignore audio errors
    }
  }

  public playPowerUp() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.05;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.23);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playShieldBreak() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch {
      // Ignore audio errors
    }
  }

  public playLetter() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      [659.25, 987.77].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const t = now + i * 0.06;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playLevelComplete() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.065;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playSpeedUp() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch {
      // Ignore audio errors
    }
  }

  public playCrash() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.45);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.36, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Ignore audio errors
    }
  }

  public playPunch() {
    this.playPunchRight();
  }

  public playPunchLeft() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.19, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // Ignore audio errors
    }
  }

  public playPunchRight() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore audio errors
    }
  }

  public playComboTrigger() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      [440, 659.25, 880].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.045;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.19);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playObstacleSmash() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.16);

      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Ignore audio errors
    }
  }

  public playOverdriveActivate() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + i * 0.05;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.46);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playBossHit() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore audio errors
    }
  }

  public playBossDeflect() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore audio errors
    }
  }

  public playBossSpawn() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      [220, 185, 146.83].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, now);

        const t = now + i * 0.11;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.23);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playBossDefeat() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const fanfare = [392.0, 523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + i * 0.075;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // Ignore audio errors
    }
  }
}

export const runnerAudio = new RunnerAudioEngine();
