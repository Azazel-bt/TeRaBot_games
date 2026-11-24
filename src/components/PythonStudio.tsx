import React, { useState } from 'react';
import { generatePythonScript } from '../utils/shapeMath';
import { Code2, Copy, Download, Check, Sliders, Sparkles, Hand, Clock, Gauge, Maximize2 } from 'lucide-react';

export const PythonStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'opencv' | 'pygame' | 'requirements'>('opencv');
  const [copied, setCopied] = useState<boolean>(false);

  // Configurator controls
  const [camWidth, setCamWidth] = useState<number>(640);
  const [camHeight, setCamHeight] = useState<number>(480);
  const [maxNumHands, setMaxNumHands] = useState<number>(2);
  const [ropeLength, setRopeLength] = useState<number>(20);
  const [ropeColor, setRopeColor] = useState<string>('cyan');
  const [ropeThickness, setRopeThickness] = useState<number>(6);
  const [gravity, setGravity] = useState<number>(0.8);
  const [spawnRate, setSpawnRate] = useState<number>(1.2);
  const [maxSpeedMultiplier, setMaxSpeedMultiplier] = useState<number>(2.5);
  const [matchDuration, setMatchDuration] = useState<number>(60);
  const [confidence, setConfidence] = useState<number>(0.6);

  const pythonCode = generatePythonScript({
    camWidth,
    camHeight,
    maxNumHands,
    ropeLength,
    ropeColor,
    ropeThickness,
    gravity,
    spawnRate,
    maxSpeedMultiplier,
    matchDuration,
    minDetectionConfidence: confidence,
  });

  const pygameCode = `# =====================================================================
# CortaFiguras AI - Juego con PyGame, 2 Manos y MediaPipe (Alto Rendimiento)
# =====================================================================
# Instrucciones de instalación:
#   pip install opencv-python mediapipe numpy pygame
#
# Para ejecutar:
#   python corta_figuras_pygame.py
#
# Controles:
#   - 'f': Pantalla Completa
#   - 'r': Reiniciar partida (60 segundos y 3 vidas)
#   - 'ESC': Salir
# =====================================================================
import cv2
import mediapipe as mp
import pygame
import random
import math
import sys
import time
from collections import deque

pygame.init()
pygame.mixer.init()

WIDTH, HEIGHT = ${camWidth}, ${camHeight}
screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
pygame.display.set_caption("CortaFiguras AI - PyGame + 2 Manos MediaPipe")
clock = pygame.time.Clock()

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=${maxNumHands},
    min_detection_confidence=${confidence},
    min_tracking_confidence=${confidence}
)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)

# Colas independientes para 2 manos
hand_trails = [deque(maxlen=${ropeLength}) for _ in range(${maxNumHands})]
shapes = []
score = 0
lives = 3  # Exactamente 3 vidas
combo = 0
start_time = time.time()
last_spawn = time.time()
MATCH_DURATION = ${matchDuration}  # 60 segundos
MAX_SPEED = ${maxSpeedMultiplier}
is_fullscreen = False

font = pygame.font.SysFont("Arial", 24, bold=True)
font_large = pygame.font.SysFont("Arial", 40, bold=True)

class ShapePygame:
    def __init__(self, speed_mult=1.0):
        self.type = random.choice(['circle', 'square', 'triangle', 'star', 'bomb'])
        self.radius = random.randint(32, 52)
        self.x = random.randint(80, WIDTH - 80)
        self.y = HEIGHT + self.radius
        self.vx = random.uniform(-2.5, 2.5) * min(speed_mult, 1.8)
        self.vy = random.uniform(-16, -11) * min(speed_mult, 2.4)
        self.rotation = 0.0
        self.v_rot = random.uniform(-0.08, 0.08) * speed_mult
        self.color = (random.randint(80, 255), random.randint(120, 255), 255) if self.type != 'bomb' else (239, 68, 68)
        self.is_sliced = False

    def update(self, speed_mult=1.0):
        self.x += self.vx
        self.y += self.vy
        self.vy += ${gravity} * speed_mult
        self.rotation += self.v_rot

    def draw(self, surface):
        if self.is_sliced: return
        if self.type == 'circle' or self.type == 'bomb':
            pygame.draw.circle(surface, self.color, (int(self.x), int(self.y)), self.radius)
            pygame.draw.circle(surface, (255, 255, 255), (int(self.x), int(self.y)), self.radius, 3)
            if self.type == 'bomb':
                txt = font.render("!", True, (255, 255, 255))
                surface.blit(txt, (int(self.x) - 5, int(self.y) - 12))
        elif self.type == 'square':
            r = self.radius
            rect = pygame.Rect(int(self.x - r), int(self.y - r), int(r * 2), int(r * 2))
            pygame.draw.rect(surface, self.color, rect, border_radius=8)
            pygame.draw.rect(surface, (255, 255, 255), rect, 3, border_radius=8)
        elif self.type == 'triangle':
            pts = []
            for i in range(3):
                angle = self.rotation + i * (2 * math.pi / 3) - math.pi / 2
                pts.append((int(self.x + self.radius * math.cos(angle)), int(self.y + self.radius * math.sin(angle))))
            pygame.draw.polygon(surface, self.color, pts)
            pygame.draw.polygon(surface, (255, 255, 255), pts, 3)

running = True

while running:
    # 1. Eventos
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False
            elif event.key == pygame.K_f:
                is_fullscreen = not is_fullscreen
                if is_fullscreen:
                    screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.FULLSCREEN)
                else:
                    screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
            elif event.key == pygame.K_r:
                score = 0
                lives = 3
                combo = 0
                shapes.clear()
                start_time = time.time()

    # 2. Cámara y Seguimiento de 2 Manos
    ret, frame = cap.read()
    if not ret: break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    detected_hands = 0
    if results.multi_hand_landmarks:
        detected_hands = len(results.multi_hand_landmarks)
        for idx, hand_landmarks in enumerate(results.multi_hand_landmarks[:${maxNumHands}]):
            index_tip = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
            cx, cy = int(index_tip.x * WIDTH), int(index_tip.y * HEIGHT)
            hand_trails[idx].append((cx, cy))

    # Frame de fondo en PyGame
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_surface = pygame.surfarray.make_surface(frame_rgb.swapaxes(0, 1))
    screen.blit(frame_surface, (0, 0))

    # 3. Temporizador de 1 Minuto y Velocidad Dinámica
    elapsed = time.time() - start_time
    time_left = max(0.0, MATCH_DURATION - elapsed)
    speed_mult = 1.0 + min(MAX_SPEED - 1.0, (score / 1500.0) * (MAX_SPEED - 1.0))
    spawn_interval = max(0.4, ${spawnRate} / speed_mult)

    # 4. Dibujar Cuerdas Neón para Mano 1 (Cian) y Mano 2 (Rosa)
    hand_colors = [(0, 242, 254), (244, 63, 94)]
    for idx in range(len(hand_trails)):
        trail = hand_trails[idx]
        if len(trail) >= 2:
            pts = list(trail)
            color = hand_colors[idx % 2]
            pygame.draw.lines(screen, color, False, pts, ${ropeThickness})
            pygame.draw.circle(screen, (255, 255, 255), pts[-1], ${ropeThickness} + 2)

    # 5. Generar y Actualizar Figuras
    if time_left > 0 and lives > 0:
        if time.time() - last_spawn > spawn_interval:
            shapes.append(ShapePygame(speed_mult))
            last_spawn = time.time()

    for shape in shapes[:]:
        shape.update(speed_mult)
        shape.draw(screen)

        # Colisión con ambas manos
        for idx in range(len(hand_trails)):
            trail = hand_trails[idx]
            if len(trail) >= 2 and not shape.is_sliced:
                p1, p2 = trail[-2], trail[-1]
                dist = math.hypot(shape.x - p2[0], shape.y - p2[1])
                if dist < shape.radius + 15:
                    shape.is_sliced = True
                    if shape.type == 'bomb':
                        lives -= 1
                        combo = 0
                    else:
                        combo += 1
                        score += 100 * combo
                    break

        if shape.y > HEIGHT + 80 or shape.is_sliced:
            shapes.remove(shape)

    # 6. Interfaz HUD (Puntaje, Tiempo 60s, 3 Vidas, Velocidad)
    hud_bg = pygame.Surface((340, 110))
    hud_bg.set_alpha(200)
    hud_bg.fill((15, 23, 42))
    screen.blit(hud_bg, (15, 15))

    txt_score = font.render(f"Puntaje: {score}", True, (0, 242, 254))
    screen.blit(txt_score, (25, 22))

    timer_str = f"Tiempo: {int(time_left // 60):02d}:{int(time_left % 60):02d}"
    txt_timer = font.render(timer_str, True, (244, 63, 94) if time_left <= 10 else (255, 255, 255))
    screen.blit(txt_timer, (25, 48))

    hearts = "❤️ " * max(0, lives)
    txt_lives = font.render(f"Vidas: {hearts}", True, (255, 100, 100))
    screen.blit(txt_lives, (25, 74))

    txt_spd = font.render(f"Vel: {speed_mult:.1f}x | Manos: {detected_hands}/2", True, (168, 85, 247))
    screen.blit(txt_spd, (25, 96))

    # Game Over / Tiempo Agotado
    if time_left <= 0 or lives <= 0:
        over_text = font_large.render("¡TIEMPO AGOTADO!" if time_left <= 0 else "¡SIN VIDAS!", True, (255, 255, 0))
        screen.blit(over_text, (WIDTH // 2 - 160, HEIGHT // 2 - 40))
        restart_text = font.render("Presiona 'R' para reiniciar", True, (255, 255, 255))
        screen.blit(restart_text, (WIDTH // 2 - 130, HEIGHT // 2 + 20))

    pygame.display.flip()
    clock.tick(60)

cap.release()
pygame.quit()
sys.exit()
`;

  const requirementsTxt = `opencv-python>=4.8.0
mediapipe>=0.10.0
numpy>=1.24.0
pygame>=2.5.0
`;

  const getCurrentCode = () => {
    if (activeTab === 'opencv') return pythonCode;
    if (activeTab === 'pygame') return pygameCode;
    return requirementsTxt;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'opencv' ? 'corta_figuras.py' : activeTab === 'pygame' ? 'corta_figuras_pygame.py' : 'requirements.txt';
    const blob = new Blob([getCurrentCode()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 text-white">
      {/* Studio Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Code2 className="w-4 h-4" />
            <span>Estudio de Generación de Código Python</span>
          </div>
          <h2 className="text-2xl font-bold">Generador Personalizado con 2 Manos, 60s y Pantalla Completa</h2>
          <p className="text-slate-400 text-sm mt-1">
            Genera scripts en Python nativos con OpenCV, MediaPipe y Pygame listos para ejecutar con 2 manos simultáneas, escala de velocidad, temporizador de 1 minuto y pantalla completa.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition text-sm font-semibold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-cyan-500/20 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Archivo .py</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Parameters Customizer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-lg">Ajustes de Parámetros</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Number of Hands */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">Cantidad de Manos</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMaxNumHands(1)}
                  className={`p-2.5 rounded-xl border text-center font-medium ${
                    maxNumHands === 1 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  1 Mano
                </button>
                <button
                  onClick={() => setMaxNumHands(2)}
                  className={`p-2.5 rounded-xl border text-center font-medium ${
                    maxNumHands === 2 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  2 Manos (Dual)
                </button>
              </div>
            </div>

            {/* Max Speed Slicer */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Velocidad Máxima (Slicer):</span>
                <span className="text-cyan-400">{maxSpeedMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={maxSpeedMultiplier}
                onChange={(e) => setMaxSpeedMultiplier(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">Resolución Cámara</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setCamWidth(640); setCamHeight(480); }}
                  className={`p-2.5 rounded-xl border text-center font-medium ${
                    camWidth === 640 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  640 x 480 (Rápido)
                </button>
                <button
                  onClick={() => { setCamWidth(1280); setCamHeight(720); }}
                  className={`p-2.5 rounded-xl border text-center font-medium ${
                    camWidth === 1280 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  1280 x 720 (HD)
                </button>
              </div>
            </div>

            {/* Rope Length slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Puntos de la Cuerda (Deque):</span>
                <span className="text-cyan-400">{ropeLength} pts</span>
              </div>
              <input
                type="range"
                min={8}
                max={40}
                value={ropeLength}
                onChange={(e) => setRopeLength(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Rope Thickness */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Grosor de Cuerda:</span>
                <span className="text-cyan-400">{ropeThickness} px</span>
              </div>
              <input
                type="range"
                min={2}
                max={16}
                value={ropeThickness}
                onChange={(e) => setRopeThickness(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Gravity slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Fuerza de Gravedad Base:</span>
                <span className="text-cyan-400">{gravity}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={2.0}
                step={0.1}
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Match Duration (1 Minute) */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Duración de Partida:</span>
                <span className="text-cyan-400">{matchDuration} segundos</span>
              </div>
              <input
                type="range"
                min={30}
                max={180}
                step={15}
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* MediaPipe Confidence */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Confianza MediaPipe:</span>
                <span className="text-cyan-400">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={0.9}
                step={0.05}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Instrucciones de Ejecución</span>
            </div>
            <p>1. Instala las dependencias en tu terminal:</p>
            <div className="bg-slate-950 p-2 rounded-lg font-mono text-cyan-300 flex justify-between items-center">
              <span>pip install opencv-python mediapipe numpy pygame</span>
            </div>
            <p>2. Ejecuta el archivo python generado:</p>
            <div className="bg-slate-950 p-2 rounded-lg font-mono text-emerald-400">
              python corta_figuras.py
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer with Tabs */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Script Tabs */}
          <div className="bg-slate-950 border-b border-slate-800 p-2 flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('opencv')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'opencv'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              main_opencv_dual_hands.py
            </button>

            <button
              onClick={() => setActiveTab('pygame')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'pygame'
                  ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              pygame_hybrid_dual_hands.py
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'requirements'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              requirements.txt
            </button>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="p-4 bg-slate-950 overflow-x-auto flex-1 font-mono text-xs text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{getCurrentCode()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
