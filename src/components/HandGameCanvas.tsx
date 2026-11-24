import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results, NormalizedLandmarkList } from '@mediapipe/hands';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';
import {
  GameMode,
  InputMode,
  ShapeItem,
  ShapeType,
  Particle,
  FloatingText,
  TrailPoint,
} from '../types';
import {
  generateShapeVertices,
  isShapeCutBySegment,
  sliceShape,
  createParticles,
} from '../utils/shapeMath';
import { soundEngine } from '../utils/audio';
import {
  Play,
  RotateCcw,
  Camera as CameraIcon,
  MousePointer,
  Sparkles,
  Zap,
  Flame,
  Pause,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Gauge,
  Clock,
  Hand,
  Award,
  Sliders,
  Check,
  Eye,
} from 'lucide-react';

interface HandGameCanvasProps {
  gameMode: GameMode;
  onScoreUpdate: (score: number) => void;
  soundEnabled: boolean;
  highScore: number;
  onResetHighScore?: () => void;
}

interface HandData {
  slot: 0 | 1;
  tipX: number;
  tipY: number;
  wristX: number;
  wristY: number;
  landmarks: { x: number; y: number }[];
  lastSeen: number;
}

export const HandGameCanvas: React.FC<HandGameCanvasProps> = ({
  gameMode,
  onScoreUpdate,
  soundEnabled,
  highScore,
  onResetHighScore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Control & Game state
  const [inputMode, setInputMode] = useState<InputMode>('hand');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0);
  const [sensitivityHigh, setSensitivityHigh] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showConfirmResetHud, setShowConfirmResetHud] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<'time' | 'lives' | null>(null);

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(gameMode === 'zen' ? 999 : 3);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [shapesSlicedCount, setShapesSlicedCount] = useState<number>(0);

  // Match Duration based on Mode (Sprint = 30s frenesí, Arcade = 60s clásico, Zen = 0)
  const matchDuration = gameMode === 'sprint' ? 30 : gameMode === 'arcade' ? 60 : 0;
  const [timeLeft, setTimeLeft] = useState<number>(matchDuration);

  // Max Speed Slider (1.0x to 3.5x)
  const [maxSpeedMultiplier, setMaxSpeedMultiplier] = useState<number>(2.5);
  const [currentDynamicSpeed, setCurrentDynamicSpeed] = useState<number>(1.0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Blade colors for dual hands
  const [ropeColorHand1, setRopeColorHand1] = useState<string>('#00f2fe'); // Neon Cyan (Hand 1)
  const [ropeColorHand2, setRopeColorHand2] = useState<string>('#f43f5e'); // Neon Rose (Hand 2)
  const [ropeGlow, setRopeGlow] = useState<boolean>(true);

  // References for zero-latency game loop
  const gameLoopRef = useRef<number | null>(null);
  const mpCameraRef = useRef<MediaPipeCamera | null>(null);
  const mpHandsRef = useRef<Hands | null>(null);
  const isCameraActiveRef = useRef<boolean>(false);
  const isProcessingFrameRef = useRef<boolean>(false);

  const shapesRef = useRef<ShapeItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  // Dual Hand Trail References
  const handTrailsRef = useRef<{ 0: TrailPoint[]; 1: TrailPoint[] }>({
    0: [],
    1: [],
  });

  // Current raw and smoothed hand landmarks for skeleton and blade rendering
  const activeHandsRef = useRef<{
    0: HandData | null;
    1: HandData | null;
  }>({
    0: null,
    1: null,
  });

  const lastSpawnTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const freezeEndTimeRef = useRef<number>(0);

  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const comboRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(60);
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const maxSpeedRef = useRef<number>(2.5);
  const lastReportedSpeedRef = useRef<number>(1.0);
  const detectedHandsCountRef = useRef<number>(0);
  const showSkeletonRef = useRef<boolean>(true);

  // Sound engine preference
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Sync state with refs
  useEffect(() => {
    scoreRef.current = score;
    onScoreUpdate(score);
  }, [score, onScoreUpdate]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    maxSpeedRef.current = maxSpeedMultiplier;
  }, [maxSpeedMultiplier]);

  useEffect(() => {
    isCameraActiveRef.current = isCameraActive;
  }, [isCameraActive]);

  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
  }, [showSkeleton]);

  // Update time and lives when gameMode changes if idle
  useEffect(() => {
    if (!isPlayingRef.current) {
      const dur = gameMode === 'sprint' ? 30 : gameMode === 'arcade' ? 60 : 0;
      setTimeLeft(dur);
      timeLeftRef.current = dur;
      setLives(gameMode === 'zen' ? 999 : 3);
      setGameOverReason(null);
    }
  }, [gameMode]);

  // Update MediaPipe confidence options dynamically when sensitivity toggle changes
  useEffect(() => {
    if (mpHandsRef.current) {
      const conf = sensitivityHigh ? 0.3 : 0.45;
      mpHandsRef.current.setOptions({
        maxNumHands: 2,
        modelComplexity: 0, // Lite model for ultra-responsive 60fps
        minDetectionConfidence: conf,
        minTrackingConfidence: conf,
      });
    }
  }, [sensitivityHigh]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcut listener ('F' for fullscreen, 'P' for pause, 'R' for restart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        if (isPlayingRef.current) setIsPaused((p) => !p);
      } else if (e.key === 'r' || e.key === 'R') {
        startGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle Fullscreen handler
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  // Start / Restart game logic
  const startGame = useCallback(() => {
    const dur = gameMode === 'sprint' ? 30 : gameMode === 'arcade' ? 60 : 0;
    setScore(0);
    setLives(gameMode === 'zen' ? 999 : 3);
    setTimeLeft(dur);
    timeLeftRef.current = dur;
    setGameOverReason(null);
    setCombo(0);
    setMaxCombo(0);
    setShapesSlicedCount(0);
    setCurrentDynamicSpeed(1.0);
    lastReportedSpeedRef.current = 1.0;
    shapesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    handTrailsRef.current = { 0: [], 1: [] };
    activeHandsRef.current = { 0: null, 1: null };
    lastSpawnTimeRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
    setIsPlaying(true);
    setIsPaused(false);
  }, [gameMode]);

  // Spawn new random geometric shape with dynamic speed scaling & Sprint burst logic
  const spawnShape = useCallback((width: number, height: number, speedMultiplier: number) => {
    const baseColors = {
      circle: '#38bdf8',  // Light Blue
      square: '#4ade80',  // Emerald Green
      triangle: '#f43f5e',// Rose Red
      hexagon: '#c084fc', // Purple
      star: '#facc15',    // Gold Yellow
      bomb: '#ef4444',    // Dark Crimson Bomb
      freeze: '#06b6d4',  // Ice Cyan
    };

    if (gameMode === 'sprint') {
      // SPRINT MODE: Multiple figures burst in waves (2 to 4 shapes)! ZERO BOMBS!
      const burstCount = Math.random() < 0.35 ? 3 : Math.random() < 0.2 ? 4 : 2;
      const normalTypes: ShapeType[] = ['circle', 'square', 'triangle', 'hexagon', 'star'];
      if (Math.random() < 0.2) normalTypes.push('freeze');

      for (let b = 0; b < burstCount; b++) {
        const type = normalTypes[Math.floor(Math.random() * normalTypes.length)];
        const radius = 34 + Math.random() * 22;
        const segmentWidth = (width - 260) / burstCount;
        const x = 130 + b * segmentWidth + Math.random() * (segmentWidth * 0.8);
        const y = height + radius + 15 + b * 20;

        const baseVy = -480 - Math.random() * 200;
        const vy = baseVy * Math.min(speedMultiplier, 2.7);
        const vx = ((width / 2 - x) * 0.38 + (Math.random() * 140 - 70)) * Math.min(speedMultiplier, 2.0);
        const vRot = (Math.random() - 0.5) * (2.8 * speedMultiplier);

        shapesRef.current.push({
          id: Math.random().toString(),
          type,
          x,
          y,
          radius,
          color: baseColors[type],
          rotation: 0,
          vx,
          vy,
          vRot,
          points: generateShapeVertices(type, radius),
          isSliced: false,
          spawnTime: performance.now(),
        });
      }
      return;
    }

    // ARCADE & ZEN MODES: Standard single launch with mode-specific hazards
    const types: ShapeType[] = ['circle', 'square', 'triangle', 'hexagon', 'star'];
    if (gameMode === 'arcade') {
      types.push('bomb');
      if (Math.random() < 0.15) types.push('freeze');
    }

    const type = types[Math.floor(Math.random() * types.length)];
    const radius = 36 + Math.random() * 24;
    const x = 120 + Math.random() * (width - 240);
    const y = height + radius + 10;

    // Upward launch velocity with scaling speed factor
    const baseVy = -440 - Math.random() * 200;
    const vy = baseVy * Math.min(speedMultiplier, 2.7);
    const vx = ((width / 2 - x) * 0.35 + (Math.random() * 120 - 60)) * Math.min(speedMultiplier, 2.0);
    const vRot = (Math.random() - 0.5) * (2.2 * speedMultiplier);

    const newShape: ShapeItem = {
      id: Math.random().toString(),
      type,
      x,
      y,
      radius,
      color: baseColors[type],
      rotation: 0,
      vx,
      vy,
      vRot,
      points: generateShapeVertices(type, radius),
      isSliced: false,
      spawnTime: performance.now(),
    };

    shapesRef.current.push(newShape);
  }, [gameMode]);

  // Add floating point popup text
  const addFloatingText = (text: string, x: number, y: number, color: string = '#facc15') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      vy: -60,
      color,
      alpha: 1.0,
    });
  };

  // Main rendering & game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1);
    lastFrameTimeRef.current = timestamp;

    const width = canvas.width;
    const height = canvas.height;
    const now = performance.now();

    // 1. Draw Canvas Dark Space Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Camera Feed Directly to Canvas (Hardware Accelerated, Zero Flicker)
    if (isCameraActiveRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.save();
      ctx.globalAlpha = 0.42; // Translucent cinematic camera background
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      ctx.restore();
    }

    // Is frozen state active?
    const isFrozen = timestamp < freezeEndTimeRef.current;
    const effectiveDt = isFrozen ? dt * 0.35 : dt;

    if (isPlayingRef.current && !isPausedRef.current) {
      // 1. Dynamic speed multiplier calculation
      const currentScore = scoreRef.current;
      const maxSpd = maxSpeedRef.current;
      const dynamicSpeed = 1.0 + Math.min(maxSpd - 1.0, (currentScore / 1500) * (maxSpd - 1.0));
      
      // Throttle dynamic speed UI update
      if (Math.abs(dynamicSpeed - lastReportedSpeedRef.current) >= 0.1) {
        lastReportedSpeedRef.current = dynamicSpeed;
        setCurrentDynamicSpeed(parseFloat(dynamicSpeed.toFixed(1)));
      }

      // 2. 60-Second Countdown Timer
      if (gameMode !== 'zen') {
        const prevSecond = Math.ceil(timeLeftRef.current);
        const newTime = Math.max(0, timeLeftRef.current - dt);
        timeLeftRef.current = newTime;
        const currentSecond = Math.ceil(newTime);

        if (currentSecond !== prevSecond || newTime === 0) {
          setTimeLeft(currentSecond);
        }

        if (newTime <= 0) {
          setIsPlaying(false);
          setGameOverReason('time');
          soundEngine.playCombo(4);
        }
      }

      // 3. Spawning shapes with progressive spawn rate acceleration
      const baseInterval = gameMode === 'sprint' ? 620 : 1150;
      const spawnInterval = Math.max(300, baseInterval / dynamicSpeed);
      
      if (timestamp - lastSpawnTimeRef.current > spawnInterval) {
        spawnShape(width, height, dynamicSpeed);
        lastSpawnTimeRef.current = timestamp;
      }

      // 4. Update shapes physics & slicing across DUAL HANDS
      const gravity = (gameMode === 'sprint' ? 620 : 550) * dynamicSpeed;
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        const shape = shapesRef.current[i];

        if (!shape.isSliced) {
          shape.x += shape.vx * effectiveDt;
          shape.y += shape.vy * effectiveDt;
          shape.vy += gravity * effectiveDt;
          shape.rotation += shape.vRot * effectiveDt;

          // Check cutting collision with recent trail points from BOTH HAND 0 & HAND 1
          let shapeWasCut = false;

          for (let handIdx = 0; handIdx < 2; handIdx++) {
            if (shapeWasCut) break;
            const points = handTrailsRef.current[handIdx as 0 | 1];
            if (points && points.length >= 2) {
              for (let p = Math.max(1, points.length - 8); p < points.length; p++) {
                const p1 = points[p - 1];
                const p2 = points[p];

                // High speed slash detection
                const ropeSpeed = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                if (ropeSpeed > 5 && isShapeCutBySegment(p1, p2, shape)) {
                  // Perform slice!
                  sliceShape(shape, p1, p2);
                  shapeWasCut = true;

                  if (shape.type === 'bomb') {
                    soundEngine.playBomb();
                    particlesRef.current.push(...createParticles(shape.x, shape.y, '#ef4444', 35));
                    addFloatingText('¡BOMBA! -1 VIDA', shape.x, shape.y, '#ef4444');
                    
                    if (gameMode !== 'zen') {
                      setLives((prev) => {
                        const newLives = prev - 1;
                        if (newLives <= 0) {
                          setIsPlaying(false);
                          setGameOverReason('lives');
                        }
                        return Math.max(0, newLives);
                      });
                    }
                    setCombo(0);
                  } else if (shape.type === 'freeze') {
                    soundEngine.playFreeze();
                    freezeEndTimeRef.current = timestamp + 4000;
                    particlesRef.current.push(...createParticles(shape.x, shape.y, '#38bdf8', 30));
                    addFloatingText('¡TIEMPO CONGELADO!', shape.x, shape.y, '#38bdf8');
                    setScore((s) => s + 250);
                  } else {
                    // Normal shape cut
                    soundEngine.playSlice();
                    setShapesSlicedCount((c) => c + 1);

                    const newCombo = comboRef.current + 1;
                    setCombo(newCombo);
                    setMaxCombo((m) => Math.max(m, newCombo));

                    if (newCombo > 2) {
                      soundEngine.playCombo(newCombo);
                    }

                    const isSprint = gameMode === 'sprint';
                    const basePoints = isSprint ? 200 : 100;
                    const pointsGained = basePoints * (newCombo > 1 ? newCombo : 1);
                    setScore((s) => s + pointsGained);

                    const label = isSprint
                      ? newCombo > 1
                        ? `+${pointsGained} (⚡ SPRINT x${newCombo}!)`
                        : `+${pointsGained} (x2!)`
                      : newCombo > 1
                      ? `+${pointsGained} (COMBO x${newCombo}!)`
                      : `+${pointsGained}`;

                    addFloatingText(label, shape.x, shape.y, isSprint ? '#fbbf24' : shape.color);
                    particlesRef.current.push(...createParticles(shape.x, shape.y, shape.color, isSprint ? 32 : 25));
                  }
                  break;
                }
              }
            }
          }

          // Offscreen fall check
          if (shape.y > height + 100) {
            if (shape.type !== 'bomb' && gameMode !== 'zen') {
              setCombo(0);
            }
            shapesRef.current.splice(i, 1);
          }
        } else if (shape.slicedHalves) {
          // Update sliced halves physics
          const h = shape.slicedHalves;
          h.leftX += h.leftVx * effectiveDt;
          h.leftY += h.leftVy * effectiveDt;
          h.leftVy += gravity * effectiveDt;
          h.leftRot += h.leftVRot * effectiveDt;

          h.rightX += h.rightVx * effectiveDt;
          h.rightY += h.rightVy * effectiveDt;
          h.rightVy += gravity * effectiveDt;
          h.rightRot += h.rightVRot * effectiveDt;

          h.opacity -= effectiveDt * 1.3;

          if (h.opacity <= 0 || h.leftY > height + 120) {
            shapesRef.current.splice(i, 1);
          }
        }
      }

      // 5. Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.life += dt;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 6. Update floating texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 0.8;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }
    }

    // Clean old trail points for both hands gracefully (320ms lifetime)
    handTrailsRef.current[0] = handTrailsRef.current[0].filter((pt) => now - pt.time < 320);
    handTrailsRef.current[1] = handTrailsRef.current[1].filter((pt) => now - pt.time < 320);

    // ==========================================
    // RENDER PASS
    // ==========================================

    // Draw Frozen Screen Overlay effect
    if (isFrozen) {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw Shapes
    shapesRef.current.forEach((shape) => {
      if (!shape.isSliced) {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);

        ctx.fillStyle = shape.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = shape.color;

        ctx.beginPath();
        shape.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Bomb or Freeze icon emblem
        if (shape.type === 'bomb') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', 0, 0);
        } else if (shape.type === 'freeze') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❄️', 0, 0);
        }

        ctx.restore();
      } else if (shape.slicedHalves) {
        const h = shape.slicedHalves;
        ctx.save();
        ctx.globalAlpha = Math.max(0, h.opacity);

        // Left half
        ctx.save();
        ctx.translate(h.leftX, h.leftY);
        ctx.rotate(h.leftRot);
        ctx.fillStyle = shape.color;
        ctx.beginPath();
        h.leftPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Right half
        ctx.save();
        ctx.translate(h.rightX, h.rightY);
        ctx.rotate(h.rightRot);
        ctx.fillStyle = shape.color;
        ctx.beginPath();
        h.rightPoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }
    });

    // Draw Particles
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Floating Text Popups
    floatingTextsRef.current.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // ==========================================
    // RENDER NEON HAND SKELETON / JOINTS
    // ==========================================
    if (showSkeletonRef.current && isCameraActiveRef.current) {
      const CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],       // Index
        [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
        [0, 13], [13, 14], [14, 15], [15, 16],// Ring
        [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
        [5, 9], [9, 13], [13, 17],            // Palm base
      ];

      [0, 1].forEach((slotIdx) => {
        const handData = activeHandsRef.current[slotIdx as 0 | 1];
        if (handData && now - handData.lastSeen < 250 && handData.landmarks.length >= 21) {
          const color = slotIdx === 0 ? ropeColorHand1 : ropeColorHand2;
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.4;

          // Draw skeleton lines
          CONNECTIONS.forEach(([i, j]) => {
            const p1 = handData.landmarks[i];
            const p2 = handData.landmarks[j];
            if (p1 && p2) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          });

          // Draw landmark joint dots
          ctx.fillStyle = '#ffffff';
          handData.landmarks.forEach((p, idx) => {
            if (idx === 8 || idx === 12 || idx === 4) return; // Skip tips (drawn by blade trail)
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.restore();
        }
      });
    }

    // ==========================================
    // RENDER DUAL HAND VIRTUAL ROPES (Hand 1 & Hand 2)
    // ==========================================
    const renderHandTrail = (points: TrailPoint[], color: string, label: string) => {
      if (points.length >= 2) {
        ctx.save();
        if (ropeGlow) {
          ctx.shadowBlur = 22;
          ctx.shadowColor = color;
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          const progress = i / points.length;

          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(3.5, progress * 14);
          ctx.globalAlpha = Math.min(1.0, progress * 0.95);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Draw glowing tip & small label at finger point
        const tip = points[points.length - 1];
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Finger ring glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Small stylish hand label badge
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(label, tip.x, tip.y - 18);

        ctx.restore();
      }
    };

    // Draw Hand 1 Trail (Slot 0 - Left)
    renderHandTrail(handTrailsRef.current[0], ropeColorHand1, 'Mano 1');
    // Draw Hand 2 Trail (Slot 1 - Right)
    renderHandTrail(handTrailsRef.current[1], ropeColorHand2, 'Mano 2');

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameMode, ropeColorHand1, ropeColorHand2, ropeGlow, spawnShape]);

  // Start animation loop on mount
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  // Handle Mouse / Touch tracking for fallback or manual control (Hand 0)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (inputMode === 'hand' && isCameraActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    handTrailsRef.current[0].push({ x, y, time: performance.now() });
    if (handTrailsRef.current[0].length > 25) {
      handTrailsRef.current[0].shift();
    }
  };

  // MediaPipe Hands Initialization with Stable Multi-Hand Spatial Tracking
  const setupCameraAndHands = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCameraLoading(true);
    setCameraError(null);

    try {
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      // Dual Hand Tracking Setup:
      // Using modelComplexity: 0 (Lite) ensures ultra-low latency & zero lag during rapid slices
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: sensitivityHigh ? 0.3 : 0.45,
        minTrackingConfidence: sensitivityHigh ? 0.3 : 0.45,
      });

      hands.onResults((results: Results) => {
        if (!canvasRef.current) return;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const now = performance.now();

        const numHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
        
        // Update detected hands count for UI badge
        if (numHands !== detectedHandsCountRef.current) {
          detectedHandsCountRef.current = numHands;
          setDetectedHandsCount(numHands);
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Parse all detected hands landmarks and compute robust cutting tips
          const detectedList: Array<{
            tipX: number;
            tipY: number;
            wristX: number;
            wristY: number;
            landmarks: { x: number; y: number }[];
          }> = [];

          results.multiHandLandmarks.forEach((landmarks: NormalizedLandmarkList) => {
            const mappedLandmarks = landmarks.map((lm) => ({
              x: (1 - lm.x) * width, // Mirror horizontally for webcam
              y: lm.y * height,
            }));

            // Multi-point fallback: index tip (8), or middle tip (12), or palm center (9)
            const indexTip = mappedLandmarks[8];
            const middleTip = mappedLandmarks[12];
            const wrist = mappedLandmarks[0];
            const palmCenter = mappedLandmarks[9];

            const tipX = indexTip ? indexTip.x : middleTip ? middleTip.x : palmCenter.x;
            const tipY = indexTip ? indexTip.y : middleTip ? middleTip.y : palmCenter.y;
            const wristX = wrist ? wrist.x : tipX;
            const wristY = wrist ? wrist.y : tipY;

            detectedList.push({
              tipX,
              tipY,
              wristX,
              wristY,
              landmarks: mappedLandmarks,
            });
          });

          // SPATIAL NEAREST-NEIGHBOR ASSOCIATION:
          // Keep hand slots stable so Mano 1 (Cian) and Mano 2 (Rosa) don't flicker or swap
          if (detectedList.length === 1) {
            const d = detectedList[0];
            const prev0 = activeHandsRef.current[0];
            const prev1 = activeHandsRef.current[1];

            // Calculate distance to previous positions if active within last 400ms
            const dist0 = prev0 && now - prev0.lastSeen < 400 ? Math.hypot(d.tipX - prev0.tipX, d.tipY - prev0.tipY) : Infinity;
            const dist1 = prev1 && now - prev1.lastSeen < 400 ? Math.hypot(d.tipX - prev1.tipX, d.tipY - prev1.tipY) : Infinity;

            let targetSlot: 0 | 1 = 0;
            if (dist0 < dist1 && dist0 < 350) {
              targetSlot = 0;
            } else if (dist1 < dist0 && dist1 < 350) {
              targetSlot = 1;
            } else {
              // If new, assign based on screen side
              targetSlot = d.tipX < width * 0.5 ? 0 : 1;
            }

            // Smooth position with EMA filter (alpha = 0.8 for snappy responsiveness)
            const prevHand = activeHandsRef.current[targetSlot];
            const smoothX = prevHand ? prevHand.tipX * 0.2 + d.tipX * 0.8 : d.tipX;
            const smoothY = prevHand ? prevHand.tipY * 0.2 + d.tipY * 0.8 : d.tipY;

            activeHandsRef.current[targetSlot] = {
              slot: targetSlot,
              tipX: smoothX,
              tipY: smoothY,
              wristX: d.wristX,
              wristY: d.wristY,
              landmarks: d.landmarks,
              lastSeen: now,
            };

            const trail = handTrailsRef.current[targetSlot];
            trail.push({ x: smoothX, y: smoothY, time: now });
            if (trail.length > 25) trail.shift();
          } else if (detectedList.length >= 2) {
            // 2 hands detected: Sort horizontally from left to right on screen
            detectedList.sort((a, b) => a.tipX - b.tipX);

            [0, 1].forEach((slotIdx) => {
              const d = detectedList[slotIdx];
              const prevHand = activeHandsRef.current[slotIdx as 0 | 1];
              const smoothX = prevHand ? prevHand.tipX * 0.2 + d.tipX * 0.8 : d.tipX;
              const smoothY = prevHand ? prevHand.tipY * 0.2 + d.tipY * 0.8 : d.tipY;

              activeHandsRef.current[slotIdx as 0 | 1] = {
                slot: slotIdx as 0 | 1,
                tipX: smoothX,
                tipY: smoothY,
                wristX: d.wristX,
                wristY: d.wristY,
                landmarks: d.landmarks,
                lastSeen: now,
              };

              const trail = handTrailsRef.current[slotIdx as 0 | 1];
              trail.push({ x: smoothX, y: smoothY, time: now });
              if (trail.length > 25) trail.shift();
            });
          }
        }
      });

      mpHandsRef.current = hands;

      // MediaPipeCamera with frame processing lock to avoid congestion & frame drop
      const camera = new MediaPipeCamera(videoRef.current, {
        onFrame: async () => {
          if (isProcessingFrameRef.current) return;
          if (videoRef.current && mpHandsRef.current && videoRef.current.readyState >= 2) {
            isProcessingFrameRef.current = true;
            try {
              await mpHandsRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.warn('Frame processing warning:', err);
            } finally {
              isProcessingFrameRef.current = false;
            }
          }
        },
        width: 640,
        height: 480,
      });

      await camera.start();
      mpCameraRef.current = camera;

      setIsCameraActive(true);
      isCameraActiveRef.current = true;
      setInputMode('hand');
      setCameraLoading(false);
    } catch (err) {
      console.error('Camera setup error:', err);
      setCameraError('No se pudo acceder a la cámara. Puedes jugar usando el ratón o touchpad.');
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
      setInputMode('mouse');
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (mpCameraRef.current) {
      mpCameraRef.current.stop();
      mpCameraRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    isCameraActiveRef.current = false;
    setDetectedHandsCount(0);
    detectedHandsCountRef.current = 0;
    activeHandsRef.current = { 0: null, 1: null };
    setInputMode('mouse');
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Timer formatted as mm:ss
  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(timeLeft % 60)
    .toString()
    .padStart(2, '0')}`;

  const timerPercentage = Math.max(0, (timeLeft / matchDuration) * 100);

  return (
    <div
      ref={containerRef}
      id="cortafiguras-game-container"
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4' : 'max-w-5xl mx-auto flex flex-col items-center'
      }`}
    >
      {/* Game Header Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-white shadow-lg backdrop-blur-md">
        {/* Score & Multiplier HUD */}
        <div className="flex items-center space-x-4 sm:space-x-6 flex-wrap gap-y-2">
          {/* Score */}
          <div id="hud-score-block">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Puntaje</span>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              {score}
            </div>
          </div>

          {/* Mode-Specific Timer */}
          <div id="hud-timer-block" className="flex flex-col">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              <Clock className={`w-3.5 h-3.5 ${gameMode === 'sprint' ? 'text-amber-400' : 'text-cyan-400'}`} />
              <span>{gameMode === 'sprint' ? 'Sprint 30s' : gameMode === 'arcade' ? 'Tiempo 60s' : 'Tiempo'}</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span
                className={`text-2xl font-black font-mono transition-colors ${
                  gameMode === 'zen'
                    ? 'text-emerald-400'
                    : timeLeft <= 5
                    ? 'text-rose-500 animate-pulse'
                    : timeLeft <= 15
                    ? 'text-amber-400'
                    : gameMode === 'sprint'
                    ? 'text-amber-300'
                    : 'text-cyan-300'
                }`}
              >
                {gameMode === 'zen' ? '∞' : formattedTime}
              </span>
              {gameMode !== 'zen' && (
                <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 hidden sm:block">
                  <div
                    className={`h-full transition-all duration-200 ${
                      timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 15 ? 'bg-amber-400' : gameMode === 'sprint' ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${timerPercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Lives / Hazards */}
          <div id="hud-lives-block">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {gameMode === 'sprint' ? 'Modo' : 'Vidas'}
            </span>
            <div className="flex items-center space-x-1 mt-0.5 text-lg">
              {gameMode === 'zen' ? (
                <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ∞ Ilimitadas
                </span>
              ) : gameMode === 'sprint' ? (
                <span className="text-amber-300 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center space-x-1">
                  <span>⚡ 0 Bombas (Frenesí)</span>
                </span>
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`transition-all duration-300 ${
                      i < lives ? 'scale-110 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'scale-90 opacity-25 grayscale'
                    }`}
                  >
                    ❤️
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Combo & Multiplier */}
          <div id="hud-combo-block">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {gameMode === 'sprint' ? 'Combo (x2 Pts)' : 'Combo'}
            </span>
            <div className="flex items-center space-x-1">
              <Flame className={`w-5 h-5 ${combo > 1 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
              <span className={`text-xl font-bold ${combo > 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                x{combo}
              </span>
            </div>
          </div>

          {/* High Score In HUD */}
          <div id="hud-record-block" className="hidden lg:flex items-center space-x-2 bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-700/60">
            <Award className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Récord</div>
              <div className="text-xs font-bold text-white">{highScore} pts</div>
            </div>
          </div>
        </div>

        {/* Action Controls & Fullscreen Button */}
        <div className="flex items-center space-x-2">
          {/* Dual Hands Detection Status Badge */}
          {isCameraActive && (
            <div
              id="dual-hands-badge"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold"
            >
              <div className="flex items-center space-x-1.5">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    detectedHandsCount >= 1 ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  M1 {detectedHandsCount >= 1 ? '✓' : '...'}
                </span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    detectedHandsCount >= 2 ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  M2 {detectedHandsCount >= 2 ? '✓' : '...'}
                </span>
              </div>
              <span className="text-slate-300 hidden sm:inline">
                {detectedHandsCount === 0
                  ? 'Buscando...'
                  : detectedHandsCount === 1
                  ? '1 Mano'
                  : '2 Manos OK'}
              </span>
            </div>
          )}

          {/* Camera Toggle Button */}
          <button
            id="camera-toggle-btn"
            onClick={() => {
              if (isCameraActive) stopCamera();
              else setupCameraAndHands();
            }}
            disabled={cameraLoading}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${
              isCameraActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <CameraIcon className="w-4 h-4" />
            <span>{cameraLoading ? 'Conectando...' : isCameraActive ? 'Cámara 2 Manos' : 'Activar 2 Manos'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            id="fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isFullscreen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa (F / Esc)' : 'Pantalla Completa de PC (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Ventana' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Screen */}
      <div
        id="cortafiguras-stage"
        className={`relative w-full bg-slate-950 border-x border-b border-slate-800 ${
          isFullscreen
            ? 'flex-1 rounded-2xl my-2'
            : 'aspect-[16/9] max-h-[600px] rounded-b-2xl'
        } overflow-hidden shadow-2xl flex items-center justify-center`}
      >
        {/* Hidden HTML5 Video element for reliable MediaPipe capture */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />

        {/* Interactive Game Canvas with 60FPS Hardware-Accelerated Video Draw */}
        <canvas
          ref={canvasRef}
          id="cortafiguras-canvas"
          width={1280}
          height={720}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain cursor-crosshair touch-none z-10"
        />

        {/* Camera Warning Banner */}
        {cameraError && (
          <div className="absolute top-4 left-4 right-4 z-20 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs p-3 rounded-xl flex items-center space-x-2 backdrop-blur-md">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Start Game Overlay */}
        {!isPlaying && gameOverReason === null && (
          <div
            id="start-overlay"
            className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl animate-pulse ${
              gameMode === 'sprint'
                ? 'bg-gradient-to-tr from-amber-500 to-rose-600 shadow-amber-500/30'
                : gameMode === 'zen'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
                : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-cyan-500/30'
            }`}>
              {gameMode === 'sprint' ? (
                <Award className="w-8 h-8 text-white" />
              ) : gameMode === 'zen' ? (
                <Sparkles className="w-8 h-8 text-white" />
              ) : (
                <Zap className="w-8 h-8 text-white" />
              )}
            </div>

            <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              {gameMode === 'sprint'
                ? '⚡ Modo Sprint • Frenesí de 30 Segundos'
                : gameMode === 'zen'
                ? 'Modo Zen • Práctica Relajada'
                : 'CortaFiguras AI • Modo Arcade (60s)'}
            </h2>
            <p className="text-slate-300 text-sm max-w-lg mb-6 leading-relaxed">
              {gameMode === 'sprint'
                ? '¡Desafío de velocidad pura contra el reloj de 30 segundos! 0 bombas, ráfagas múltiples de hasta 4 figuras y puntos x2 en combos. ¡Usa ambas manos al máximo!'
                : gameMode === 'zen'
                ? 'Corta figuras libremente sin temporizador, sin bombas y con vidas infinitas. Ideal para calentar y relajarte.'
                : 'Corta tantas figuras como puedas en 1 minuto con tus dos manos a la vez. Cuidado con las bombas y aprovecha los congeladores de tiempo.'}
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl w-full mb-6 text-xs text-slate-300">
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center text-center">
                <Hand className="w-4 h-4 text-cyan-400 mb-1" />
                <strong className="text-white">2 Manos Dual</strong>
                <span className="text-[10px] text-slate-400">Cortes simultáneos</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center text-center">
                <Clock className={`w-4 h-4 ${gameMode === 'sprint' ? 'text-amber-400' : 'text-cyan-400'} mb-1`} />
                <strong className="text-white">
                  {gameMode === 'sprint' ? '30 Segundos' : gameMode === 'zen' ? 'Sin Límite (∞)' : '60 Segundos'}
                </strong>
                <span className="text-[10px] text-slate-400">
                  {gameMode === 'sprint' ? 'Contrarreloj relámpago' : gameMode === 'zen' ? 'Modo infinito' : 'Partida completa'}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center text-center">
                <Gauge className="w-4 h-4 text-indigo-400 mb-1" />
                <strong className="text-white">
                  {gameMode === 'sprint' ? 'Ráfagas de Figuras' : 'Velocidad Progresiva'}
                </strong>
                <span className="text-[10px] text-slate-400">
                  {gameMode === 'sprint' ? '2 a 4 por oleada' : 'Acelera con puntos'}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center text-center">
                <span className="text-base mb-0.5">{gameMode === 'sprint' ? '⚡' : gameMode === 'zen' ? '🌸' : '❤️'}</span>
                <strong className="text-white">
                  {gameMode === 'sprint' ? '0 Bombas' : gameMode === 'zen' ? '∞ Vidas' : '3 Vidas'}
                </strong>
                <span className="text-[10px] text-slate-400">
                  {gameMode === 'sprint' ? 'Puntos Dobles x2' : gameMode === 'zen' ? 'Cero estrés' : 'Cuidado con bombas'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                id="btn-start-match"
                onClick={startGame}
                className={`flex items-center space-x-2.5 px-8 py-3.5 rounded-xl font-bold text-white shadow-lg hover:scale-105 transition active:scale-95 ${
                  gameMode === 'sprint'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 shadow-amber-500/30'
                    : gameMode === 'zen'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 shadow-cyan-500/30'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {gameMode === 'sprint'
                    ? '¡Iniciar Sprint Frenético (30s)!'
                    : gameMode === 'zen'
                    ? '¡Iniciar Modo Zen!'
                    : '¡Iniciar Partida (60s)!'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over / Match Results Overlay */}
        {!isPlaying && gameOverReason !== null && (
          <div
            id="gameover-overlay"
            className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
              gameMode === 'sprint'
                ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/30'
                : gameOverReason === 'time'
                ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-cyan-500/30'
                : 'bg-gradient-to-tr from-rose-500 to-amber-600 shadow-rose-500/30'
            }`}>
              {gameOverReason === 'time' ? (
                <Clock className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
              )}
            </div>

            <h2 className="text-3xl font-extrabold mb-1">
              {gameMode === 'sprint' ? (
                <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent">
                  ¡FIN DEL SPRINT! (30s)
                </span>
              ) : gameOverReason === 'time' ? (
                <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
                  ¡TIEMPO AGOTADO! (60s)
                </span>
              ) : (
                <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                  ¡TE HAS QUEDADO SIN VIDAS!
                </span>
              )}
            </h2>

            <p className="text-slate-400 text-xs mb-5">
              {gameMode === 'sprint'
                ? 'Completaste los 30 segundos a máxima velocidad cortando ráfagas continuas.'
                : gameOverReason === 'time'
                ? 'Completaste el minuto entero cortando figuras a máxima destreza.'
                : 'Una bomba explotó tus 3 vidas disponibles.'}
            </p>

            {/* Results Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-md w-full bg-slate-900/90 border border-slate-800 p-4 rounded-2xl mb-4 shadow-inner">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Puntaje Final</span>
                <div className="text-2xl font-black text-cyan-400">{score}</div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Figuras Cortadas</span>
                <div className="text-2xl font-black text-emerald-400">{shapesSlicedCount}</div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Combo Máximo</span>
                <div className="text-2xl font-black text-amber-400">x{maxCombo}</div>
              </div>
            </div>

            {/* High Score Record Block with Reset option */}
            <div className="flex items-center justify-between max-w-md w-full bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 rounded-xl mb-6 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Récord Histórico:</span>
                <strong className="text-amber-400 text-sm font-bold">{highScore} pts</strong>
                {score >= highScore && score > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                    ¡NUEVO RÉCORD!
                  </span>
                )}
              </div>

              {onResetHighScore && highScore > 0 && (
                <button
                  onClick={onResetHighScore}
                  className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition text-[11px]"
                  title="Reiniciar récord"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resetear Récord</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                id="btn-retry-match"
                onClick={startGame}
                className="flex items-center space-x-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-white shadow-lg shadow-cyan-500/25 hover:scale-105 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jugar Otra Vez</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Pause Overlay */}
        {isPlaying && isPaused && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-4 text-cyan-400">Juego En Pausa</h2>
            <p className="text-xs text-slate-400 mb-6">El tiempo y la velocidad están detenidos.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
            >
              Reanudar Partida
            </button>
          </div>
        )}

        {/* In-game Floating Controls (Pause / Restart / Fullscreen) */}
        {isPlaying && (
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 backdrop-blur-md transition"
              title="Pausar (P)"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={startGame}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 backdrop-blur-md transition"
              title="Reiniciar (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Control Settings Bar (Max Speed Slider, Sensitivity, Skeleton, Dual Colors) */}
      <div
        id="game-settings-bar"
        className="w-full mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-5 text-white text-xs shadow-lg backdrop-blur-md"
      >
        {/* Max Speed Slicer / Slider */}
        <div className="flex items-center space-x-3 bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/80">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Velocidad Máxima (Slicer):</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="max-speed-slider"
              type="range"
              min="1.0"
              max="3.5"
              step="0.1"
              value={maxSpeedMultiplier}
              onChange={(e) => setMaxSpeedMultiplier(parseFloat(e.target.value))}
              className="w-28 sm:w-36 accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
            <span className="font-mono font-bold text-cyan-300 min-w-[3rem]">
              {maxSpeedMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* AI Detection Sensitivity & Skeleton Options */}
        <div className="flex items-center space-x-3 bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setSensitivityHigh(!sensitivityHigh)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
              sensitivityHigh ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-700 text-slate-400'
            }`}
            title="Aumenta la sensibilidad de detección para capturar movimientos rápidos y poca luz"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sensibilidad {sensitivityHigh ? 'Alta (Ultra Rápida)' : 'Normal'}</span>
          </button>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
              showSkeleton ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-700 text-slate-400'
            }`}
            title="Muestra el esqueleto y articulaciones de las manos detectadas"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Esqueleto Neón</span>
          </button>
        </div>

        {/* Dual Hand Colors Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Mano 1:</span>
            <div className="flex items-center space-x-1.5">
              {[
                { name: 'Cian', color: '#00f2fe' },
                { name: 'Verde Láser', color: '#22c55e' },
                { name: 'Amarillo', color: '#facc15' },
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => setRopeColorHand1(c.color)}
                  className={`w-5 h-5 rounded-full border transition ${
                    ropeColorHand1 === c.color ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-60'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={`Mano 1: ${c.name}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Mano 2:</span>
            <div className="flex items-center space-x-1.5">
              {[
                { name: 'Rosa Neón', color: '#f43f5e' },
                { name: 'Naranja Fuego', color: '#f97316' },
                { name: 'Púrpura', color: '#a855f7' },
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => setRopeColorHand2(c.color)}
                  className={`w-5 h-5 rounded-full border transition ${
                    ropeColorHand2 === c.color ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-60'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={`Mano 2: ${c.name}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Glow & Keyboard shortcuts hint */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ropeGlow}
              onChange={(e) => setRopeGlow(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-slate-300">Resplandor</span>
          </label>

          <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-500">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">F</kbd> Pantalla Completa
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">P</kbd> Pausa
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">R</kbd> Reiniciar
          </div>
        </div>
      </div>
    </div>
  );
};
