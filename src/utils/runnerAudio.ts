// Procedural Web Audio API Electronic-Rock, Distorted Guitar, Vocal & SFX Engine

export type NightcoreTrackId =
  | 'subway_dash_vocal'
  | 'gogogo_casual'
  | 'skate_neon_funk'
  | 'tokyo_metro_pop'
  | 'graffiti_boss_groove'
  | 'turbo_hoverboard_vocal';

export interface NightcoreTrackDef {
  id: NightcoreTrackId;
  title: string;
  subtitle: string;
  vibe: 'runner' | 'monster';
  bpm: number;
  keyLabel: string;
  energyRating: string;
  accent: string;
  description: string;
  rootsHz: [number, number, number, number];
  arpChords: Array<[number, number, number, number]>;
  melodyHz: Array<number | null>;
  // Vowel sequence per 16th step for singing formant synthesis: 'a' | 'e' | 'i' | 'o'
  vowels: Array<'a' | 'e' | 'i' | 'o'>;
  chantSteps: number[]; // Steps where crowd shouts "HEY!" / "GO!"
  guitarChugPattern: number[]; // 16-step rhythm guitar palm-mute/power-chord hits per bar
  drumFeel: 'breakbeat_rock' | 'punk_drive' | 'arena_groove';
  guitarGain: number;
  vocalPitchShift: number;
}

