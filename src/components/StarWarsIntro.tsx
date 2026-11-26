import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FastForward, Volume2, VolumeX, Sparkles, ArrowRight } from 'lucide-react';

interface StarWarsIntroProps {
  onComplete: () => void;
  soundEnabled: boolean;
}

const TOTAL_INTRO_MS = 19600;

export const StarWarsIntro: React.FC<StarWarsIntroProps> = ({
  onComplete,
  soundEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);
  const [exiting, setExiting] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const stopFanfare = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore close error
      }
      audioCtxRef.current = null;
    }
    setMusicPlaying(false);
  }, []);

  const triggerExit = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    stopFanfare();
    window.setTimeout(() => {
      onComplete();
    }, 380);
  }, [exiting, onComplete, stopFanfare]);

  // Procedural Star Wars-inspired heroic brass fanfare via Web Audio API (100% offline)
  const playHeroicFanfare = useCallback(() => {
    if (!soundEnabled) return;
    stopFanfare();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      setMusicPlaying(true);

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.22, ctx.currentTime);
      master.connect(ctx.destination);

      const brassNote = (freq: number, startSec: number, durSec: number, vol = 0.28) => {
        const now = ctx.currentTime + startSec;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * 1.003, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
        filter.frequency.exponentialRampToValueAtTime(1150, now + durSec);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.05);
        gain.gain.setValueAtTime(vol * 0.85, now + Math.max(0.06, durSec - 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + durSec + 0.02);
        osc2.stop(now + durSec + 0.02);
      };

      // Heroic original space-opera fanfare motif (Bb major triumphant intervals)
      const motif: Array<[number, number, number, number]> = [
        // Pickup triplets + main call
        [233.08, 2.35, 0.22, 0.24],
        [233.08, 2.58, 0.22, 0.24],
        [233.08, 2.81, 0.22, 0.26],
        [349.23, 3.05, 0.92, 0.34],
        [523.25, 4.02, 0.88, 0.32],
        // Descending heroic triplet
        [466.16, 4.95, 0.22, 0.26],
        [440.0, 5.18, 0.22, 0.26],
        [392.0, 5.41, 0.22, 0.26],
        [698.46, 5.66, 1.05, 0.35],
        [523.25, 6.76, 0.55, 0.28],
        // Answer phrase
        [466.16, 7.36, 0.22, 0.25],
        [440.0, 7.59, 0.22, 0.25],
        [392.0, 7.82, 0.22, 0.25],
        [698.46, 8.07, 1.0, 0.34],
        [523.25, 9.12, 0.52, 0.28],
        // High resolve
        [466.16, 9.7, 0.22, 0.25],
        [440.0, 9.93, 0.22, 0.25],
        [466.16, 10.16, 0.22, 0.25],
        [392.0, 10.42, 1.15, 0.32],
        // Warm pad bass foundation
        [116.54, 2.35, 3.2, 0.2],
        [174.61, 5.66, 3.2, 0.2],
        [130.81, 9.12, 2.8, 0.18],
      ];

      motif.forEach(([freq, t, dur, vol]) => brassNote(freq, t, dur, vol));
    } catch {
      setMusicPlaying(false);
    }
  }, [soundEnabled, stopFanfare]);

  // Check prefers-reduced-motion and auto-complete timer
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    if (!mq.matches) {
      const doneTimer = window.setTimeout(() => {
        triggerExit();
      }, TOTAL_INTRO_MS);
      return () => window.clearTimeout(doneTimer);
    }
  }, [triggerExit]);

  // Keyboard skip (Space / Escape / Enter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter') {
        e.preventDefault();
        triggerExit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerExit]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => stopFanfare();
  }, [stopFanfare]);

  // GPU-friendly Starfield Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const starCount = 240;
    const stars = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random() * 0.95 + 0.05,
      size: Math.random() * 1.6 + 0.5,
      phase: Math.random() * Math.PI * 2,
      tint:
        Math.random() > 0.85
          ? 'rgba(232, 121, 249, '
          : Math.random() > 0.65
          ? 'rgba(34, 211, 238, '
          : 'rgba(241, 245, 249, ',
    }));

    let bgGrad: CanvasGradient | null = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      const w = canvas.width;
      const h = canvas.height;
      bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.25, 0, w * 0.5, h * 0.35, Math.max(w, h) * 0.65);
      bgGrad.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
      bgGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    };
    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();

    const drawFrame = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const elapsedSec = (now - startTime) / 1000;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      if (bgGrad) {
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
      }

      const speed = reducedMotion ? 0 : elapsedSec > 2.2 && elapsedSec < 6.0 ? 0.0022 : 0.00055;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z -= speed;
        if (s.z <= 0.04) {
          s.z = 1;
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
        }

        const px = w * 0.5 + (s.x / s.z) * w * 0.42;
        const py = h * 0.5 + (s.y / s.z) * h * 0.42;
        if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;

        const twinkle = 0.68 + 0.32 * Math.sin(elapsedSec * 2.4 + s.phase);
        const alpha = Math.min(1, (1 - s.z * 0.55) * twinkle);
        const radius = Math.max(1.2, s.size * (1.35 - s.z * 0.6));

        ctx.fillStyle = `${s.tint}${alpha.toFixed(2)})`;
        ctx.fillRect(px - radius * 0.5, py - radius * 0.5, radius, radius);
      }

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    rafId = window.requestAnimationFrame(drawFrame);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion]);

  return (
    <div
      id="starwars-intro-overlay"
      role="dialog"
      aria-label="Introducción cinematográfica de EraBotGames"
      className={`fixed inset-0 z-[100] bg-slate-950 text-slate-100 overflow-hidden select-none transition-opacity duration-400 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Animated Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {reducedMotion ? (
        /* Reduced Motion Accessible Credits Card */
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 text-center">
          <p className="text-cyan-400 text-sm sm:text-base tracking-wide mb-4">
            Hace poco tiempo, en un laboratorio muy, muy cercano...
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(34,211,238,0.4)] mb-6">
            EraBotGames
          </h1>
          <div className="max-w-lg w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 backdrop-blur-md shadow-xl shadow-cyan-500/10">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">Programa hecho por</div>
              <div className="font-display text-2xl font-bold text-white">Carlos Stiven Roa</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">Grupo</div>
                <div className="font-display text-xl font-bold text-cyan-400">CEMOS</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-fuchsia-300/80">Semillero</div>
                <div className="font-display text-xl font-bold text-fuchsia-400">ERA</div>
              </div>
            </div>
          </div>
          <button
            id="btn-enter-erabotgames"
            onClick={triggerExit}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition"
          >
            <span>Entrar a EraBotGames</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Phase 1: Classic Azure/Cyan Prelude */}
          <div className="sw-prelude-anim absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
            <p className="max-w-2xl text-center text-cyan-400 text-xl sm:text-3xl font-medium tracking-wide leading-relaxed drop-shadow-[0_0_16px_rgba(34,211,238,0.35)]">
              Hace poco tiempo, en un laboratorio de visión artificial muy, muy cercano...
            </p>
          </div>

          {/* Phase 2: Iconic Receding EraBotGames Title */}
          <div className="sw-logo-anim absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none">
            <div
              className="font-display font-extrabold uppercase tracking-[0.09em] text-center text-4xl sm:text-6xl md:text-7xl bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent"
              style={{
                filter: 'drop-shadow(0 0 28px rgba(34, 211, 238, 0.45))',
              }}
            >
              EraBotGames
            </div>
            <div className="mt-3 font-display text-xs sm:text-base uppercase tracking-[0.34em] text-slate-300">
              CEMOS · SEMILLERO ERA
            </div>
          </div>

          {/* Phase 3: 3D Perspective Star Wars Credits Crawl */}
          <div className="sw-crawl-stage absolute inset-x-0 top-0 bottom-16 flex justify-center overflow-hidden pointer-events-none">
            <div className="sw-crawl-content w-full max-w-3xl px-6 sm:px-10 text-center font-display text-slate-200">
              <p className="text-lg sm:text-2xl uppercase tracking-[0.28em] text-cyan-400 font-bold mb-2">
                Episodio I
              </p>
              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-[0.12em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent mb-10 leading-tight">
                El Despertar de EraBotGames
              </h2>

              {/* Hero Author & Group Credits */}
              <div className="my-8 py-6 px-6 border-y border-cyan-500/40 bg-slate-900/45 space-y-5">
                <div>
                  <div className="text-xs sm:text-sm uppercase tracking-[0.32em] text-cyan-300/80 mb-1">
                    Programa hecho por
                  </div>
                  <div className="text-3xl sm:text-5xl font-extrabold uppercase tracking-wider text-white drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]">
                    Carlos Stiven Roa
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  <div>
                    <div className="text-xs sm:text-sm uppercase tracking-[0.28em] text-indigo-300/80 mb-1">
                      Grupo
                    </div>
                    <div className="text-2xl sm:text-4xl font-extrabold tracking-widest text-cyan-400">
                      CEMOS
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm uppercase tracking-[0.28em] text-fuchsia-300/80 mb-1">
                      Semillero
                    </div>
                    <div className="text-2xl sm:text-4xl font-extrabold tracking-widest text-fuchsia-400">
                      ERA
                    </div>
                  </div>
                </div>
              </div>

              {/* Epic Space-Opera Narrative */}
              <div className="space-y-7 text-xl sm:text-3xl font-bold leading-relaxed tracking-wide text-slate-200">
                <p>
                  En una nueva era donde la cámara sustituye al control tradicional, nace{' '}
                  <span className="text-white">EraBotGames</span>, una suite interactiva impulsada por{' '}
                  Visión Artificial en tiempo real y ejecución 100% offline.
                </p>
                <p>
                  Domina el corte espacial en <span className="text-cyan-300">CortaFiguras</span>, esquiva trenes y derrota
                  jefes elementales en <span className="text-indigo-300">Metro Runner CV</span>, y captura filtros en vivo
                  dentro de la <span className="text-fuchsia-300">Cabina de Fotos CV</span>.
                </p>
                <p className="text-cyan-300 uppercase tracking-[0.2em] pt-4">
                  ¡Que la Visión Artificial te acompañe!
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subtle Bottom Attribution & Interactive Controls */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-fuchsia-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-left">
            <div className="font-display text-xs sm:text-sm font-bold text-slate-200 tracking-wide">
              Carlos Stiven Roa · Grupo: CEMOS · Semillero: ERA
            </div>
            <div className="w-48 sm:w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
              <div className="sw-progress-fill h-full w-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {soundEnabled && (
            <button
              id="btn-intro-audio"
              onClick={() => (musicPlaying ? stopFanfare() : playHeroicFanfare())}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold transition"
            >
              {musicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{musicPlaying ? 'Silenciar Música' : 'Música Épica'}</span>
            </button>
          )}

          <button
            id="btn-skip-intro"
            onClick={triggerExit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition"
          >
            <FastForward className="w-4 h-4" />
            <span>Saltar Intro (Espacio)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
