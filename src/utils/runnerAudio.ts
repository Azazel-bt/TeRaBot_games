// Procedural Web Audio API Music Sequencer, Subway Surfers-Inspired Vocal Song Bank & SFX Engine

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
  cowbellPattern: number[]; // 16-step pattern inside each bar
  vocalPitchShift: number; // 1.0 = warm pop voice, 1.25 = bright nightcore voice
  groovyBreakbeat: boolean;
}

export const NIGHTCORE_TRACK_BANK: NightcoreTrackDef[] = [
  {
    id: 'subway_dash_vocal',
    title: '1. Subway Street Dash (Con Voz)',
    subtitle: 'Estilo Subway Surfers · Groove Callejero',
    vibe: 'runner',
    bpm: 138,
    keyLabel: 'C Mayor',
    energyRating: 'Flow 10/10',
    accent: '#22d3ee',
    description:
      'Ritmo casual súper pegajoso con breakbeat funky, cencerro surfero, marimba y voz cantada ("Ah-Oh-Ee-Ah!") con coros "¡HEY! ¡GO!".',
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
    cowbellPattern: [0, 3, 6, 8, 11, 14],
    vocalPitchShift: 1.0,
    groovyBreakbeat: true,
  },
  {
    id: 'gogogo_casual',
    title: '2. Go Go Go! Surf Pop (Con Voz)',
    subtitle: 'Inspirada en Go Go Go + Ritmo Casual Alegre',
    vibe: 'runner',
    bpm: 146,
    keyLabel: 'F Mayor',
    energyRating: 'Alegre 10/10',
    accent: '#facc15',
    description:
      'La melodía alegre de Go Go Go suavizada a un ritmo casual bailable con voz cantada brillante, palmas y cantos "¡GO! ¡GO! ¡GO!".',
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
    cowbellPattern: [0, 4, 7, 10, 14],
    vocalPitchShift: 1.12,
    groovyBreakbeat: true,
  },
  {
    id: 'skate_neon_funk',
    title: '3. Skate & Rails Funk (Con Voz)',
    subtitle: 'Funk Callejero Relajado · Bajo Slap',
    vibe: 'runner',
    bpm: 132,
    keyLabel: 'G Mayor',
    energyRating: 'Groove 9.5/10',
    accent: '#4ade80',
    description:
      'El ritmo más relajado y con más estilo skate: batería funky con shaker, bajo slap juguetón y coro vocal suave estilo street-pop.',
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
    cowbellPattern: [2, 6, 10, 12, 15],
    vocalPitchShift: 0.96,
    groovyBreakbeat: true,
  },
  {
    id: 'tokyo_metro_pop',
    title: '4. Metro Pop Arcade (Con Voz)',
    subtitle: 'Estilo Tokyo Rails · Voz Kawaii Pop',
    vibe: 'runner',
    bpm: 144,
    keyLabel: 'D Mayor',
    energyRating: 'Catchy 10/10',
    accent: '#f472b6',
    description:
      'Voz aguda estilo Nightcore-Pop suave sobre arpegios de marimba feliz y un beat ligero perfecto para correr sin parar.',
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
    cowbellPattern: [0, 3, 8, 11, 14],
    vocalPitchShift: 1.22,
    groovyBreakbeat: false,
  },
  {
    id: 'graffiti_boss_groove',
    title: '5. Monster Graffiti Groove (Boss)',
    subtitle: 'Monster + Chase Urbano · Con Voz',
    vibe: 'monster',
    bpm: 148,
    keyLabel: 'Am',
    energyRating: 'Épico Casual 10/10',
    accent: '#fb7185',
    description:
      'Beat urbano energético inspirado en Monster + persecución de trenes, con voz cantada emotiva y gritos "¡HEY! ¡RUN!" para jefes.',
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
    cowbellPattern: [0, 4, 8, 10, 12, 14],
    vocalPitchShift: 1.06,
    groovyBreakbeat: true,
  },
  {
    id: 'turbo_hoverboard_vocal',
    title: '6. Hoverboard Party (Con Voz)',
    subtitle: 'Electro-Pop Festivo · Ritmo Bailable',
    vibe: 'runner',
    bpm: 152,
    keyLabel: 'Em',
    energyRating: 'Fiesta 10/10',
    accent: '#c084fc',
    description:
      'Ritmo festivo estilo patineta turbo: percusión ligera con pandereta, bajo saltarín y voz Nightcore alegre cantando el estribillo.',
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
    cowbellPattern: [2, 4, 6, 10, 12, 14],
    vocalPitchShift: 1.15,
    groovyBreakbeat: true,
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
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(16, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.16, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.soundEnabled ? 0.78 : 0;
      this.masterGain.connect(this.compressor);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.36 : 0;
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
      this.masterGain.gain.setTargetAtTime(enabled ? 0.78 : 0, this.ctx.currentTime, 0.04);
    }
    if (!enabled) {
      this.stopMusic();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.36 : 0, this.ctx.currentTime, 0.05);
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
      this.masterGain.gain.setTargetAtTime(0.84, ctx.currentTime, 0.03);
    }
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0.45, ctx.currentTime, 0.03);
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
      this.musicGain.gain.setTargetAtTime(this.musicEnabled ? 0.36 : 0, this.ctx.currentTime, 0.04);
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.soundEnabled ? 0.78 : 0, this.ctx.currentTime, 0.04);
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
        ? 176
        : 168;
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

  // Synthesizes a sung vocal phrase note through dual vowel-formant filters (F1 + F2) + vibrato
  private playSungVocalNote(freq: number, vowel: 'a' | 'e' | 'i' | 'o', time: number, dur: number, level: number) {
    if (!this.ctx || !this.musicGain) return;

    const [f1, f2] = VOWEL_FORMANTS[vowel];
    const glottal = this.ctx.createOscillator();
    const glottalHarmonic = this.ctx.createOscillator();
    glottal.type = 'sawtooth';
    glottalHarmonic.type = 'triangle';

    // Gentle expressive scoop-in pitch bend (like a real singer hitting the note)
    glottal.frequency.setValueAtTime(freq * 0.94, time);
    glottal.frequency.exponentialRampToValueAtTime(freq, time + 0.032);
    glottalHarmonic.frequency.setValueAtTime(freq * 0.94, time);
    glottalHarmonic.frequency.exponentialRampToValueAtTime(freq, time + 0.032);

    // Subtle vocal vibrato
    const vibrato = this.ctx.createOscillator();
    const vibratoDepth = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.6, time);
    vibratoDepth.gain.setValueAtTime(freq * 0.011, time);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(glottal.frequency);
    vibratoDepth.connect(glottalHarmonic.frequency);

    // Parallel Formant Bandpass Filters (gives unmistakable human voice character)
    const bp1 = this.ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.setValueAtTime(f1, time);
    bp1.Q.setValueAtTime(4.2, time);

    const bp2 = this.ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.setValueAtTime(f2, time);
    bp2.Q.setValueAtTime(5.5, time);

    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.7, time);
    gain2.gain.setValueAtTime(0.45, time);

    const masterVocalEnv = this.ctx.createGain();
    masterVocalEnv.gain.setValueAtTime(0.001, time);
    masterVocalEnv.gain.linearRampToValueAtTime(level, time + 0.018);
    masterVocalEnv.gain.setValueAtTime(level * 0.85, time + dur * 0.65);
    masterVocalEnv.gain.exponentialRampToValueAtTime(0.001, time + dur);

    glottal.connect(bp1);
    glottal.connect(bp2);
    glottalHarmonic.connect(bp1);

    bp1.connect(gain1);
    bp2.connect(gain2);
    gain1.connect(masterVocalEnv);
    gain2.connect(masterVocalEnv);
    masterVocalEnv.connect(this.musicGain);

    glottal.start(time);
    glottalHarmonic.start(time);
    vibrato.start(time);
    glottal.stop(time + dur + 0.025);
    glottalHarmonic.stop(time + dur + 0.025);
    vibrato.stop(time + dur + 0.025);
  }

  // Synthesizes energetic street-crew voice shout ("HEY!" / "GO!") right on beat
  private playCrowdVocalChant(time: number, basePitch: number, isGo: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const dur = 0.145;

    // Two slightly detuned crowd voices shouting together
    [0.985, 1.015].forEach((detune) => {
      if (!this.ctx || !this.musicGain) return;
      const voiceOsc = this.ctx.createOscillator();
      voiceOsc.type = 'sawtooth';
      if (isGo) {
        // "GO!": bright punch downward contour
        voiceOsc.frequency.setValueAtTime(basePitch * 1.15 * detune, time);
        voiceOsc.frequency.exponentialRampToValueAtTime(basePitch * 0.85 * detune, time + dur);
      } else {
        // "HEY!": cheerful upward-downward shout
        voiceOsc.frequency.setValueAtTime(basePitch * 0.92 * detune, time);
        voiceOsc.frequency.exponentialRampToValueAtTime(basePitch * 1.2 * detune, time + 0.045);
        voiceOsc.frequency.exponentialRampToValueAtTime(basePitch * 0.95 * detune, time + dur);
      }

      const formant = this.ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(isGo ? 640 : 1250, time); // 'O' for GO, 'EY' for HEY
      formant.frequency.exponentialRampToValueAtTime(isGo ? 520 : 1850, time + dur);
      formant.Q.setValueAtTime(2.8, time);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.001, time);
      env.gain.linearRampToValueAtTime(0.11, time + 0.012);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);

      voiceOsc.connect(formant);
      formant.connect(env);
      env.connect(this.musicGain);
      voiceOsc.start(time);
      voiceOsc.stop(time + dur + 0.02);
    });

    // Crisp consonant breath burst ("H-" / "G-")
    const bLen = Math.floor(this.ctx.sampleRate * 0.032);
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
    bGain.gain.setValueAtTime(0.08, time);
    bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.032);
    breath.connect(bp);
    bp.connect(bGain);
    bGain.connect(this.musicGain);
    breath.start(time);
  }

  // Casual, Groovy Subway Surfers-Inspired Synth + Vocal Engine for NIGHTCORE_TRACK_BANK
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

    // 1. Groovy Subway Surfers Kick (bouncy syncopated breakbeat OR friendly 4-floor)
    const isKick = track.groovyBreakbeat
      ? stepInBar === 0 || stepInBar === 3 || stepInBar === 8 || stepInBar === 10
      : stepInBar % 4 === 0;
    if (isKick) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(160, time);
      kickOsc.frequency.exponentialRampToValueAtTime(48, time + 0.095);
      kickGain.gain.setValueAtTime(0.001, time);
      kickGain.gain.linearRampToValueAtTime(stepInBar === 0 || stepInBar === 8 ? 0.42 : 0.3, time + 0.004);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(time);
      kickOsc.stop(time + 0.13);
    }

    // 2. Casual Snare + Street Clap on Beats 2 & 4 (+ light funky ghost snare)
    const isMainSnare = stepInBar === 4 || stepInBar === 12;
    const isGhostSnare = track.groovyBreakbeat && stepInBar === 15;
    if (isMainSnare || isGhostSnare) {
      const dur = isMainSnare ? 0.11 : 0.05;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.7);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(isMainSnare ? 1950 : 2500, time);
      bp.Q.setValueAtTime(1.0, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isMainSnare ? 0.17 : 0.065, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(bp);
      bp.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);

      if (isMainSnare) {
        // Warm acoustic snare body punch
        const body = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        body.type = 'triangle';
        body.frequency.setValueAtTime(210, time);
        body.frequency.exponentialRampToValueAtTime(115, time + 0.06);
        bGain.gain.setValueAtTime(0.16, time);
        bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
        body.connect(bGain);
        bGain.connect(this.musicGain);
        body.start(time);
        body.stop(time + 0.075);
      }
    }

    // 3. Swung Shaker / Tambourine & Cowbell Groove (classic Subway Surfers vibe!)
    if (step % 2 === 0 || step % 4 === 2) {
      const isOffOpen = step % 4 === 2;
      const dur = isOffOpen ? 0.055 : 0.022;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.4);
      }
      const shaker = this.ctx.createBufferSource();
      shaker.buffer = buffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(7200, time);
      const sGain = this.ctx.createGain();
      sGain.gain.setValueAtTime(isOffOpen ? 0.065 : 0.026, time);
      sGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      shaker.connect(hp);
      hp.connect(sGain);
      sGain.connect(this.musicGain);
      shaker.start(time);
    }

    if (track.cowbellPattern.includes(stepInBar)) {
      const cow1 = this.ctx.createOscillator();
      const cow2 = this.ctx.createOscillator();
      const cowBp = this.ctx.createBiquadFilter();
      const cowGain = this.ctx.createGain();
      cow1.type = 'square';
      cow2.type = 'square';
      cow1.frequency.setValueAtTime(545, time);
      cow2.frequency.setValueAtTime(815, time);
      cowBp.type = 'bandpass';
      cowBp.frequency.setValueAtTime(720, time);
      cowBp.Q.setValueAtTime(2.0, time);
      cowGain.gain.setValueAtTime(0.036, time);
      cowGain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
      cow1.connect(cowBp);
      cow2.connect(cowBp);
      cowBp.connect(cowGain);
      cowGain.connect(this.musicGain);
      cow1.start(time);
      cow2.start(time);
      cow1.stop(time + 0.06);
      cow2.stop(time + 0.06);
    }

    // 4. Bouncy Funky Bassline (warm slap/pop groove)
    const rootFreq = track.rootsHz[barIdx];
    const playBass =
      stepInBar === 0 || stepInBar === 3 || stepInBar === 6 || stepInBar === 8 || stepInBar === 11 || stepInBar === 14;
    if (playBass) {
      const isPop = stepInBar === 6 || stepInBar === 14;
      const bassOsc = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const bGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      const f = isPop ? rootFreq * 2 : rootFreq;
      bassOsc.frequency.setValueAtTime(f, time);
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(isPop ? 1200 : 620, time);
      bGain.gain.setValueAtTime(0.001, time);
      bGain.gain.linearRampToValueAtTime(isPop ? 0.24 : 0.22, time + 0.005);
      bGain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 1.45);
      bassOsc.connect(lp);
      lp.connect(bGain);
      bGain.connect(this.musicGain);
      bassOsc.start(time);
      bassOsc.stop(time + stepDur * 1.5);
    }

    // 5. Playful Marimba / Surf-Guitar Offbeat Chord Plucks
    const chord = track.arpChords[barIdx];
    if (step % 2 === 0) {
      const arpNote = chord[(step / 2) % chord.length];
      const marimba = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      marimba.type = 'sine';
      marimba.frequency.setValueAtTime(arpNote, time);
      mGain.gain.setValueAtTime(0.001, time);
      mGain.gain.linearRampToValueAtTime(0.055, time + 0.003);
      mGain.gain.exponentialRampToValueAtTime(0.001, time + stepDur * 1.15);
      marimba.connect(mGain);
      mGain.connect(this.musicGain);
      marimba.start(time);
      marimba.stop(time + stepDur * 1.2);
    }

    // 6. Sung Vowel-Formant Vocal Lead Melody!
    const note = track.melodyHz[step];
    if (note) {
      const sungFreq = note * track.vocalPitchShift;
      const vowel = track.vowels[stepInBar];
      this.playSungVocalNote(sungFreq, vowel, time, stepDur * 1.85, 0.22);
    }

    // 7. On-Beat Crew Voice Shouts ("GO!" / "HEY!")
    if (track.chantSteps.includes(step)) {
      const isGoTrack = track.id === 'gogogo_casual';
      this.playCrowdVocalChant(time, track.rootsHz[0] * 4.5, isGoTrack);
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