export const NIGHTCORE_TRACK_BANK: NightcoreTrackDef[] = [
  {
    id: 'subway_dash_vocal',
    title: '1. Subway Electro-Rock (Con Voz)',
    subtitle: 'Rock-Electrónico + Groove Subway Surfers',
    vibe: 'runner',
    bpm: 140,
    keyLabel: 'C Mayor',
    energyRating: 'Rock Flow 10/10',
    accent: '#22d3ee',
    description:
      'Guitarras eléctricas con overdrive, batería rock-electrónica con groove casual, bajo distorsionado y voz cantada con coros "¡HEY! ¡GO!".',
    rootsHz: [65.41, 98.0, 110.0, 87.31], // C2 -> G2 -> A2 -> F2
    arpChords: [
      [261.63, 329.63, 392.0, 523.25],
      [392.0, 493.88, 587.33, 783.99],
      [440.0, 523.25, 659.25, 880.0],
      [349.23, 440.0, 523.25, 698.46],
    ],
    melodyHz: [
      523.25, null, 659.25, 587.33, 523.25, null, 392.0, null,
      440.0, 523.25, 659.25, null, 587.33, null, 523.25, null,
      587.33, null, 783.99, 659.25, 587.33, null, 493.88, null,
      392.0, 493.88, 587.33, null, 659.25, null, 587.33, null,
      659.25, null, 880.0, 783.99, 659.25, null, 523.25, null,
      587.33, 659.25, 783.99, null, 659.25, null, 523.25, null,
      698.46, null, 659.25, 587.33, 523.25, null, 440.0, null,
      523.25, 587.33, 659.25, null, 783.99, 659.25, 587.33, 523.25,
    ],
    vowels: ['a', 'a', 'o', 'e', 'a', 'a', 'o', 'o', 'e', 'i', 'a', 'a', 'o', 'o', 'a', 'e'],
    chantSteps: [12, 28, 44, 60],
    guitarChugPattern: [0, 3, 6, 8, 10, 12, 14],
    drumFeel: 'breakbeat_rock',
    guitarGain: 1.0,
    vocalPitchShift: 1.0,
  },
  {
    id: 'gogogo_casual',
    title: '2. Go Go Go! Punk Electro (Con Voz)',
    subtitle: 'Pop-Punk Electrónico · Riffs + Voz Alegre',
    vibe: 'runner',
    bpm: 148,
    keyLabel: 'F Mayor',
    energyRating: 'Energía 10/10',
    accent: '#facc15',
    description:
      'Power chords palm-muted estilo pop-punk moderno, batería acústico-electrónica con platillos crash y voz cantada + cantos "¡GO! ¡GO! ¡GO!".',
    rootsHz: [87.31, 65.41, 73.42, 116.54], // F2 -> C2 -> D2 -> Bb2
    arpChords: [
      [349.23, 440.0, 523.25, 698.46],
      [261.63, 329.63, 392.0, 523.25],
      [293.66, 349.23, 440.0, 587.33],
      [466.16, 587.33, 698.46, 932.33],
    ],
    melodyHz: [
      698.46, null, 698.46, null, 698.46, 783.99, 880.0, null,
      783.99, 698.46, 587.33, null, 523.25, null, 587.33, null,
      659.25, null, 659.25, null, 659.25, 783.99, 880.0, null,
      783.99, 659.25, 587.33, null, 523.25, null, 659.25, null,
      587.33, null, 587.33, null, 698.46, 783.99, 880.0, null,
      783.99, 698.46, 587.33, null, 698.46, null, 783.99, null,
      932.33, null, 880.0, null, 783.99, 698.46, 587.33, null,
      523.25, 587.33, 698.46, null, 880.0, 783.99, 698.46, 587.33,
    ],
    vowels: ['o', 'o', 'o', 'o', 'o', 'a', 'e', 'e', 'a', 'o', 'i', 'i', 'a', 'a', 'o', 'e'],
    chantSteps: [0, 2, 4, 32, 34, 36],
    guitarChugPattern: [0, 2, 4, 6, 8, 10, 12, 14],
    drumFeel: 'punk_drive',
    guitarGain: 1.15,
    vocalPitchShift: 1.06,
  },
  {
    id: 'skate_neon_funk',
    title: '3. Neon Skate Rock (Con Voz)',
    subtitle: 'Rock Alternativo + Bajo Eléctrico con Púa',
    vibe: 'runner',
    bpm: 134,
    keyLabel: 'G Mayor',
    energyRating: 'Groove Rock 9.5/10',
    accent: '#4ade80',
    description:
      'Ritmo rock alternativo relajado estilo skate: guitarra crunchy rítmica, bajo eléctrico con púa, batería gruesa de estudio y voz melódica.',
    rootsHz: [98.0, 82.41, 65.41, 73.42], // G2 -> E2 -> C2 -> D2
    arpChords: [
      [392.0, 493.88, 587.33, 783.99],
      [329.63, 392.0, 493.88, 659.25],
      [261.63, 329.63, 392.0, 523.25],
      [293.66, 369.99, 440.0, 587.33],
    ],
    melodyHz: [
      587.33, null, 659.25, 783.99, null, 659.25, 587.33, 493.88,
      392.0, null, 493.88, 587.33, null, 493.88, 392.0, null,
      493.88, null, 659.25, 783.99, null, 659.25, 493.88, 392.0,
      329.63, null, 493.88, 587.33, null, 659.25, 587.33, null,
      523.25, null, 659.25, 783.99, 880.0, null, 783.99, 659.25,
      523.25, null, 587.33, 659.25, null, 523.25, 493.88, null,
      587.33, null, 739.99, 880.0, null, 783.99, 659.25, 587.33,
      493.88, 587.33, 659.25, 783.99, 880.0, null, 783.99, null,
    ],
    vowels: ['o', 'o', 'a', 'e', 'e', 'a', 'o', 'i', 'a', 'a', 'o', 'e', 'e', 'i', 'o', 'a'],
    chantSteps: [14, 30, 46, 62],
    guitarChugPattern: [0, 3, 4, 8, 11, 12, 14],
    drumFeel: 'breakbeat_rock',
    guitarGain: 0.95,
    vocalPitchShift: 0.95,
  },
  {
    id: 'tokyo_metro_pop',
    title: '4. Cyber Arena Rock (Con Voz)',
    subtitle: 'J-Rock Electrónico · Supersaw + Guitarra',
    vibe: 'runner',
    bpm: 144,
    keyLabel: 'D Mayor',
    energyRating: 'Épico 10/10',
    accent: '#f472b6',
    description:
      'Fusión J-Rock y Electrónica moderna con sintetizadores anchos supersaw, guitarra solista con delay y voz cantada estilo opening de anime.',
    rootsHz: [73.42, 110.0, 98.0, 82.41], // D2 -> A2 -> G2 -> E2
    arpChords: [
      [293.66, 369.99, 440.0, 587.33],
      [440.0, 554.37, 659.25, 880.0],
      [392.0, 493.88, 587.33, 783.99],
      [329.63, 415.3, 493.88, 659.25],
    ],
    melodyHz: [
      587.33, 659.25, 739.99, null, 880.0, null, 739.99, 659.25,
      587.33, null, 739.99, 880.0, 987.77, null, 880.0, null,
      880.0, 987.77, 1108.73, null, 880.0, null, 739.99, 659.25,
      554.37, null, 659.25, 739.99, 880.0, null, 739.99, null,
      783.99, 880.0, 987.77, null, 1174.66, null, 987.77, 880.0,
      783.99, null, 880.0, 987.77, 880.0, null, 739.99, null,
      659.25, null, 739.99, 880.0, 987.77, null, 880.0, 739.99,
      659.25, 739.99, 880.0, null, 1108.73, 987.77, 880.0, 739.99,
    ],
    vowels: ['i', 'e', 'a', 'a', 'o', 'o', 'e', 'i', 'a', 'a', 'e', 'o', 'a', 'a', 'o', 'o'],
    chantSteps: [8, 24, 40, 56],
    guitarChugPattern: [0, 4, 6, 8, 12, 14],
    drumFeel: 'arena_groove',
    guitarGain: 1.05,
    vocalPitchShift: 1.14,
  },
  {
    id: 'graffiti_boss_groove',
    title: '5. Monster Electro-Rock (Boss)',
    subtitle: 'Rock Industrial + Chase Electrónico · Con Voz',
    vibe: 'monster',
    bpm: 150,
    keyLabel: 'Am',
    energyRating: 'Boss Rock 10/10',
    accent: '#fb7185',
    description:
      'Rock electrónico pesado inspirado en Monster: riffs de guitarra graves con distorsión, batería potente con doble bombo y voz dramática.',
    rootsHz: [110.0, 87.31, 65.41, 98.0], // Am -> F -> C -> G
    arpChords: [
      [440.0, 523.25, 659.25, 880.0],
      [349.23, 440.0, 523.25, 698.46],
      [261.63, 329.63, 392.0, 523.25],
      [392.0, 493.88, 587.33, 783.99],
    ],
    melodyHz: [
      659.25, null, 659.25, 587.33, 659.25, null, 783.99, null,
      880.0, null, 783.99, 659.25, 587.33, null, 523.25, null,
      523.25, null, 659.25, 783.99, 880.0, null, 783.99, null,
      659.25, null, 587.33, 523.25, 440.0, null, 523.25, null,
      523.25, null, 659.25, null, 783.99, null, 1046.5, null,
      987.77, null, 880.0, 783.99, 659.25, null, 783.99, null,
      783.99, null, 880.0, null, 987.77, null, 880.0, 783.99,
      659.25, 783.99, 880.0, null, 1046.5, 987.77, 880.0, 783.99,
    ],
    vowels: ['o', 'o', 'e', 'a', 'o', 'o', 'a', 'a', 'e', 'e', 'o', 'a', 'i', 'i', 'o', 'o'],
    chantSteps: [6, 22, 38, 54, 60],
    guitarChugPattern: [0, 2, 3, 6, 8, 10, 12, 14, 15],
    drumFeel: 'punk_drive',
    guitarGain: 1.25,
    vocalPitchShift: 1.0,
  },
  {
    id: 'turbo_hoverboard_vocal',
    title: '6. Hoverboard Synth-Rock (Con Voz)',
    subtitle: 'Electro-Rock de Estadio · Ritmo Festival',
    vibe: 'runner',
    bpm: 152,
    keyLabel: 'Em',
    energyRating: 'Festival 10/10',
    accent: '#c084fc',
    description:
      'Electro-rock festivo estilo festival: acordes grandes de guitarra y sinte analógico, bajo sub profundo, platillos en vivo y voz potente.',
    rootsHz: [82.41, 65.41, 98.0, 73.42], // Em -> C -> G -> D
    arpChords: [
      [329.63, 392.0, 493.88, 659.25],
      [261.63, 329.63, 392.0, 523.25],
      [392.0, 493.88, 587.33, 783.99],
      [293.66, 369.99, 440.0, 587.33],
    ],
    melodyHz: [
      659.25, null, 783.99, null, 987.77, null, 880.0, 783.99,
      659.25, 783.99, 880.0, null, 783.99, null, 659.25, null,
      523.25, null, 659.25, null, 783.99, null, 880.0, 783.99,
      659.25, 587.33, 523.25, null, 659.25, null, 783.99, null,
      783.99, null, 987.77, null, 1174.66, null, 1046.5, 987.77,
      880.0, 783.99, 880.0, null, 987.77, null, 783.99, null,
      739.99, null, 880.0, null, 987.77, null, 880.0, 739.99,
      659.25, 739.99, 880.0, null, 987.77, 1046.5, 987.77, 880.0,
    ],
    vowels: ['a', 'a', 'e', 'e', 'i', 'i', 'o', 'a', 'a', 'e', 'o', 'o', 'a', 'a', 'e', 'i'],
    chantSteps: [0, 16, 32, 48, 60],
    guitarChugPattern: [0, 3, 6, 8, 12, 14],
    drumFeel: 'arena_groove',
    guitarGain: 1.1,
    vocalPitchShift: 1.08,
  },
];

