import React, { useState } from 'react';
import { generatePythonScript } from '../utils/shapeMath';
import { Code2, Copy, Download, Check, Sliders, Sparkles } from 'lucide-react';

type PythonScriptTab = 'opencv' | 'pygame' | 'photobooth' | 'runner' | 'requirements';

export const PythonStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PythonScriptTab>('opencv');
  const [copied, setCopied] = useState<boolean>(false);

  // Configurator controls
  const [camWidth, setCamWidth] = useState<number>(640);
  const [camHeight, setCamHeight] = useState<number>(480);
  const [maxNumHands, setMaxNumHands] = useState<number>(2);
  const [ropeLength, setRopeLength] = useState<number>(20);
  const [ropeColor] = useState<string>('cyan');
  const [ropeThickness, setRopeThickness] = useState<number>(6);
  const [gravity, setGravity] = useState<number>(0.8);
  const [spawnRate] = useState<number>(1.2);
  const [maxSpeedMultiplier, setMaxSpeedMultiplier] = useState<number>(2.5);
  const [matchDuration, setMatchDuration] = useState<number>(60);
  const [confidence, setConfidence] = useState<number>(0.6);

  const slicerHands = Math.min(2, maxNumHands);
  const boothHands = maxNumHands === 1 ? 2 : maxNumHands;

  const pythonCode = generatePythonScript({
    camWidth,
    camHeight,
    maxNumHands: slicerHands,
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
# EraBotGames · CortaFiguras - Juego con PyGame, 2 Manos y MediaPipe (Alto Rendimiento)
# Autor: Carlos Stiven Roa | Grupo: CEMOS | Semillero: ERA
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
pygame.display.set_caption("EraBotGames - CortaFiguras PyGame + 2 Manos MediaPipe")
clock = pygame.time.Clock()

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=${slicerHands},
    min_detection_confidence=${confidence},
    min_tracking_confidence=${confidence}
)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)

