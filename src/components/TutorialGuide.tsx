import React from 'react';
import {
  BookOpen,
  Terminal,
  HelpCircle,
  Hand,
  Clock,
  Gauge,
  Maximize2,
  Footprints,
  Aperture,
  Sparkles,
  Flame,
  Shield,
  Music,
  Wand2,
  Grid3X3,
  Cpu,
} from 'lucide-react';

export const TutorialGuide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8 text-slate-200">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center space-x-3 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-2">
          <BookOpen className="w-5 h-5" />
          <span>EraBotGames · Documentación Técnica y Guía Offline</span>
        </div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400">
          Suite de Visión Artificial Offline · Carlos Stiven Roa
        </h2>
        <p className="text-xs font-semibold text-indigo-300 mt-1">
          Grupo: CEMOS · Semillero: ERA
        </p>
        <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-3xl">
          Toda la plataforma <strong className="text-slate-200">EraBotGames</strong> funciona 100% sin conexión a internet gracias a tipografías locales y modelos MediaPipe empaquetados en el proyecto. En PC Windows puedes iniciarla al instante con doble clic en{' '}
          <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">Iniciar_EraBotGames.bat</code>, o explorar los módulos de seguimiento gestual, pose corporal y filtros mágicos en Web y Python.
        </p>

        {/* Quick Offline & Intro Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs">
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Intro Star Wars 3D</span>
            </div>
            <p className="text-slate-400">
              Créditos espaciales en perspectiva 3D al inicio con campo de estrellas y botón <strong className="text-slate-200">Intro</strong> en la barra superior para repetirla cuando quieras.
            </p>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
              <Cpu className="w-4 h-4" />
              <span>Modelos MediaPipe Locales</span>
            </div>
            <p className="text-slate-400">
              Los archivos <code className="text-indigo-300">.wasm</code> y <code className="text-indigo-300">.tflite</code> se sirven localmente desde <code className="text-cyan-300">/mediapipe/</code> sin CDN externos.
            </p>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-fuchsia-400 font-bold mb-1">
              <Terminal className="w-4 h-4" />
              <span>Lanzador Directo .bat</span>
            </div>
            <p className="text-slate-400">
              <code className="text-fuchsia-300">Iniciar_EraBotGames.bat</code> levanta el servidor local en el puerto <code className="text-cyan-300">3000</code> y abre el navegador automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: CortaFiguras Dual Hands */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <Hand className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">Módulo 1 · CortaFiguras Dual Hands</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Concept 1: Dual Hands MediaPipe */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Hand className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">1. Seguimiento de 2 Manos Simultáneas</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Configurando <code className="text-cyan-300">max_num_hands=2</code>, MediaPipe detecta y procesa simultáneamente ambas manos en cada cuadro de video.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
              hands = mp_hands.Hands(max_num_hands=2)<br />
              for idx, hand_lms in enumerate(results.multi_hand_landmarks):<br />
              &nbsp;&nbsp;tip = hand_lms.landmark[8] # Punta índice
            </div>
            <p className="text-xs text-slate-400">
              Cada mano mantiene su propia estela luminosa: Mano 1 en <strong>Cian Neón</strong> y Mano 2 en <strong>Fucsia/Rosa Neón</strong>.
            </p>
          </div>

          {/* Concept 2: Dynamic Speed & Spawn Scaling */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Gauge className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">2. Aceleración Progresiva y Slider</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              A medida que acumulas puntos en Arcade (60s), Sprint (30s) o Zen, la velocidad y generación escalan dinámicamente hasta el límite del slider.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
              speed_mult = 1.0 + min(max_speed - 1.0, (score / 1500.0) * (max_speed - 1.0))<br />
              spawn_interval = base_interval / speed_mult
            </div>
            <p className="text-xs text-slate-400">
              Premia la destreza con rachas de combos y congeladores de tiempo.
            </p>
          </div>

          {/* Concept 3: 1-Minute Match Timer & 3 Lives */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">3. Modos Arcade, Sprint y Zen</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Arcade dura <strong>60 segundos</strong> con <strong>3 vidas</strong>; Sprint libera ráfagas sin bombas en <strong>30 segundos</strong> con x2; Zen permite practicar sin límite.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-fuchsia-300">
              time_left = max(0, 60 - (time.time() - start_time))<br />
              if shape.type == 'bomb': lives -= 1
            </div>
            <p className="text-xs text-slate-400">
              Cambia de modo en cualquier momento desde las pestañas superiores del juego.
            </p>
          </div>

          {/* Concept 4: Fullscreen PC Mode */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Maximize2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">4. Modo Pantalla Completa en PC</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Expande cualquier juego a pantalla completa con la tecla <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-cyan-300">F</kbd> o el botón dedicado.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
              # En OpenCV Python:<br />
              cv2.setWindowProperty(win_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            </div>
            <p className="text-xs text-slate-400">
              El renderizado y la cámara espejo se adaptan automáticamente a tu monitor.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Metro Runner CV */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <Footprints className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-white">Módulo 2 · Metro Runner CV (Pose, Combos x10 y Jefes a Distancia)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Footprints className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">1. Seguimiento Corporal (MediaPipe Pose)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Controla 3 carriles inclinando el torso a izquierda/derecha, salta elevando hombros o agáchate bajando la cadera. También responde a flechas <kbd className="px-1 bg-slate-950 border border-slate-700 rounded text-cyan-300">← → ↑ ↓</kbd> / <kbd className="px-1 bg-slate-950 border border-slate-700 rounded text-cyan-300">WASD</kbd>.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
              center_x = (left_shoulder.x + right_shoulder.x) / 2<br />
              lane = 0 if center_x &lt; 0.42 else (2 if center_x &gt; 0.58 else 1)
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">2. Combos de Puños, Umbral 1,000 y Barras Laterales</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Los puños frontales (<code className="text-cyan-300">IZQ ❄️</code> / <code className="text-fuchsia-300">DER 🔥</code>) cargan la <strong>Barra Vertical Izquierda (0 → 1,000)</strong>. Al alcanzar el umbral 1,000 activas <strong>Invulnerabilidad + Daño x10</strong> durante 10s. La <strong>Barra Vertical Derecha</strong> muestra el combo actual y el empuje en vivo sin tapar el centro 3D.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-fuchsia-300">
              Combos: L-R (1-2 Clásico) · L-L-R (Demoledor) · R-R-L (Martillo) · L-R-L-R (Ráfaga)
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">3. Entrenador Pre-Juego y Jefes al Fondo</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Antes de correr, abre el <strong>Entrenador de Combos</strong> para practicar los 4 gestos con tu cámara o teclas <kbd className="px-1 bg-slate-950 border border-slate-700 rounded text-cyan-300">K</kbd>/<kbd className="px-1 bg-slate-950 border border-slate-700 rounded text-cyan-300">J</kbd>. Cada 3 niveles, los Jefes aparecen al fondo (<code className="text-cyan-300">z = -48</code>) lanzando obstáculos en arco parabólico.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Music className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">4. Banco Rock-Electrónico con Voz y Taller</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Escucha y asigna 6 pistas procedurales con guitarra distorsionada, batería de estadio y voz por formantes para Carrera y Jefes. Invierte tus monedas en Escudo Criogénico, Imán x2 o Núcleo +250.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Cabina de Fotos CV (New Multi-Hand & Movie/Dr. Strange Magic) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <Aperture className="w-5 h-5 text-fuchsia-400" />
          <h3 className="text-xl font-bold text-white">Módulo 3 · Cabina de Fotos CV (Filtro Distinto por Mano y Magia Dr. Strange)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
              <Wand2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">1. Filtro Único por Cada Mano (Hasta 6 Manos)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cuando aparecen múltiples manos frente a la cámara (<code className="text-fuchsia-300">maxNumHands: 6</code>), cada mano genera su propio portal circular independiente y recibe <strong>un filtro completamente diferente</strong> (<code className="text-cyan-300">M1</code>, <code className="text-fuchsia-300">M2</code>, <code className="text-indigo-300">M3</code>…).
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-fuchsia-300">
              # Cada mano conserva su filtro en hand_filters[hand_id]<br />
              # Cerrar y reabrir pulgar+índice cambia SOLO el filtro de esa mano
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">2. 26 Filtros de Cine y Magia Animada</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Incluye efectos animados cuadro a cuadro inspirados en cine y fantasía junto a lentes retro clásicos:
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li><strong className="text-cyan-300">Magia Dr. Strange:</strong> Mandala rúnico giratorio con cuadrados y anillos de energía.</li>
              <li><strong className="text-indigo-300">Dimensión Espejo &amp; Ojo de Agamotto:</strong> Prismas fractales y reloj rúnico esmeralda.</li>
              <li><strong className="text-fuchsia-300">Cine &amp; Fantasía:</strong> Holograma Galáctico, Magia Escarlata, Escudo Patronus, Pulso Vibranium, Cómic Multiverso, Neon Blade Runner y Mundo del Revés.</li>
              <li><strong className="text-slate-200">Lentes Ópticos (16):</strong> Ojo de Pez 8mm, Y2K 2003, CRT VHS, Prisma RGB, Visión Térmica, Matrix y más.</li>
            </ul>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Grid3X3 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">3. Gesto de Captura ✌️ y Sliding Puzzle CV en Vivo</h4>
                  <p className="text-xs text-slate-300">
                    Cierra y vuelve a abrir <strong>pulgar e índice</strong> para rotar el filtro de esa mano; levanta <strong>índice + corazón en V (✌️)</strong> para activar una cuenta regresiva de 3 segundos que guarda la foto y la convierte en un <strong>Sliding Puzzle en vivo (3×3 a 6×6)</strong> manipulable pellizcando las piezas frente a la cámara.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Installation Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-lg">
          <Terminal className="w-5 h-5" />
          <span>Guía Paso a Paso para Ejecutar en tu Computadora (Offline o Python)</span>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <strong className="text-white block text-sm">Modo Suite Completa Offline (.bat en Windows)</strong>
              <span>Una vez generada la carpeta <code className="text-cyan-300">dist/</code> con <code className="text-indigo-300">npm run build</code>, haz doble clic en <code className="text-cyan-300">Iniciar_EraBotGames.bat</code> incluso sin internet para jugar CortaFiguras, Metro Runner CV y Cabina de Fotos CV idénticos a la versión online.</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <strong className="text-white block text-sm">Instalar Dependencias de Visión Artificial para Scripts Python</strong>
              <span>Si deseas correr los scripts nativos de la pestaña <strong>Código Python</strong>, instala OpenCV, MediaPipe, NumPy y Pygame:</span>
              <code className="block bg-slate-900 p-2 rounded-lg mt-1 text-cyan-300 font-mono">pip install opencv-python mediapipe numpy pygame</code>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-fuchsia-500 text-white font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <strong className="text-white block text-sm">Ejecutar el Módulo Python Elegido</strong>
              <span>Descarga desde <strong>Código Python</strong> el módulo que prefieras y ejecútalo en tu consola:</span>
              <code className="block bg-slate-900 p-2 rounded-lg mt-1 text-indigo-300 font-mono">
                python corta_figuras.py &nbsp;# o python cabina_fotos_magia_cv.py &nbsp;# o python metro_runner_pose_cv.py
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ & Troubleshooting */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-300 font-bold text-lg">
          <HelpCircle className="w-5 h-5" />
          <span>Preguntas Frecuentes y Consejos de Juego</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Cómo tener un filtro diferente en cada mano en Cabina CV?</h4>
            <p className="text-slate-400">
              Solo muestra 2 o más manos frente a la cámara: la suite asigna automáticamente un filtro único por mano. Cierra y reabre pulgar e índice de una mano para cambiar únicamente su propio efecto.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Cómo activar el modo x10 en Metro Runner CV?</h4>
            <p className="text-slate-400">
              Lanza puños frontales para encadenar combos especiales y llenar la barra vertical izquierda hasta el umbral <strong>1,000</strong>. Obtendrás Invulnerabilidad total y Multiplicador x10 durante 10 segundos.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Funciona realmente sin internet en otro PC?</h4>
            <p className="text-slate-400">
              Sí. Todas las tipografías (<code className="text-cyan-300">@fontsource</code>) y modelos neuronales de <code className="text-cyan-300">@mediapipe/hands</code> y <code className="text-cyan-300">@mediapipe/pose</code> van dentro de <code className="text-indigo-300">dist/</code> junto a <code className="text-fuchsia-300">Iniciar_EraBotGames.bat</code>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">¿Qué hacer si la cámara va lenta con 4-6 manos?</h4>
            <p className="text-slate-400">
              Asegúrate de tener buena iluminación frontal y reduce la resolución a 640×480 en el script Python si tu PC no tiene GPU dedicada, manteniendo 30-60 FPS fluidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
