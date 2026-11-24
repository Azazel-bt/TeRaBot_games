import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HandGameCanvas } from './components/HandGameCanvas';
import { SubwayRunnerGame } from './components/SubwayRunnerGame';
import { PhotoBoothCV } from './components/PhotoBoothCV';
import { PythonStudio } from './components/PythonStudio';
import { TutorialGuide } from './components/TutorialGuide';
import { ActiveGame, GameMode } from './types';
import { runnerAudio } from './utils/runnerAudio';
import { Zap, Award, Sparkles, Heart, Hand, Footprints, Aperture } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'python' | 'guide'>('game');
  const [activeGame, setActiveGame] = useState<ActiveGame>('slicer');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [slicerHighScore, setSlicerHighScore] = useState<number>(0);
  const [runnerHighScore, setRunnerHighScore] = useState<number>(0);

  // Load high scores from localStorage
  useEffect(() => {
    const savedSlicer = localStorage.getItem('cortafiguras_highscore');
    if (savedSlicer) {
      setSlicerHighScore(parseInt(savedSlicer, 10));
    }
    const savedRunner = localStorage.getItem('metrorunner_highscore');
    if (savedRunner) {
      setRunnerHighScore(parseInt(savedRunner, 10));
    }
  }, []);

  // Stop runner music whenever leaving the runner game or switching tabs
  useEffect(() => {
    if (activeTab !== 'game' || activeGame !== 'runner') {
      runnerAudio.stopMusic();
    }
  }, [activeTab, activeGame]);

  const handleSlicerScoreUpdate = useCallback(
    (currentScore: number) => {
      if (currentScore > slicerHighScore) {
        setSlicerHighScore(currentScore);
        localStorage.setItem('cortafiguras_highscore', currentScore.toString());
      }
    },
    [slicerHighScore]
  );

  const handleRunnerScoreUpdate = useCallback(
    (currentScore: number) => {
      if (currentScore > runnerHighScore) {
        setRunnerHighScore(currentScore);
        localStorage.setItem('metrorunner_highscore', currentScore.toString());
      }
    },
    [runnerHighScore]
  );

  const activeHighScore = activeGame === 'runner' ? runnerHighScore : slicerHighScore;

  const handleResetHighScore = useCallback(() => {
    if (activeGame === 'runner') {
      setRunnerHighScore(0);
      localStorage.removeItem('metrorunner_highscore');
    } else {
      setSlicerHighScore(0);
      localStorage.removeItem('cortafiguras_highscore');
    }
  }, [activeGame]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        highScore={activeHighScore}
        onResetHighScore={handleResetHighScore}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6 px-4">
        {activeTab === 'game' && (
          <div className="space-y-5">
            {/* Clean 2-Game Switcher */}
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h2 className="font-display text-lg font-bold text-white tracking-tight">
                  {activeGame === 'slicer'
                    ? 'CortaFiguras AI'
                    : activeGame === 'runner'
                    ? 'Metro Runner CV'
                    : 'Cabina de Fotos CV'}
                </h2>
                <p className="text-xs text-slate-400">
                  {activeGame === 'slicer'
                    ? 'Seguimiento de manos · Corta figuras en el aire'
                    : activeGame === 'runner'
                    ? 'Seguimiento corporal · Esquiva obstáculos, combate Jefes y crea elementos con monedas'
                    : 'Solo pulgar e índice · Filtros aleatorios y Sliding Puzzle en vivo en cámara'}
                </p>
              </div>

              <div className="inline-flex flex-wrap items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-sm gap-1">
                <button
                  id="select-game-slicer"
                  onClick={() => setActiveGame('slicer')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    activeGame === 'slicer'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span>CortaFiguras</span>
                </button>

                <button
                  id="select-game-runner"
                  onClick={() => setActiveGame('runner')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    activeGame === 'runner'
                      ? 'bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Footprints className="w-4 h-4" />
                  <span>Metro Runner CV</span>
                </button>

                <button
                  id="select-game-photobooth"
                  onClick={() => setActiveGame('photobooth')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    activeGame === 'photobooth'
                      ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Aperture className="w-4 h-4" />
                  <span>Cabina Fotos CV</span>
                </button>
              </div>
            </div>

            {activeGame === 'slicer' ? (
              <div className="space-y-4">
                {/* Mode Selection Tabs */}
                <div className="max-w-xl mx-auto flex flex-col items-center space-y-2">
                  <div className="w-full bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-semibold shadow-md">
                    <button
                      id="tab-mode-arcade"
                      onClick={() => setGameMode('arcade')}
                      className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                        gameMode === 'arcade'
                          ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Arcade (60s)</span>
                    </button>

                    <button
                      id="tab-mode-sprint"
                      onClick={() => setGameMode('sprint')}
                      className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                        gameMode === 'sprint'
                          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span>Sprint (30s)</span>
                    </button>

                    <button
                      id="tab-mode-zen"
                      onClick={() => setGameMode('zen')}
                      className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                        gameMode === 'zen'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart className="w-4 h-4 text-emerald-300" />
                      <span>Zen (Sin Límite)</span>
                    </button>
                  </div>

                  {/* Dynamic Game Mode Description */}
                  <div className="w-full text-center px-4 py-2 rounded-xl text-xs border backdrop-blur-sm transition-all duration-300">
                    {gameMode === 'arcade' && (
                      <div className="text-cyan-300/90 bg-cyan-950/40 border-cyan-800/40 rounded-lg p-2">
                        <strong className="text-cyan-300">Modo Arcade (Equilibrado):</strong> 60 segundos de juego con 3 vidas. Aparecen figuras, bombas y congeladores de tiempo. La velocidad aumenta progresivamente con tu puntuación.
                      </div>
                    )}
                    {gameMode === 'sprint' && (
                      <div className="text-amber-300/90 bg-amber-950/40 border-amber-800/40 rounded-lg p-2 shadow-inner">
                        <strong className="text-amber-300">Modo Sprint (Frenesí 30s):</strong> Contrarreloj ultrarrápido de 30 segundos. 0 Bombas, oleadas con ráfagas de hasta 4 figuras a la vez y Puntuación Doble (x2) en combos.
                      </div>
                    )}
                    {gameMode === 'zen' && (
                      <div className="text-emerald-300/90 bg-emerald-950/40 border-emerald-800/40 rounded-lg p-2">
                        <strong className="text-emerald-300">Modo Zen (Relajado):</strong> Sin temporizador, sin bombas y vidas ilimitadas. Ideal para calibrar la cámara o practicar el corte con 2 manos.
                      </div>
                    )}
                  </div>
                </div>

                {/* CortaFiguras Interactive Canvas */}
                <HandGameCanvas
                  gameMode={gameMode}
                  onScoreUpdate={handleSlicerScoreUpdate}
                  soundEnabled={soundEnabled}
                  highScore={slicerHighScore}
                  onResetHighScore={handleResetHighScore}
                />
              </div>
            ) : activeGame === 'runner' ? (
              /* Subway Surfers Style CV Runner */
              <SubwayRunnerGame
                onScoreUpdate={handleRunnerScoreUpdate}
                soundEnabled={soundEnabled}
                highScore={runnerHighScore}
                onResetHighScore={handleResetHighScore}
              />
            ) : (
              /* Interactive CV Hand-Tracking Photo Booth */
              <PhotoBoothCV soundEnabled={soundEnabled} />
            )}
          </div>
        )}

        {activeTab === 'python' && <PythonStudio />}

        {activeTab === 'guide' && <TutorialGuide />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-400">CortaFiguras AI</span>
            <span>· Visión Artificial con MediaPipe Hands & Pose</span>
          </div>
          <div>
            Juegos interactivos con seguimiento gestual y corporal en tiempo real
          </div>
        </div>
      </footer>
    </div>
  );
}
