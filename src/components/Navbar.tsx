import React from 'react';
import { Camera, Code2, BookOpen, Sparkles, Volume2, VolumeX, RotateCcw, Award, Film } from 'lucide-react';

interface NavbarProps {
  activeTab: 'game' | 'python' | 'guide';
  setActiveTab: (tab: 'game' | 'python' | 'guide') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  highScore: number;
  onResetHighScore: () => void;
  onReplayIntro: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  highScore,
  onResetHighScore,
  onReplayIntro,
}) => {
  const [showConfirmReset, setShowConfirmReset] = React.useState(false);

  const handleReset = () => {
    onResetHighScore();
    setShowConfirmReset(false);
  };
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent tracking-wide">
              EraBotGames
            </h1>
            <p className="text-[11px] text-slate-400">
              CEMOS · Semillero ERA · Modo Offline
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('game')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'game'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Juego Interactivo</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'python'
                ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Código Python</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'guide'
                ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow-md shadow-fuchsia-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guía y Tutorial</span>
          </button>
        </div>

        {/* Sound toggle & High Score */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 shadow-inner">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold hidden sm:inline">Récord:</span>
            <span className="font-bold text-white">{highScore} pts</span>

            {/* Reset Record Button */}
            {highScore > 0 && (
              <>
                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="ml-1 p-1 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-rose-400 transition"
                    title="Reiniciar Récord a 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl z-50 flex flex-col space-y-2 min-w-[170px] text-xs">
                    <span className="text-slate-300 font-medium text-[11px]">¿Reiniciar récord a 0 pts?</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleReset}
                        className="flex-1 py-1 px-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-[10px] transition"
                      >
                        Sí, borrar
                      </button>
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            id="btn-replay-intro"
            onClick={onReplayIntro}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition"
            title="Ver Intro Star Wars"
          >
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Intro</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title={soundEnabled ? 'Desactivar Sonido' : 'Activar Sonido'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