# Colas independientes para manos
hand_trails = [deque(maxlen=${ropeLength}) for _ in range(${slicerHands})]
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

    # 2. Cámara y Seguimiento de Manos
    ret, frame = cap.read()
    if not ret: break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    detected_hands = 0
    if results.multi_hand_landmarks:
        detected_hands = len(results.multi_hand_landmarks)
        for idx, hand_landmarks in enumerate(results.multi_hand_landmarks[:${slicerHands}]):
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

    # 4. Dibujar Cuerdas Neón
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

    # 6. Interfaz HUD
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

    txt_spd = font.render(f"Vel: {speed_mult:.1f}x | Manos: {detected_hands}/${slicerHands}", True, (168, 85, 247))
    screen.blit(txt_spd, (25, 96))

    if time_left <= 0 or lives <= 0:
        over_text = font_large.render("¡TIEMPO AGOTADO!" if time_left <= 0 else "¡SIN VIDAS!", True, (34, 211, 238))
        screen.blit(over_text, (WIDTH // 2 - 160, HEIGHT // 2 - 40))
        restart_text = font.render("Presiona 'R' para reiniciar", True, (255, 255, 255))
        screen.blit(restart_text, (WIDTH // 2 - 130, HEIGHT // 2 + 20))

    pygame.display.flip()
    clock.tick(60)

cap.release()
pygame.quit()
sys.exit()
`;

  const photoBoothPythonCode = `# =====================================================================
# EraBotGames · Cabina de Fotos CV - Filtros Distintos por Mano + Magia Dr. Strange
# Autor: Carlos Stiven Roa | Grupo: CEMOS | Semillero: ERA
# =====================================================================
# Características:
#   - Detecta hasta ${boothHands} manos simultáneas (solo pulgar e índice).
#   - Asigna un FILTRO ÚNICO Y DIFERENTE a cada mano detectada (M1, M2, M3...).
#   - Incluye animación procedural de Magia Dr. Strange, Ojo de Agamotto,
#     Dimensión Espejo, Holograma Galáctico, Pulso Vibranium, Matrix y Térmico.
#   - Cierra y vuelve a abrir pulgar+índice de una mano para cambiar su filtro.
#   - Haz señal Paz (✌️) para iniciar cuenta regresiva de 3s y guardar PNG.
#   - Presiona 'P' para activar/desactivar Sliding Puzzle 3x3 sobre el video.
# =====================================================================
import cv2
import mediapipe as mp
import numpy as np
import math
import random
import time

WIDTH, HEIGHT = ${camWidth}, ${camHeight}
MAX_HANDS = ${boothHands}

FILTERS = [
    ("dr_strange", "Magia Dr. Strange", (0, 165, 255)),
    ("mirror_dim", "Dimension Espejo", (248, 189, 56)),
    ("time_stone", "Ojo de Agamotto", (94, 197, 34)),
    ("hologram", "Holograma Galactico", (238, 211, 34)),
    ("vibranium", "Pulso Vibranium", (252, 132, 192)),
    ("thermal", "Vision Termica", (22, 115, 249)),
    ("matrix", "Codigo Matrix", (94, 197, 34)),
    ("cyber_blade", "Neon Blade Runner", (94, 63, 244)),
    ("upside_down", "Mundo del Reves", (38, 38, 220)),
]

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=MAX_HANDS,
    min_detection_confidence=${confidence},
    min_tracking_confidence=${confidence}
)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)

# Estado independiente por mano: filtro único + detector de cierre/apertura
hand_filters = {}
hand_was_closed = {}
countdown_end = 0.0
flash_until = 0.0
puzzle_mode = False
board = list(range(9))
random.shuffle(board)


def draw_dr_strange_mandala(canvas, cx, cy, radius, t, color_main, color_glow):
    # Anillos exteriores giratorios
    cv2.circle(canvas, (cx, cy), radius, color_main, 2, cv2.LINE_AA)
    cv2.circle(canvas, (cx, cy), int(radius * 0.86), color_glow, 1, cv2.LINE_AA)
    # Dos cuadrados rotando en sentido opuesto (símbolo arcano)
    side = int(radius * 0.72)
    for direction in (1, -1):
        angle = t * 1.4 * direction + (0 if direction == 1 else math.pi / 4)
        pts = []
        for k in range(4):
            a = angle + k * (math.pi / 2)
            pts.append([int(cx + side * math.cos(a)), int(cy + side * math.sin(a))])
        cv2.polylines(canvas, [np.array(pts, np.int32)], True, color_main, 2, cv2.LINE_AA)
    # Chispas orbitales
    for i in range(8):
        a = t * 2.2 + i * (math.pi / 4)
        sx = int(cx + radius * 0.94 * math.cos(a))
        sy = int(cy + radius * 0.94 * math.sin(a))
        cv2.circle(canvas, (sx, sy), 3, color_glow, -1, cv2.LINE_AA)


def apply_portal_filter(roi, filter_id, t):
    h, w = roi.shape[:2]
    if h <= 2 or w <= 2:
        return roi

    if filter_id == "dr_strange":
        warm = cv2.applyColorMap(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), cv2.COLORMAP_HOT)
        return cv2.addWeighted(roi, 0.45, warm, 0.55, 10)
    elif filter_id == "mirror_dim":
        flip_x = cv2.flip(roi, 1)
        shift = np.roll(roi, int(12 * math.sin(t * 2)), axis=1)
        blend = cv2.addWeighted(roi, 0.5, flip_x, 0.5, 0)
        return cv2.addWeighted(blend, 0.75, shift, 0.25, 0)
    elif filter_id == "time_stone":
        out = roi.copy()
        out[:, :, 0] = (out[:, :, 0] * 0.35).astype(np.uint8)
        out[:, :, 1] = np.clip(out[:, :, 1] * 1.35 + 20, 0, 255).astype(np.uint8)
        out[:, :, 2] = (out[:, :, 2] * 0.35).astype(np.uint8)
        return out
    elif filter_id == "hologram":
        out = roi.copy()
        out[:, :, 0] = np.clip(out[:, :, 0] * 1.4 + 35, 0, 255).astype(np.uint8)
        out[:, :, 2] = (out[:, :, 2] * 0.3).astype(np.uint8)
        out[::4, :] = (out[::4, :] * 0.45).astype(np.uint8)
        return out
    elif filter_id == "vibranium":
        edges = cv2.Canny(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), 50, 140)
        purple = np.zeros_like(roi)
        purple[edges > 0] = (252, 132, 192)
        return cv2.addWeighted(roi, 0.75, purple, 0.85, 0)
    elif filter_id == "thermal":
        return cv2.applyColorMap(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), cv2.COLORMAP_JET)
    elif filter_id == "matrix":
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        out = np.zeros_like(roi)
        out[:, :, 1] = np.clip(gray * 1.25, 0, 255).astype(np.uint8)
        return out
    elif filter_id == "cyber_blade":
        out = roi.copy()
        out[:, :, 0] = np.clip(out[:, :, 0] * 1.3, 0, 255).astype(np.uint8)
        out[:, :, 2] = np.clip(out[:, :, 2] * 1.35, 0, 255).astype(np.uint8)
        return out
    elif filter_id == "upside_down":
        flipped = cv2.flip(roi, 0)
        flipped[:, :, 2] = np.clip(flipped[:, :, 2] * 1.45, 0, 255).astype(np.uint8)
        flipped[:, :, 1] = (flipped[:, :, 1] * 0.5).astype(np.uint8)
        return flipped
    return roi


