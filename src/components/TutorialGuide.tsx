import React from 'react';
import { BookOpen, Cpu, ShieldCheck, Zap, Code, Terminal, Layers, HelpCircle, Hand, Clock, Gauge, Maximize2 } from 'lucide-react';

export const TutorialGuide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8 text-slate-200">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center space-x-3 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-2">
          <BookOpen className="w-5 h-5" />
          <span>Documentación Técnica y Guía Didáctica</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white">
          Cómo Funciona el Juego con 2 Manos, OpenCV y MediaPipe
        </h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-3xl">
          Esta guía explica paso a paso los principios de visión por computadora para seguimiento gestual simultáneo de 2 manos, aceleración progresiva de velocidad, temporizador de 1 minuto y pantalla completa en Python y la Web.
        </p>
      </div>

      {/* Grid of Key Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concept 1: Dual Hands MediaPipe */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Hand className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">1. Seguimiento de 2 Manos Simultáneas</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Configurando <code className="text-cyan-300">max_num_hands=2</code>, MediaPipe detecta y procesa simultáneamente ambas manos en cada cuadro de video.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
            hands = mp_hands.Hands(max_num_hands=2)<br />
            for idx, hand_lms in enumerate(results.multi_hand_landmarks):<br />
            &nbsp;&nbsp;tip = hand_lms.landmark[8] # Punta índice
          </div>
          <p className="text-xs text-slate-400">
            Cada mano mantiene su propia cola de estela virtual: Mano 1 en <strong>Cian Neón</strong> y Mano 2 en <strong>Rosa Neón</strong>.
          </p>
        </div>

        {/* Concept 2: Dynamic Speed & Spawn Scaling */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Gauge className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">2. Aceleración Progresiva y Slider de Velocidad</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            A medida que acumulas puntos, la velocidad de movimiento de las figuras y la tasa de generación aumentan dinámicamente hasta el límite fijado en el slider.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
            speed_mult = 1.0 + min(max_speed - 1.0, (score / 1500.0) * (max_speed - 1.0))<br />
            spawn_interval = base_interval / speed_mult
          </div>
          <p className="text-xs text-slate-400">
            Esto crea una curva de dificultad progresiva que premia la destreza y los reflejos rápidos.
          </p>
        </div>

        {/* Concept 3: 1-Minute Match Timer & 3 Lives */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">3. Temporizador de 1 Minuto y 3 Vidas</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            La partida dura exactamente <strong>60 segundos</strong> con un cronómetro regresivo. Tienes <strong>3 vidas</strong>; cortar una bomba resta una vida inmediatamente.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-fuchsia-300">
            time_left = max(0, 60 - (time.time() - start_time))<br />
            if shape.type == 'bomb': lives -= 1
          </div>
          <p className="text-xs text-slate-400">
            La partida finaliza cuando el tiempo llega a 0 o si se agotan las 3 vidas disponibles.
          </p>
        </div>

        {/* Concept 4: Fullscreen PC Mode */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Maximize2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">4. Modo Pantalla Completa en PC</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Puedes expandir el juego a pantalla completa en cualquier momento presionando la tecla <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-cyan-300">F</kbd> o usando el botón dedicado.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300">
            # En OpenCV Python:<br />
            cv2.setWindowProperty(win_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
          </div>
          <p className="text-xs text-slate-400">
            El renderizado se adapta fluidamente a la resolución nativa de tu monitor.
          </p>
        </div>
      </div>

      {/* Step-by-Step Installation Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-lg">
          <Terminal className="w-5 h-5" />
          <span>Guía Paso a Paso para Ejecutar en tu Computadora</span>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <strong className="text-white block text-sm">Instalar Python 3.9+ y Entorno</strong>
              <span>Asegúrate de tener Python instalado. Puedes verificarlo abriendo tu terminal o CMD y escribiendo:</span>
              <code className="block bg-slate-900 p-2 rounded-lg mt-1 text-cyan-300 font-mono">python --version</code>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <strong className="text-white block text-sm">Instalar Dependencias de Visión Artificial</strong>
              <span>Ejecuta el siguiente comando en tu consola para instalar OpenCV, MediaPipe y las bibliotecas necesarias:</span>
              <code className="block bg-slate-900 p-2 rounded-lg mt-1 text-emerald-400 font-mono">pip install opencv-python mediapipe numpy pygame</code>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <strong className="text-white block text-sm">Ejecutar el Script</strong>
              <span>Descarga el código generado en la pestaña "Código Python" como <code className="text-cyan-300">corta_figuras.py</code> y ejecútalo:</span>
              <code className="block bg-slate-900 p-2 rounded-lg mt-1 text-amber-300 font-mono">python corta_figuras.py</code>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ & Troubleshooting */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-lg">
          <HelpCircle className="w-5 h-5" />
          <span>Preguntas Frecuentes y Consejos de Juego</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Cómo jugar con dos personas a la vez?</h4>
            <p className="text-slate-400">
              Con el modo 2 manos activado, dos jugadores pueden pararse frente a la cámara y cada uno cortar con su mano de forma cooperativa o competitiva.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Cómo cambiar la velocidad máxima del juego?</h4>
            <p className="text-slate-400">
              Usa el control deslizante (slicer) en la barra de ajustes inferior para ajustar el multiplicador desde 1.0x (tranquilo) hasta 3.5x (modo maestro ninja).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Qué atajos de teclado están disponibles?</h4>
            <p className="text-slate-400">
              Presiona <kbd className="px-1 bg-slate-800 rounded border border-slate-700 text-cyan-300">F</kbd> para pantalla completa, <kbd className="px-1 bg-slate-800 rounded border border-slate-700 text-cyan-300">P</kbd> para pausar y <kbd className="px-1 bg-slate-800 rounded border border-slate-700 text-cyan-300">R</kbd> para reiniciar la partida de 60 segundos.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Qué hacer si la cámara va lenta?</h4>
            <p className="text-slate-400">
              Asegúrate de contar con buena iluminación en la habitación. Una buena luz permite a MediaPipe detectar las 2 manos a 60 FPS estables sin retraso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
