import { Point, ShapeItem, ShapeType, Particle } from '../types';

// Generate polygon relative vertices
export function generateShapeVertices(type: ShapeType, radius: number): Point[] {
  const points: Point[] = [];
  switch (type) {
    case 'circle': {
      const sides = 24;
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        points.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        });
      }
      break;
    }
    case 'square': {
      const r = radius * 0.85;
      points.push({ x: -r, y: -r });
      points.push({ x: r, y: -r });
      points.push({ x: r, y: r });
      points.push({ x: -r, y: r });
      break;
    }
    case 'triangle': {
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        points.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        });
      }
      break;
    }
    case 'hexagon': {
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6;
        points.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        });
      }
      break;
    }
    case 'star': {
      const outerR = radius;
      const innerR = radius * 0.45;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        points.push({
          x: r * Math.cos(angle),
          y: r * Math.sin(angle),
        });
      }
      break;
    }
    case 'bomb': {
      const sides = 16;
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        points.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        });
      }
      break;
    }
    case 'freeze': {
      const outerR = radius * 0.9;
      const innerR = radius * 0.5;
      for (let i = 0; i < 12; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 6;
        points.push({
          x: r * Math.cos(angle),
          y: r * Math.sin(angle),
        });
      }
      break;
    }
  }
  return points;
}

// Convert relative points to transformed absolute canvas points
export function getAbsolutePoints(shape: ShapeItem): Point[] {
  const cos = Math.cos(shape.rotation);
  const sin = Math.sin(shape.rotation);
  return shape.points.map((p) => ({
    x: shape.x + (p.x * cos - p.y * sin),
    y: shape.y + (p.x * sin + p.y * cos),
  }));
}

// Distance between point and line segment
export function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// Check segment intersection (p1-p2 with p3-p4)
export function checkLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): { x: number; y: number } | null {
  const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (denominator === 0) return null;

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }
  return null;
}

// Check if rope line segment cuts shape
export function isShapeCutBySegment(p1: Point, p2: Point, shape: ShapeItem): boolean {
  // Bounding circle check first for speed
  const dist = distToSegment({ x: shape.x, y: shape.y }, p1, p2);
  if (dist > shape.radius + 15) return false;

  const absPoints = getAbsolutePoints(shape);
  if (absPoints.length < 3) return dist < shape.radius;

  let intersections = 0;
  for (let i = 0; i < absPoints.length; i++) {
    const p3 = absPoints[i];
    const p4 = absPoints[(i + 1) % absPoints.length];
    if (checkLineIntersection(p1, p2, p3, p4)) {
      intersections++;
    }
  }

  // If cuts through center or crosses polygon edges
  return intersections >= 1 || dist < shape.radius * 0.7;
}

// Slice shape into left and right halves
export function sliceShape(shape: ShapeItem, p1: Point, p2: Point) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  // Split push velocity perpendicular to slice line
  const pushSpeed = 120 + Math.random() * 80;

  shape.isSliced = true;
  shape.slicedHalves = {
    leftPoints: shape.points.map((p) => ({ x: p.x - 5, y: p.y })),
    rightPoints: shape.points.map((p) => ({ x: p.x + 5, y: p.y })),
    leftX: shape.x - nx * 10,
    leftY: shape.y - ny * 10,
    rightX: shape.x + nx * 10,
    rightY: shape.y + ny * 10,
    leftVx: shape.vx - nx * pushSpeed,
    leftVy: shape.vy - ny * pushSpeed - 50,
    rightVx: shape.vx + nx * pushSpeed,
    rightVy: shape.vy + ny * pushSpeed - 50,
    leftRot: shape.rotation,
    rightRot: shape.rotation,
    leftVRot: shape.vRot - 0.15,
    rightVRot: shape.vRot + 0.15,
    opacity: 1.0,
  };
}

// Generate explosive particles when sliced
export function createParticles(x: number, y: number, color: string, count: number = 20): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 300;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 6,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.4 + Math.random() * 0.4,
    });
  }
  return particles;
}