def is_peace_sign(lms):
    # Índice y corazón extendidos; anular y meñique doblados
    index_up = lms[8].y < lms[6].y
    middle_up = lms[12].y < lms[10].y
    ring_down = lms[16].y > lms[14].y
    pinky_down = lms[20].y > lms[18].y
    return index_up and middle_up and ring_down and pinky_down


win_name = "EraBotGames - Cabina de Fotos CV (Filtro Unico por Mano)"
cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame, 1)
    t = time.time()
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)

    output = frame.copy()
    peace_detected = False

    if results.multi_hand_landmarks:
        used_filters = {hand_filters[i] for i in range(len(results.multi_hand_landmarks)) if i in hand_filters}

        for hid, hand_lms in enumerate(results.multi_hand_landmarks[:MAX_HANDS]):
            lms = hand_lms.landmark
            tx, ty = int(lms[4].x * WIDTH), int(lms[4].y * HEIGHT)   # Pulgar
            ix, iy = int(lms[8].x * WIDTH), int(lms[8].y * HEIGHT)   # Índice
            cx, cy = (tx + ix) // 2, (ty + iy) // 2
            pinch_dist = math.hypot(ix - tx, iy - ty)

            # Asignar un filtro único que no esté usando otra mano
            if hid not in hand_filters:
                avail = [idx for idx in range(len(FILTERS)) if idx not in used_filters]
                chosen = random.choice(avail if avail else list(range(len(FILTERS))))
                hand_filters[hid] = chosen
                used_filters.add(chosen)

            # Gesto cerrar/abrir pulgar+índice: cambia SOLO el filtro de esta mano
            closed_now = pinch_dist < 28
            if hand_was_closed.get(hid, False) and not closed_now:
                other_used = {v for k, v in hand_filters.items() if k != hid}
                candidates = [idx for idx in range(len(FILTERS)) if idx != hand_filters[hid] and idx not in other_used]
                if not candidates:
                    candidates = [idx for idx in range(len(FILTERS)) if idx != hand_filters[hid]]
                hand_filters[hid] = random.choice(candidates)
            hand_was_closed[hid] = closed_now

            if is_peace_sign(lms):
                peace_detected = True

            # Calcular radio del portal según apertura pulgar-índice
            radius = max(72, min(195, int(pinch_dist * 1.15)))
            x1, y1 = max(0, cx - radius), max(0, cy - radius)
            x2, y2 = min(WIDTH, cx + radius), min(HEIGHT, cy + radius)

            fid, flabel, fcolor = FILTERS[hand_filters[hid]]
            if x2 > x1 and y2 > y1:
                roi = frame[y1:y2, x1:x2]
                filtered_roi = apply_portal_filter(roi, fid, t)
                mask = np.zeros((y2 - y1, x2 - x1), dtype=np.uint8)
                cv2.circle(mask, (cx - x1, cy - y1), radius, 255, -1)
                inv_mask = cv2.bitwise_not(mask)
                bg_part = cv2.bitwise_and(output[y1:y2, x1:x2], output[y1:y2, x1:x2], mask=inv_mask)
                fg_part = cv2.bitwise_and(filtered_roi, filtered_roi, mask=mask)
                output[y1:y2, x1:x2] = cv2.add(bg_part, fg_part)

            # Anillos mágicos animados sobre el portal
            if fid in ("dr_strange", "time_stone"):
                glow = (120, 220, 255) if fid == "dr_strange" else (140, 255, 160)
                draw_dr_strange_mandala(output, cx, cy, radius, t, fcolor, glow)
            else:
                cv2.circle(output, (cx, cy), radius, fcolor, 3, cv2.LINE_AA)

            # Etiqueta con número de mano + filtro activo
            cv2.putText(output, f"M{hid+1}: {flabel}", (cx - 75, max(25, cy - radius - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, fcolor, 2, cv2.LINE_AA)

    # Modo Sliding Puzzle 3x3 opcional (Tecla P)
    if puzzle_mode:
        pw, ph = WIDTH // 3, HEIGHT // 3
        puzz = np.zeros_like(output)
        for pos, tile_val in enumerate(board):
            if tile_val == 8:
                continue
            src_r, src_c = divmod(tile_val, 3)
            dst_r, dst_c = divmod(pos, 3)
            puzz[dst_r*ph:(dst_r+1)*ph, dst_c*pw:(dst_c+1)*pw] = output[src_r*ph:(src_r+1)*ph, src_c*pw:(src_c+1)*pw]
            cv2.rectangle(puzz, (dst_c*pw, dst_r*ph), ((dst_c+1)*pw, (dst_r+1)*ph), (254, 242, 0), 2)
        output = puzz

    # Cuenta regresiva con gesto Paz (✌️)
    if peace_detected and countdown_end == 0.0:
        countdown_end = t + 3.0
    if countdown_end > 0.0:
        rem = countdown_end - t
        if rem > 0:
            cv2.putText(output, str(int(math.ceil(rem))), (WIDTH // 2 - 20, HEIGHT // 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 3.0, (0, 255, 255), 5, cv2.LINE_AA)
        else:
            fname = f"erabotgames_foto_{int(t)}.png"
            cv2.imwrite(fname, output)
            countdown_end = 0.0
            flash_until = t + 0.25

    if t < flash_until:
        output = cv2.addWeighted(output, 0.35, np.full_like(output, 255), 0.65, 0)

    cv2.putText(output, "Cierra/abre pulgar+indice: cambia filtro | Paz: foto | P: puzzle | ESC: salir",
                (14, HEIGHT - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (226, 232, 240), 1, cv2.LINE_AA)

    cv2.imshow(win_name, output)
    key = cv2.waitKey(1) & 0xFF
    if key == 27:
        break
    elif key in (ord('p'), ord('P')):
        puzzle_mode = not puzzle_mode
    elif key in (ord('s'), ord('S')):
        random.shuffle(board)

cap.release()
cv2.destroyAllWindows()
`;

  const runnerPythonCode = `# =====================================================================
# EraBotGames · Metro Runner CV - Pose Corporal, Combos y Umbral x10
# Autor: Carlos Stiven Roa | Grupo: CEMOS | Semillero: ERA
# =====================================================================
# Características:
#   - MediaPipe Pose para 3 carriles (inclinar torso), salto y agachado.
#   - Detector de puños izquierdo/derecho para combos especiales.
#   - Barra vertical izquierda (0 -> 1000) con umbral para Invulnerabilidad x10.
#   - Barra vertical derecha con el combo actual y medidor de empuje en vivo.
#   - Simulación de Jefes a distancia lanzando obstáculos hacia las vías.
# =====================================================================
import cv2
import mediapipe as mp
import math
import time
import random

WIDTH, HEIGHT = ${camWidth}, ${camHeight}
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    min_detection_confidence=${confidence},
    min_tracking_confidence=${confidence}
)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)

# Estado del corredor y sistema de combos
lane = 1  # 0=Izquierda, 1=Centro, 2=Derecha
power_charge = 0
POWER_THRESHOLD = 1000
invuln_until = 0.0
combo_seq = []
combo_expires = 0.0
current_combo_label = "LISTO"
prev_l_wrist_z = 0.0
prev_r_wrist_z = 0.0
last_punch_time = 0.0
score = 0
boss_wave_timer = time.time()
projectiles = []  # [lane_idx, progress 0..1]

COMBO_MAP = {
    ("L", "R"): ("1-2 CLASICO", 180),
    ("L", "L", "R"): ("DEMOLEDOR", 260),
    ("R", "R", "L"): ("MARTILLO", 260),
    ("L", "R", "L", "R"): ("RAFAGA CAMPEON", 400),
}

win_name = "EraBotGames - Metro Runner CV (Pose + Combos x10)"
cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame = cv2.flip(frame, 1)
    now = time.time()
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = pose.process(rgb)

    action_label = "CORRIENDO"
    l_force, r_force = 0.0, 0.0

    if res.pose_landmarks:
        lm = res.pose_landmarks.landmark
        l_sh, r_sh = lm[11], lm[12]
        l_wr, r_wr = lm[15], lm[16]
        hip_y = (lm[23].y + lm[24].y) * 0.5
        sh_x = (l_sh.x + r_sh.x) * 0.5
        sh_y = (l_sh.y + r_sh.y) * 0.5

        # 1. Carril por inclinación del torso
        lane = 0 if sh_x < 0.42 else (2 if sh_x > 0.58 else 1)

        # 2. Salto y Agachado
        if sh_y < 0.30:
            action_label = "SALTO"
        elif hip_y > 0.72:
            action_label = "AGACHADO"

        # 3. Detección de Puños por avance rápido en eje Z
        l_force = max(0.0, (prev_l_wrist_z - l_wr.z) * 18.0)
        r_force = max(0.0, (prev_r_wrist_z - r_wr.z) * 18.0)
        prev_l_wrist_z, prev_r_wrist_z = l_wr.z, r_wr.z

        if now - last_punch_time > 0.28:
            punched = None
            if l_force > 0.45 and l_force >= r_force:
                punched = "L"
            elif r_force > 0.45:
                punched = "R"

            if punched:
                last_punch_time = now
                combo_seq = (combo_seq + [punched])[-4:]
                combo_expires = now + 2.0
                power_charge = min(POWER_THRESHOLD, power_charge + 90)
                score += 50 * (10 if now < invuln_until else 1)

                for length in (4, 3, 2):
                    tail = tuple(combo_seq[-length:])
                    if tail in COMBO_MAP:
                        name, bonus = COMBO_MAP[tail]
                        current_combo_label = name
                        power_charge = min(POWER_THRESHOLD, power_charge + bonus)
                        break

                if power_charge >= POWER_THRESHOLD and now >= invuln_until:
                    invuln_until = now + 10.0
                    power_charge = 0
                    current_combo_label = "MODO x10 ACTIVO"

    if now > combo_expires:
        combo_seq.clear()
        if now >= invuln_until:
            current_combo_label = "LISTO"

    # Simulación de Jefes al fondo lanzando obstáculos
    if now - boss_wave_timer > 2.2:
        projectiles.append([random.randint(0, 2), 0.0])
        boss_wave_timer = now

    for p in projectiles[:]:
        p[1] += 0.025
        lane_x = int(WIDTH * (0.28 + p[0] * 0.22))
        proj_y = int(110 + (p[1] ** 1.3) * (HEIGHT - 170))
        rad = int(10 + p[1] * 24)
        cv2.circle(frame, (lane_x, proj_y), rad, (244, 63, 94), -1)
        if p[1] >= 1.0:
            if p[0] == lane and now < invuln_until:
                score += 250
            projectiles.remove(p)

    # Indicador de carril activo en la base
    px = int(WIDTH * (0.28 + lane * 0.22))
    p_color = (238, 211, 34) if now >= invuln_until else (232, 121, 249)
    cv2.circle(frame, (px, HEIGHT - 52), 24, p_color, 4)

    # BARRA VERTICAL IZQUIERDA: Carga de Poder (0 -> 1000 umbral x10)
    bx1, by1, bx2, by2 = 18, 70, 44, HEIGHT - 70
    cv2.rectangle(frame, (bx1, by1), (bx2, by2), (15, 23, 42), -1)
    cv2.rectangle(frame, (bx1, by1), (bx2, by2), (56, 189, 248), 2)
    fill_ratio = 1.0 if now < invuln_until else (power_charge / float(POWER_THRESHOLD))
    fill_top = int(by2 - (by2 - by1) * fill_ratio)
    bar_col = (232, 121, 249) if now < invuln_until else (238, 211, 34)
    cv2.rectangle(frame, (bx1 + 3, fill_top), (bx2 - 3, by2 - 3), bar_col, -1)
    cv2.putText(frame, "x10", (14, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.55, bar_col, 2)

    # BARRA VERTICAL DERECHA: Combo Actual + Fuerza de Puños
    rx1, rx2 = WIDTH - 44, WIDTH - 18
    cv2.rectangle(frame, (rx1, by1), (rx2, by2), (15, 23, 42), -1)
    cv2.rectangle(frame, (rx1, by1), (rx2, by2), (168, 85, 247), 2)
    combo_ratio = min(1.0, len(combo_seq) / 4.0)
    c_top = int(by2 - (by2 - by1) * combo_ratio)
    cv2.rectangle(frame, (rx1 + 3, c_top), (rx2 - 3, by2 - 3), (192, 132, 252), -1)
    cv2.putText(frame, current_combo_label, (WIDTH - 220, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (232, 121, 249), 2, cv2.LINE_AA)

    cv2.putText(frame, f"Puntos: {score} | Pose: {action_label} | Seq: {'-'.join(combo_seq) or '-'}",
                (70, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

    cv2.imshow(win_name, frame)
    if (cv2.waitKey(1) & 0xFF) == 27:
        break

cap.release()
cv2.destroyAllWindows()
`;

  const requirementsTxt = `opencv-python>=4.8.0
mediapipe>=0.10.0
numpy>=1.24.0
pygame>=2.5.0
`;

  const getCurrentCode = () => {
    if (activeTab === 'opencv') return pythonCode;
    if (activeTab === 'pygame') return pygameCode;
    if (activeTab === 'photobooth') return photoBoothPythonCode;
    if (activeTab === 'runner') return runnerPythonCode;
    return requirementsTxt;
  };

  const getFilename = () => {
    if (activeTab === 'opencv') return 'corta_figuras.py';
    if (activeTab === 'pygame') return 'corta_figuras_pygame.py';
    if (activeTab === 'photobooth') return 'cabina_fotos_magia_cv.py';
    if (activeTab === 'runner') return 'metro_runner_pose_cv.py';
    return 'requirements.txt';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = getFilename();
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
            <span>EraBotGames · Estudio de Generación de Código Python</span>
          </div>
          <h2 className="text-2xl font-bold">Scripts Nativos para CortaFiguras, Cabina Mágica CV y Metro Runner</h2>
          <p className="text-slate-400 text-sm mt-1">
            Genera e instala scripts en Python con OpenCV, MediaPipe (Hands hasta 6 manos y Pose) y Pygame listos para ejecutar con filtro único por mano, magia Dr. Strange, combos x10 y pantalla completa.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
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
            <span>Descargar {getFilename()}</span>
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMaxNumHands(1)}
                  className={`p-2 rounded-xl border text-center font-medium ${
                    maxNumHands === 1 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  1 Mano
                </button>
                <button
                  onClick={() => setMaxNumHands(2)}
                  className={`p-2 rounded-xl border text-center font-medium ${
                    maxNumHands === 2 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  2 Manos
                </button>
                <button
                  onClick={() => setMaxNumHands(6)}
                  className={`p-2 rounded-xl border text-center font-medium ${
                    maxNumHands === 6 ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  6 (Cabina)
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

            {/* Match Duration */}
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
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Instrucciones de Ejecución</span>
            </div>
            <p>1. Instala las dependencias en tu terminal:</p>
            <div className="bg-slate-950 p-2 rounded-lg font-mono text-cyan-300">
              pip install opencv-python mediapipe numpy pygame
            </div>
            <p>2. Ejecuta el archivo python activo:</p>
            <div className="bg-slate-950 p-2 rounded-lg font-mono text-indigo-300">
              {activeTab === 'requirements' ? 'pip install -r requirements.txt' : `python ${getFilename()}`}
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer with Tabs */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Script Tabs */}
          <div className="bg-slate-950 border-b border-slate-800 p-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('opencv')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'opencv'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              corta_figuras.py
            </button>

            <button
              onClick={() => setActiveTab('pygame')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'pygame'
                  ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              corta_figuras_pygame.py
            </button>

            <button
              onClick={() => setActiveTab('photobooth')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'photobooth'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              cabina_fotos_magia_cv.py
            </button>

            <button
              onClick={() => setActiveTab('runner')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'runner'
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              metro_runner_pose_cv.py
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'requirements'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              requirements.txt
            </button>
          </div>

          {/* Code Viewer */}
          <div className="p-4 bg-slate-950 overflow-x-auto flex-1 font-mono text-xs text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{getCurrentCode()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
