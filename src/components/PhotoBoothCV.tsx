import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as mpHands from '@mediapipe/hands';
import type { Results, NormalizedLandmarkList } from '@mediapipe/hands';
import * as mpCamera from '@mediapipe/camera_utils';
import {
  Camera as CameraIcon,
  Download,
  Image as ImageIcon,
  LayoutGrid,
  Sparkles,
  Trash2,
  VideoOff,
  Aperture,
  Grid3X3,
  Shuffle,
  CheckCircle2,
  Trophy,
  RotateCcw,
  Video,
  Wand2,
} from 'lucide-react';

interface PhotoBoothCVProps {
  soundEnabled: boolean;
}

type BoothMode = 'portals' | 'puzzle';
type PuzzleSourceMode = 'live' | 'photo';

type PortalFilterId =
  | 'dr_strange_mandala'
  | 'mirror_dimension'
  | 'time_stone'
  | 'starwars_hologram'
  | 'scarlet_chaos'
  | 'patronus_charm'
  | 'wakanda_vibranium'
  | 'spider_verse'
  | 'cyber_blade'
  | 'upside_down'
  | 'fisheye'
  | 'y2k_ccd'
  | 'halation'
  | 'crt_glitch'
  | 'anamorphic'
  | 'aura_neon'
  | 'prism'
  | 'kaleido'
  | 'thermal_lens'
  | 'xray_portal'
  | 'pixel_glass'
  | 'popart_portal'
  | 'matrix_rain'
  | 'vaporwave'
  | 'sketch_ink'
  | 'golden_prism';

type PuzzleGridSize = 3 | 4 | 5 | 6;

interface ThumbIndexHand {
  id: number;
  thumbTip: { x: number; y: number };
  thumbBase: { x: number; y: number };
  indexTip: { x: number; y: number };
  indexBase: { x: number; y: number };
  pinchCenter: { x: number; y: number };
  handScale: number;
  isPeaceSign: boolean;
  isThumbIndexClosed: boolean;
  lastSeen: number;
}

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  rawDataUrl: string;
  filterLabel: string;
  timestamp: string;
}

interface HandPuzzleState {
  isPinching: boolean;
  grabbedTileVal: number | null;
  grabStartX: number;
  grabStartY: number;
  grabAxis: 'x' | 'y' | null;
  grabDir: 1 | -1;
  grabMaxDist: number;
  grabProgress: number;
  grabStartTime: number;
  cooldownUntil: number;
}

interface TileSlideAnim {
  tileVal: number;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  startTime: number;
}

interface PortalShape {
  kind: 'circle' | 'quad';
  handId: number;
  cx: number;
  cy: number;
  radius: number;
  points: Array<{ x: number; y: number }>;
}

const CANVAS_W = 960;
const CANVAS_H = 540;
const BOARD_W = 912;
const BOARD_H = 513;
const BOARD_X = (CANVAS_W - BOARD_W) / 2;
const BOARD_Y = (CANVAS_H - BOARD_H) / 2;

const PORTAL_FILTERS: Array<{
  id: PortalFilterId;
  name: string;
  accent: string;
}> = [
  { id: 'dr_strange_mandala', name: 'Magia Dr. Strange', accent: '#fb923c' },
  { id: 'mirror_dimension', name: 'Dimensión Espejo', accent: '#38bdf8' },
  { id: 'time_stone', name: 'Ojo de Agamotto', accent: '#22c55e' },
  { id: 'starwars_hologram', name: 'Holograma Galáctico', accent: '#22d3ee' },
  { id: 'scarlet_chaos', name: 'Magia Escarlata', accent: '#ef4444' },
  { id: 'patronus_charm', name: 'Escudo Patronus', accent: '#bae6fd' },
  { id: 'wakanda_vibranium', name: 'Pulso Vibranium', accent: '#c084fc' },
  { id: 'spider_verse', name: 'Cómic Multiverso', accent: '#e879f9' },
  { id: 'cyber_blade', name: 'Neon Blade Runner', accent: '#f43f5e' },
  { id: 'upside_down', name: 'Mundo del Revés', accent: '#dc2626' },
  { id: 'fisheye', name: 'Ojo de Pez 8mm', accent: '#38bdf8' },
  { id: 'y2k_ccd', name: 'Cámara Y2K 2003', accent: '#f59e0b' },
  { id: 'halation', name: 'Cine Halation 35mm', accent: '#fb7185' },
  { id: 'crt_glitch', name: 'CRT Glitch VHS', accent: '#34d399' },
  { id: 'anamorphic', name: 'Lente Anamórfico', accent: '#22d3ee' },
  { id: 'aura_neon', name: 'Aura Arcoíris', accent: '#e879f9' },
  { id: 'prism', name: 'Lente Prisma RGB', accent: '#c084fc' },
  { id: 'kaleido', name: 'Espejo Caleidoscopio', accent: '#60a5fa' },
  { id: 'thermal_lens', name: 'Visión Térmica', accent: '#f97316' },
  { id: 'xray_portal', name: 'Portal Rayos-X', accent: '#67e8f9' },
  { id: 'pixel_glass', name: 'Cristal Pixelado', accent: '#facc15' },
  { id: 'popart_portal', name: 'Cómic Pop Halftone', accent: '#f43f5e' },
  { id: 'matrix_rain', name: 'Código Matrix', accent: '#22c55e' },
  { id: 'vaporwave', name: 'Vaporwave 80s', accent: '#f472b6' },
  { id: 'sketch_ink', name: 'Boceto Tinta Manga', accent: '#e2e8f0' },
  { id: 'golden_prism', name: 'Sunset Lamp Dorado', accent: '#fbbf24' },
];

const HAND_COLORS = ['#38bdf8', '#f472b6', '#4ade80', '#facc15', '#c084fc', '#fb923c'];

function playBoothTone(freq: number, dur: number, soundEnabled: boolean, type: OscillatorType = 'sine') {
  if (!soundEnabled) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close().catch(() => {}), dur * 1000 + 80);
  } catch {
    // Ignore audio errors
  }
}

function playShutterClick(soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    setTimeout(() => ctx.close().catch(() => {}), 200);
  } catch {
    // Ignore audio errors
  }
}

function generateSolvableBoard(size: number): number[] {
  const total = size * size;
  const emptyVal = total - 1;
  const board = Array.from({ length: total }, (_, i) => i);
  let emptyIdx = emptyVal;
  let lastEmptyIdx = -1;

  const shuffleSteps = total * 40;
  for (let step = 0; step < shuffleSteps; step++) {
    const row = Math.floor(emptyIdx / size);
    const col = emptyIdx % size;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(emptyIdx - size);
    if (row < size - 1) neighbors.push(emptyIdx + size);
    if (col > 0) neighbors.push(emptyIdx - 1);
    if (col < size - 1) neighbors.push(emptyIdx + 1);

    const filtered = neighbors.filter((n) => n !== lastEmptyIdx);
    const pick = filtered[Math.floor(Math.random() * filtered.length)] ?? neighbors[0];
    board[emptyIdx] = board[pick];
    board[pick] = emptyVal;
    lastEmptyIdx = emptyIdx;
    emptyIdx = pick;
  }

  if (board.every((v, idx) => v === idx)) {
    const swapA = emptyIdx === 0 ? 1 : 0;
    const swapB = swapA + 1 < total && swapA + 1 !== emptyIdx ? swapA + 1 : swapA;
    if (swapA !== emptyIdx && swapB !== emptyIdx && swapA !== swapB) {
      [board[swapA], board[swapB]] = [board[swapB], board[swapA]];
    }
  }
  return board;
}

function getCellIndexAtCanvasPos(x: number, y: number, size: number): number | null {
  if (x < BOARD_X || x >= BOARD_X + BOARD_W || y < BOARD_Y || y >= BOARD_Y + BOARD_H) {
    return null;
  }
  const col = Math.min(size - 1, Math.max(0, Math.floor(((x - BOARD_X) / BOARD_W) * size)));
  const row = Math.min(size - 1, Math.max(0, Math.floor(((y - BOARD_Y) / BOARD_H) * size)));
  return row * size + col;
}

/**
 * Finds the best adjacent movable tile near (x, y), allowing 14px border tolerance
 * so pinching near the edge of a tile still locks cleanly onto the adjacent tile.
 */
function findNearestAdjacentCell(x: number, y: number, size: number, emptyIdx: number): number | null {
  const exact = getCellIndexAtCanvasPos(x, y, size);
  const eRow = Math.floor(emptyIdx / size);
  const eCol = emptyIdx % size;

  if (exact !== null && exact !== emptyIdx) {
    const cRow = Math.floor(exact / size);
    const cCol = exact % size;
    if (Math.abs(cRow - eRow) + Math.abs(cCol - eCol) === 1) {
      return exact;
    }
  }

  // Border forgiveness up to 14px
  const cellW = BOARD_W / size;
  const cellH = BOARD_H / size;
  const adjOffsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  let bestIdx: number | null = null;
  let bestDist = 14;

  for (const [dr, dc] of adjOffsets) {
    const r = eRow + dr;
    const c = eCol + dc;
    if (r < 0 || r >= size || c < 0 || c >= size) continue;
    const left = BOARD_X + c * cellW;
    const top = BOARD_Y + r * cellH;
    const right = left + cellW;
    const bottom = top + cellH;
    const clampedX = Math.max(left, Math.min(right, x));
    const clampedY = Math.max(top, Math.min(bottom, y));
    const d = Math.hypot(x - clampedX, y - clampedY);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = r * size + c;
    }
  }
  return bestIdx;
}

function pickNextRandomFilter(current: PortalFilterId, excluded: Set<PortalFilterId> = new Set()): PortalFilterId {
  const uniquePool = PORTAL_FILTERS.filter((f) => f.id !== current && !excluded.has(f.id));
  const pool = uniquePool.length > 0 ? uniquePool : PORTAL_FILTERS.filter((f) => f.id !== current);
  return pool[Math.floor(Math.random() * pool.length)]?.id || 'dr_strange_mandala';
}