// Dynamic Python code generator function
export function generatePythonScript(config: {
  camWidth: number;
  camHeight: number;
  maxNumHands?: number;
  ropeLength: number;
  ropeColor: string;
  ropeColorHand2?: string;
  ropeThickness: number;
  gravity: number;
  spawnRate: number;
  maxSpeedMultiplier?: number;
  matchDuration?: number;
  includePygame?: boolean;
  minDetectionConfidence: number;
}): string {
  const maxHands = config.maxNumHands || 2;
  const maxSpeed = config.maxSpeedMultiplier || 2.5;
  const duration = config.matchDuration || 60;

  return `# =====================================================================
# CortaFiguras AI - Juego Interactivo con 2 Manos y Visión Artificial
# Desarrollado con OpenCV, MediaPipe Hands y Numpy
# =====================================================================
# Instrucciones de instalación:
#   pip install opencv-python mediapipe numpy pygame
#
# Para ejecutar:
#   python main.py
#
# Controles:
#   - 'f': Alternar Pantalla Completa
#   - 'r': Reiniciar partida (60 segundos y 3 vidas)
#   - 'q' o ESC: Salir
# =====================================================================

import cv2
import mediapipe as mp
import numpy as np
import random
import math
import time
from collections import deque

# Configuración Inicial
WIDTH, HEIGHT = ${config.camWidth}, ${config.camHeight}
MAX_HANDS = ${maxHands}            # Permite usar 2 manos simultáneamente
ROPE_LENGTH = ${config.ropeLength}        # Historial de puntos de la cuerda/trazo
ROPE_THICKNESS = ${config.ropeThickness}     # Grosor de la cuerda
GRAVITY_BASE = ${config.gravity}        # Gravedad base
SPAWN_RATE_BASE = ${config.spawnRate}    # Segundos base entre figuras
MAX_SPEED_MULT = ${maxSpeed}      # Multiplicador de velocidad máxima
MATCH_DURATION = ${duration}         # Duración de la partida en segundos (1 minuto)
CONFIDENCE = ${config.minDetectionConfidence}        # Confianza de detección de MediaPipe

# Inicialización de MediaPipe Hands (Soporte Dual Hand)
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(
    max_num_hands=MAX_HANDS,
    min_detection_confidence=CONFIDENCE,
    min_tracking_confidence=CONFIDENCE
)

# Colores BGR para Hand 1 (Cian) y Hand 2 (Rosa/Fucsia)
COLOR_HAND1 = (255, 242, 0)   # Cian BGR
COLOR_HAND2 = (180, 50, 244)  # Rosa / Fucsia BGR
COLOR_SCORE = (0, 255, 255)   # Amarillo
COLOR_TIMER = (255, 200, 0)   # Azul/Cian

class Shape:
    """Clase para representar figuras geométricas en caída"""
    def __init__(self, speed_mult=1.0):
        self.type = random.choice(['circle', 'square', 'triangle', 'star', 'bomb'])
        self.radius = random.randint(35, 55)
        self.x = random.randint(100, WIDTH - 100)
        self.y = HEIGHT + self.radius
        self.vx = random.uniform(-2, 2) * min(speed_mult, 1.8)
        self.vy = random.uniform(-18, -12) * min(speed_mult, 2.5)  # Impulso inicial escalado
        self.rotation = 0.0
        self.v_rot = random.uniform(-0.1, 0.1) * speed_mult
        self.is_sliced = False
        
        # Asignar color según el tipo
        if self.type == 'circle':
            self.color = (255, 100, 100) # Azul suave
        elif self.type == 'square':
            self.color = (100, 255, 100) # Verde
        elif self.type == 'triangle':
            self.color = (100, 100, 255) # Rojo
        elif self.type == 'star':
            self.color = (0, 255, 255)   # Amarillo
        else: # bomb
            self.color = (50, 50, 220)   # Rojo oscuro (Bomba)

    def update(self, speed_mult=1.0):
        """Actualizar posición con física y velocidad escalada"""
        self.x += self.vx
        self.y += self.vy
        self.vy += GRAVITY_BASE * speed_mult
        self.rotation += self.v_rot

    def draw(self, frame):
        """Dibujar figura en la imagen de OpenCV"""
        if self.is_sliced:
            return
            
        center = (int(self.x), int(self.y))
        
        if self.type == 'circle' or self.type == 'bomb':
            cv2.circle(frame, center, self.radius, self.color, -1)
            cv2.circle(frame, center, self.radius, (255, 255, 255), 2)
            if self.type == 'bomb':
                cv2.circle(frame, center, 8, (0, 0, 0), -1)
                cv2.putText(frame, "!", (center[0] - 5, center[1] + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
        elif self.type == 'square':
            r = self.radius
            pts = np.array([
                [-r, -r], [r, -r], [r, r], [-r, r]
            ], np.float32)
            rot_mat = cv2.getRotationMatrix2D((0, 0), math.degrees(self.rotation), 1.0)
            rotated_pts = cv2.transform(np.array([pts]), rot_mat)[0] + [self.x, self.y]
            cv2.fillPoly(frame, [np.int32(rotated_pts)], self.color)
            cv2.polylines(frame, [np.int32(rotated_pts)], True, (255, 255, 255), 2)
            
        elif self.type == 'triangle':
            pts = []
            for i in range(3):
                angle = self.rotation + i * (2 * math.pi / 3) - math.pi / 2
                pts.append([self.x + self.radius * math.cos(angle), self.y + self.radius * math.sin(angle)])
            cv2.fillPoly(frame, [np.int32(pts)], self.color)
            cv2.polylines(frame, [np.int32(pts)], True, (255, 255, 255), 2)
            
        elif self.type == 'star':
            pts = []
            for i in range(10):
                r = self.radius if i % 2 == 0 else self.radius * 0.5
                angle = self.rotation + i * (math.pi / 5)
                pts.append([self.x + r * math.cos(angle), self.y + r * math.sin(angle)])
            cv2.fillPoly(frame, [np.int32(pts)], self.color)
            cv2.polylines(frame, [np.int32(pts)], True, (255, 255, 255), 2)

    def is_cut_by_line(self, p1, p2):
        """Verificar si el segmento de cuerda p1-p2 corta la figura"""
        if self.is_sliced:
            return False
            
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        length = math.hypot(dx, dy)
        if length == 0:
            return False
            
        u = ((self.x - p1[0]) * dx + (self.y - p1[1]) * dy) / (length ** 2)
        u = max(0.0, min(1.0, u))
        
        nearest_x = p1[0] + u * dx
        nearest_y = p1[1] + u * dy
        
        dist = math.hypot(self.x - nearest_x, self.y - nearest_y)
        return dist < self.radius

def main():
    window_name = "CortaFiguras AI - Python Dual Hands"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
    
    # 2 Colas independientes para las 2 manos
    hand_trails = [deque(maxlen=ROPE_LENGTH) for _ in range(2)]
    shapes = []
    
    score = 0
    lives = 3  # Exactamente 3 vidas
    combo = 0
    start_time = time.time()
    last_spawn_time = time.time()
    is_fullscreen = False
    
    print("=== CortaFiguras AI Iniciado (2 Manos Simultáneas) ===")
    print("Mueve ambas manos frente a la cámara para dibujar cuerdas y cortar figuras.")
    print("Presiona 'f' para Pantalla Completa | 'r' para reiniciar | 'q' o ESC para salir.")
    
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("No se pudo acceder a la cámara.")
            break
            
        # Voltear horizontalmente para efecto espejo
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        
        # Calcular tiempo restante (1 minuto = 60s)
        elapsed = time.time() - start_time
        time_left = max(0.0, MATCH_DURATION - elapsed)
        
        # Calcular velocidad dinámica progresiva con los puntos
        speed_mult = 1.0 + min(MAX_SPEED_MULT - 1.0, (score / 1500.0) * (MAX_SPEED_MULT - 1.0))
        current_spawn_interval = max(0.38, SPAWN_RATE_BASE / speed_mult)
        
        # Convertir a RGB para MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        
        # Detectar hasta 2 manos simultáneamente
        detected_indices = set()
        if results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(results.multi_hand_landmarks[:2]):
                detected_indices.add(idx)
                # Landmark 8 = Punta del dedo índice
                index_tip = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                cx, cy = int(index_tip.x * w), int(index_tip.y * h)
                hand_trails[idx].append((cx, cy))
                
        # Limpiar colas de manos no detectadas
        for idx in range(2):
            if idx not in detected_indices and len(hand_trails[idx]) > 0:
                hand_trails[idx].popleft()
                
        # Dibujar Trazo de Mano 1 (Cian) y Mano 2 (Rosa)
        trail_colors = [COLOR_HAND1, COLOR_HAND2]
        for idx in range(2):
            trail = hand_trails[idx]
            color = trail_colors[idx]
            for i in range(1, len(trail)):
                thickness = int(np.sqrt(ROPE_THICKNESS * (i / len(trail))) * 2.2) + 1
                alpha_color = (
                    int(color[0] * (i / len(trail))),
                    int(color[1] * (i / len(trail))),
                    int(color[2] * (i / len(trail)))
                )
                cv2.line(frame, trail[i - 1], trail[i], alpha_color, thickness)
                cv2.circle(frame, trail[i], thickness // 2 + 1, (255, 255, 255), -1)

        # Generar nuevas figuras con ritmo acelerado si no se acabó el juego
        if time_left > 0 and lives > 0:
            if time.time() - last_spawn_time > current_spawn_interval:
                shapes.append(Shape(speed_mult))
                last_spawn_time = time.time()
            
        # Actualizar y verificar colisiones con las figuras para AMBAS manos
        for shape in shapes[:]:
            shape.update(speed_mult)
            
            # Comprobar cortes con Mano 1 y Mano 2
            shape_cut = False
            for idx in range(2):
                trail = hand_trails[idx]
                if len(trail) >= 2 and not shape.is_sliced:
                    p1 = trail[-2]
                    p2 = trail[-1]
                    if shape.is_cut_by_line(p1, p2):
                        shape.is_sliced = True
                        shape_cut = True
                        if shape.type == 'bomb':
                            lives -= 1
                            combo = 0
                            print(f"[Mano {idx+1}] ¡Bomba cortada! Vidas restantes: {lives}")
                        else:
                            combo += 1
                            points_gained = 100 * combo
                            score += points_gained
                            print(f"[Mano {idx+1}] ¡Corte! +{points_gained} pts (Combo x{combo}) [Velocidad: {speed_mult:.1f}x]")
                        break
                        
            # Eliminar figuras fuera de pantalla
            if shape.y > HEIGHT + 100 or shape.is_sliced:
                if not shape.is_sliced and shape.type != 'bomb' and shape.y > HEIGHT + 80:
                    combo = 0
                shapes.remove(shape)
                
            shape.draw(frame)
            
        # Dibujar Interfaz HUD elegante
        cv2.rectangle(frame, (10, 10), (360, 130), (15, 23, 42), -1)
        cv2.rectangle(frame, (10, 10), (360, 130), (51, 65, 85), 2)
        
        cv2.putText(frame, f"Puntaje: {score}", (25, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_SCORE, 2)
        
        # Formato de tiempo mm:ss
        timer_str = f"Tiempo: {int(time_left // 60):02d}:{int(time_left % 60):02d}"
        timer_color = (0, 0, 255) if time_left <= 10 else (0, 255, 255)
        cv2.putText(frame, timer_str, (25, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, timer_color, 2)
        
        # 3 Vidas
        hearts_str = "Vidas: " + " ".join(["<3" for _ in range(lives)])
        cv2.putText(frame, hearts_str, (25, 98), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)
        
        # Velocidad multiplicador y combo
        hud_info = f"Vel: {speed_mult:.1f}x" + (f" | COMBO x{combo}" if combo > 1 else "")
        cv2.putText(frame, hud_info, (25, 122), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        # Estado de Manos Detectadas
        hands_count = len(detected_indices)
        hands_text = f"Manos: {hands_count}/2"
        cv2.putText(frame, hands_text, (w - 150, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0) if hands_count == 2 else (255, 255, 255), 2)
            
        # Fin de Partida: Por Tiempo o Por Vidas
        if time_left <= 0 or lives <= 0:
            title = "TIEMPO AGOTADO (60s)" if time_left <= 0 else "SIN VIDAS - GAME OVER"
            cv2.rectangle(frame, (w//2 - 250, h//2 - 90), (w//2 + 250, h//2 + 90), (15, 23, 42), -1)
            cv2.rectangle(frame, (w//2 - 250, h//2 - 90), (w//2 + 250, h//2 + 90), (0, 255, 255), 3)
            
            cv2.putText(frame, title, (w//2 - 220, h//2 - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
            cv2.putText(frame, f"Puntaje Final: {score}", (w//2 - 130, h//2 + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "Presiona 'r' para reiniciar | 'q' salir", (w//2 - 200, h//2 + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('r'):
                lives = 3
                score = 0
                combo = 0
                start_time = time.time()
                shapes.clear()
            elif key == ord('f'):
                is_fullscreen = not is_fullscreen
                prop = cv2.WINDOW_FULLSCREEN if is_fullscreen else cv2.WINDOW_NORMAL
                cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, prop)
            elif key == ord('q') or key == 27:
                break
            cv2.imshow(window_name, frame)
            continue

        cv2.imshow(window_name, frame)
        
        # Manejo de teclas
        key = cv2.waitKey(1) & 0xFF
        if key == ord('f'):
            is_fullscreen = not is_fullscreen
            prop = cv2.WINDOW_FULLSCREEN if is_fullscreen else cv2.WINDOW_NORMAL
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, prop)
        elif key == ord('r'):
            lives = 3
            score = 0
            combo = 0
            start_time = time.time()
            shapes.clear()
        elif key == ord('q') or key == 27:
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
`;
}