// Formant F1/F2 pairs (Hz) for realistic sung vowels in Web Audio API
const VOWEL_FORMANTS: Record<'a' | 'e' | 'i' | 'o', [number, number]> = {
  a: [730, 1090], // "AH"
  e: [530, 1840], // "EH"
  i: [310, 2250], // "EE"
  o: [500, 860],  // "OH"
};

class RunnerAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Electronic-Rock Spatial & Saturation Processors
  private reverbNode: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delaySend: GainNode | null = null;
  private guitarDriveCurve: Float32Array<ArrayBuffer> | null = null;
  private bassDriveCurve: Float32Array<ArrayBuffer> | null = null;

  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private musicMode: 'runner' | 'monster' = 'runner';
  private selectedRunnerTrackId: NightcoreTrackId | 'legacy' = 'legacy';
  private selectedMonsterTrackId: NightcoreTrackId | 'legacy' = 'legacy';
  private previewTrackId: NightcoreTrackId | null = null;
  private previewBpmScale: number = 1.0;

  private isMusicPlaying: boolean = false;
  private schedulerId: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private intensity: number = 1.0; // Scales with speed (1.0 -> 1.35)
  private coinStreak: number = 0;
  private lastCoinTime: number = 0;

  private createDistortionCurve(drive: number, asymmetric: boolean): Float32Array<ArrayBuffer> {
    const samples = 1024;
    const buffer = new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const shaped = ((3 + drive) * x * 20 * deg) / (Math.PI + drive * Math.abs(x));
      curve[i] = asymmetric && x < 0 ? shaped * 0.86 : shaped;
    }
    return curve;
  }

  private createArenaImpulse(ctx: AudioContext, duration = 1.05, decay = 2.8): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        const white = (Math.random() * 2 - 1) * env;
        // Gentle lowpass inside impulse so stadium reverb sounds warm, never metallic/8-bit
        lp = lp * 0.65 + white * 0.35;
        data[i] = lp;
      }
    }
    return impulse;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master compressor/limiter prevents clipping & glues drums + guitars + vocals
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-15, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(14, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(5.5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.soundEnabled ? 0.8 : 0;
      this.masterGain.connect(this.compressor);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.38 : 0;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);

      // Build Arena Reverb + Analog Slap Delay buses for music
      this.guitarDriveCurve = this.createDistortionCurve(42, true);
      this.bassDriveCurve = this.createDistortionCurve(14, false);

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this.createArenaImpulse(this.ctx, 1.0, 2.9);
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.value = 0.24;
      this.reverbSend.connect(this.reverbNode);
      this.reverbNode.connect(this.musicGain);

      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.21;
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.22;
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 2600;
      this.delaySend = this.ctx.createGain();
      this.delaySend.gain.value = 0.2;
      this.delaySend.connect(this.delayNode);
      this.delayNode.connect(delayFilter);
      delayFilter.connect(delayFeedback);
      delayFeedback.connect(this.delayNode);
      delayFilter.connect(this.musicGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(enabled ? 0.8 : 0, this.ctx.currentTime, 0.04);
    }
    if (!enabled) {
      this.stopMusic();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.38 : 0, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicMode(mode: 'runner' | 'monster') {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    this.currentStep = 0;
  }

  public setSelectedRunnerTrack(trackId: NightcoreTrackId | 'legacy') {
    this.selectedRunnerTrackId = trackId;
    if (this.musicMode === 'runner') {
      this.currentStep = 0;
    }
  }

  public getSelectedRunnerTrack(): NightcoreTrackId | 'legacy' {
    return this.selectedRunnerTrackId;
  }

  public setSelectedMonsterTrack(trackId: NightcoreTrackId | 'legacy') {
    this.selectedMonsterTrackId = trackId;
    if (this.musicMode === 'monster') {
      this.currentStep = 0;
    }
  }

  public getSelectedMonsterTrack(): NightcoreTrackId | 'legacy' {
    return this.selectedMonsterTrackId;
  }

  public getPreviewTrackId(): NightcoreTrackId | null {
    return this.previewTrackId;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public previewTrack(trackId: NightcoreTrackId, bpmScale: number = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.86, ctx.currentTime, 0.03);
    }
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0.46, ctx.currentTime, 0.03);
    }

    this.previewTrackId = trackId;
    this.previewBpmScale = Math.max(0.85, Math.min(1.2, bpmScale));
    this.currentStep = 0;

    if (!this.isMusicPlaying) {
      this.startLoopScheduler(true);
    }
  }

  public setPreviewBpmScale(bpmScale: number) {
    this.previewBpmScale = Math.max(0.85, Math.min(1.2, bpmScale));
  }

  public stopPreview() {
    this.previewTrackId = null;
    this.stopMusic();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicEnabled ? 0.38 : 0, this.ctx.currentTime, 0.04);
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.soundEnabled ? 0.8 : 0, this.ctx.currentTime, 0.04);
    }
  }

  public setIntensity(speedMultiplier: number) {
    this.intensity = Math.max(0.85, Math.min(1.35, speedMultiplier));
  }

  public startMusic() {
    if (!this.soundEnabled || !this.musicEnabled) return;
    this.previewTrackId = null;
    this.startLoopScheduler(false);
  }

  private startLoopScheduler(isAudition: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.04;

    const scheduleAheadTime = 0.14;
    const lookaheadMs = 30;

    const scheduler = () => {
      if (!this.isMusicPlaying || !this.ctx) return;

      const previewTrack = this.previewTrackId
        ? NIGHTCORE_TRACK_BANK.find((t) => t.id === this.previewTrackId) || null
        : null;

      const activeChosenId =
        this.musicMode === 'monster' ? this.selectedMonsterTrackId : this.selectedRunnerTrackId;
      const chosenBankTrack =
        activeChosenId !== 'legacy'
          ? NIGHTCORE_TRACK_BANK.find((t) => t.id === activeChosenId) || null
          : null;

      const targetTrack = previewTrack || chosenBankTrack;

      const baseBpm = targetTrack
        ? targetTrack.bpm * (previewTrack ? this.previewBpmScale : 1)
        : this.musicMode === 'monster'
        ? 154
        : 146;
      const tempoBpm = previewTrack ? baseBpm : baseBpm + (this.intensity - 1.0) * 14;
      const stepDuration = 60 / tempoBpm / 4; // 16th notes

      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
        if (targetTrack) {
          this.scheduleBankTrackStep(targetTrack, this.currentStep, this.nextStepTime, stepDuration, isAudition);
        } else if (this.musicMode === 'monster') {
          this.scheduleMonsterNightcoreStep(this.currentStep, this.nextStepTime, stepDuration);
        } else {
          this.scheduleMusicStep(this.currentStep, this.nextStepTime, stepDuration);
        }
        this.nextStepTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 64; // 4-bar phrase (64 steps)
      }
      this.schedulerId = window.setTimeout(scheduler, lookaheadMs);
    };

    scheduler();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    this.previewTrackId = null;
    if (this.schedulerId !== null) {
      clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
  }

  // Distorted Electric Guitar Power Chord (Root + 5th + Octave through Tube Amp + 4x12 Cabinet EQ)
  private playDistortedPowerChord(
    rootHz: number,
    time: number,
    dur: number,
    palmMuted: boolean,
    level: number
  ) {
    if (!this.ctx || !this.musicGain || !this.guitarDriveCurve) return;

    const freqs = [rootHz * 2, rootHz * 3, rootHz * 4]; // E.g. Power chord (Root + 5th + Octave in mid register)
    const preAmp = this.ctx.createGain();
    preAmp.gain.setValueAtTime(palmMuted ? 1.8 : 2.3, time);

    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this.guitarDriveCurve;
    shaper.oversample = '2x';

    // 4x12 Guitar Cabinet modeling: tight low-cut + warm mid crunch + smooth fizz roll-off
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(115, time);

    const cab = this.ctx.createBiquadFilter();
    cab.type = 'lowpass';
    cab.frequency.setValueAtTime(palmMuted ? 1650 : 3200, time);
    cab.Q.setValueAtTime(1.1, time);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(level, time + 0.006);
    if (palmMuted) {
      env.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.72);
    } else {
      env.gain.setValueAtTime(level * 0.8, time + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);
    }

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx === 2 ? 'triangle' : 'sawtooth';
      // Slight natural string detune so it sounds thick & rock, never synthetic 8-bit
      osc.frequency.setValueAtTime(f * (idx === 1 ? 1.002 : 0.998), time);
      osc.connect(preAmp);
      osc.start(time);
      osc.stop(time + dur + 0.03);
    });

    preAmp.connect(shaper);
    shaper.connect(hp);
    hp.connect(cab);
    cab.connect(env);
    env.connect(this.musicGain);
    if (this.reverbSend) {
      env.connect(this.reverbSend);
    }
  }

  // Thick Electronic-Rock Hybrid Bass (Sub Sine + Gritty Picked Analog Bass)
  private playRockSynthBass(freq: number, time: number, dur: number, isAccent: boolean) {
    if (!this.ctx || !this.musicGain || !this.bassDriveCurve) return;

    // 1. Clean Sub Punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, time);
    subGain.gain.setValueAtTime(0.001, time);
    subGain.gain.linearRampToValueAtTime(0.24, time + 0.005);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    sub.connect(subGain);
    subGain.connect(this.musicGain);
    sub.start(time);
    sub.stop(time + dur + 0.02);

    // 2. Overdriven Rock Picked Bass Growl
    const grit = this.ctx.createOscillator();
    const shaper = this.ctx.createWaveShaper();
    const lp = this.ctx.createBiquadFilter();
    const gGain = this.ctx.createGain();

    grit.type = 'sawtooth';
    grit.frequency.setValueAtTime(freq, time);

    shaper.curve = this.bassDriveCurve;
    lp.type = 'lowpass';
    lp.Q.setValueAtTime(1.8, time);
    lp.frequency.setValueAtTime(isAccent ? 1450 : 920, time);
    lp.frequency.exponentialRampToValueAtTime(240, time + dur * 0.9);

    gGain.gain.setValueAtTime(0.001, time);
    gGain.gain.linearRampToValueAtTime(isAccent ? 0.14 : 0.1, time + 0.004);
    gGain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.95);

    grit.connect(shaper);
    shaper.connect(lp);
    lp.connect(gGain);
    gGain.connect(this.musicGain);
    grit.start(time);
    grit.stop(time + dur + 0.02);
  }

  // Realistic 6-Oscillator Metallic Rock Cymbal / Hi-Hat Synthesis
  private playMetallicCymbal(time: number, kind: 'hat' | 'open' | 'crash') {
    if (!this.ctx || !this.musicGain) return;

    const dur = kind === 'crash' ? 0.65 : kind === 'open' ? 0.16 : 0.036;
    const baseFreq = kind === 'crash' ? 310 : 415;
    const ratios = [1.0, 1.48, 1.82, 2.54, 2.66, 3.88];

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(kind === 'crash' ? 5400 : 8200, time);
    bp.Q.setValueAtTime(0.75, time);

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(kind === 'crash' ? 3200 : 6200, time);

    const env = this.ctx.createGain();
    const peak = kind === 'crash' ? 0.11 : kind === 'open' ? 0.055 : 0.028;
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(peak, time + 0.003);
    env.gain.exponentialRampToValueAtTime(0.001, time + dur);

    ratios.forEach((r) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq * r, time);
      osc.connect(bp);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    });

    // Add silky air noise shimmer for real bronze cymbal texture
    const nLen = Math.floor(this.ctx.sampleRate * dur);
    const nBuf = this.ctx.createBuffer(1, nLen, this.ctx.sampleRate);
    const ch = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nLen, kind === 'crash' ? 1.4 : 2.1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = nBuf;
    noise.connect(hp);

    bp.connect(hp);
    hp.connect(env);
    env.connect(this.musicGain);
    if (this.reverbSend && kind !== 'hat') {
      env.connect(this.reverbSend);
    }
    noise.start(time);
  }

  // Lush Wide Electronic-Rock Supersaw Chord Pad (No 8-bit arps!)
  private playElectroRockPadChord(chord: [number, number, number, number], time: number, dur: number, level: number) {
    if (!this.ctx || !this.musicGain) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(1150, time + dur);
    filter.Q.setValueAtTime(0.9, time);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(level, time + 0.025);
    env.gain.setValueAtTime(level * 0.72, time + dur * 0.65);
    env.gain.exponentialRampToValueAtTime(0.001, time + dur);

    chord.slice(0, 3).forEach((noteHz) => {
      [0.994, 1.006].forEach((det) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(noteHz * det, time);
        osc.connect(filter);
        osc.start(time);
        osc.stop(time + dur + 0.02);
      });
    });

    filter.connect(env);
    env.connect(this.musicGain);
    if (this.reverbSend) {
      env.connect(this.reverbSend);
    }
  }

  // Double-Tracked Sung Rock-Pop Vocal Lead (Dual Formants + Vibrato + Reverb/Delay)
  private playSungVocalNote(freq: number, vowel: 'a' | 'e' | 'i' | 'o', time: number, dur: number, level: number) {
    if (!this.ctx || !this.musicGain) return;

    const [f1, f2] = VOWEL_FORMANTS[vowel];
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.setValueAtTime(f1, time);
    bp1.Q.setValueAtTime(3.6, time);

    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.setValueAtTime(f2, time);
    bp2.Q.setValueAtTime(4.8, time);

    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.75, time);
    gain2.gain.setValueAtTime(0.5, time);

    const masterVocalEnv = this.ctx.createGain();
    masterVocalEnv.gain.setValueAtTime(0.001, time);
    masterVocalEnv.gain.linearRampToValueAtTime(level, time + 0.02);
    masterVocalEnv.gain.setValueAtTime(level * 0.85, time + dur * 0.68);
    masterVocalEnv.gain.exponentialRampToValueAtTime(0.001, time + dur);

    const vibrato = this.ctx.createOscillator();
    const vibratoDepth = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.4, time);
    vibratoDepth.gain.setValueAtTime(freq * 0.012, time);
    vibrato.connect(vibratoDepth);

    // Double-tracked voices (±6 cents) for rich modern studio chorus vocal
    [0.9965, 1.0035].forEach((detune, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * 0.93 * detune, time);
      osc.frequency.exponentialRampToValueAtTime(freq * detune, time + 0.036);
      vibratoDepth.connect(osc.frequency);
      osc.connect(bp1);
      if (idx === 0) osc.connect(bp2);
      osc.start(time);
      osc.stop(time + dur + 0.03);
    });

    bp1.connect(gain1);
    bp2.connect(gain2);
    gain1.connect(masterVocalEnv);
    gain2.connect(masterVocalEnv);
    masterVocalEnv.connect(this.musicGain);
    if (this.reverbSend) masterVocalEnv.connect(this.reverbSend);
    if (this.delaySend) masterVocalEnv.connect(this.delaySend);

    vibrato.start(time);
    vibrato.stop(time + dur + 0.03);
  }

  // Stadium Rock / Street-Crew Crowd Shout ("HEY!" / "GO!")
  private playCrowdVocalChant(time: number, basePitch: number, isGo: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const dur = 0.16;

    [0.98, 1.0, 1.02].forEach((detune) => {
      if (!this.ctx || !this.musicGain) return;
      const voiceOsc = this.ctx.createOscillator();
      voiceOsc.type = 'sawtooth';
      if (isGo) {
        voiceOsc.frequency.setValueAtTime(basePitch * 1.15 * detune, time);
        voiceOsc.frequency.exponentialRampToValueAtTime(basePitch * 0.85 * detune, time + dur);
      } else {
        voiceOsc.frequency.setValueAtTime(basePitch * 0.92 * detune, time);
        voiceOsc.frequency.exponentialRampToValueAtTime(basePitch * 1.2 * detune, time + 0.045);
        voiceOsc.frequency.exponentialRampToValueAtTime(basePitch * 0.95 * detune, time + dur);
      }

      const formant = this.ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(isGo ? 640 : 1250, time);
      formant.frequency.exponentialRampToValueAtTime(isGo ? 520 : 1850, time + dur);
      formant.Q.setValueAtTime(2.6, time);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.001, time);
      env.gain.linearRampToValueAtTime(0.09, time + 0.014);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);

      voiceOsc.connect(formant);
      formant.connect(env);
      env.connect(this.musicGain);
      if (this.reverbSend) env.connect(this.reverbSend);
      voiceOsc.start(time);
      voiceOsc.stop(time + dur + 0.02);
    });

    const bLen = Math.floor(this.ctx.sampleRate * 0.034);
    const buf = this.ctx.createBuffer(1, bLen, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * (1 - i / bLen);
    }
    const breath = this.ctx.createBufferSource();
    breath.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2200, time);
    const bGain = this.ctx.createGain();
    bGain.gain.setValueAtTime(0.085, time);
    bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.034);
    breath.connect(bp);
    bp.connect(bGain);
    bGain.connect(this.musicGain);
    breath.start(time);
  }

  // Electronic-Rock + Vocal Sequencer Engine (Zero Chiptune/8-Bit!)
  private scheduleBankTrackStep(
    track: NightcoreTrackDef,
    step: number,
    time: number,
    stepDur: number,
    isAudition: boolean
  ) {
    if (!this.ctx || !this.musicGain) return;
    if (!isAudition && (!this.soundEnabled || !this.musicEnabled)) return;

    const barIdx = Math.floor(step / 16);
    const stepInBar = step % 16;
    const rootFreq = track.rootsHz[barIdx];
    const chord = track.arpChords[barIdx];

    // 1. Punchy Hybrid Acoustic/Electronic Rock Kick
    const isKick =
      track.drumFeel === 'breakbeat_rock'
        ? stepInBar === 0 || stepInBar === 3 || stepInBar === 8 || stepInBar === 10
        : track.drumFeel === 'punk_drive'
        ? stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 10
        : stepInBar % 4 === 0;

    if (isKick) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(145, time);
      kickOsc.frequency.exponentialRampToValueAtTime(44, time + 0.085);
      kickGain.gain.setValueAtTime(0.001, time);
      kickGain.gain.linearRampToValueAtTime(0.45, time + 0.003);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(time);
      kickOsc.stop(time + 0.14);

      // Beater transient click so the kick cuts through distorted guitars
      const click = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(1650, time);
      click.frequency.exponentialRampToValueAtTime(240, time + 0.018);
      cGain.gain.setValueAtTime(0.14, time);
      cGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      click.connect(cGain);
      cGain.connect(this.musicGain);
      click.start(time);
      click.stop(time + 0.025);
    }

    // 2. Cracking Stadium Rock Snare (with Reverb) + Phrase-End Tom Fill
    const isMainSnare = stepInBar === 4 || stepInBar === 12;
    const isEndFill = step >= 60 && step % 2 === 1;
    if (isMainSnare || isEndFill) {
      const dur = isMainSnare ? 0.14 : 0.09;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.55);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(isMainSnare ? 2100 : 1400, time);
      bp.Q.setValueAtTime(0.85, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isMainSnare ? 0.2 : 0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(bp);
      bp.connect(gain);
      gain.connect(this.musicGain);
      if (this.reverbSend) gain.connect(this.reverbSend);
      noise.start(time);

      // Acoustic Snare / Rack Tom chest body punch
      const body = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      body.type = 'triangle';
      const pitch = isMainSnare ? 195 : 150 - (step - 60) * 14;
      body.frequency.setValueAtTime(pitch, time);
      body.frequency.exponentialRampToValueAtTime(pitch * 0.56, time + 0.07);
      bGain.gain.setValueAtTime(isMainSnare ? 0.22 : 0.18, time);
      bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      body.connect(bGain);
      bGain.connect(this.musicGain);
      body.start(time);
      body.stop(time + 0.085);
    }

    // 3. Real Metallic Crash Cymbals & Rock Hi-Hats
    if (step === 0 || step === 32) {
      this.playMetallicCymbal(time, 'crash');
    } else if (step % 2 === 0) {
      this.playMetallicCymbal(time, stepInBar % 4 === 2 ? 'open' : 'hat');
    }

    // 4. Distorted Electric Guitar Power Chords (Palm-muted chugs + big ring-out on bar hits)
    if (track.guitarChugPattern.includes(stepInBar)) {
      const isRingOut = stepInBar === 0 || stepInBar === 8;
      this.playDistortedPowerChord(
        rootFreq,
        time,
        isRingOut ? stepDur * 2.8 : stepDur * 1.15,
        !isRingOut,
        (isRingOut ? 0.11 : 0.085) * track.guitarGain
      );
    }

    // 5. Thick Picked Analog Rock + Sub Bassline
    if (step % 2 === 0 || stepInBar === 3 || stepInBar === 11) {
      const isAccent = stepInBar === 0 || stepInBar === 8;
      this.playRockSynthBass(rootFreq, time, stepDur * 1.45, isAccent);
    }

    // 6. Wide Electronic-Rock Supersaw Chord Pad (on beats 1 & 3 of every bar)
    if (stepInBar === 0 || stepInBar === 8) {
      this.playElectroRockPadChord(chord, time, stepDur * 7.5, 0.042);
    }

    // 7. Double-Tracked Sung Vocal Melody
    const note = track.melodyHz[step];
    if (note) {
      const sungFreq = note * track.vocalPitchShift;
      const vowel = track.vowels[stepInBar];
      this.playSungVocalNote(sungFreq, vowel, time, stepDur * 1.9, 0.21);
    }

    // 8. Stadium Rock Crowd Voice Shouts ("GO!" / "HEY!")
    if (track.chantSteps.includes(step)) {
      const isGoTrack = track.id === 'gogogo_casual';
      this.playCrowdVocalChant(time, track.rootsHz[0] * 4.5, isGoTrack);
    }
  }

  private scheduleMonsterNightcoreStep(step: number, time: number, stepDur: number) {
    if (!this.ctx || !this.musicGain || !this.soundEnabled || !this.musicEnabled) return;

    const barIdx = Math.floor(step / 16); // 0..3 -> Dm -> Bb -> Gm -> A
    const stepInBar = step % 16;
    const monsterRoots = [73.42, 58.27, 98.0, 55.0]; // D2, Bb1, G2, A1
    const rootFreq = monsterRoots[barIdx];
    const monsterChords: Array<[number, number, number, number]> = [
      [293.66, 349.23, 440.0, 587.33], // Dm
      [233.08, 293.66, 349.23, 466.16], // Bb
      [392.0, 466.16, 587.33, 783.99],  // Gm
      [220.0, 277.18, 329.63, 440.0],   // A
    ];

    // 1. Heavy Industrial/Electronic-Rock Double Kick + Beater Click
    const isDoubleKick =
      step % 4 === 0 || stepInBar === 6 || stepInBar === 14;
    if (isDoubleKick) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(165, time);
      osc.frequency.exponentialRampToValueAtTime(44, time + 0.085);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(step % 4 === 0 ? 0.44 : 0.3, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.13);

      const click = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(1750, time);
      click.frequency.exponentialRampToValueAtTime(260, time + 0.016);
      cGain.gain.setValueAtTime(0.14, time);
      cGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
      click.connect(cGain);
      cGain.connect(this.musicGain);
      click.start(time);
      click.stop(time + 0.022);
    }

    // 2. Cracking Stadium Rock Snare + Heavy Tom Fill
    const isMonsterFill = step >= 58;
    if (step % 8 === 4 || isMonsterFill) {
      const dur = isMonsterFill ? 0.07 : 0.13;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isMonsterFill ? 1700 : 2150, time);
      filter.Q.setValueAtTime(0.85, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isMonsterFill ? 0.12 + (step - 58) * 0.015 : 0.19, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      if (this.reverbSend) gain.connect(this.reverbSend);
      noise.start(time);

      const body = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      body.type = 'triangle';
      const pitch = isMonsterFill ? 175 - (step - 58) * 14 : 190;
      body.frequency.setValueAtTime(pitch, time);
      body.frequency.exponentialRampToValueAtTime(pitch * 0.55, time + 0.065);
      bGain.gain.setValueAtTime(0.2, time);
      bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);
      body.connect(bGain);
      bGain.connect(this.musicGain);
      body.start(time);
      body.stop(time + 0.08);
    }

    // 3. Real Metallic Crash & Open Hats
    if (step === 0 || step === 32) {
      this.playMetallicCymbal(time, 'crash');
    } else if (step % 2 === 0) {
      this.playMetallicCymbal(time, stepInBar % 4 === 2 ? 'open' : 'hat');
    }

    // 4. Heavy Distorted Guitar Power-Chord Riffs
    if ([0, 2, 3, 6, 8, 10, 12, 14, 15].includes(stepInBar)) {
      const isRingOut = stepInBar === 0 || stepInBar === 8;
      this.playDistortedPowerChord(
        rootFreq,
        time,
        isRingOut ? stepDur * 2.5 : stepDur * 1.1,
        !isRingOut,
        isRingOut ? 0.125 : 0.095
      );
    }

    // 5. Overdriven Analog Rock + Sub Bassline
    if (step % 2 === 0 || stepInBar === 3) {
      this.playRockSynthBass(rootFreq, time, stepDur * 1.4, stepInBar === 0 || stepInBar === 8);
    }

    // 6. Wide Stadium Supersaw Pad
    if (stepInBar === 0 || stepInBar === 8) {
      this.playElectroRockPadChord(monsterChords[barIdx], time, stepDur * 7.2, 0.04);
    }

    // 7. Sung Rock Vocal Hook ("Monster")
    const monsterMelody: Array<number | null> = [
      587.33, null, 587.33, 523.25, 587.33, null, 698.46, null,
      659.25, null, 587.33, null, 523.25, null, 440.0, null,
      466.16, null, 587.33, null, 698.46, null, 659.25, null,
      587.33, null, 523.25, null, 466.16, null, 440.0, null,
      392.0, null, 587.33, null, 783.99, null, 698.46, null,
      659.25, 587.33, 523.25, null, 587.33, null, 659.25, null,
      554.37, null, 659.25, null, 880.0, null, 830.61, null,
      659.25, null, 554.37, null, 587.33, 659.25, 698.46, 659.25,
    ];
    const mNote = monsterMelody[step];
    if (mNote) {
      const vowels: Array<'a' | 'e' | 'i' | 'o'> = ['o', 'o', 'e', 'a', 'o', 'o', 'a', 'a', 'e', 'e', 'o', 'a', 'i', 'i', 'o', 'o'];
      this.playSungVocalNote(mNote, vowels[stepInBar], time, stepDur * 1.8, 0.2);
    }
    if (step === 6 || step === 38 || step === 60) {
      this.playCrowdVocalChant(time, 293.66, false);
    }
  }

  private scheduleMusicStep(step: number, time: number, stepDur: number) {
    if (!this.ctx || !this.musicGain || !this.soundEnabled || !this.musicEnabled) return;

    const barIdx = Math.floor(step / 16); // 0..3 -> F#m, D, A, E
    const stepInBar = step % 16;
    const bassRoots = [92.5, 73.42, 110.0, 82.41];
    const baseBass = bassRoots[barIdx];
    const chords: Array<[number, number, number, number]> = [
      [369.99, 440.0, 554.37, 739.99], // F#m
      [293.66, 369.99, 440.0, 587.33], // D
      [440.0, 554.37, 659.25, 880.0],  // A
      [329.63, 415.3, 493.88, 659.25], // E
    ];

    // 1. Punchy Electronic-Rock Kick (groovy syncopated rock-pop drive)
    if (stepInBar === 0 || stepInBar === 3 || stepInBar === 8 || stepInBar === 10) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.085);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.42, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.125);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.13);

      const click = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(1600, time);
      click.frequency.exponentialRampToValueAtTime(240, time + 0.016);
      cGain.gain.setValueAtTime(0.13, time);
      cGain.gain.exponentialRampToValueAtTime(0.001, time + 0.018);
      click.connect(cGain);
      cGain.connect(this.musicGain);
      click.start(time);
      click.stop(time + 0.02);
    }

    // 2. Real Metallic Crash Cymbals & Rock Hi-Hats
    if (step === 0 || step === 32) {
      this.playMetallicCymbal(time, 'crash');
    } else if (step % 2 === 0) {
      this.playMetallicCymbal(time, stepInBar % 4 === 2 ? 'open' : 'hat');
    }

    // 3. Acoustic/Electro Rock Snare + Tom Fill
    const isSnareFill = step >= 60;
    if (step % 8 === 4 || isSnareFill) {
      const dur = isSnareFill ? 0.08 : 0.135;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.55);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSnareFill ? 1600 : 2100, time);
      filter.Q.setValueAtTime(0.85, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isSnareFill ? 0.12 + (step - 60) * 0.02 : 0.19, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      if (this.reverbSend) gain.connect(this.reverbSend);
      noise.start(time);

      const body = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      body.type = 'triangle';
      const pitch = isSnareFill ? 165 - (step - 60) * 14 : 195;
      body.frequency.setValueAtTime(pitch, time);
      body.frequency.exponentialRampToValueAtTime(pitch * 0.56, time + 0.065);
      bGain.gain.setValueAtTime(0.2, time);
      bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);
      body.connect(bGain);
      bGain.connect(this.musicGain);
      body.start(time);
      body.stop(time + 0.08);
    }

    // 4. Crunchy Distorted Guitar Power Chords (No 8-bit arps!)
    if ([0, 3, 6, 8, 10, 12, 14].includes(stepInBar)) {
      const isRingOut = stepInBar === 0 || stepInBar === 8;
      this.playDistortedPowerChord(
        baseBass,
        time,
        isRingOut ? stepDur * 2.6 : stepDur * 1.15,
        !isRingOut,
        isRingOut ? 0.105 : 0.082
      );
    }

    // 5. Analog Picked Rock + Sub Bassline
    if (step % 2 === 0 || stepInBar === 3 || stepInBar === 11) {
      this.playRockSynthBass(baseBass, time, stepDur * 1.45, stepInBar === 0 || stepInBar === 8);
    }

    // 6. Wide Supersaw Electro-Rock Pad Chords
    if (stepInBar === 0 || stepInBar === 8) {
      this.playElectroRockPadChord(chords[barIdx], time, stepDur * 7.5, 0.04);
    }

    // 7. Sung Rock-Pop Lead Vocal ("GO! GO! GO!")
    const melodyPattern: Array<number | null> = [
      554.37, null, 554.37, null, 659.25, null, 587.33, null,
      554.37, 493.88, 440.0, null, 493.88, null, 554.37, null,
      587.33, null, 587.33, null, 739.99, null, 659.25, null,
      587.33, 554.37, 440.0, null, 440.0, null, 493.88, null,
      659.25, null, 659.25, null, 880.0, null, 830.61, null,
      659.25, 554.37, 659.25, null, 554.37, null, 493.88, null,
      493.88, null, 554.37, null, 659.25, null, 415.3, null,
      493.88, null, 659.25, null, 739.99, 659.25, 554.37, 493.88,
    ];
    const note = melodyPattern[step];
    if (note) {
      const vowels: Array<'a' | 'e' | 'i' | 'o'> = ['o', 'o', 'o', 'o', 'a', 'e', 'o', 'o', 'a', 'i', 'e', 'e', 'o', 'o', 'a', 'e'];
      this.playSungVocalNote(note, vowels[stepInBar], time, stepDur * 1.85, 0.21);
    }
    if (step === 0 || step === 2 || step === 4 || step === 32 || step === 34 || step === 36) {
      this.playCrowdVocalChant(time, 369.99, true);
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
