import React, { useEffect, useState } from 'react';
import {
  Music,
  Play,
  Square,
  X,
  Zap,
  Swords,
  Check,
  Sliders,
  Volume2,
} from 'lucide-react';
import {
  NIGHTCORE_TRACK_BANK,
  NightcoreTrackId,
  runnerAudio,
} from '../utils/runnerAudio';

interface NightcoreBankModalProps {
  onClose: () => void;
}

export const NightcoreBankModal: React.FC<NightcoreBankModalProps> = ({ onClose }) => {
  const [playingId, setPlayingId] = useState<NightcoreTrackId | null>(() =>
    runnerAudio.getPreviewTrackId()
  );
  const [bpmScale, setBpmScale] = useState<number>(1.0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [appliedRunnerId, setAppliedRunnerId] = useState<NightcoreTrackId | 'legacy'>(() =>
    runnerAudio.getSelectedRunnerTrack()
  );
  const [appliedMonsterId, setAppliedMonsterId] = useState<NightcoreTrackId | 'legacy'>(() =>
    runnerAudio.getSelectedMonsterTrack()
  );

  // Sync live step beat meter when previewing
  useEffect(() => {
    if (!playingId) return;
    const id = window.setInterval(() => {
      setActiveStep(runnerAudio.getCurrentStep());
    }, 45);
    return () => window.clearInterval(id);
  }, [playingId]);

  const handleTogglePlay = (trackId: NightcoreTrackId) => {
    if (playingId === trackId) {
      runnerAudio.stopPreview();
      setPlayingId(null);
    } else {
      runnerAudio.previewTrack(trackId, bpmScale);
      setPlayingId(trackId);
    }
  };

  const handleSpeedChange = (nextScale: number) => {
    setBpmScale(nextScale);
    runnerAudio.setPreviewBpmScale(nextScale);
  };

  const handleApplyRunner = (trackId: NightcoreTrackId) => {
    runnerAudio.setSelectedRunnerTrack(trackId);
    setAppliedRunnerId(trackId);
  };

  const handleApplyMonster = (trackId: NightcoreTrackId) => {
    runnerAudio.setSelectedMonsterTrack(trackId);
    setAppliedMonsterId(trackId);
  };

  const handleClose = () => {
    if (playingId) {
      runnerAudio.stopPreview();
    }
    onClose();
  };

  const playingTrack = playingId
    ? NIGHTCORE_TRACK_BANK.find((t) => t.id === playingId) || null
    : null;

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/96 backdrop-blur-md flex flex-col p-5 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-white">
              Banco Rock-Electrónico con Voz · Pre-Escucha Antes de Aplicar
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Escucha 6 pistas de <strong>Rock Electrónico</strong> con guitarras con distorsión, batería de estadio, sintetizadores anchos y voz cantada (sin sonido de 8-bits). Nada cambia hasta que elijas aplicarla.
          </p>
        </div>

        <button
          onClick={handleClose}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition shrink-0"
        >
          <X className="w-4 h-4" />
          <span>Cerrar</span>
        </button>
      </div>

      {/* Live Audition Monitor + BPM Multiplier */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              playingTrack
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {playingTrack ? 'Reproduciendo Pre-Escucha' : 'Selecciona una pista para escuchar'}
            </span>
            <span className="block text-sm font-bold text-white truncate">
              {playingTrack
                ? `${playingTrack.title} · ${Math.round(playingTrack.bpm * bpmScale)} BPM (${playingTrack.keyLabel})`
                : '6 pistas listas · Haz clic en Escuchar'}
            </span>
          </div>
        </div>

        {/* 16-step Live Beat Visualizer */}
        <div className="flex items-end gap-1 h-7 px-2">
          {Array.from({ length: 16 }).map((_, i) => {
            const isCurrent = playingTrack !== null && activeStep % 16 === i;
            const isQuarter = i % 4 === 0;
            return (
              <div
                key={i}
                className="w-1.5 rounded-sm transition-all duration-75"
                style={{
                  height: isCurrent ? '100%' : isQuarter ? '52%' : '26%',
                  backgroundColor: isCurrent
                    ? playingTrack?.accent || '#22d3ee'
                    : isQuarter
                    ? 'rgba(148, 163, 184, 0.5)'
                    : 'rgba(71, 85, 105, 0.45)',
                }}
              />
            );
          })}
        </div>

        {/* Audition Pitch / Speed Control */}
        <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
          <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
          <span className="text-[11px] font-semibold text-slate-300">Velocidad:</span>
          <input
            type="range"
            min="0.9"
            max="1.15"
            step="0.05"
            value={bpmScale}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-20 accent-fuchsia-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <span className="font-mono-num text-xs font-bold text-fuchsia-300 w-10 text-right">
            {bpmScale.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* 6-Track Song Bank Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {NIGHTCORE_TRACK_BANK.map((track) => {
          const isPlaying = playingId === track.id;
          const isRunnerSelected = appliedRunnerId === track.id;
          const isMonsterSelected = appliedMonsterId === track.id;
          const effectiveBpm = Math.round(track.bpm * bpmScale);

          return (
            <div
              key={track.id}
              className={`rounded-xl p-4 border transition flex flex-col justify-between gap-3 ${
                isPlaying
                  ? 'bg-slate-900 border-cyan-400/70 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <h4
                      className="font-display text-sm sm:text-base font-extrabold truncate"
                      style={{ color: track.accent }}
                    >
                      {track.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {track.subtitle} · <span className="text-slate-200">{effectiveBpm} BPM</span> · {track.keyLabel}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0"
                    style={{
                      color: track.accent,
                      borderColor: `${track.accent}55`,
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    }}
                  >
                    {track.energyRating}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{track.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => handleTogglePlay(track.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                    isPlaying
                      ? 'bg-rose-500 hover:bg-rose-400 text-slate-950'
                      : 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:brightness-110 text-slate-950'
                  }`}
                >
                  {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Detener' : 'Escuchar'}</span>
                </button>

                <button
                  onClick={() => handleApplyRunner(track.id)}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold border transition ${
                    isRunnerSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                  title="Aplicar esta pista para la carrera normal"
                >
                  {isRunnerSelected ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isRunnerSelected ? 'En Carrera' : 'Usar en Carrera'}</span>
                </button>

                <button
                  onClick={() => handleApplyMonster(track.id)}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold border transition ${
                    isMonsterSelected
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                  title="Aplicar esta pista para las peleas contra Jefes"
                >
                  {isMonsterSelected ? <Check className="w-3.5 h-3.5" /> : <Swords className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{isMonsterSelected ? 'En Jefes' : 'Usar en Jefes'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
        <span>
          Configuración actual:{' '}
          <strong className="text-cyan-300">
            Carrera:{' '}
            {appliedRunnerId === 'legacy'
              ? 'Original (Sin cambios)'
              : NIGHTCORE_TRACK_BANK.find((t) => t.id === appliedRunnerId)?.title}
          </strong>{' '}
          ·{' '}
          <strong className="text-rose-300">
            Jefes:{' '}
            {appliedMonsterId === 'legacy'
              ? 'Monster Original (Sin cambios)'
              : NIGHTCORE_TRACK_BANK.find((t) => t.id === appliedMonsterId)?.title}
          </strong>
        </span>
        {(appliedRunnerId !== 'legacy' || appliedMonsterId !== 'legacy') && (
          <button
            onClick={() => {
              runnerAudio.setSelectedRunnerTrack('legacy');
              runnerAudio.setSelectedMonsterTrack('legacy');
              setAppliedRunnerId('legacy');
              setAppliedMonsterId('legacy');
            }}
            className="text-slate-300 hover:text-white underline"
          >
            Restaurar originales
          </button>
        )}
      </div>
    </div>
  );
};