export const PhotoBoothCV: React.FC<PhotoBoothCVProps> = ({ soundEnabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelScratchRef = useRef<HTMLCanvasElement | null>(null);
  const mpHandsRef = useRef<mpHands.Hands | null>(null);
  const mpCameraRef = useRef<mpCamera.Camera | null>(null);
  const isProcessingFrameRef = useRef<boolean>(false);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handsCount, setHandsCount] = useState<number>(0);

  // Simple Mode: Portales (Gesture Filters) vs Sliding Puzzle on Live Camera
  const [boothMode, setBoothMode] = useState<BoothMode>('portals');
  const [activeFilter, setActiveFilter] = useState<PortalFilterId>('dr_strange_mandala');
  const [autoRandomFilter, setAutoRandomFilter] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [peaceDetected, setPeaceDetected] = useState<boolean>(false);
  const [filterToast, setFilterToast] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);

  // Live Camera Sliding Puzzle State
  const [puzzleSourceMode, setPuzzleSourceMode] = useState<PuzzleSourceMode>('live');
  const [puzzlePhoto, setPuzzlePhoto] = useState<CapturedPhoto | null>(null);
  const [puzzleSize, setPuzzleSize] = useState<PuzzleGridSize>(3);
  const [puzzleBoard, setPuzzleBoard] = useState<number[]>(() => generateSolvableBoard(3));
  const [puzzleMoves, setPuzzleMoves] = useState<number>(0);
  const [puzzleSeconds, setPuzzleSeconds] = useState<number>(0);
  const [puzzleSolved, setPuzzleSolved] = useState<boolean>(false);
  const [showPuzzleNumbers, setShowPuzzleNumbers] = useState<boolean>(true);
  const [showPuzzleRef, setShowPuzzleRef] = useState<boolean>(false);

  // Refs synced for 60fps Canvas Loop & MediaPipe Callback
  const boothModeRef = useRef<BoothMode>(boothMode);
  const activeFilterRef = useRef<PortalFilterId>(activeFilter);
  const autoRandomFilterRef = useRef<boolean>(autoRandomFilter);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const isCameraActiveRef = useRef<boolean>(false);

  const puzzleSourceModeRef = useRef<PuzzleSourceMode>(puzzleSourceMode);
  const puzzlePhotoImgRef = useRef<HTMLImageElement | null>(null);
  const puzzleSizeRef = useRef<PuzzleGridSize>(puzzleSize);
  const puzzleBoardRef = useRef<number[]>(puzzleBoard);
  const puzzleSolvedRef = useRef<boolean>(puzzleSolved);
  const showPuzzleNumbersRef = useRef<boolean>(showPuzzleNumbers);
  const showPuzzleRefRef = useRef<boolean>(showPuzzleRef);

  const trackedHandsRef = useRef<ThumbIndexHand[]>([]);
  const nextHandIdRef = useRef<number>(1);
  const handPuzzleStatesRef = useRef<Map<number, HandPuzzleState>>(new Map());
  const handCloseOpenStateRef = useRef<Map<number, { wasClosed: boolean; closedAt: number }>>(new Map());
  const handFiltersRef = useRef<Map<number, PortalFilterId>>(new Map());
  const filterSwapCooldownRef = useRef<number>(0);
  const filterToastTimerRef = useRef<number | null>(null);
  const peaceHoldStartRef = useRef<number | null>(null);
  const peaceCooldownRef = useRef<number>(0);
  const slideAnimsRef = useRef<TileSlideAnim[]>([]);
  const countdownActiveRef = useRef<boolean>(false);

  useEffect(() => {
    boothModeRef.current = boothMode;
  }, [boothMode]);
  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);
  useEffect(() => {
    autoRandomFilterRef.current = autoRandomFilter;
  }, [autoRandomFilter]);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  useEffect(() => {
    puzzleSourceModeRef.current = puzzleSourceMode;
  }, [puzzleSourceMode]);
  useEffect(() => {
    puzzleSizeRef.current = puzzleSize;
  }, [puzzleSize]);
  useEffect(() => {
    puzzleBoardRef.current = puzzleBoard;
  }, [puzzleBoard]);
  useEffect(() => {
    puzzleSolvedRef.current = puzzleSolved;
  }, [puzzleSolved]);
  useEffect(() => {
    showPuzzleNumbersRef.current = showPuzzleNumbers;
  }, [showPuzzleNumbers]);
  useEffect(() => {
    showPuzzleRefRef.current = showPuzzleRef;
  }, [showPuzzleRef]);

  // Optional periodic auto-rotation (disabled by default since Close+Open fingers swaps randomly!)
  useEffect(() => {
    if (!isCameraActive || boothMode !== 'portals' || !autoRandomFilter) return;
    const interval = setInterval(() => {
      setActiveFilter((prev) => pickNextRandomFilter(prev));
    }, 3500);
    return () => clearInterval(interval);
  }, [isCameraActive, boothMode, autoRandomFilter]);

  // Preload 16:9 image when playing puzzle from a captured photo
  useEffect(() => {
    if (!puzzlePhoto) {
      puzzlePhotoImgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      puzzlePhotoImgRef.current = img;
    };
    img.src = puzzlePhoto.rawDataUrl;
  }, [puzzlePhoto]);

  // Puzzle Timer Tick
  useEffect(() => {
    if (boothMode !== 'puzzle' || puzzleSolved) return;
    if (puzzleSourceMode === 'live' && !isCameraActive) return;
    const timer = setInterval(() => {
      setPuzzleSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [boothMode, puzzleSolved, puzzleSourceMode, isCameraActive]);

  const executeTileSlide = useCallback((tileIndex: number): boolean => {
    if (puzzleSolvedRef.current) return false;
    const size = puzzleSizeRef.current;
    const board = puzzleBoardRef.current;
    const emptyVal = size * size - 1;
    const emptyIdx = board.indexOf(emptyVal);
    if (emptyIdx === -1 || tileIndex < 0 || tileIndex >= board.length) return false;

    const tRow = Math.floor(tileIndex / size);
    const tCol = tileIndex % size;
    const eRow = Math.floor(emptyIdx / size);
    const eCol = emptyIdx % size;

    const isAdjacent = Math.abs(tRow - eRow) + Math.abs(tCol - eCol) === 1;
    if (!isAdjacent) return false;

    const movingTileVal = board[tileIndex];
    const next = [...board];
    next[emptyIdx] = movingTileVal;
    next[tileIndex] = emptyVal;

    puzzleBoardRef.current = next;
    const nowSolved = next.every((val, idx) => val === idx);
    puzzleSolvedRef.current = nowSolved;

    slideAnimsRef.current.push({
      tileVal: movingTileVal,
      fromCol: tCol,
      fromRow: tRow,
      toCol: eCol,
      toRow: eRow,
      startTime: performance.now(),
    });

    setPuzzleBoard(next);
    setPuzzleMoves((m) => m + 1);
    playBoothTone(540, 0.055, soundEnabledRef.current, 'triangle');

    if (nowSolved) {
      setPuzzleSolved(true);
      playBoothTone(880, 0.28, soundEnabledRef.current, 'sine');
    }
    return true;
  }, []);

  const executeTileSlideRef = useRef(executeTileSlide);
  useEffect(() => {
    executeTileSlideRef.current = executeTileSlide;
  }, [executeTileSlide]);

  const changePuzzleSize = useCallback((newSize: PuzzleGridSize) => {
    const fresh = generateSolvableBoard(newSize);
    puzzleSizeRef.current = newSize;
    puzzleBoardRef.current = fresh;
    puzzleSolvedRef.current = false;
    handPuzzleStatesRef.current.clear();
    slideAnimsRef.current = [];
    setPuzzleSize(newSize);
    setPuzzleBoard(fresh);
    setPuzzleMoves(0);
    setPuzzleSeconds(0);
    setPuzzleSolved(false);
  }, []);

  const reshufflePuzzle = useCallback(() => {
    const size = puzzleSizeRef.current;
    const fresh = generateSolvableBoard(size);
    puzzleBoardRef.current = fresh;
    puzzleSolvedRef.current = false;
    handPuzzleStatesRef.current.clear();
    slideAnimsRef.current = [];
    setPuzzleBoard(fresh);
    setPuzzleMoves(0);
    setPuzzleSeconds(0);
    setPuzzleSolved(false);
  }, []);

  useEffect(() => {
    if (boothMode !== 'puzzle' || puzzleSolved) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const size = puzzleSizeRef.current;
      const board = puzzleBoardRef.current;
      const emptyVal = size * size - 1;
      const emptyIdx = board.indexOf(emptyVal);
      const eRow = Math.floor(emptyIdx / size);
      const eCol = emptyIdx % size;

      let targetIdx = -1;
      if (e.key === 'ArrowUp' && eRow < size - 1) targetIdx = emptyIdx + size;
      else if (e.key === 'ArrowDown' && eRow > 0) targetIdx = emptyIdx - size;
      else if (e.key === 'ArrowLeft' && eCol < size - 1) targetIdx = emptyIdx + 1;
      else if (e.key === 'ArrowRight' && eCol > 0) targetIdx = emptyIdx - 1;

      if (targetIdx !== -1) {
        executeTileSlideRef.current(targetIdx);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [boothMode, puzzleSolved]);

  const snapPhotoNow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    playShutterClick(soundEnabledRef.current);
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 180);

    // Full-screen screenshot of the live viewport (mirrored camera + active optical lens filters)
    const rawDataUrl = canvas.toDataURL('image/png');

    const outCanvas = document.createElement('canvas');
    const pad = 20;
    const footerH = 44;
    outCanvas.width = canvas.width + pad * 2;
    outCanvas.height = canvas.height + pad + footerH;
    const octx = outCanvas.getContext('2d');
    const filterDef = PORTAL_FILTERS.find((f) => f.id === activeFilterRef.current);
    const timeStr = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    let framedDataUrl = rawDataUrl;
    if (octx) {
      octx.fillStyle = '#090d16';
      octx.fillRect(0, 0, outCanvas.width, outCanvas.height);
      octx.drawImage(canvas, pad, pad);
      octx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
      octx.lineWidth = 2;
      octx.strokeRect(pad, pad, canvas.width, canvas.height);

      octx.fillStyle = '#e2e8f0';
      octx.font = 'bold 16px sans-serif';
      octx.fillText(`CABINA CV · ${filterDef?.name.toUpperCase() || 'PORTAL'}`, pad, canvas.height + pad + 29);

      octx.fillStyle = '#94a3b8';
      octx.font = '13px monospace';
      octx.textAlign = 'right';
      octx.fillText(timeStr, outCanvas.width - pad, canvas.height + pad + 29);
      framedDataUrl = outCanvas.toDataURL('image/png');
    }

    const newPhoto: CapturedPhoto = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dataUrl: framedDataUrl,
      rawDataUrl,
      filterLabel: filterDef?.name || 'Portal',
      timestamp: timeStr,
    };
    setPhotos((prev) => [newPhoto, ...prev].slice(0, 12));

    // IMMEDIATELY launch real-time Sliding Puzzle on screen using the captured full-screen screenshot!
    const preloadImg = new Image();
    preloadImg.onload = () => {
      puzzlePhotoImgRef.current = preloadImg;
    };
    preloadImg.src = rawDataUrl;

    const freshBoard = generateSolvableBoard(puzzleSizeRef.current);
    puzzleBoardRef.current = freshBoard;
    puzzleSolvedRef.current = false;
    puzzleSourceModeRef.current = 'photo';
    boothModeRef.current = 'puzzle';
    handPuzzleStatesRef.current.clear();
    slideAnimsRef.current = [];
    peaceCooldownRef.current = performance.now() + 2200;

    setPuzzlePhoto(newPhoto);
    setPuzzleSourceMode('photo');
    setBoothMode('puzzle');
    setPuzzleBoard(freshBoard);
    setPuzzleMoves(0);
    setPuzzleSeconds(0);
    setPuzzleSolved(false);
  }, []);

  const triggerCountdownCapture = useCallback(() => {
    if (countdownActiveRef.current) return;
    countdownActiveRef.current = true;
    setCountdown(3);
    playBoothTone(660, 0.12, soundEnabledRef.current);

    setTimeout(() => {
      if (!countdownActiveRef.current) return;
      setCountdown(2);
      playBoothTone(760, 0.12, soundEnabledRef.current);
    }, 900);

    setTimeout(() => {
      if (!countdownActiveRef.current) return;
      setCountdown(1);
      playBoothTone(880, 0.15, soundEnabledRef.current);
    }, 1800);

    setTimeout(() => {
      countdownActiveRef.current = false;
      setCountdown(null);
      snapPhotoNow();
    }, 2650);
  }, [snapPhotoNow]);

  const triggerCountdownCaptureRef = useRef(triggerCountdownCapture);
  useEffect(() => {
    triggerCountdownCaptureRef.current = triggerCountdownCapture;
  }, [triggerCountdownCapture]);

  const stopCamera = useCallback(() => {
    countdownActiveRef.current = false;
    setCountdown(null);
    setPeaceDetected(false);
    if (mpCameraRef.current) {
      mpCameraRef.current.stop();
      mpCameraRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((tr) => tr.stop());
      videoRef.current.srcObject = null;
    }
    isCameraActiveRef.current = false;
    setIsCameraActive(false);
    setHandsCount(0);
    trackedHandsRef.current = [];
    handPuzzleStatesRef.current.clear();
    handCloseOpenStateRef.current.clear();
    handFiltersRef.current.clear();
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCameraLoading(true);
    setCameraError(null);

    try {
      const HandsCtor =
        mpHands.Hands ||
        (mpHands as unknown as { default?: { Hands?: typeof mpHands.Hands } }).default?.Hands ||
        (window as unknown as { Hands?: typeof mpHands.Hands }).Hands;
      if (!HandsCtor) {
        throw new Error('MediaPipe Hands constructor not available');
      }

      const hands = new HandsCtor({
        locateFile: (file) => `/mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 6,
        modelComplexity: 1,
        minDetectionConfidence: 0.48,
        minTrackingConfidence: 0.45,
      });

      hands.onResults((results: Results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        const now = performance.now();

        const rawHands = results.multiHandLandmarks || [];
        setHandsCount(rawHands.length);

        const prevHands = trackedHandsRef.current.filter((th) => now - th.lastSeen < 450);
        const usedPrevIds = new Set<number>();

        const nextTracked: ThumbIndexHand[] = rawHands.map((lms: NormalizedLandmarkList) => {
          const toPx = (idx: number) => ({
            x: (1 - lms[idx].x) * w,
            y: lms[idx].y * h,
          });
          const wrist = toPx(0);
          const thumbBase = toPx(2);
          const thumbTip = toPx(4);
          const indexBase = toPx(5);
          const indexPip = toPx(6);
          const indexTip = toPx(8);
          const middleMcp = toPx(9);
          const middlePip = toPx(10);
          const middleTip = toPx(12);
          const ringPip = toPx(14);
          const ringTip = toPx(16);
          const pinkyPip = toPx(18);
          const pinkyTip = toPx(20);

          const pinchCenter = {
            x: (thumbTip.x + indexTip.x) * 0.5,
            y: (thumbTip.y + indexTip.y) * 0.5,
          };

          let bestPrev: ThumbIndexHand | null = null;
          let bestDist = 150;
          for (const ph of prevHands) {
            if (usedPrevIds.has(ph.id)) continue;
            const d = Math.hypot(indexBase.x - ph.indexBase.x, indexBase.y - ph.indexBase.y);
            if (d < bestDist) {
              bestDist = d;
              bestPrev = ph;
            }
          }

          const smooth = (curr: { x: number; y: number }, prev?: { x: number; y: number }) =>
            prev ? { x: prev.x * 0.25 + curr.x * 0.75, y: prev.y * 0.25 + curr.y * 0.75 } : curr;

          const sThumbBase = smooth(thumbBase, bestPrev?.thumbBase);
          const sThumbTip = smooth(thumbTip, bestPrev?.thumbTip);
          const sIndexBase = smooth(indexBase, bestPrev?.indexBase);
          const sIndexTip = smooth(indexTip, bestPrev?.indexTip);
          const sCenter = {
            x: (sThumbTip.x + sIndexTip.x) * 0.5,
            y: (sThumbTip.y + sIndexTip.y) * 0.5,
          };
          const thumbLen = Math.hypot(sThumbTip.x - sThumbBase.x, sThumbTip.y - sThumbBase.y);
          const indexLen = Math.hypot(sIndexTip.x - sIndexBase.x, sIndexTip.y - sIndexBase.y);
          const palmScale = Math.max(
            24,
            Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y)
          );
          const handScale = Math.max(36, Math.max(thumbLen, indexLen) * 1.15);

          // Scale-normalized V-Sign Peace Gesture (Index [8] + Corazón/Middle [12] raised in V, Ring & Pinky curled)
          const dW = (pt: { x: number; y: number }) => Math.hypot(pt.x - wrist.x, pt.y - wrist.y);
          const indexExtended = dW(indexTip) > dW(indexPip) + palmScale * 0.18 && indexTip.y < indexPip.y;
          const middleExtended = dW(middleTip) > dW(middlePip) + palmScale * 0.18 && middleTip.y < middlePip.y;
          const ringCurled = dW(ringTip) < dW(ringPip) + palmScale * 0.16;
          const pinkyCurled = dW(pinkyTip) < dW(pinkyPip) + palmScale * 0.16;
          const vSpread = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y) > palmScale * 0.22;
          const isPeaceSign = indexExtended && middleExtended && ringCurled && pinkyCurled && vSpread;

          // Thumb + Index Close-then-Open pinch ratio for switching random filters
          const pinchDistRaw = Math.hypot(sIndexTip.x - sThumbTip.x, sIndexTip.y - sThumbTip.y);
          const isThumbIndexClosed = pinchDistRaw / handScale < 0.42;

          if (bestPrev) {
            usedPrevIds.add(bestPrev.id);
            return {
              id: bestPrev.id,
              thumbTip: sThumbTip,
              thumbBase: sThumbBase,
              indexTip: sIndexTip,
              indexBase: sIndexBase,
              pinchCenter: sCenter,
              handScale,
              isPeaceSign,
              isThumbIndexClosed,
              lastSeen: now,
            };
          }

          return {
            id: nextHandIdRef.current++,
            thumbTip: sThumbTip,
            thumbBase: sThumbBase,
            indexTip: sIndexTip,
            indexBase: sIndexBase,
            pinchCenter: sCenter,
            handScale,
            isPeaceSign,
            isThumbIndexClosed,
            lastSeen: now,
          };
        });

        trackedHandsRef.current = nextTracked;

        const activeIds = new Set<number>(nextTracked.map((th) => th.id));
        handPuzzleStatesRef.current.forEach((_, id) => {
          if (!activeIds.has(id)) {
            handPuzzleStatesRef.current.delete(id);
          }
        });
        handCloseOpenStateRef.current.forEach((_, id) => {
          if (!activeIds.has(id)) {
            handCloseOpenStateRef.current.delete(id);
          }
        });
        handFiltersRef.current.forEach((_, id) => {
          if (!activeIds.has(id)) {
            handFiltersRef.current.delete(id);
          }
        });

        // Guarantee every detected hand has its own unique filter (different from other active hands!)
        if (nextTracked.length > 0) {
          const usedFilters = new Set<PortalFilterId>();
          nextTracked.forEach((hand, hIdx) => {
            let assigned = handFiltersRef.current.get(hand.id);
            if (!assigned) {
              if (hIdx === 0 && !usedFilters.has(activeFilterRef.current)) {
                assigned = activeFilterRef.current;
              } else {
                const candidate = PORTAL_FILTERS.find((f) => !usedFilters.has(f.id));
                assigned = candidate ? candidate.id : PORTAL_FILTERS[hIdx % PORTAL_FILTERS.length].id;
              }
              handFiltersRef.current.set(hand.id, assigned);
            } else if (usedFilters.has(assigned)) {
              const uniquePick = PORTAL_FILTERS.find((f) => !usedFilters.has(f.id));
              if (uniquePick) {
                assigned = uniquePick.id;
                handFiltersRef.current.set(hand.id, assigned);
              }
            }
            usedFilters.add(assigned);
          });
        }

        // PORTALS MODE GESTURES:
        // 1) V-Sign (Index + Corazón raised in V) from ANY person -> triggers 3s photo countdown -> auto-opens Slider!
        // 2) Close Thumb+Index fingers & Re-open -> swaps THAT hand automatically to a Random Filter!
        if (boothModeRef.current === 'portals') {
          const anyPeace = nextTracked.some((th) => th.isPeaceSign);
          setPeaceDetected(anyPeace);

          if (anyPeace && !countdownActiveRef.current && now >= peaceCooldownRef.current) {
            if (peaceHoldStartRef.current === null) {
              peaceHoldStartRef.current = now;
            } else if (now - peaceHoldStartRef.current >= 180) {
              peaceHoldStartRef.current = null;
              peaceCooldownRef.current = now + 4000;
              triggerCountdownCaptureRef.current();
            }
          } else {
            peaceHoldStartRef.current = null;
          }

          // Close-then-Open Thumb+Index finger gesture switches THAT hand to a unique Random Filter
          if (!countdownActiveRef.current) {
            nextTracked.forEach((hand, hIdx) => {
              const pinchDist = Math.hypot(hand.indexTip.x - hand.thumbTip.x, hand.indexTip.y - hand.thumbTip.y);
              const pinchRatio = pinchDist / hand.handScale;
              let co = handCloseOpenStateRef.current.get(hand.id);
              if (!co) {
                co = { wasClosed: false, closedAt: 0 };
                handCloseOpenStateRef.current.set(hand.id, co);
              }

              if (!hand.isPeaceSign && pinchRatio < 0.42) {
                co.wasClosed = true;
                co.closedAt = now;
              } else if (
                co.wasClosed &&
                pinchRatio > 0.72 &&
                now - co.closedAt < 2000 &&
                now >= filterSwapCooldownRef.current
              ) {
                co.wasClosed = false;
                filterSwapCooldownRef.current = now + 420;
                const otherFilters = new Set<PortalFilterId>();
                nextTracked.forEach((other) => {
                  if (other.id !== hand.id) {
                    const f = handFiltersRef.current.get(other.id);
                    if (f) otherFilters.add(f);
                  }
                });
                const currentHandFilter = handFiltersRef.current.get(hand.id) || activeFilterRef.current;
                const nextId = pickNextRandomFilter(currentHandFilter, otherFilters);
                handFiltersRef.current.set(hand.id, nextId);
                if (hIdx === 0 || nextTracked.length === 1) {
                  activeFilterRef.current = nextId;
                  setActiveFilter(nextId);
                }
                const nextMeta = PORTAL_FILTERS.find((f) => f.id === nextId);
                if (nextMeta) {
                  setFilterToast(
                    nextTracked.length > 1 ? `Mano ${hIdx + 1}: ${nextMeta.name}` : nextMeta.name
                  );
                  if (filterToastTimerRef.current) {
                    window.clearTimeout(filterToastTimerRef.current);
                  }
                  filterToastTimerRef.current = window.setTimeout(() => {
                    setFilterToast(null);
                  }, 1500);
                }
                playBoothTone(720, 0.08, soundEnabledRef.current, 'sine');
              }
            });
          }
        } else {
          setPeaceDetected(false);
          peaceHoldStartRef.current = null;
        }

        // Sliding Puzzle: STRICTLY Thumb + Index Pinch Control (Pinch-Tap or Pinch-Drag)
        if (boothModeRef.current === 'puzzle' && !puzzleSolvedRef.current) {
          const size = puzzleSizeRef.current;
          const board = puzzleBoardRef.current;
          const emptyVal = size * size - 1;
          const emptyIdx = board.indexOf(emptyVal);
          const eRow = Math.floor(emptyIdx / size);
          const eCol = emptyIdx % size;
          const cellW = BOARD_W / size;
          const cellH = BOARD_H / size;

          nextTracked.forEach((hand) => {
            const cx = hand.pinchCenter.x;
            const cy = hand.pinchCenter.y;
            const pinchDist = Math.hypot(hand.indexTip.x - hand.thumbTip.x, hand.indexTip.y - hand.thumbTip.y);

            let state = handPuzzleStatesRef.current.get(hand.id);
            if (!state) {
              state = {
                isPinching: false,
                grabbedTileVal: null,
                grabStartX: cx,
                grabStartY: cy,
                grabAxis: null,
                grabDir: 1,
                grabMaxDist: cellW,
                grabProgress: 0,
                grabStartTime: 0,
                cooldownUntil: 0,
              };
              handPuzzleStatesRef.current.set(hand.id, state);
            }

            const startThresh = Math.max(26, hand.handScale * 0.42);
            const releaseThresh = Math.max(36, hand.handScale * 0.58);
            const wasPinching = state.isPinching;
            const isPinching = wasPinching ? pinchDist < releaseThresh : pinchDist < startThresh;
            state.isPinching = isPinching;

            // 1. Pinch Start: lock onto adjacent movable tile (with border tolerance)
            if (!wasPinching && isPinching && now >= state.cooldownUntil && emptyIdx !== -1) {
              const targetCellIdx = findNearestAdjacentCell(cx, cy, size, emptyIdx);
              if (targetCellIdx !== null) {
                const tRow = Math.floor(targetCellIdx / size);
                const tCol = targetCellIdx % size;
                state.grabbedTileVal = board[targetCellIdx];
                state.grabStartX = cx;
                state.grabStartY = cy;
                state.grabStartTime = now;
                state.grabProgress = 0;
                if (eCol !== tCol) {
                  state.grabAxis = 'x';
                  state.grabDir = eCol > tCol ? 1 : -1;
                  state.grabMaxDist = cellW;
                } else {
                  state.grabAxis = 'y';
                  state.grabDir = eRow > tRow ? 1 : -1;
                  state.grabMaxDist = cellH;
                }
              }
            }

            // 2. While Pinch-Dragging: easy 30% drag threshold snaps cleanly into empty slot
            if (isPinching && state.grabbedTileVal !== null && state.grabAxis) {
              const liveIdx = puzzleBoardRef.current.indexOf(state.grabbedTileVal);
              if (liveIdx === -1) {
                state.grabbedTileVal = null;
              } else {
                const rawDelta =
                  state.grabAxis === 'x'
                    ? (cx - state.grabStartX) * state.grabDir
                    : (cy - state.grabStartY) * state.grabDir;
                const progress = Math.max(0, Math.min(1, rawDelta / state.grabMaxDist));
                state.grabProgress = progress;

                if (progress >= 0.3) {
                  executeTileSlideRef.current(liveIdx);
                  state.grabbedTileVal = null;
                  state.grabProgress = 0;
                  state.cooldownUntil = now + 260;
                }
              }
            }

            // 3. Quick Pinch Release (< 450ms): acts as reliable Pinch-Tap to slide tile immediately!
            if (wasPinching && !isPinching && state.grabbedTileVal !== null) {
              const holdDuration = now - state.grabStartTime;
              const liveIdx = puzzleBoardRef.current.indexOf(state.grabbedTileVal);
              if (liveIdx !== -1 && (state.grabProgress >= 0.16 || holdDuration < 450)) {
                executeTileSlideRef.current(liveIdx);
                state.cooldownUntil = now + 220;
              }
              state.grabbedTileVal = null;
              state.grabProgress = 0;
            }
          });
        }
      });

      mpHandsRef.current = hands;

      const CameraCtor =
        mpCamera.Camera ||
        (mpCamera as unknown as { default?: { Camera?: typeof mpCamera.Camera } }).default?.Camera ||
        (window as unknown as { Camera?: typeof mpCamera.Camera }).Camera;
      if (!CameraCtor) {
        throw new Error('MediaPipe Camera constructor not available');
      }

      const camera = new CameraCtor(videoRef.current, {
        onFrame: async () => {
          if (isProcessingFrameRef.current) return;
          if (videoRef.current && mpHandsRef.current && videoRef.current.readyState >= 2) {
            isProcessingFrameRef.current = true;
            try {
              await mpHandsRef.current.send({ image: videoRef.current });
            } catch {
              // Ignore dropped frames
            } finally {
              isProcessingFrameRef.current = false;
            }
          }
        },
        width: CANVAS_W,
        height: CANVAS_H,
      });

      await camera.start();
      mpCameraRef.current = camera;
      isCameraActiveRef.current = true;
      setIsCameraActive(true);
      setCameraLoading(false);
    } catch (err) {
      console.error('PhotoBooth camera error:', err);
      setCameraError('Toca "Encender Cámara" o permite acceso a tu webcam para activar gestos CV.');
      isCameraActiveRef.current = false;
      setIsCameraActive(false);
      setCameraLoading(false);
    }
  }, []);

  // Auto-activate camera upon entering Cabina Fotos CV
  useEffect(() => {
    void startCamera();
    return () => {
      stopCamera();
      if (filterToastTimerRef.current) {
        window.clearTimeout(filterToastTimerRef.current);
      }
    };
  }, [startCamera, stopCamera]);

  const startPuzzleWithPhoto = useCallback(
    async (photo: CapturedPhoto) => {
      setPuzzlePhoto(photo);
      setPuzzleSourceMode('photo');
      puzzleSourceModeRef.current = 'photo';
      setBoothMode('puzzle');
      boothModeRef.current = 'puzzle';

      const fresh = generateSolvableBoard(puzzleSizeRef.current);
      puzzleBoardRef.current = fresh;
      puzzleSolvedRef.current = false;
      handPuzzleStatesRef.current.clear();
      slideAnimsRef.current = [];
      setPuzzleBoard(fresh);
      setPuzzleMoves(0);
      setPuzzleSeconds(0);
      setPuzzleSolved(false);

      if (!isCameraActiveRef.current && !cameraLoading) {
        startCamera();
      }
    },
    [cameraLoading, startCamera]
  );

  const switchToLivePuzzleMode = useCallback(() => {
    setBoothMode('puzzle');
    boothModeRef.current = 'puzzle';
    setPuzzleSourceMode('live');
    puzzleSourceModeRef.current = 'live';
    if (!isCameraActiveRef.current && !cameraLoading) {
      startCamera();
    }
  }, [cameraLoading, startCamera]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (boothModeRef.current !== 'puzzle' || puzzleSolvedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    const cellIdx = getCellIndexAtCanvasPos(x, y, puzzleSizeRef.current);
    if (cellIdx !== null) {
      executeTileSlideRef.current(cellIdx);
    }
  }, []);

  // 60fps Canvas Render Loop: Thumb-Index Portals OR Live Camera Sliding Puzzle
  useEffect(() => {
    let rafId = 0;

    // Build Independent Optical Portal PER HAND so multiple hands each show their own distinct filter!
    const buildThumbIndexPortals = (hands: ThumbIndexHand[]): PortalShape[] => {
      const sorted = [...hands].sort((a, b) => a.pinchCenter.x - b.pinchCenter.x);
      return sorted.map((h1) => {
        const span = Math.hypot(h1.indexTip.x - h1.thumbTip.x, h1.indexTip.y - h1.thumbTip.y);
        return {
          kind: 'circle',
          handId: h1.id,
          cx: h1.pinchCenter.x,
          cy: h1.pinchCenter.y,
          radius: Math.max(48, span * 0.85, h1.handScale * 1.05),
          points: [h1.thumbTip, h1.indexTip],
        };
      });
    };

    const drawPortalEffect = (
      ctx: CanvasRenderingContext2D,
      shape: PortalShape,
      filterId: PortalFilterId,
      w: number,
      h: number,
      now: number
    ) => {
      let minX = w;
      let minY = h;
      let maxX = 0;
      let maxY = 0;

      if (shape.kind === 'circle') {
        minX = shape.cx - shape.radius;
        maxX = shape.cx + shape.radius;
        minY = shape.cy - shape.radius;
        maxY = shape.cy + shape.radius;
      } else {
        shape.points.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
      }
      const boxW = maxX - minX;
      const boxH = maxY - minY;
      if (boxW < 18 || boxH < 18) return;

      const { cx, cy } = shape;
      const hasVideo = Boolean(isCameraActiveRef.current && videoRef.current && videoRef.current.readyState >= 2);
      const traceShape = () => {
        ctx.beginPath();
        if (shape.kind === 'circle') {
          ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
        } else {
          shape.points.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.closePath();
        }
      };

      ctx.save();
      traceShape();
      ctx.clip();

      if (filterId === 'dr_strange_mandala') {
        // Doctor Strange Eldritch Sling-Ring Mandala + Warm Amber Reality Portal
        const maxR = Math.max(boxW, boxH) * 0.52;
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.25) saturate(1.55) sepia(0.28) brightness(1.08)';
          ctx.translate(cx, cy);
          ctx.scale(1.12 + Math.sin(now * 0.004) * 0.04, 1.12 + Math.sin(now * 0.004) * 0.04);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const mysticGrad = ctx.createRadialGradient(cx, cy, maxR * 0.2, cx, cy, maxR);
        mysticGrad.addColorStop(0, 'rgba(251, 146, 60, 0.05)');
        mysticGrad.addColorStop(0.75, 'rgba(249, 115, 22, 0.24)');
        mysticGrad.addColorStop(1, 'rgba(250, 204, 21, 0.48)');
        ctx.fillStyle = mysticGrad;
        ctx.fillRect(minX, minY, boxW, boxH);
      } else if (filterId === 'mirror_dimension') {
        // Doctor Strange Mirror Dimension: 6 Rotating Crystalline Triangular Shards
        const maxR = Math.max(boxW, boxH) * 0.65;
        if (hasVideo && videoRef.current) {
          for (let sIdx = 0; sIdx < 6; sIdx++) {
            const a0 = (sIdx * Math.PI) / 3 + now * 0.00045;
            const a1 = a0 + Math.PI / 3;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a0) * maxR, cy + Math.sin(a0) * maxR);
            ctx.lineTo(cx + Math.cos(a1) * maxR, cy + Math.sin(a1) * maxR);
            ctx.closePath();
            ctx.clip();

            ctx.filter = sIdx % 2 === 0 ? 'contrast(1.28) saturate(1.45)' : 'contrast(1.35) hue-rotate(25deg) brightness(1.08)';
            ctx.translate(cx, cy);
            ctx.rotate((sIdx % 2 === 0 ? 1 : -1) * 0.14 * Math.sin(now * 0.0018 + sIdx));
            ctx.scale(sIdx % 2 === 0 ? 1.16 : -1.16, 1.16);
            ctx.translate(-cx, -cy);
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, w, h);
            ctx.restore();

            ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a0) * maxR, cy + Math.sin(a0) * maxR);
            ctx.stroke();
          }
        }
      } else if (filterId === 'time_stone') {
        // Eye of Agamotto / Time Stone Animated Emerald Chronos Portal
        const maxR = Math.max(boxW, boxH) * 0.52;
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.3) saturate(2.2) hue-rotate(88deg) brightness(1.06)';
          ctx.translate(cx, cy);
          ctx.rotate(Math.sin(now * 0.002) * 0.08);
          ctx.scale(1.15, 1.15);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const timeGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, maxR);
        timeGrad.addColorStop(0, 'rgba(74, 222, 128, 0.12)');
        timeGrad.addColorStop(0.75, 'rgba(34, 197, 94, 0.25)');
        timeGrad.addColorStop(1, 'rgba(16, 185, 129, 0.5)');
        ctx.fillStyle = timeGrad;
        ctx.fillRect(minX, minY, boxW, boxH);
      } else if (filterId === 'starwars_hologram') {
        // Star Wars Galactic Hologram Projector (Flickering Cyan Scanlines & Beam)
        const flicker = Math.sin(now * 0.045) > 0.85 ? 0.68 : 0.94;
        const jx = Math.sin(now * 0.06) > 0.88 ? 6 : 0;
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.globalAlpha = flicker;
          ctx.filter = 'grayscale(0.8) sepia(1) hue-rotate(155deg) saturate(3.6) contrast(1.45) brightness(1.15)';
          ctx.translate(w + jx, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(8, 145, 178, 0.24)';
        ctx.fillRect(minX, minY, boxW, boxH);
        ctx.fillStyle = 'rgba(103, 232, 249, 0.35)';
        for (let sy = Math.floor(minY); sy < maxY; sy += 4) {
          ctx.fillRect(minX, sy, boxW, 1.5);
        }
        const beamY = minY + ((now * 0.19) % Math.max(20, boxH));
        ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
        ctx.fillRect(minX, beamY, boxW, 4);
      } else if (filterId === 'scarlet_chaos') {
        // Scarlet Witch Crimson Hex Energy Ripples
        const maxR = Math.max(boxW, boxH) * 0.54;
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.38) saturate(2.4) hue-rotate(-32deg) brightness(0.98)';
          ctx.translate(cx, cy);
          ctx.scale(1.16, 1.16);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const hexGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, maxR);
        hexGrad.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
        hexGrad.addColorStop(0.68, 'rgba(220, 38, 38, 0.26)');
        hexGrad.addColorStop(1, 'rgba(153, 27, 27, 0.55)');
        ctx.fillStyle = hexGrad;
        ctx.fillRect(minX, minY, boxW, boxH);
        for (let wave = 0; wave < 3; wave++) {
          const prog = ((now * 0.0009 + wave / 3) % 1);
          ctx.strokeStyle = `rgba(248, 113, 113, ${(1 - prog) * 0.75})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(6, maxR * prog), 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (filterId === 'patronus_charm') {
        // Enchanted Silver-Blue Patronus Mist & Spirit Particles
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.22) saturate(0.65) brightness(1.18) hue-rotate(175deg)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.42;
          ctx.globalCompositeOperation = 'screen';
          ctx.filter = 'blur(5px) brightness(1.35) saturate(1.4)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        for (let p = 0; p < 12; p++) {
          const ang = now * 0.0022 + p * ((Math.PI * 2) / 12);
          const rad = Math.min(boxW, boxH) * (0.18 + 0.24 * Math.sin(now * 0.003 + p));
          const px = cx + Math.cos(ang) * rad;
          const py = cy + Math.sin(ang) * rad;
          ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (filterId === 'wakanda_vibranium') {
        // Kinetic Purple Vibranium Hex Shield Pulse
        const maxR = Math.max(boxW, boxH) * 0.54;
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.32) saturate(2.1) hue-rotate(248deg) brightness(1.04)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(139, 92, 246, 0.22)';
        ctx.fillRect(minX, minY, boxW, boxH);
        const pulseR = ((now * 0.06) % maxR);
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.72)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3 + now * 0.0012;
          const hx = cx + Math.cos(a) * pulseR;
          const hy = cy + Math.sin(a) * pulseR;
          if (k === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (filterId === 'spider_verse') {
        // Spider-Verse Comic Multiverse Split + Ben-Day Halftone + Electric Arcs
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.85) saturate(2.5) brightness(1.06)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.globalCompositeOperation = 'screen';
          ctx.filter = 'hue-rotate(155deg) saturate(3.0)';
          ctx.translate(w + 7, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(232, 121, 249, 0.22)';
        for (let gy = Math.floor(minY); gy < maxY; gy += 14) {
          for (let gx = Math.floor(minX); gx < maxX; gx += 14) {
            ctx.beginPath();
            ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (filterId === 'cyber_blade') {
        // Blade Runner Neo-Noir Rain + Cyan/Magenta Neon Grade
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.42) saturate(2.1) hue-rotate(-14deg) brightness(0.95)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const neoGrad = ctx.createLinearGradient(minX, minY, maxX, maxY);
        neoGrad.addColorStop(0, 'rgba(6, 182, 212, 0.26)');
        neoGrad.addColorStop(1, 'rgba(244, 63, 94, 0.26)');
        ctx.fillStyle = neoGrad;
        ctx.fillRect(minX, minY, boxW, boxH);
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
        ctx.lineWidth = 1.2;
        for (let rx = Math.floor(minX); rx < maxX; rx += 18) {
          const ry = minY + ((now * 0.26 + rx * 11) % Math.max(30, boxH));
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 5, ry + 14);
          ctx.stroke();
        }
      } else if (filterId === 'upside_down') {
        // Upside Down Dark Cobalt-Crimson Spores & Lightning
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.45) brightness(0.84) saturate(1.4) hue-rotate(205deg)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = Math.sin(now * 0.017) > 0.92 ? 'rgba(220, 38, 38, 0.28)' : 'rgba(15, 23, 42, 0.34)';
        ctx.fillRect(minX, minY, boxW, boxH);
        for (let sp = 0; sp < 14; sp++) {
          const sx = minX + ((sp * 37 + Math.sin(now * 0.001 + sp) * 20) % Math.max(20, boxW));
          const sy = maxY - ((now * 0.05 + sp * 29) % Math.max(20, boxH));
          ctx.fillStyle = 'rgba(248, 113, 113, 0.72)';
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (filterId === 'fisheye') {
        // Real-time 8mm Fisheye Barrel Bulge using concentric GPU-clipped magnification rings
        const maxR = Math.max(boxW, boxH) * 0.62;
        if (hasVideo && videoRef.current) {
          const rings = 10;
          for (let i = 0; i < rings; i++) {
            const frac = 1 - i / rings;
            const ringR = maxR * frac;
            const scale = 0.72 + Math.pow(1 - frac, 1.55) * 0.92;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.clip();
            ctx.filter = 'contrast(1.16) saturate(1.3)';
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, w, h);
            ctx.restore();
          }
        }
        // Optical fisheye dark rim vignette + curved glass highlight
        const vig = ctx.createRadialGradient(cx, cy, maxR * 0.4, cx, cy, maxR);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(0.75, 'rgba(0,0,0,0.12)');
        vig.addColorStop(1, 'rgba(2,6,23,0.68)');
        ctx.fillStyle = vig;
        ctx.fillRect(minX, minY, boxW, boxH);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(12, Math.min(boxW, boxH) * 0.4), Math.PI * 1.12, Math.PI * 1.44);
        ctx.stroke();
      } else if (filterId === 'y2k_ccd') {
        // Trending 2003 Compact DigiCam (harsh direct flash + crunchy contrast + timestamp)
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.38) brightness(1.12) saturate(1.42) sepia(0.12)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const flashGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(boxW, boxH) * 0.65);
        flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        flashGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        flashGrad.addColorStop(1, 'rgba(15, 23, 42, 0.42)');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(minX, minY, boxW, boxH);

        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("'03 11 23", cx, maxY - 12);
      } else if (filterId === 'halation') {
        // Trending 35mm Film Halation / CineBloom (glowing crimson-amber highlights)
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.15) saturate(1.2) sepia(0.14) brightness(1.04)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.36;
          ctx.globalCompositeOperation = 'screen';
          ctx.filter = 'blur(7px) saturate(2.8) hue-rotate(-28deg) brightness(1.18)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const leakGrad = ctx.createLinearGradient(minX, minY, maxX, maxY);
        leakGrad.addColorStop(0, 'rgba(251, 113, 133, 0.22)');
        leakGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        leakGrad.addColorStop(1, 'rgba(249, 115, 22, 0.18)');
        ctx.fillStyle = leakGrad;
        ctx.fillRect(minX, minY, boxW, boxH);
      } else if (filterId === 'crt_glitch') {
        // Trending CRT / VHS RGB Glitch Split + phosphor scanlines
        const jitter = Math.sin(now * 0.028) > 0.72 ? 12 : 4;
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.28) saturate(1.4)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.32;
          ctx.globalCompositeOperation = 'screen';
          ctx.filter = 'hue-rotate(95deg) saturate(2.4)';
          ctx.translate(w + jitter, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.globalCompositeOperation = 'screen';
          ctx.filter = 'hue-rotate(-110deg) saturate(2.4)';
          ctx.translate(w - jitter, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        for (let sy = Math.floor(minY); sy < maxY; sy += 4) {
          ctx.fillRect(minX, sy, boxW, 1.5);
        }
        const barY = minY + ((now * 0.16) % Math.max(20, boxH));
        ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
        ctx.fillRect(minX, barY, boxW, 5);
      } else if (filterId === 'anamorphic') {
        // Trending Anamorphic Cinema Scope + Horizontal Cyan Lens Flare Streak
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.26) saturate(1.36) hue-rotate(-12deg)';
          ctx.translate(cx, cy);
          ctx.scale(1.16, 1.04);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const flare = ctx.createLinearGradient(minX, cy, maxX, cy);
        flare.addColorStop(0, 'rgba(34, 211, 238, 0)');
        flare.addColorStop(0.35, 'rgba(34, 211, 238, 0.25)');
        flare.addColorStop(0.5, 'rgba(224, 242, 254, 0.72)');
        flare.addColorStop(0.65, 'rgba(34, 211, 238, 0.25)');
        flare.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = flare;
        ctx.fillRect(minX, cy - 3, boxW, 6);

        // Subtle cinema bars inside frame
        ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
        ctx.fillRect(minX, minY, boxW, boxH * 0.14);
        ctx.fillRect(minX, maxY - boxH * 0.14, boxW, boxH * 0.14);
      } else if (filterId === 'aura_neon') {
        // Trending Ethereal Iridescent Rainbow Aura + Motion Trail
        const hueShift = Math.floor((now * 0.09) % 360);
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = `hue-rotate(${hueShift}deg) saturate(2.3) contrast(1.18)`;
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.globalCompositeOperation = 'screen';
          ctx.filter = `hue-rotate(${(hueShift + 130) % 360}deg) saturate(2.6) blur(2px)`;
          ctx.translate(cx + Math.cos(now * 0.003) * 8, cy + Math.sin(now * 0.003) * 8);
          ctx.scale(1.12, 1.12);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
      } else if (filterId === 'prism') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'saturate(2.5) contrast(1.32) hue-rotate(175deg)';
          ctx.translate(cx, cy);
          ctx.scale(1.42, 1.42);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.globalCompositeOperation = 'screen';
          ctx.translate(cx + 6, cy - 3);
          ctx.scale(1.44, 1.44);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(192, 132, 252, 0.16)';
        for (let sy = Math.floor(minY); sy < maxY; sy += 6) {
          ctx.fillRect(minX, sy, boxW, 2);
        }
      } else if (filterId === 'kaleido') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'saturate(1.75) contrast(1.22)';
          const quadrants: Array<[number, number]> = [
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
          ];
          quadrants.forEach(([sx, sy], qi) => {
            ctx.save();
            ctx.beginPath();
            const qx = sx > 0 ? cx : minX;
            const qy = sy > 0 ? cy : minY;
            const qw = sx > 0 ? maxX - cx : cx - minX;
            const qh = sy > 0 ? maxY - cy : cy - minY;
            ctx.rect(qx, qy, qw, qh);
            ctx.clip();

            ctx.translate(cx, cy);
            ctx.scale(sx, sy);
            ctx.rotate(Math.sin(now * 0.0012 + qi * 0.2) * 0.08);
            ctx.translate(-cx, -cy);
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current!, 0, 0, w, h);
            ctx.restore();
          });
          ctx.restore();
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, minY);
        ctx.lineTo(cx, maxY);
        ctx.moveTo(minX, cy);
        ctx.lineTo(maxX, cy);
        ctx.stroke();
      } else if (filterId === 'thermal_lens') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.65) saturate(3.2) hue-rotate(-35deg) brightness(1.08)';
          ctx.translate(cx, cy);
          ctx.scale(1.18, 1.18);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(boxW, boxH) * 0.7);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
        grad.addColorStop(0.55, 'rgba(249, 115, 22, 0.22)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0.35)');
        ctx.fillStyle = grad;
        ctx.fillRect(minX, minY, boxW, boxH);

        const sweepY = minY + ((now * 0.12) % Math.max(20, boxH));
        ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
        ctx.fillRect(minX, sweepY, boxW, 3);
      } else if (filterId === 'xray_portal') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'invert(1) grayscale(0.4) contrast(1.55) hue-rotate(165deg)';
          ctx.translate(cx, cy);
          ctx.scale(1.25, 1.25);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
        ctx.lineWidth = 1.5;
        for (let r = 18; r < Math.max(boxW, boxH) * 0.6; r += 26) {
          ctx.beginPath();
          ctx.arc(cx, cy, r + ((now * 0.03) % 26), 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (filterId === 'pixel_glass') {
        if (!pixelScratchRef.current) {
          pixelScratchRef.current = document.createElement('canvas');
        }
        const scratch = pixelScratchRef.current;
        const pixelSize = 18;
        const sw = Math.max(16, Math.floor(w / pixelSize));
        const sh = Math.max(9, Math.floor(h / pixelSize));
        if (scratch.width !== sw || scratch.height !== sh) {
          scratch.width = sw;
          scratch.height = sh;
        }
        const sctx = scratch.getContext('2d');
        if (sctx && hasVideo && videoRef.current) {
          sctx.save();
          sctx.translate(sw, 0);
          sctx.scale(-1, 1);
          sctx.drawImage(videoRef.current, 0, 0, sw, sh);
          sctx.restore();

          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(scratch, 0, 0, sw, sh, 0, 0, w, h);
          ctx.imageSmoothingEnabled = true;

          ctx.strokeStyle = 'rgba(250, 204, 21, 0.22)';
          ctx.lineWidth = 1;
          for (let gx = Math.floor(minX / pixelSize) * pixelSize; gx < maxX; gx += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(gx, minY);
            ctx.lineTo(gx, maxY);
            ctx.stroke();
          }
        }
      } else if (filterId === 'popart_portal') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(2.1) saturate(3.0) brightness(1.1) hue-rotate(-30deg)';
          ctx.translate(cx, cy);
          ctx.scale(1.22, 1.22);
          ctx.translate(-cx, -cy);
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(251, 113, 133, 0.24)';
        for (let gy = Math.floor(minY); gy < maxY; gy += 12) {
          for (let gx = Math.floor(minX); gx < maxX; gx += 12) {
            ctx.beginPath();
            ctx.arc(gx, gy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (filterId === 'matrix_rain') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.65) brightness(0.88) hue-rotate(80deg) saturate(2.5)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(2, 44, 34, 0.34)';
        ctx.fillRect(minX, minY, boxW, boxH);
        ctx.fillStyle = 'rgba(74, 222, 128, 0.72)';
        ctx.font = 'bold 11px monospace';
        const glyphs = '01アイウエカキク';
        for (let mx = Math.floor(minX); mx < maxX; mx += 16) {
          const dropY = minY + (((now * 0.14 + mx * 7) % Math.max(40, boxH)));
          const ch = glyphs[Math.floor((mx + now * 0.01) % glyphs.length)];
          ctx.fillText(ch, mx, dropY);
        }
      } else if (filterId === 'vaporwave') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.32) saturate(2.2) hue-rotate(275deg) brightness(1.06)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const vGrad = ctx.createLinearGradient(minX, minY, maxX, maxY);
        vGrad.addColorStop(0, 'rgba(236, 72, 153, 0.28)');
        vGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.14)');
        vGrad.addColorStop(1, 'rgba(34, 211, 238, 0.3)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(minX, minY, boxW, boxH);
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.38)';
        ctx.lineWidth = 1;
        for (let gy = Math.floor(cy); gy < maxY; gy += 14) {
          ctx.beginPath();
          ctx.moveTo(minX, gy);
          ctx.lineTo(maxX, gy);
          ctx.stroke();
        }
      } else if (filterId === 'sketch_ink') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'grayscale(1) contrast(2.8) brightness(1.22)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.lineWidth = 1;
        for (let sx = minX; sx < maxX; sx += 10) {
          ctx.beginPath();
          ctx.moveTo(sx, minY);
          ctx.lineTo(sx - 12, maxY);
          ctx.stroke();
        }
      } else if (filterId === 'golden_prism') {
        if (hasVideo && videoRef.current) {
          ctx.save();
          ctx.filter = 'contrast(1.24) saturate(1.75) sepia(0.32) brightness(1.1)';
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          ctx.restore();
        }
        const sunGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(boxW, boxH) * 0.68);
        sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
        sunGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.28)');
        sunGrad.addColorStop(1, 'rgba(244, 63, 94, 0.36)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(minX, minY, boxW, boxH);
      }

      ctx.restore();

      const filterMeta = PORTAL_FILTERS.find((f) => f.id === filterId);
      const strokeColor = filterMeta?.accent || '#22d3ee';
      ctx.save();

      // Animated Outer Sacred Mandala Rings for Dr. Strange & Time Stone Filters
      if (filterId === 'dr_strange_mandala' || filterId === 'time_stone') {
        const ringR = shape.radius * 1.02;
        const glowCol = filterId === 'dr_strange_mandala' ? '#fb923c' : '#22c55e';
        const innerCol = filterId === 'dr_strange_mandala' ? '#fde047' : '#86efac';
        ctx.shadowBlur = 22;
        ctx.shadowColor = glowCol;

        // Outer spinning dashed glyph ring
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(now * 0.0014);
        ctx.strokeStyle = glowCol;
        ctx.lineWidth = 2.6;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // Twin rotated mystic squares forming an 8-point Eldritch Star
        ctx.setLineDash([]);
        ctx.strokeStyle = innerCol;
        ctx.lineWidth = 1.8;
        const sqHalf = ringR * 0.68;
        ctx.strokeRect(-sqHalf, -sqHalf, sqHalf * 2, sqHalf * 2);
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-sqHalf, -sqHalf, sqHalf * 2, sqHalf * 2);
        ctx.restore();

        // Counter-rotating inner ring + orbiting mystic sparks
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-now * 0.0022);
        ctx.strokeStyle = glowCol;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 0.78, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let sp = 0; sp < 8; sp++) {
          const sa = (sp * Math.PI) / 4;
          ctx.fillStyle = innerCol;
          ctx.beginPath();
          ctx.arc(Math.cos(sa) * ringR, Math.sin(sa) * ringR, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        ctx.strokeStyle = strokeColor;
        ctx.shadowBlur = 18;
        ctx.shadowColor = strokeColor;
        ctx.lineWidth = 3;
        traceShape();
        ctx.stroke();
      }

      // Anchor nodes strictly on Thumb + Index tips
      shape.points.forEach((p) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    };

    const drawLivePuzzleBoard = (
      ctx: CanvasRenderingContext2D,
      hands: ThumbIndexHand[],
      hasVideo: boolean,
      now: number
    ) => {
      const size = puzzleSizeRef.current;
      const board = puzzleBoardRef.current;
      const solved = puzzleSolvedRef.current;
      const emptyVal = size * size - 1;
      const emptyIdx = board.indexOf(emptyVal);
      const eRow = Math.floor(emptyIdx / size);
      const eCol = emptyIdx % size;
      const cellW = BOARD_W / size;
      const cellH = BOARD_H / size;
      const tileGap = 3;

      const usePhotoSource = puzzleSourceModeRef.current === 'photo' && puzzlePhotoImgRef.current !== null;
      const video = videoRef.current;
      const photoImg = puzzlePhotoImgRef.current;

      ctx.save();
      ctx.fillStyle = 'rgba(6, 10, 20, 0.56)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = 'rgba(8, 13, 26, 0.88)';
      ctx.fillRect(BOARD_X - 4, BOARD_Y - 4, BOARD_W + 8, BOARD_H + 8);
      ctx.strokeStyle = solved ? '#34d399' : 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(BOARD_X - 4, BOARD_Y - 4, BOARD_W + 8, BOARD_H + 8);
      ctx.restore();

      if (!solved && emptyIdx !== -1) {
        const ex = BOARD_X + eCol * cellW + tileGap;
        const ey = BOARD_Y + eRow * cellH + tileGap;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fillRect(ex, ey, cellW - tileGap * 2, cellH - tileGap * 2);
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(ex, ey, cellW - tileGap * 2, cellH - tileGap * 2);
        ctx.restore();
      }

      const ANIM_MS = 115;
      slideAnimsRef.current = slideAnimsRef.current.filter((a) => now - a.startTime < ANIM_MS);

      const hoveredAdjMap = new Map<number, string>();
      const grabbedTileOffset = new Map<number, { ox: number; oy: number; color: string }>();

      hands.forEach((hand, hi) => {
        const color = HAND_COLORS[hi % HAND_COLORS.length];
        const hState = handPuzzleStatesRef.current.get(hand.id);

        if (hState && hState.grabbedTileVal !== null && hState.grabAxis) {
          const ox = hState.grabAxis === 'x' ? hState.grabProgress * hState.grabDir * cellW : 0;
          const oy = hState.grabAxis === 'y' ? hState.grabProgress * hState.grabDir * cellH : 0;
          grabbedTileOffset.set(hState.grabbedTileVal, { ox, oy, color });
        } else if (!solved && emptyIdx !== -1) {
          const cellIdx = findNearestAdjacentCell(hand.pinchCenter.x, hand.pinchCenter.y, size, emptyIdx);
          if (cellIdx !== null) {
            hoveredAdjMap.set(cellIdx, color);
          }
        }
      });

      const drawOrder: number[] = [];
      for (let i = 0; i < board.length; i++) {
        if (board[i] === emptyVal && !solved) continue;
        if (grabbedTileOffset.has(board[i])) continue;
        drawOrder.push(i);
      }
      for (let i = 0; i < board.length; i++) {
        if (board[i] === emptyVal && !solved) continue;
        if (grabbedTileOffset.has(board[i])) drawOrder.push(i);
      }

      drawOrder.forEach((idx) => {
        const tileVal = board[idx];
        const curRow = Math.floor(idx / size);
        const curCol = idx % size;
        const origRow = Math.floor(tileVal / size);
        const origCol = tileVal % size;

        let drawCol = curCol;
        let drawRow = curRow;

        const anim = slideAnimsRef.current.find((a) => a.tileVal === tileVal);
        if (anim) {
          const t = Math.min(1, (now - anim.startTime) / ANIM_MS);
          const ease = 1 - Math.pow(1 - t, 3);
          drawCol = anim.fromCol + (anim.toCol - anim.fromCol) * ease;
          drawRow = anim.fromRow + (anim.toRow - anim.fromRow) * ease;
        }

        const grab = grabbedTileOffset.get(tileVal);
        const dx = BOARD_X + drawCol * cellW + tileGap + (grab?.ox || 0);
        const dy = BOARD_Y + drawRow * cellH + tileGap + (grab?.oy || 0);
        const dw = cellW - tileGap * 2;
        const dh = cellH - tileGap * 2;

        const sliceCx0 = BOARD_X + origCol * cellW + tileGap;
        const sliceCy0 = BOARD_Y + origRow * cellH + tileGap;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(dx, dy, dw, dh, 6);
        ctx.clip();

        if (usePhotoSource && photoImg) {
          const sx = (sliceCx0 / CANVAS_W) * photoImg.width;
          const sy = (sliceCy0 / CANVAS_H) * photoImg.height;
          const sw = (dw / CANVAS_W) * photoImg.width;
          const sh = (dh / CANVAS_H) * photoImg.height;
          ctx.drawImage(photoImg, sx, sy, sw, sh, dx, dy, dw, dh);
        } else if (hasVideo && video && video.videoWidth > 0) {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const sx = vw * (1 - (sliceCx0 + dw) / CANVAS_W);
          const sy = vh * (sliceCy0 / CANVAS_H);
          const sw = vw * (dw / CANVAS_W);
          const sh = vh * (dh / CANVAS_H);
          ctx.save();
          ctx.translate(dx + dw, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
          ctx.restore();
        } else {
          const g = ctx.createLinearGradient(dx, dy, dx + dw, dy + dh);
          g.addColorStop(0, '#0f172a');
          g.addColorStop(1, '#1e293b');
          ctx.fillStyle = g;
          ctx.fillRect(dx, dy, dw, dh);
        }
        ctx.restore();

        const isCorrectSpot = tileVal === idx;
        const hoverColor = hoveredAdjMap.get(idx);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(dx, dy, dw, dh, 6);
        if (grab) {
          ctx.strokeStyle = grab.color;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 16;
          ctx.shadowColor = grab.color;
        } else if (hoverColor) {
          ctx.strokeStyle = hoverColor;
          ctx.lineWidth = 3.5;
          ctx.shadowBlur = 12;
          ctx.shadowColor = hoverColor;
        } else if (solved) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
        } else if (isCorrectSpot) {
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.72)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
          ctx.lineWidth = 1.5;
        }
        ctx.stroke();
        ctx.restore();

        if ((hoverColor || grab) && !solved) {
          const arrowDirX = Math.sign(eCol - curCol);
          const arrowDirY = Math.sign(eRow - curRow);
          const acx = dx + dw / 2;
          const acy = dy + dh / 2;
          ctx.save();
          ctx.fillStyle = grab ? grab.color : hoverColor || '#38bdf8';
          ctx.beginPath();
          ctx.arc(acx, acy, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#090d16';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const arrowChar =
            arrowDirX === 1 ? '→' : arrowDirX === -1 ? '←' : arrowDirY === 1 ? '↓' : '↑';
          ctx.fillText(arrowChar, acx, acy + 1);
          ctx.restore();
        }

        if (showPuzzleNumbersRef.current && !solved) {
          ctx.save();
          ctx.fillStyle = isCorrectSpot ? 'rgba(6, 78, 59, 0.85)' : 'rgba(9, 13, 22, 0.82)';
          ctx.beginPath();
          ctx.roundRect(dx + 6, dy + 6, 26, 22, 5);
          ctx.fill();
          ctx.strokeStyle = isCorrectSpot ? '#34d399' : 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = isCorrectSpot ? '#a7f3d0' : '#f8fafc';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(tileVal + 1), dx + 19, dy + 17.5);
          ctx.restore();
        }
      });

      if (showPuzzleRefRef.current && !solved) {
        const refW = 192;
        const refH = 108;
        const rx = BOARD_X + BOARD_W - refW - 10;
        const ry = BOARD_Y + 10;
        ctx.save();
        ctx.fillStyle = '#090d16';
        ctx.fillRect(rx - 3, ry - 3, refW + 6, refH + 6);
        if (usePhotoSource && photoImg) {
          ctx.drawImage(photoImg, rx, ry, refW, refH);
        } else if (hasVideo && video && video.readyState >= 2) {
          ctx.save();
          ctx.translate(rx + refW, ry);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, refW, refH);
          ctx.restore();
        }
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx, ry, refW, refH);
        ctx.restore();
      }

      // Render STRICTLY Thumb + Index Pinch Caliper Cursor
      hands.forEach((hand, hi) => {
        const { thumbTip, indexTip, pinchCenter } = hand;
        const hState = handPuzzleStatesRef.current.get(hand.id);
        const pinching = Boolean(hState?.isPinching);
        const hasGrab = Boolean(hState?.grabbedTileVal !== null);
        const color = HAND_COLORS[hi % HAND_COLORS.length];

        ctx.save();
        // Guide caliper between Thumb [4] and Index [8]
        ctx.strokeStyle = hasGrab ? '#4ade80' : pinching ? '#facc15' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = pinching ? 3 : 1.5;
        ctx.setLineDash(pinching ? [] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(thumbTip.x, thumbTip.y);
        ctx.lineTo(indexTip.x, indexTip.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Thumb Tip Dot & Index Tip Dot
        ctx.fillStyle = pinching ? '#facc15' : '#ffffff';
        ctx.beginPath();
        ctx.arc(thumbTip.x, thumbTip.y, pinching ? 6 : 4.5, 0, Math.PI * 2);
        ctx.arc(indexTip.x, indexTip.y, pinching ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Converging Pinch Target Ring at exact Midpoint
        ctx.shadowBlur = 14;
        ctx.shadowColor = hasGrab ? '#4ade80' : color;
        ctx.strokeStyle = hasGrab ? '#4ade80' : color;
        ctx.lineWidth = pinching ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.arc(pinchCenter.x, pinchCenter.y, pinching ? 11 : 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = hasGrab ? '#4ade80' : color;
        ctx.beginPath();
        ctx.arc(pinchCenter.x, pinchCenter.y, pinching ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    };

    const renderFrame = (now: number) => {
      rafId = requestAnimationFrame(renderFrame);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const hasVideo = Boolean(isCameraActiveRef.current && videoRef.current && videoRef.current.readyState >= 2);

      // Clean Live Mirrored Webcam Feed
      ctx.save();
      if (hasVideo && videoRef.current) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#090d18');
        bgGrad.addColorStop(0.5, '#111827');
        bgGrad.addColorStop(1, '#081426');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();

      const hands = trackedHandsRef.current.filter((th) => now - th.lastSeen < 380);

      if (boothModeRef.current === 'puzzle') {
        drawLivePuzzleBoard(ctx, hands, hasVideo, now);
      } else if (hands.length > 0) {
        const portals = buildThumbIndexPortals(hands);
        portals.forEach((shape, pIdx) => {
          const handFilterId =
            portals.length === 1
              ? activeFilterRef.current
              : handFiltersRef.current.get(shape.handId) ||
                PORTAL_FILTERS[pIdx % PORTAL_FILTERS.length].id;
          drawPortalEffect(ctx, shape, handFilterId, w, h, now);

          if (portals.length > 1) {
            const meta = PORTAL_FILTERS.find((f) => f.id === handFilterId);
            if (meta) {
              const label = `M${pIdx + 1}: ${meta.name}`;
              ctx.save();
              ctx.font = 'bold 11px sans-serif';
              const tw = ctx.measureText(label).width + 14;
              const lx = Math.max(8, Math.min(w - tw - 8, shape.cx - tw * 0.5));
              const ly = Math.max(44, shape.cy - shape.radius - 26);
              ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
              ctx.beginPath();
              ctx.roundRect(lx, ly, tw, 20, 6);
              ctx.fill();
              ctx.strokeStyle = meta.accent;
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.fillStyle = meta.accent;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, lx + tw * 0.5, ly + 10.5);
              ctx.restore();
            }
          }
        });
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const downloadDataUrl = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadPhotoStrip = async () => {
    if (photos.length < 2) return;
    const batch = photos.slice(0, Math.min(3, photos.length));
    const imgs = await Promise.all(
      batch.map(
        (ph) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = ph.dataUrl;
          })
      )
    );

    const w = imgs[0].width;
    const h = imgs[0].height;
    const strip = document.createElement('canvas');
    strip.width = w;
    strip.height = h * imgs.length + 52;
    const sctx = strip.getContext('2d');
    if (!sctx) return;

    sctx.fillStyle = '#090d16';
    sctx.fillRect(0, 0, strip.width, strip.height);
    imgs.forEach((img, idx) => {
      sctx.drawImage(img, 0, idx * h);
    });
    sctx.fillStyle = '#c084fc';
    sctx.font = 'bold 20px sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('CABINA DE FOTOS CV', strip.width / 2, strip.height - 18);

    downloadDataUrl(strip.toDataURL('image/png'), `tira-cabina-cv-${Date.now()}.png`);
  };

  const formatTimer = (sec: number) =>
    `${Math.floor(sec / 60)
      .toString()
      .padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  const currentFilterMeta = PORTAL_FILTERS.find((f) => f.id === activeFilter) || PORTAL_FILTERS[0];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4">
      {/* FULL-WIDTH CAMERA VIEWPORT (Clean, Simple, Uncluttered) */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl aspect-video">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          className={`w-full h-full block object-cover ${boothMode === 'puzzle' ? 'cursor-pointer' : ''}`}
        />

        {/* Shutter Flash */}
        {shutterFlash && <div className="absolute inset-0 bg-white z-30 pointer-events-none" />}

        {/* Countdown 3-2-1 Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-slate-950/25">
            <div className="w-28 h-28 rounded-full bg-slate-950/90 border-4 border-fuchsia-400 flex items-center justify-center shadow-2xl">
              <span className="font-display text-6xl font-black text-white">{countdown}</span>
            </div>
          </div>
        )}

        {/* Minimal Top Overlay Bar inside Camera */}
        {isCameraActive && (
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            <div className="bg-slate-950/88 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 flex items-center gap-2">
              {boothMode === 'puzzle' ? (
                <>
                  <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="tabular-nums">
                    Puzzle {puzzleSize}×{puzzleSize} · Mov: {puzzleMoves} · {formatTimer(puzzleSeconds)} ·{' '}
                    {handsCount > 0 ? 'Pellizca pulgar + índice sobre una ficha' : 'Muestra pulgar e índice'}
                  </span>
                </>
              ) : (
                <>
                  <Aperture className="w-3.5 h-3.5" style={{ color: currentFilterMeta.accent }} />
                  <span>
                    <strong style={{ color: currentFilterMeta.accent }}>{currentFilterMeta.name}</strong> ·{' '}
                    {peaceDetected
                      ? '✌️ ¡Paz detectada! Capturando...'
                      : handsCount > 0
                      ? `${handsCount} ${handsCount === 1 ? 'mano' : 'manos'} · Cierra/abre dedos = Filtro · ✌️ = Foto 3s`
                      : 'Cierra/abre dedos = Filtro · ✌️ (índice + corazón) = Foto 3s'}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {boothMode === 'puzzle' && (
                <button
                  onClick={() => setBoothMode('portals')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 text-xs font-extrabold transition shadow"
                >
                  <Aperture className="w-3.5 h-3.5" />
                  <span>Nueva Foto</span>
                </button>
              )}
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Detener</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Swap Toast */}
        {filterToast && boothMode === 'portals' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-1.5 rounded-xl bg-slate-950/92 border border-cyan-400/50 text-xs font-extrabold text-cyan-300 shadow-lg">
            ✨ Filtro Aleatorio: {filterToast}
          </div>
        )}

        {/* Puzzle Solved Overlay inside Camera */}
        {boothMode === 'puzzle' && puzzleSolved && (
          <div className="absolute inset-0 z-20 bg-slate-950/65 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-emerald-400/60 rounded-2xl p-6 text-center max-w-sm shadow-2xl">
              <Trophy className="w-10 h-10 text-amber-300 mx-auto mb-2" />
              <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-display font-bold text-xl mb-1">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡Puzzle Completado!</span>
              </div>
              <p className="text-xs text-slate-300 mb-4 tabular-nums">
                {puzzleSize}×{puzzleSize} resuelto en <strong>{puzzleMoves}</strong> movimientos ({formatTimer(puzzleSeconds)}).
              </p>
              <div className="flex gap-2">
                <button
                  onClick={reshufflePuzzle}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rejugar</span>
                </button>
                <button
                  onClick={() => setBoothMode('portals')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Aperture className="w-4 h-4" />
                  <span>Otra Foto</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Idle Start Prompt inside Camera */}
        {!isCameraActive && !(boothMode === 'puzzle' && puzzleSourceMode === 'photo' && puzzlePhoto) && (
          <div className="absolute inset-0 z-20 bg-slate-950/82 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-cyan-500 flex items-center justify-center mb-4 shadow-xl">
              {boothMode === 'puzzle' ? (
                <Grid3X3 className="w-8 h-8 text-slate-950" />
              ) : (
                <Aperture className="w-8 h-8 text-slate-950" />
              )}
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-2">
              {boothMode === 'puzzle' ? 'Sliding Puzzle en Cámara' : 'Cabina Fotográfica CV'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-5 leading-relaxed">
              {boothMode === 'puzzle'
                ? 'Pellizca y desliza las piezas en tiempo real con tu pulgar e índice sobre la cámara.'
                : 'Cierra y abre pulgar e índice para cambiar de filtro al azar. Levanta índice y corazón en V (✌️) para foto en 3s y jugar Sliding Puzzle al instante.'}
            </p>
            {cameraError && (
              <p className="text-xs text-rose-300 bg-rose-950/80 border border-rose-500/40 px-4 py-2 rounded-xl mb-4">
                {cameraError}
              </p>
            )}
            <button
              onClick={startCamera}
              disabled={cameraLoading}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 font-extrabold text-sm shadow-lg hover:brightness-110 active:scale-95 transition"
            >
              <CameraIcon className="w-4 h-4" />
              <span>{cameraLoading ? 'Conectando Cámara...' : 'Encender Cámara'}</span>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CABINA FOTOGRÁFICA DOCK & PHOTO STRIP */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 space-y-4">
        {/* Compact Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          {/* Mode Switch */}
          <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
            <button
              onClick={() => setBoothMode('portals')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                boothMode === 'portals' ? 'bg-fuchsia-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Aperture className="w-4 h-4" />
              <span>Cabina Filtros</span>
            </button>
            <button
              onClick={switchToLivePuzzleMode}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                boothMode === 'puzzle' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Sliding Puzzle CV</span>
            </button>
          </div>

          {/* Contextual Controls */}
          {boothMode === 'portals' ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAutoRandomFilter(!autoRandomFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                  autoRandomFilter
                    ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40'
                    : 'bg-slate-950 text-slate-300 border-slate-700'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{autoRandomFilter ? 'Auto-Timer: Sí' : 'Gesto Dedos: Activo'}</span>
              </button>

              <button
                onClick={() => setActiveFilter((prev) => pickNextRandomFilter(prev))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition whitespace-nowrap"
              >
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filtro Aleatorio</span>
              </button>

              {isCameraActive && (
                <>
                  <button
                    onClick={triggerCountdownCapture}
                    disabled={countdown !== null}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition whitespace-nowrap"
                  >
                    <CameraIcon className="w-4 h-4" />
                    <span>✌️ Foto 3s + Puzzle</span>
                  </button>
                  <button
                    onClick={snapPhotoNow}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 active:scale-95 transition whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Captura Instantánea</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
                {([3, 4, 5, 6] as PuzzleGridSize[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => changePuzzleSize(sz)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition ${
                      puzzleSize === sz
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {sz}×{sz}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setPuzzleSourceMode('live');
                  puzzleSourceModeRef.current = 'live';
                }}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                  puzzleSourceMode === 'live'
                    ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-400'
                    : 'bg-slate-950 text-slate-300 border-slate-700'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Cámara Vivo</span>
              </button>

              <button
                onClick={() => setShowPuzzleNumbers(!showPuzzleNumbers)}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap ${
                  showPuzzleNumbers
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700'
                }`}
              >
                {showPuzzleNumbers ? 'Números: Sí' : 'Números: No'}
              </button>

              <button
                onClick={() => setShowPuzzleRef(!showPuzzleRef)}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap ${
                  showPuzzleRef
                    ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700'
                }`}
              >
                {showPuzzleRef ? 'Guía: Sí' : 'Ver Guía'}
              </button>

              <button
                onClick={reshufflePuzzle}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition whitespace-nowrap"
              >
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mezclar</span>
              </button>
            </div>
          )}
        </div>

        {/* Compact Trending Lens Strip in Portals Mode */}
        {boothMode === 'portals' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PORTAL_FILTERS.map((f) => {
              const selected = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveFilter(f.id);
                    activeFilterRef.current = f.id;
                    if (trackedHandsRef.current.length > 0) {
                      handFiltersRef.current.set(trackedHandsRef.current[0].id, f.id);
                    }
                    setAutoRandomFilter(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition whitespace-nowrap shrink-0 ${
                    selected
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  style={selected ? { borderColor: f.accent, color: f.accent } : undefined}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Photo Strip Gallery */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display text-sm font-bold text-white">
                Cabina Fotográfica · Tus Fotos ({photos.length})
              </h3>
            </div>
            {photos.length >= 2 && (
              <button
                onClick={downloadPhotoStrip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/40 text-xs font-bold text-fuchsia-200 transition"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Descargar Tira ({Math.min(3, photos.length)})</span>
              </button>
            )}
          </div>

          {photos.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              Enciende la cámara, abre tu pulgar e índice para los filtros aleatorios y toma fotos aquí abajo o juega Sliding Puzzle directo en la cámara.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((ph) => (
                <div
                  key={ph.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
                >
                  <button
                    onClick={() => setSelectedPhoto(ph)}
                    className="aspect-video w-full overflow-hidden bg-slate-900"
                  >
                    <img src={ph.dataUrl} alt={ph.filterLabel} className="w-full h-full object-cover" />
                  </button>
                  <div className="px-2.5 py-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-300 font-semibold truncate">{ph.filterLabel}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => downloadDataUrl(ph.dataUrl, `cabina-cv-${ph.id}.png`)}
                          className="p-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 transition"
                          title="Descargar PNG"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPhotos((prev) => prev.filter((item) => item.id !== ph.id))}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => startPuzzleWithPhoto(ph)}
                      className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center gap-1.5 hover:brightness-110 transition active:scale-95"
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      <span>Jugar Puzzle en Cámara</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Photo Preview */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl"
          >
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.filterLabel}
              className="w-full h-auto rounded-xl mb-3"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-300">
                {selectedPhoto.filterLabel} · {selectedPhoto.timestamp}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const ph = selectedPhoto;
                    setSelectedPhoto(null);
                    startPuzzleWithPhoto(ph);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs"
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Jugar Puzzle en Cámara</span>
                </button>
                <button
                  onClick={() => downloadDataUrl(selectedPhoto.dataUrl, `cabina-cv-${selectedPhoto.id}.png`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PNG</span>
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
