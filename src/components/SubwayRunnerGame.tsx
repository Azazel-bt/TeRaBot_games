import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as mpPose from '@mediapipe/pose';
import type { Results as PoseResults, NormalizedLandmark } from '@mediapipe/pose';
import * as mpCamera from '@mediapipe/camera_utils';
import {
  Award,
  Camera as CameraIcon,
  Crosshair,
  Gauge,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Magnet,
  Swords,
  BookOpen,
  Flame,
  Snowflake,
  X,
  Coins,
  Hammer,
  CheckCircle2,
} from 'lucide-react';
import { RunnerLane, RunnerPosture, RunnerPowerUpType } from '../types';
import { runnerAudio } from '../utils/runnerAudio';
import { createExtrudedLetterGeometry } from '../utils/letter3dGeometry';
import {
  createEnvironmentSegmentGroups,
  ENVIRONMENT_ORDER,
  ENVIRONMENT_THEMES,
  EnvironmentThemeId,
} from '../utils/runnerEnvironments';
import {
  BOSS_CONFIGS,
  BuiltBossRig,
  createBossObstacleMesh,
  createBossRig,
} from '../utils/runnerBosses';
import {
  ARM_POWERS,
  ArmHand,
  BOXING_COMBOS,
  BoxingComboDef,
  matchBoxingCombo,
  OVERDRIVE_CONFIG,
  POWER_METER_MAX,
} from '../utils/runnerCombos';
import { NightcoreBankModal } from './NightcoreBankModal';

interface SubwayRunnerGameProps {
  onScoreUpdate: (score: number) => void;
  soundEnabled: boolean;
  highScore: number;
  onResetHighScore: () => void;
}

type RunnerGameState = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface ObstacleEntity {
  id: number;
  kind: 'low' | 'high' | 'train';
  lane: RunnerLane;
  z: number;
  speedOffset: number;
  width: number;
  height: number;
  depth: number;
  bottomY: number;
  hasRamp?: boolean;
  rampLength?: number;
  thrown?: {
    startX: number;
    startY: number;
    startZ: number;
    targetX: number;
    landZ: number;
    arcHeight: number;
  };
  mesh: THREE.Group;
  passed: boolean;
}

interface CoinEntity {
  id: number;
  lane: RunnerLane;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  mesh: THREE.Mesh;
}

interface LetterEntity {
  id: number;
  char: string;
  letterIndex: number;
  lane: RunnerLane;
  x: number;
  y: number;
  baseY: number;
  z: number;
  mesh: THREE.Group;
  letterMesh: THREE.Mesh;
  outerRing: THREE.Mesh;
  letterMat: THREE.MeshStandardMaterial;
  ringMat: THREE.MeshBasicMaterial;
}

interface PowerUpEntity {
  id: number;
  type: RunnerPowerUpType;
  lane: RunnerLane;
  y: number;
  z: number;
  collected: boolean;
  mesh: THREE.Group;
}

interface Particle3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface PunchProjectile {
  id: number;
  lane: RunnerLane;
  x: number;
  y: number;
  z: number;
  speed: number;
  damage: number;
  breaksObstacles: boolean;
  shattersShield: boolean;
  slowsBoss: boolean;
  isOverdrive: boolean;
  airborne: boolean;
  hand: ArmHand;
  comboId: BoxingComboDef['id'] | null;
  mesh: THREE.Group;
  orbMat: THREE.MeshBasicMaterial;
  ringMat: THREE.MeshBasicMaterial;
}

const LANE_WIDTH = 2.8;
const LANE_POSITIONS: Record<RunnerLane, number> = {
  '-1': -LANE_WIDTH,
  '0': 0,
  '1': LANE_WIDTH,
};

const BASE_SPEED = 14.5;
const DEFAULT_MAX_SPEED_MULTIPLIER = 1.6;
const GRAVITY = -36;
const JUMP_VELOCITY = 15.2;
const DUCK_DURATION = 0.68;
const TRAIN_ROOF_Y = 2.25;
const RAMP_LENGTH = 4.0;
const BOSS_BASE_Z = -48.0;
const BOSS_BASE_Y = 6.2;
const BOSS_COLOSSAL_SCALE = 3.85;
const BOSS_INTRO_DURATION = 2.8;
const LEVEL_WORDS = ['UIS', 'ERA', 'CEMOS', 'METRO', 'RUNNER'];

type CraftedElementId = 'cryo_shield' | 'turbo_magnet' | 'power_core';

interface CraftedElementDef {
  id: CraftedElementId;
  hotkey: '1' | '2' | '3';
  name: string;
  shortName: string;
  cost: number;
  color: string;
  description: string;
}

const CRAFTED_ELEMENTS: CraftedElementDef[] = [
  {
    id: 'cryo_shield',
    hotkey: '1',
    name: 'Escudo Criogénico',
    shortName: 'Escudo',
    cost: 10,
    color: '#10b981',
    description: 'Te protege de 1 choque y congela al Jefe durante 4s.',
  },
  {
    id: 'turbo_magnet',
    hotkey: '2',
    name: 'Imán Dorado x2',
    shortName: 'Imán x2',
    cost: 15,
    color: '#06b6d4',
    description: 'Atrae monedas y letras 10s con multiplicador x2 de puntaje.',
  },
  {
    id: 'power_core',
    hotkey: '3',
    name: 'Núcleo de Poder +250',
    shortName: 'Núcleo +250',
    cost: 20,
    color: '#facc15',
    description: 'Carga +250 en la Barra de Poder y destruye obstáculos cercanos.',
  },
];

const COIN_WALLET_STORAGE_KEY = 'metrorunner_coin_wallet';
const CRAFTED_ITEMS_STORAGE_KEY = 'metrorunner_crafted_items';
const COMBO_WINDOW_SEC = 1.45;

function getNextComboHint(history: ArmHand[]): {
  label: string;
  nextHand: ArmHand | null;
} {
  if (history.length === 0) {
    return { label: 'Alterna IZQ → DER para combos (+35 a +120 ⚡)', nextHand: 'left' };
  }
  const seq = history.join(',');
  if (seq === 'left') {
    return { label: 'Sigue DER → 1-2 (+35⚡) · o IZQ → Demoledor', nextHand: 'right' };
  }
  if (seq === 'left,right') {
    return { label: 'Sigue IZQ → DER → Ráfaga Campeón (+120⚡)', nextHand: 'left' };
  }
  if (seq === 'left,right,left') {
    return { label: '¡Falta 1 DER → Ráfaga Campeón (+120⚡)!', nextHand: 'right' };
  }
  if (seq === 'left,left') {
    return { label: '¡Falta 1 DER → Demoledor (+65⚡)!', nextHand: 'right' };
  }
  if (seq === 'right') {
    return { label: 'Sigue DER → IZQ → Martillo (+75⚡)', nextHand: 'right' };
  }
  if (seq === 'right,right') {
    return { label: '¡Falta 1 IZQ → Martillo Escudos (+75⚡)!', nextHand: 'left' };
  }
  return { label: 'Sigue golpeando para cargar x10', nextHand: history[history.length - 1] === 'left' ? 'right' : 'left' };
}

// Smooth RGB cycling across Gold (#facc15) -> Orange (#f97316) -> Green (#22c55e)
function sampleGoldOrangeGreenRgb(phase: number): [number, number, number] {
  const stops: Array<[number, number, number]> = [
    [250, 204, 21], // Gold
    [249, 115, 22], // Orange
    [34, 197, 94],  // Emerald Green
  ];
  const t = ((phase % 1) + 1) % 1;
  const scaled = t * stops.length;
  const i = Math.floor(scaled) % stops.length;
  const j = (i + 1) % stops.length;
  const frac = scaled - Math.floor(scaled);
  return [
    Math.round(stops[i][0] + (stops[j][0] - stops[i][0]) * frac),
    Math.round(stops[i][1] + (stops[j][1] - stops[i][1]) * frac),
    Math.round(stops[i][2] + (stops[j][2] - stops[i][2]) * frac),
  ];
}

export const SubwayRunnerGame: React.FC<SubwayRunnerGameProps> = ({
  onScoreUpdate,
  soundEnabled,
  highScore,
  onResetHighScore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);

  // Game UI State
  const [gameState, setGameState] = useState<RunnerGameState>('READY');
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [speedFactor, setSpeedFactor] = useState<number>(1.0);
  const [maxSpeedMultiplier, setMaxSpeedMultiplier] = useState<number>(DEFAULT_MAX_SPEED_MULTIPLIER);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  // Power-ups & Level Word HUD state
  const [activeShield, setActiveShield] = useState<boolean>(false);
  const [magnetRemaining, setMagnetRemaining] = useState<number>(0);
  const [multiplierRemaining, setMultiplierRemaining] = useState<number>(0);
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [currentEnv, setCurrentEnv] = useState<EnvironmentThemeId>(ENVIRONMENT_ORDER[0]);
  const [currentWord, setCurrentWord] = useState<string>(LEVEL_WORDS[0]);
  const [collectedMask, setCollectedMask] = useState<boolean[]>(() =>
    Array(LEVEL_WORDS[0].length).fill(false)
  );
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [rgbPhase, setRgbPhase] = useState<number>(0);

  // Boss Battle HUD state (triggers every 3 levels)
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossIntroActive, setBossIntroActive] = useState<boolean>(false);
  const [bossIntroHeadline, setBossIntroHeadline] = useState<string>('');
  const [bossWeaknessBadge, setBossWeaknessBadge] = useState<string>('');
  const [bossWeaknessHint, setBossWeaknessHint] = useState<string>('');
  const [bossDangerWarning, setBossDangerWarning] = useState<string>('');
  const [bossName, setBossName] = useState<string>('');
  const [bossTitle, setBossTitle] = useState<string>('');
  const [bossHp, setBossHp] = useState<number>(0);
  const [bossMaxHp, setBossMaxHp] = useState<number>(400);
  const [bossShielded, setBossShielded] = useState<boolean>(false);
  const [bossEnraged, setBossEnraged] = useState<boolean>(false);
  const [bossStaggered, setBossStaggered] = useState<boolean>(false);
  const [bossTelegraphLane, setBossTelegraphLane] = useState<RunnerLane | null>(null);
  const [bossPrompt, setBossPrompt] = useState<string>('');
  const [bossAccentColor, setBossAccentColor] = useState<string>('#38bdf8');
  const [punchFlashLabel, setPunchFlashLabel] = useState<string | null>(null);

  // Boxing Combos, Arm Powers & Power Bar (Overdrive x10) State
  const [powerMeter, setPowerMeter] = useState<number>(0);
  const [overdriveActive, setOverdriveActive] = useState<boolean>(false);
  const [overdriveRemaining, setOverdriveRemaining] = useState<number>(0);
  const [comboSequence, setComboSequence] = useState<ArmHand[]>([]);
  const [comboWindowPct, setComboWindowPct] = useState<number>(0);
  const [fistCharge, setFistCharge] = useState<{ left: number; right: number }>({ left: 0, right: 0 });
  const [activeComboName, setActiveComboName] = useState<string | null>(null);
  const [showComboMenu, setShowComboMenu] = useState<boolean>(false);
  const showComboMenuRef = useRef<boolean>(false);
  const pausedForComboMenuRef = useRef<boolean>(false);
  const [practicedCombos, setPracticedCombos] = useState<Record<string, boolean>>({});
  const [practiceFeedMsg, setPracticeFeedMsg] = useState<string | null>(null);

  // Coin Bank & Crafted Elements ("Elementos Creados")
  const [coinWallet, setCoinWallet] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(COIN_WALLET_STORAGE_KEY);
      return saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });
  const [craftedInventory, setCraftedInventory] = useState<Record<CraftedElementId, number>>(() => {
    try {
      const saved = localStorage.getItem(CRAFTED_ITEMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          cryo_shield: Math.max(0, Number(parsed.cryo_shield) || 0),
          turbo_magnet: Math.max(0, Number(parsed.turbo_magnet) || 0),
          power_core: Math.max(0, Number(parsed.power_core) || 0),
        };
      }
    } catch {
      // ignore storage errors
    }
    return { cryo_shield: 1, turbo_magnet: 0, power_core: 0 };
  });
  const [showCraftMenu, setShowCraftMenu] = useState<boolean>(false);
  const pausedForCraftMenuRef = useRef<boolean>(false);
  const [showMusicBank, setShowMusicBank] = useState<boolean>(false);
  const pausedForMusicBankRef = useRef<boolean>(false);

  // CV Pose Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [poseDetected, setPoseDetected] = useState<boolean>(false);
  const [cvSensitivityHigh, setCvSensitivityHigh] = useState<boolean>(true);
  const [punchZThreshold, setPunchZThreshold] = useState<number>(0.30);
  const [showCvPreview, setShowCvPreview] = useState<boolean>(true);
  const [cvActionLabel, setCvActionLabel] = useState<string>('Centro');
  const [cvCalibrationStatus, setCvCalibrationStatus] = useState<'idle' | 'calibrating' | 'ready'>('idle');

  // Mutable Refs for 60fps Three.js loop
  const gameStateRef = useRef<RunnerGameState>('READY');
  const scoreRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);
  const coinsRef = useRef<number>(0);
  const coinWalletRef = useRef<number>(coinWallet);
  const craftedInventoryRef = useRef<Record<CraftedElementId, number>>(craftedInventory);
  const speedRef = useRef<number>(BASE_SPEED);
  const speedTierRef = useRef<number>(0);
  const maxSpeedMultiplierRef = useRef<number>(DEFAULT_MAX_SPEED_MULTIPLIER);

  const levelIdxRef = useRef<number>(0);
  const currentEnvRef = useRef<EnvironmentThemeId>(ENVIRONMENT_ORDER[0]);
  const collectedMaskRef = useRef<boolean[]>(Array(LEVEL_WORDS[0].length).fill(false));
  const waveCounterRef = useRef<number>(0);
  const bannerTimerRef = useRef<number>(0);

  // Boss & Punch Mutable Refs
  const bossActiveRef = useRef<boolean>(false);
  const bossThemeRef = useRef<EnvironmentThemeId>(ENVIRONMENT_ORDER[0]);
  const bossCycleRef = useRef<number>(0);
  const bossLaneRef = useRef<RunnerLane>(0);
  const bossXRef = useRef<number>(0);
  const bossZRef = useRef<number>(BOSS_BASE_Z);
  const bossRecoilRef = useRef<number>(0);
  const bossIntroTimerRef = useRef<number>(0);
  const bossTelegraphTimerRef = useRef<number>(0);
  const bossTelegraphLaneRef = useRef<RunnerLane | null>(null);
  const bossStaggerTimerRef = useRef<number>(0);
  const bossEnragedRef = useRef<boolean>(false);
  const bossHpRef = useRef<number>(0);
  const bossMaxHpRef = useRef<number>(400);
  const bossShieldedRef = useRef<boolean>(false);
  const bossMoveTimerRef = useRef<number>(0);
  const bossAttackTimerRef = useRef<number>(0);
  const bossSpecialTimerRef = useRef<number>(0);
  const bossHitFlashRef = useRef<number>(0);
  const bossSlowTimerRef = useRef<number>(0);
  const doublePunchTimerRef = useRef<number>(0);
  const doublePunchCountRef = useRef<number>(0);
  const leftPunchAnimRef = useRef<number>(0);
  const rightPunchAnimRef = useRef<number>(0);
  const lastLeftPunchAtRef = useRef<number>(0);
  const lastRightPunchAtRef = useRef<number>(0);
  const punchFlashTimerRef = useRef<number>(0);

  // Boxing Combo & Power Bar Mutable Refs
  const powerMeterRef = useRef<number>(0);
  const overdriveActiveRef = useRef<boolean>(false);
  const overdriveTimerRef = useRef<number>(0);
  const comboHistoryRef = useRef<ArmHand[]>([]);
  const comboWindowTimerRef = useRef<number>(0);
  const comboNameTimerRef = useRef<number>(0);
  const fistChargeRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });

  const playerLaneRef = useRef<RunnerLane>(0);
  const playerXRef = useRef<number>(0);
  const playerYRef = useRef<number>(0);
  const playerVyRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  const duckTimerRef = useRef<number>(0);
  const rollSpinRef = useRef<number>(0);
  const runCycleRef = useRef<number>(0);
  const invulnTimerRef = useRef<number>(0);
  const shakeTimerRef = useRef<number>(0);

  const shieldActiveRef = useRef<boolean>(false);
  const magnetTimerRef = useRef<number>(0);
  const multiplierTimerRef = useRef<number>(0);

  // Pose CV Refs
  const mpPoseRef = useRef<mpPose.Pose | null>(null);
  const mpCameraRef = useRef<mpCamera.Camera | null>(null);
  const isProcessingPoseRef = useRef<boolean>(false);
  const isCameraActiveRef = useRef<boolean>(false);
  const cvSensitivityRef = useRef<boolean>(true);
  const punchZThresholdRef = useRef<number>(0.30);
  const showCvPreviewRef = useRef<boolean>(true);

  const baselineSamplesRef = useRef<Array<{ x: number; y: number }>>([]);
  const baselineRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedCvRef = useRef<{ x: number; y: number } | null>(null);
  const prevBodyYRef = useRef<number | null>(null);
  const prevWristsRef = useRef<{
    left: { relX: number; relY: number; smoothedNormZ: number; smoothedSpan: number; extended: boolean } | null;
    right: { relX: number; relY: number; smoothedNormZ: number; smoothedSpan: number; extended: boolean } | null;
  }>({ left: null, right: null });
  const lastJumpTriggerRef = useRef<number>(0);
  const lastDuckTriggerRef = useRef<number>(0);
  const lastCvLaneRef = useRef<RunnerLane>(0);
  const currentPostureRef = useRef<RunnerPosture>('neutral');
  const initialSeedNeededRef = useRef<boolean>(false);
  const onScoreUpdateRef = useRef(onScoreUpdate);

  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onScoreUpdate]);

  // Touch swipe ref
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Three.js scene objects refs
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    runnerGroup: THREE.Group;
    torsoGroup: THREE.Group;
    headGroup: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    shadowMesh: THREE.Mesh;
    shieldMesh: THREE.Mesh;
    magnetRing: THREE.Mesh;
    overdriveMesh: THREE.Mesh;
    trackSegments: THREE.Group[];
    obstacles: ObstacleEntity[];
    coins: CoinEntity[];
    letters: LetterEntity[];
    powerUps: PowerUpEntity[];
    particles: Particle3D[];
    punchProjectiles: PunchProjectile[];
    bossRig: BuiltBossRig | null;
    entityIdCounter: number;
    nextSpawnZ: number;
    coinGeo: THREE.CylinderGeometry;
    coinMat: THREE.MeshStandardMaterial;
    particleGeo: THREE.BoxGeometry;
    punchOrbGeo: THREE.SphereGeometry;
    punchRingGeo: THREE.TorusGeometry;
    letterGeoCache: Map<string, THREE.ExtrudeGeometry>;
    letterRingGeo: THREE.TorusGeometry;
    applyEnvironment: (themeId: EnvironmentThemeId) => void;
  } | null>(null);

  // Sync audio preferences
  useEffect(() => {
    runnerAudio.setSoundEnabled(soundEnabled);
    if (!soundEnabled) {
      runnerAudio.stopMusic();
    } else if (gameStateRef.current === 'PLAYING' && musicEnabled) {
      runnerAudio.startMusic();
    }
  }, [soundEnabled, musicEnabled]);

  useEffect(() => {
    runnerAudio.setMusicEnabled(musicEnabled);
    if (musicEnabled && soundEnabled && gameStateRef.current === 'PLAYING') {
      runnerAudio.startMusic();
    } else if (!musicEnabled) {
      runnerAudio.stopMusic();
    }
  }, [musicEnabled, soundEnabled]);

  useEffect(() => {
    cvSensitivityRef.current = cvSensitivityHigh;
  }, [cvSensitivityHigh]);

  useEffect(() => {
    punchZThresholdRef.current = punchZThreshold;
  }, [punchZThreshold]);

  useEffect(() => {
    showCvPreviewRef.current = showCvPreview;
  }, [showCvPreview]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    showComboMenuRef.current = showComboMenu;
  }, [showComboMenu]);

  // Keep combo sequence decay & fist charge responsive while practicing before starting the game
  useEffect(() => {
    if (!showComboMenu || gameState === 'PLAYING') return;
    const interval = window.setInterval(() => {
      const dt = 0.05;
      if (leftPunchAnimRef.current > 0) leftPunchAnimRef.current = Math.max(0, leftPunchAnimRef.current - dt);
      if (rightPunchAnimRef.current > 0) rightPunchAnimRef.current = Math.max(0, rightPunchAnimRef.current - dt);
      if (!isCameraActiveRef.current) {
        fistChargeRef.current.left = Math.round((leftPunchAnimRef.current / 0.28) * 100);
        fistChargeRef.current.right = Math.round((rightPunchAnimRef.current / 0.28) * 100);
      }
      if (comboWindowTimerRef.current > 0) {
        comboWindowTimerRef.current = Math.max(0, comboWindowTimerRef.current - dt);
        setComboWindowPct(Math.round((comboWindowTimerRef.current / COMBO_WINDOW_SEC) * 100));
        if (comboWindowTimerRef.current === 0 && comboHistoryRef.current.length > 0) {
          comboHistoryRef.current = [];
          setComboSequence([]);
          setComboWindowPct(0);
        }
      }
      if (comboNameTimerRef.current > 0) {
        comboNameTimerRef.current = Math.max(0, comboNameTimerRef.current - dt);
        if (comboNameTimerRef.current === 0) {
          setActiveComboName(null);
        }
      }
      setFistCharge({
        left: Math.round(fistChargeRef.current.left),
        right: Math.round(fistChargeRef.current.right),
      });
    }, 50);
    return () => window.clearInterval(interval);
  }, [showComboMenu, gameState]);

  useEffect(() => {
    maxSpeedMultiplierRef.current = maxSpeedMultiplier;
  }, [maxSpeedMultiplier]);

  // Stop music on unmount
  useEffect(() => {
    return () => {
      runnerAudio.stopMusic();
    };
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial
    }
  }, []);

  // Player Movement Actions
  const moveLane = useCallback((direction: -1 | 1) => {
    if (gameStateRef.current !== 'PLAYING') return;
    const next = Math.max(-1, Math.min(1, playerLaneRef.current + direction)) as RunnerLane;
    if (next !== playerLaneRef.current) {
      playerLaneRef.current = next;
      runnerAudio.playLaneSwitch();
    }
  }, []);

  const setLaneDirect = useCallback((targetLane: RunnerLane) => {
    if (gameStateRef.current !== 'PLAYING') return;
    if (targetLane !== playerLaneRef.current) {
      playerLaneRef.current = targetLane;
      runnerAudio.playLaneSwitch();
    }
  }, []);

  const triggerJump = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    if (!isJumpingRef.current && playerYRef.current <= 0.08) {
      playerVyRef.current = JUMP_VELOCITY;
      isJumpingRef.current = true;
      duckTimerRef.current = 0;
      rollSpinRef.current = 0;
      runnerAudio.playJump();

      // Spawn dust puff particles at feet
      if (threeRef.current) {
        const t = threeRef.current;
        for (let i = 0; i < 8; i++) {
          const mat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 });
          const mesh = new THREE.Mesh(t.particleGeo, mat);
          mesh.position.set(playerXRef.current + (Math.random() - 0.5) * 0.6, 0.15, 0.2);
          mesh.scale.setScalar(0.9);
          t.scene.add(mesh);
          t.particles.push({
            mesh,
            vx: (Math.random() - 0.5) * 3.5,
            vy: 1.5 + Math.random() * 2.5,
            vz: 2 + Math.random() * 2,
            life: 0,
            maxLife: 0.4,
          });
        }
      }
    }
  }, []);

  // Spawn 3D Particle Burst
  const spawnBurst = useCallback((x: number, y: number, z: number, colorHex: number, count: number) => {
    const t = threeRef.current;
    if (!t) return;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(t.particleGeo, mat);
      mesh.position.set(x, y, z);
      t.scene.add(mesh);
      t.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 8,
        vy: 2 + Math.random() * 6,
        vz: (Math.random() - 0.5) * 8,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
      });
    }
  }, []);

  const triggerDuck = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    // Fast-fall if mid-air, otherwise roll/slide under barriers
    if (isJumpingRef.current && playerYRef.current > 0.2) {
      playerVyRef.current = Math.min(playerVyRef.current, -24);
    }
    if (duckTimerRef.current <= 0.15) {
      runnerAudio.playRoll();
    }
    duckTimerRef.current = DUCK_DURATION;
    rollSpinRef.current = 0;

    // Special Boss Action ('duck_break' in Factory Fire Boss): Ducking shatters its Thermal Shield!
    if (
      bossActiveRef.current &&
      bossShieldedRef.current &&
      BOSS_CONFIGS[bossThemeRef.current].specialAction === 'duck_break'
    ) {
      bossShieldedRef.current = false;
      bossSpecialTimerRef.current = 5.5;
      setBossShielded(false);
      setBossPrompt(BOSS_CONFIGS[bossThemeRef.current].defaultPrompt);
      setBannerMessage('¡Escudo Térmico ENFRIADO! ¡Golpea con PUÑOS ahora!');
      bannerTimerRef.current = 2.2;
      runnerAudio.playShieldBreak();
      spawnBurst(bossXRef.current, BOSS_BASE_Y, bossZRef.current, 0x38bdf8, 28);
    }
  }, [spawnBurst]);

  const triggerPunch = useCallback(
    (hand: ArmHand) => {
      const isPlaying = gameStateRef.current === 'PLAYING';
      const isPractice = !isPlaying && showComboMenuRef.current;
      if (!isPlaying && !isPractice) return;

      const armCfg = ARM_POWERS[hand];
      if (hand === 'left') {
        leftPunchAnimRef.current = 0.28;
        runnerAudio.playPunchLeft();
      } else {
        rightPunchAnimRef.current = 0.28;
        runnerAudio.playPunchRight();
      }

      // 1. Update Rolling Boxing Combo Sequence (1.45s combo window for physical CV punches)
      const nextHist = [...comboHistoryRef.current, hand].slice(-4);
      comboHistoryRef.current = nextHist;
      comboWindowTimerRef.current = COMBO_WINDOW_SEC;
      setComboWindowPct(100);
      fistChargeRef.current[hand] = 100;
      setFistCharge({
        left: Math.round(fistChargeRef.current.left),
        right: Math.round(fistChargeRef.current.right),
      });

      const { combo, shouldResetBuffer } = matchBoxingCombo(nextHist);
      if (shouldResetBuffer) {
        comboHistoryRef.current = [];
        setComboSequence([]);
      } else {
        setComboSequence(nextHist);
      }

      // 2. Charge Power Bar (Overdrive x10 when reaching 100%)
      let gain = armCfg.powerGain;
      if (combo) {
        gain = combo.powerCharge;
        if (isPlaying) {
          scoreRef.current += combo.bonusScore;
        }
        runnerAudio.playComboTrigger();
        setActiveComboName(
          combo.breaksObstacles ? `${combo.name} · ¡ROMPE OBSTÁCULOS!` : combo.name
        );
        comboNameTimerRef.current = 1.75;
        setPunchFlashLabel(`¡${combo.name.toUpperCase()}!`);
        if (isPractice) {
          setPracticedCombos((prev) => ({ ...prev, [combo.id]: true }));
          setPracticeFeedMsg(`¡Combo ejecutado: ${combo.name} (+${combo.powerCharge} Poder)!`);
        }
      } else {
        setPunchFlashLabel(hand === 'left' ? '¡BOLA DE NIEVE!' : '¡BOLA DE FUEGO!');
        if (isPractice) {
          setPracticeFeedMsg(
            hand === 'left'
              ? 'Jab IZQ (Nieve) detectado · Sigue la cadena antes que termine el tiempo'
              : 'Recto DER (Fuego) detectado · Sigue la cadena antes que termine el tiempo'
          );
        }
      }
      punchFlashTimerRef.current = 0.55;

      if (!overdriveActiveRef.current) {
        const nextMeter = Math.min(POWER_METER_MAX, powerMeterRef.current + gain);
        powerMeterRef.current = nextMeter;
        setPowerMeter(Math.round(nextMeter));

        if (nextMeter >= POWER_METER_MAX) {
          if (isPractice) {
            runnerAudio.playOverdriveActivate();
            setPracticeFeedMsg('¡UMBRAL 1,000 ALCANZADO! Así se activa Invulnerabilidad + Daño x10.');
            powerMeterRef.current = 0;
            setPowerMeter(0);
          } else {
            overdriveActiveRef.current = true;
            overdriveTimerRef.current = OVERDRIVE_CONFIG.durationSec;
            setOverdriveActive(true);
            setOverdriveRemaining(OVERDRIVE_CONFIG.durationSec);
            runnerAudio.playOverdriveActivate();
            setBannerMessage('¡PODER SUPREMO x10! INMORTAL · DAÑO x10 · ROMPE OBSTÁCULOS');
            bannerTimerRef.current = 3.2;
            spawnBurst(playerXRef.current, playerYRef.current + 1.1, 0, 0xfacc15, 30);
          }
        }
      }

      if (isPractice) return;

      const t = threeRef.current;
      if (!t) return;

      const isOverdrive = overdriveActiveRef.current;
      const lane = playerLaneRef.current;
      const py = playerYRef.current + 1.15;
      const airborne = playerYRef.current > 0.35;

      const projDamage = combo ? combo.damage : armCfg.baseDamage;
      const projSpeed = combo ? 94 : armCfg.projectileSpeed;
      const breaksObstacles = Boolean(combo?.breaksObstacles || isOverdrive);
      const shattersShield = Boolean(combo?.shattersShield || isOverdrive);
      const slowsBoss = hand === 'left';
      const orbColor = isOverdrive
        ? 0xfacc15
        : combo
        ? combo.hex
        : hand === 'left'
        ? 0xe0f2fe
        : 0xf97316;
      const ringColor = hand === 'left' ? 0x38bdf8 : 0xfef08a;
      const targetLanes: RunnerLane[] = combo?.multiLane ? [-1, 0, 1] : [lane];

      targetLanes.forEach((spawnLane) => {
        const spawnX = combo?.multiLane ? LANE_POSITIONS[spawnLane] : playerXRef.current;
        const group = new THREE.Group();
        const orbMat = new THREE.MeshBasicMaterial({
          color: orbColor,
          transparent: true,
          opacity: 0.95,
        });
        const ringMat = new THREE.MeshBasicMaterial({
          color: isOverdrive ? 0xffffff : ringColor,
          transparent: true,
          opacity: 0.92,
        });

        const orb = new THREE.Mesh(t.punchOrbGeo, orbMat);
        group.add(orb);
        const ring = new THREE.Mesh(t.punchRingGeo, ringMat);
        group.add(ring);

        const scaleMult = isOverdrive ? 1.85 : breaksObstacles ? 1.55 : hand === 'right' ? 1.28 : 1.05;
        group.scale.setScalar(scaleMult);
        group.position.set(spawnX, py, -0.8);
        t.scene.add(group);

        t.punchProjectiles.push({
          id: t.entityIdCounter++,
          lane: spawnLane,
          x: spawnX,
          y: py,
          z: -0.8,
          speed: projSpeed,
          damage: projDamage,
          breaksObstacles,
          shattersShield,
          slowsBoss,
          isOverdrive,
          airborne,
          hand,
          comboId: combo?.id ?? null,
          mesh: group,
          orbMat,
          ringMat,
        });
      });
    },
    [spawnBurst]
  );

  // Clear all active entities and reset runner for a new match
  const resetWorld = useCallback(() => {
    const t = threeRef.current;
    if (t) {
      t.obstacles.forEach((o) => t.scene.remove(o.mesh));
      t.coins.forEach((c) => t.scene.remove(c.mesh));
      t.letters.forEach((l) => {
        t.scene.remove(l.mesh);
        l.letterMat.dispose();
        l.ringMat.dispose();
      });
      t.powerUps.forEach((p) => t.scene.remove(p.mesh));
      t.particles.forEach((p) => t.scene.remove(p.mesh));
      t.punchProjectiles.forEach((proj) => {
        t.scene.remove(proj.mesh);
        proj.orbMat.dispose();
        proj.ringMat.dispose();
      });
      if (t.bossRig) {
        t.scene.remove(t.bossRig.root);
        t.bossRig.dispose();
        t.bossRig = null;
      }
      t.obstacles = [];
      t.coins = [];
      t.letters = [];
      t.powerUps = [];
      t.particles = [];
      t.punchProjectiles = [];
      t.nextSpawnZ = -110;
      t.runnerGroup.position.set(0, 0, 0);
      t.runnerGroup.rotation.set(0, 0, 0);
      t.torsoGroup.rotation.set(0, 0, 0);
      t.torsoGroup.position.y = 1.05;
      t.shadowMesh.position.set(0, 0.04, 0);
      t.shieldMesh.visible = false;
      t.magnetRing.visible = false;
      t.overdriveMesh.visible = false;
      t.applyEnvironment(ENVIRONMENT_ORDER[0]);
    }

    initialSeedNeededRef.current = true;
    lastCvLaneRef.current = 0;
    scoreRef.current = 0;
    distanceRef.current = 0;
    coinsRef.current = 0;
    speedRef.current = BASE_SPEED * Math.min(1, maxSpeedMultiplierRef.current);
    speedTierRef.current = 0;
    levelIdxRef.current = 0;
    currentEnvRef.current = ENVIRONMENT_ORDER[0];
    collectedMaskRef.current = Array(LEVEL_WORDS[0].length).fill(false);
    waveCounterRef.current = 0;
    bannerTimerRef.current = 0;

    bossActiveRef.current = false;
    bossThemeRef.current = ENVIRONMENT_ORDER[0];
    bossCycleRef.current = 0;
    bossLaneRef.current = 0;
    bossXRef.current = 0;
    bossZRef.current = BOSS_BASE_Z;
    bossRecoilRef.current = 0;
    bossIntroTimerRef.current = 0;
    bossTelegraphTimerRef.current = 0;
    bossTelegraphLaneRef.current = null;
    bossStaggerTimerRef.current = 0;
    bossEnragedRef.current = false;
    bossHpRef.current = 0;
    bossMaxHpRef.current = 400;
    bossShieldedRef.current = false;
    bossMoveTimerRef.current = 0;
    bossAttackTimerRef.current = 0;
    bossSpecialTimerRef.current = 0;
    bossHitFlashRef.current = 0;
    bossSlowTimerRef.current = 0;
    doublePunchTimerRef.current = 0;
    doublePunchCountRef.current = 0;
    leftPunchAnimRef.current = 0;
    rightPunchAnimRef.current = 0;
    punchFlashTimerRef.current = 0;

    powerMeterRef.current = 0;
    overdriveActiveRef.current = false;
    overdriveTimerRef.current = 0;
    comboHistoryRef.current = [];
    comboWindowTimerRef.current = 0;
    comboNameTimerRef.current = 0;
    fistChargeRef.current = { left: 0, right: 0 };

    playerLaneRef.current = 0;
    playerXRef.current = 0;
    playerYRef.current = 0;
    playerVyRef.current = 0;
    isJumpingRef.current = false;
    duckTimerRef.current = 0;
    rollSpinRef.current = 0;
    invulnTimerRef.current = 0;
    shakeTimerRef.current = 0;
    shieldActiveRef.current = false;
    magnetTimerRef.current = 0;
    multiplierTimerRef.current = 0;

    setScore(0);
    setDistance(0);
    setCoins(0);
    setSpeedFactor(parseFloat(Math.min(1, maxSpeedMultiplierRef.current).toFixed(1)));
    setLevelNumber(1);
    setCurrentEnv(ENVIRONMENT_ORDER[0]);
    setCurrentWord(LEVEL_WORDS[0]);
    setCollectedMask(Array(LEVEL_WORDS[0].length).fill(false));
    setBannerMessage(null);
    setBossActive(false);
    setBossIntroActive(false);
    setBossIntroHeadline('');
    setBossWeaknessBadge('');
    setBossWeaknessHint('');
    setBossDangerWarning('');
    setBossShielded(false);
    setBossEnraged(false);
    setBossStaggered(false);
    setBossTelegraphLane(null);
    setPunchFlashLabel(null);
    setPowerMeter(0);
    setOverdriveActive(false);
    setOverdriveRemaining(0);
    setComboSequence([]);
    setComboWindowPct(0);
    setFistCharge({ left: 0, right: 0 });
    setActiveComboName(null);
    setPracticeFeedMsg(null);
    setActiveShield(false);
    setMagnetRemaining(0);
    setMultiplierRemaining(0);
    runnerAudio.setMusicMode('runner');
  }, []);

  const startGame = useCallback(() => {
    setShowComboMenu(false);
    pausedForComboMenuRef.current = false;
    resetWorld();
    gameStateRef.current = 'PLAYING';
    setGameState('PLAYING');
    runnerAudio.setMusicMode('runner');
    runnerAudio.setIntensity(1.0);
    if (soundEnabled && musicEnabled) {
      runnerAudio.startMusic();
    }
  }, [resetWorld, soundEnabled, musicEnabled]);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'PLAYING') {
      gameStateRef.current = 'PAUSED';
      setGameState('PAUSED');
      runnerAudio.stopMusic();
    } else if (gameStateRef.current === 'PAUSED') {
      gameStateRef.current = 'PLAYING';
      setGameState('PLAYING');
      if (soundEnabled && musicEnabled) {
        runnerAudio.startMusic();
      }
    }
  }, [soundEnabled, musicEnabled]);

  const recalibratePose = useCallback(() => {
    baselineSamplesRef.current = [];
    baselineRef.current = null;
    setCvCalibrationStatus('calibrating');
  }, []);

  useEffect(() => {
    coinWalletRef.current = coinWallet;
    try {
      localStorage.setItem(COIN_WALLET_STORAGE_KEY, String(coinWallet));
    } catch {
      // ignore
    }
  }, [coinWallet]);

  useEffect(() => {
    craftedInventoryRef.current = craftedInventory;
    try {
      localStorage.setItem(CRAFTED_ITEMS_STORAGE_KEY, JSON.stringify(craftedInventory));
    } catch {
      // ignore
    }
  }, [craftedInventory]);

  const craftElement = useCallback((elId: CraftedElementId) => {
    const def = CRAFTED_ELEMENTS.find((c) => c.id === elId);
    if (!def) return;
    if (coinWalletRef.current < def.cost) return;

    runnerAudio.playPowerUp();
    const nextWallet = coinWalletRef.current - def.cost;
    coinWalletRef.current = nextWallet;
    setCoinWallet(nextWallet);

    const nextInv = {
      ...craftedInventoryRef.current,
      [elId]: (craftedInventoryRef.current[elId] || 0) + 1,
    };
    craftedInventoryRef.current = nextInv;
    setCraftedInventory(nextInv);
  }, []);

  const exchangeCoinsForScore = useCallback(() => {
    if (coinWalletRef.current < 10) return;
    runnerAudio.playLevelComplete();
    const nextWallet = coinWalletRef.current - 10;
    coinWalletRef.current = nextWallet;
    setCoinWallet(nextWallet);
    scoreRef.current += 1000;
    setScore(Math.floor(scoreRef.current));
    onScoreUpdateRef.current(Math.floor(scoreRef.current));
    setBannerMessage('¡10 Monedas canjeadas por +1,000 Puntos!');
    bannerTimerRef.current = 2.4;
  }, []);

  const useCraftedElement = useCallback(
    (elId: CraftedElementId) => {
      if (gameStateRef.current !== 'PLAYING') return;
      const count = craftedInventoryRef.current[elId] || 0;
      if (count <= 0) return;

      const nextInv = { ...craftedInventoryRef.current, [elId]: count - 1 };
      craftedInventoryRef.current = nextInv;
      setCraftedInventory(nextInv);
      runnerAudio.playPowerUp();

      if (elId === 'cryo_shield') {
        shieldActiveRef.current = true;
        setActiveShield(true);
        if (bossActiveRef.current) {
          bossSlowTimerRef.current = Math.max(bossSlowTimerRef.current, 4.0);
        }
        setBannerMessage('¡Elemento Creado: ESCUDO CRIOGÉNICO activado!');
        bannerTimerRef.current = 2.2;
        spawnBurst(playerXRef.current, playerYRef.current + 1.1, 0, 0x10b981, 22);
      } else if (elId === 'turbo_magnet') {
        magnetTimerRef.current = 10.0;
        multiplierTimerRef.current = 10.0;
        setMagnetRemaining(10);
        setMultiplierRemaining(10);
        setBannerMessage('¡Elemento Creado: IMÁN DORADO x2 activado (10s)!');
        bannerTimerRef.current = 2.2;
        spawnBurst(playerXRef.current, playerYRef.current + 1.1, 0, 0x06b6d4, 24);
      } else if (elId === 'power_core') {
        const nextMeter = Math.min(POWER_METER_MAX, powerMeterRef.current + 250);
        powerMeterRef.current = nextMeter;
        setPowerMeter(Math.round(nextMeter));
        if (nextMeter >= POWER_METER_MAX && !overdriveActiveRef.current) {
          overdriveActiveRef.current = true;
          overdriveTimerRef.current = OVERDRIVE_CONFIG.durationSec;
          setOverdriveActive(true);
          setOverdriveRemaining(OVERDRIVE_CONFIG.durationSec);
          runnerAudio.playOverdriveActivate();
        }
        const t = threeRef.current;
        if (t) {
          for (let oi = t.obstacles.length - 1; oi >= 0; oi--) {
            if (t.obstacles[oi].z > -26 && t.obstacles[oi].z < 4) {
              spawnBurst(LANE_POSITIONS[t.obstacles[oi].lane], 1.2, t.obstacles[oi].z, 0xfacc15, 16);
              t.scene.remove(t.obstacles[oi].mesh);
              t.obstacles.splice(oi, 1);
            }
          }
        }
        runnerAudio.playObstacleSmash();
        shakeTimerRef.current = 0.22;
        setBannerMessage('¡Elemento Creado: NÚCLEO +250 PODER activado!');
        bannerTimerRef.current = 2.4;
        spawnBurst(playerXRef.current, playerYRef.current + 1.1, 0, 0xfacc15, 28);
      }
    },
    [spawnBurst]
  );

  // Keyboard Controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        if (gameStateRef.current === 'READY' || gameStateRef.current === 'GAME_OVER') {
          startGame();
        } else {
          triggerJump();
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        triggerDuck();
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        e.preventDefault();
        triggerPunch('right');
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        triggerPunch('left');
      } else if (e.key === '1') {
        e.preventDefault();
        useCraftedElement('cryo_shield');
      } else if (e.key === '2') {
        e.preventDefault();
        useCraftedElement('turbo_magnet');
      } else if (e.key === '3') {
        e.preventDefault();
        useCraftedElement('power_core');
      } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
      } else if (e.key === 'r' || e.key === 'R') {
        startGame();
      } else if (e.key === 'c' || e.key === 'C') {
        recalibratePose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveLane, triggerJump, triggerDuck, triggerPunch, useCraftedElement, togglePause, startGame, recalibratePose, toggleFullscreen]);

  // ============================================================================
  // THREE.JS 3D SCENE INITIALIZATION & 60FPS GAME LOOP
  // ============================================================================
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, powerPreference: 'high-performance' });
    } catch {
      setWebglError(true);
      return;
    }

    const width = stageEl.clientWidth || 1280;
    const height = stageEl.clientHeight || 720;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    renderer.domElement.className = 'w-full h-full block touch-none select-none';
    stageEl.prepend(renderer.domElement);

    const handleContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const initEnv = ENVIRONMENT_THEMES[ENVIRONMENT_ORDER[0]];

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(initEnv.skyHex);
    scene.background = skyColor;
    const sceneFog = new THREE.FogExp2(initEnv.fogHex, initEnv.fogDensity);
    scene.fog = sceneFog;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 220);
    camera.position.set(0, 4.4, 7.6);
    camera.lookAt(0, 1.4, -12);

    // Three-Point Studio + Dynamic Theme Lighting
    const hemiLight = new THREE.HemisphereLight(
      initEnv.hemiSkyHex,
      initEnv.hemiGroundHex,
      initEnv.hemiIntensity
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(initEnv.keyHex, initEnv.keyIntensity);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 65;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 15;
    keyLight.shadow.camera.bottom = -15;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(initEnv.rimHex, initEnv.rimIntensity);
    rimLight.position.set(-10, 8, -14);
    scene.add(rimLight);

    // Horizon Glow Backdrop Sun/Moon Disc
    const horizonGlowMat = new THREE.MeshBasicMaterial({
      color: initEnv.horizonHex,
      transparent: true,
      opacity: initEnv.horizonOpacity,
    });
    const horizonGlow = new THREE.Mesh(new THREE.CircleGeometry(18, 32), horizonGlowMat);
    horizonGlow.position.set(0, 10, -140);
    scene.add(horizonGlow);

    // Ambient Weather / Atmosphere 3D Particle System (Snowflakes, Fire Embers, Hospital Motes, Toxic Spores)
    const AMBIENT_PARTICLE_COUNT = 150;
    const ambientPositions = new Float32Array(AMBIENT_PARTICLE_COUNT * 3);
    for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
      ambientPositions[i * 3] = (Math.random() - 0.5) * 26;
      ambientPositions[i * 3 + 1] = Math.random() * 11;
      ambientPositions[i * 3 + 2] = -Math.random() * 75 + 6;
    }
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    const ambientMat = new THREE.PointsMaterial({
      color: initEnv.particleHex,
      size: 0.24,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const ambientPoints = new THREE.Points(ambientGeo, ambientMat);
    ambientPoints.frustumCulled = false;
    scene.add(ambientPoints);

    // Shared Geometries & Materials for Track Segments
    const SEGMENT_LENGTH = 16;
    const NUM_SEGMENTS = 10;
    const trackSegments: THREE.Group[] = [];

    const bedGeo = new THREE.BoxGeometry(11.6, 0.2, SEGMENT_LENGTH);
    const bedMat = new THREE.MeshStandardMaterial({ color: initEnv.bedHex, roughness: 0.92, metalness: 0.05 });

    const railGeo = new THREE.BoxGeometry(0.11, 0.14, SEGMENT_LENGTH);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.85 });

    const tieGeo = new THREE.BoxGeometry(1.75, 0.07, 0.26);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });

    const laneStripGeo = new THREE.BoxGeometry(0.06, 0.02, SEGMENT_LENGTH);
    const laneStripMat = new THREE.MeshBasicMaterial({ color: initEnv.laneStripHex, transparent: true, opacity: 0.38 });

    const platformGeo = new THREE.BoxGeometry(3.5, 1.1, SEGMENT_LENGTH);
    const platformMat = new THREE.MeshStandardMaterial({ color: initEnv.platformHex, roughness: 0.78, metalness: 0.12 });

    const curbGeo = new THREE.BoxGeometry(0.24, 0.12, SEGMENT_LENGTH);
    const curbMat = new THREE.MeshStandardMaterial({
      color: initEnv.curbHex,
      roughness: 0.45,
      emissive: initEnv.curbEmissiveHex,
      emissiveIntensity: 0.35,
    });

    const pillarGeo = new THREE.BoxGeometry(0.45, 7.2, 0.45);
    const pillarMat = new THREE.MeshStandardMaterial({ color: initEnv.pillarHex, roughness: 0.55, metalness: 0.45 });

    const archBeamGeo = new THREE.BoxGeometry(13.2, 0.42, 0.45);
    const lightStripGeo = new THREE.BoxGeometry(2.6, 0.12, 0.16);
    const lightStripMat = new THREE.MeshBasicMaterial({ color: initEnv.lightStripHex });

    const envBuilderCtx = {
      animatedFlames: [] as THREE.Group[],
      animatedZombies: [] as THREE.Group[],
      disposePool: [] as Array<{ dispose: () => void }>,
    };
    const segmentThemeGroups: Array<Record<EnvironmentThemeId, THREE.Group>> = [];

    for (let s = 0; s < NUM_SEGMENTS; s++) {
      const seg = new THREE.Group();
      seg.position.z = 12 - s * SEGMENT_LENGTH;

      // Ground track bed
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.y = -0.1;
      bed.receiveShadow = true;
      seg.add(bed);

      // 3 Lanes: Rails & Sleepers
      ([-1, 0, 1] as RunnerLane[]).forEach((lane) => {
        const lx = LANE_POSITIONS[lane];
        const leftRail = new THREE.Mesh(railGeo, railMat);
        leftRail.position.set(lx - 0.65, 0.07, 0);
        seg.add(leftRail);

        const rightRail = new THREE.Mesh(railGeo, railMat);
        rightRail.position.set(lx + 0.65, 0.07, 0);
        seg.add(rightRail);

        for (let t = -SEGMENT_LENGTH / 2 + 1; t < SEGMENT_LENGTH / 2; t += 1.6) {
          const tie = new THREE.Mesh(tieGeo, tieMat);
          tie.position.set(lx, 0.02, t);
          tie.receiveShadow = true;
          seg.add(tie);
        }
      });

      // Lane Divider Glow Strips
      [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach((dx) => {
        const strip = new THREE.Mesh(laneStripGeo, laneStripMat);
        strip.position.set(dx, 0.015, 0);
        seg.add(strip);
      });

      // Left & Right Platforms + Curbs
      [-7.2, 7.2].forEach((px) => {
        const plat = new THREE.Mesh(platformGeo, platformMat);
        plat.position.set(px, 0.45, 0);
        plat.receiveShadow = true;
        seg.add(plat);

        const curb = new THREE.Mesh(curbGeo, curbMat);
        curb.position.set(px > 0 ? px - 1.65 : px + 1.65, 1.02, 0);
        seg.add(curb);
      });

      // Overhead Gantry Arch every segment
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-6.1, 3.6, 0);
      seg.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
      rightPillar.position.set(6.1, 3.6, 0);
      seg.add(rightPillar);

      const arch = new THREE.Mesh(archBeamGeo, pillarMat);
      arch.position.set(0, 7.1, 0);
      seg.add(arch);

      const lightBar = new THREE.Mesh(lightStripGeo, lightStripMat);
      lightBar.position.set(0, 6.85, 0);
      seg.add(lightBar);

      // Attach all 4 themed 3D sceneries (Nieve, Fábrica con Fuego, Hospital, Calle con Zombies)
      const themeGroups = createEnvironmentSegmentGroups(s, envBuilderCtx);
      Object.values(themeGroups).forEach((grp) => seg.add(grp));
      segmentThemeGroups.push(themeGroups);

      scene.add(seg);
      trackSegments.push(seg);
    }

    let activeParticleVy = initEnv.particleVy;
    const applyEnvironment = (themeId: EnvironmentThemeId) => {
      const cfg = ENVIRONMENT_THEMES[themeId];
      skyColor.setHex(cfg.skyHex);
      sceneFog.color.setHex(cfg.fogHex);
      sceneFog.density = cfg.fogDensity;

      hemiLight.color.setHex(cfg.hemiSkyHex);
      hemiLight.groundColor.setHex(cfg.hemiGroundHex);
      hemiLight.intensity = cfg.hemiIntensity;

      keyLight.color.setHex(cfg.keyHex);
      keyLight.intensity = cfg.keyIntensity;
      rimLight.color.setHex(cfg.rimHex);
      rimLight.intensity = cfg.rimIntensity;

      horizonGlowMat.color.setHex(cfg.horizonHex);
      horizonGlowMat.opacity = cfg.horizonOpacity;

      bedMat.color.setHex(cfg.bedHex);
      platformMat.color.setHex(cfg.platformHex);
      curbMat.color.setHex(cfg.curbHex);
      curbMat.emissive.setHex(cfg.curbEmissiveHex);
      laneStripMat.color.setHex(cfg.laneStripHex);
      pillarMat.color.setHex(cfg.pillarHex);
      lightStripMat.color.setHex(cfg.lightStripHex);

      ambientMat.color.setHex(cfg.particleHex);
      activeParticleVy = cfg.particleVy;

      segmentThemeGroups.forEach((groups) => {
        (Object.keys(groups) as EnvironmentThemeId[]).forEach((k) => {
          groups[k].visible = k === themeId;
        });
      });
    };

    // ========================================================================
    // ARTICULATED 3D RUNNER CHARACTER
    // ========================================================================
    const runnerGroup = new THREE.Group();
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.05, 0);
    runnerGroup.add(torsoGroup);

    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4, metalness: 0.15 });
    const darkPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.6 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Torso
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 0.38), jacketMat);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    // Backpack
    const packMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.52, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    packMesh.position.set(0, 0.05, 0.28);
    packMesh.castShadow = true;
    torsoGroup.add(packMesh);

    const packAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    packAccent.position.set(0, 0.12, 0.41);
    torsoGroup.add(packAccent);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.64, 0);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Cap & Visor
    const capCrown = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.48), capMat);
    capCrown.position.set(0, 0.2, 0);
    headGroup.add(capCrown);

    const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.25), capMat);
    capBrim.position.set(0, 0.12, -0.26);
    headGroup.add(capBrim);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.05), visorMat);
    visor.position.set(0, 0.04, -0.23);
    headGroup.add(visor);

    torsoGroup.add(headGroup);

    // Left & Right Arms (with glowing Left Crio-Cyan & Right Solar-Flame Gauntlets)
    const leftGauntletMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.5,
    });
    const rightGauntletMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.5,
    });

    const createArm = (side: -1 | 1) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.46, 0.28, 0);
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.48, 0.2), jacketMat);
      sleeve.position.set(0, -0.2, 0);
      sleeve.castShadow = true;
      armPivot.add(sleeve);

      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.23, 0.21, 0.23),
        side === -1 ? leftGauntletMat : rightGauntletMat
      );
      hand.position.set(0, -0.52, 0);
      armPivot.add(hand);
      return armPivot;
    };

    const leftArm = createArm(-1);
    const rightArm = createArm(1);
    torsoGroup.add(leftArm);
    torsoGroup.add(rightArm);

    // Left & Right Legs (pivoted at hip)
    const createLeg = (side: -1 | 1) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.18, -0.38, 0);
      const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.26), darkPantsMat);
      legMesh.position.set(0, -0.28, 0);
      legMesh.castShadow = true;
      legPivot.add(legMesh);

      const shoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.36), shoeMat);
      shoeMesh.position.set(0, -0.6, -0.05);
      shoeMesh.castShadow = true;
      legPivot.add(shoeMesh);
      return legPivot;
    };

    const leftLeg = createLeg(-1);
    const rightLeg = createLeg(1);
    torsoGroup.add(leftLeg);
    torsoGroup.add(rightLeg);

    // Ground Shadow Disc
    const shadowMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.65, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.04, 0);
    scene.add(shadowMesh);

    // Power-up Auras around Runner
    const shieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 24, 18),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.24,
        wireframe: true,
      })
    );
    shieldMesh.position.set(0, 1.05, 0);
    shieldMesh.visible = false;
    runnerGroup.add(shieldMesh);

    const magnetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.05, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75 })
    );
    magnetRing.rotation.x = Math.PI / 2;
    magnetRing.position.set(0, 0.9, 0);
    magnetRing.visible = false;
    runnerGroup.add(magnetRing);

    const overdriveMesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.88, 0.075, 48, 10),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85, wireframe: true })
    );
    overdriveMesh.position.set(0, 1.05, 0);
    overdriveMesh.visible = false;
    runnerGroup.add(overdriveMesh);

    scene.add(runnerGroup);

    // Shared Collectible Geometries
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.11, 18);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.85,
    });
    const particleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const punchOrbGeo = new THREE.SphereGeometry(0.36, 14, 12);
    const punchRingGeo = new THREE.TorusGeometry(0.54, 0.06, 8, 22);
    const letterGeoCache = new Map<string, THREE.ExtrudeGeometry>();
    const letterRingGeo = new THREE.TorusGeometry(0.92, 0.042, 10, 32);

    threeRef.current = {
      renderer,
      scene,
      camera,
      runnerGroup,
      torsoGroup,
      headGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      shadowMesh,
      shieldMesh,
      magnetRing,
      overdriveMesh,
      trackSegments,
      obstacles: [],
      coins: [],
      letters: [],
      powerUps: [],
      particles: [],
      punchProjectiles: [],
      bossRig: null,
      entityIdCounter: 1,
      nextSpawnZ: -110,
      coinGeo,
      coinMat,
      particleGeo,
      punchOrbGeo,
      punchRingGeo,
      letterGeoCache,
      letterRingGeo,
      applyEnvironment,
    };

    // Obstacle & Wave Builders
    const createLowBarrier = (lane: RunnerLane, z: number): ObstacleEntity => {
      const group = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.4 });
      const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, emissive: 0x9a3412, emissiveIntensity: 0.25 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });

      const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.22), postMat);
      leftPost.position.set(-0.95, 0.525, 0);
      leftPost.castShadow = true;
      group.add(leftPost);

      const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.22), postMat);
      rightPost.position.set(0.95, 0.525, 0);
      rightPost.castShadow = true;
      group.add(rightPost);

      // Striped crossbar
      for (let i = 0; i < 5; i++) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.42, 0.26),
          i % 2 === 0 ? orangeMat : whiteMat
        );
        block.position.set(-0.8 + i * 0.4, 0.84, 0);
        block.castShadow = true;
        group.add(block);
      }

      // Upward jump indicator chevron glow
      const arrowGlow = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      arrowGlow.position.set(0, 1.08, 0);
      group.add(arrowGlow);

      group.position.set(LANE_POSITIONS[lane], 0, z);
      scene.add(group);
      return {
        id: threeRef.current!.entityIdCounter++,
        kind: 'low',
        lane,
        z,
        speedOffset: 0,
        width: 1.9,
        height: 1.08,
        depth: 0.45,
        bottomY: 0,
        mesh: group,
        passed: false,
      };
    };

    const createHighBeam = (lane: RunnerLane, z: number): ObstacleEntity => {
      const group = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 });
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0xe11d48,
        roughness: 0.35,
        emissive: 0x881337,
        emissiveIntensity: 0.35,
      });

      // Side uprights
      [-1.08, 1.08].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.75, 0.22), postMat);
        post.position.set(px, 1.375, 0);
        post.castShadow = true;
        group.add(post);
      });

      // High barrier panel (bottom at y = 1.08 so ducking passes cleanly underneath)
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.35, 0.36), beamMat);
      panel.position.set(0, 1.78, 0);
      panel.castShadow = true;
      group.add(panel);

      // Bottom caution stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(2.18, 0.14, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      stripe.position.set(0, 1.12, 0);
      group.add(stripe);

      group.position.set(LANE_POSITIONS[lane], 0, z);
      scene.add(group);
      return {
        id: threeRef.current!.entityIdCounter++,
        kind: 'high',
        lane,
        z,
        speedOffset: 0,
        width: 2.0,
        height: 1.45,
        depth: 0.5,
        bottomY: 1.08,
        mesh: group,
        passed: false,
      };
    };

    const trainBodyColors = [0x2563eb, 0x059669, 0xdc2626, 0x7c3aed];
    const createTrain = (
      lane: RunnerLane,
      z: number,
      moving: boolean,
      hasRamp: boolean
    ): ObstacleEntity => {
      const group = new THREE.Group();
      const bodyColor = trainBodyColors[Math.floor(Math.random() * trainBodyColors.length)];
      const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.32, metalness: 0.4 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.45, metalness: 0.5 });
      const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

      const length = 9.4;
      const bodyHeight = TRAIN_ROOF_Y - 0.25;
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.18, bodyHeight, length), bodyMat);
      body.position.set(0, bodyHeight / 2 + 0.12, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Walkable metallic roof surface top at y = TRAIN_ROOF_Y
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, length - 0.1), roofMat);
      roof.position.set(0, TRAIN_ROOF_Y - 0.1, 0);
      roof.receiveShadow = true;
      group.add(roof);

      // Glowing cyan roof runner guide strips
      [-0.82, 0.82].forEach((rx) => {
        const roofStrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.03, length - 0.6),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
        );
        roofStrip.position.set(rx, TRAIN_ROOF_Y + 0.01, 0);
        group.add(roofStrip);
      });

      // Front windshield & headlights facing player (+Z)
      const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.72, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.8 })
      );
      windshield.position.set(0, 1.52, length / 2 + 0.01);
      group.add(windshield);

      [-0.65, 0.65].forEach((hx) => {
        const headlight = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 10, 10),
          new THREE.MeshBasicMaterial({ color: moving ? 0xfef08a : 0xf8fafc })
        );
        headlight.position.set(hx, 0.72, length / 2 + 0.04);
        group.add(headlight);
      });

      // Side passenger windows
      for (let wz = -3.2; wz <= 3.2; wz += 1.6) {
        [-1.1, 1.1].forEach((wx) => {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.58, 1.05), winMat);
          win.position.set(wx, 1.48, wz);
          group.add(win);
        });
      }

      // Optional Sloped Boarding Ramp on the front (+Z) so runner can run straight up onto roof!
      if (hasRamp) {
        const slopeLen = Math.hypot(RAMP_LENGTH, TRAIN_ROOF_Y);
        const angle = Math.atan2(TRAIN_ROOF_Y, RAMP_LENGTH);
        const rampDeck = new THREE.Mesh(
          new THREE.BoxGeometry(2.05, 0.18, slopeLen),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.35 })
        );
        rampDeck.position.set(0, TRAIN_ROOF_Y / 2 - 0.04, length / 2 + RAMP_LENGTH / 2);
        rampDeck.rotation.x = angle;
        rampDeck.receiveShadow = true;
        group.add(rampDeck);

        // Glowing chevron guide strips on ramp
        [-0.78, 0.78].forEach((rx) => {
          const guide = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.05, slopeLen - 0.2),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
          );
          guide.position.set(rx, TRAIN_ROOF_Y / 2 + 0.06, length / 2 + RAMP_LENGTH / 2);
          guide.rotation.x = angle;
          group.add(guide);
        });
      }

      group.position.set(LANE_POSITIONS[lane], 0, z);
      scene.add(group);
      return {
        id: threeRef.current!.entityIdCounter++,
        kind: 'train',
        lane,
        z,
        speedOffset: moving ? 4.5 : 0,
        width: 2.05,
        height: TRAIN_ROOF_Y,
        depth: length,
        bottomY: 0,
        hasRamp,
        rampLength: hasRamp ? RAMP_LENGTH : 0,
        mesh: group,
        passed: false,
      };
    };

    const spawnCoinLine = (
      lane: RunnerLane,
      startZ: number,
      count: number,
      arcType: 'flat' | 'jump' | 'low' | 'roof'
    ) => {
      const t = threeRef.current;
      if (!t) return;
      for (let i = 0; i < count; i++) {
        const z = startZ - i * 2.0;
        let y = 0.72;
        if (arcType === 'jump') {
          const norm = (i / Math.max(1, count - 1)) * 2 - 1;
          y = 0.85 + (1 - norm * norm) * 1.65;
        } else if (arcType === 'low') {
          y = 0.45;
        } else if (arcType === 'roof') {
          y = TRAIN_ROOF_Y + 0.75;
        }
        const mesh = new THREE.Mesh(t.coinGeo, t.coinMat);
        mesh.position.set(LANE_POSITIONS[lane], y, z);
        t.scene.add(mesh);
        t.coins.push({
          id: t.entityIdCounter++,
          lane,
          x: LANE_POSITIONS[lane],
          y,
          z,
          collected: false,
          mesh,
        });
      }
    };

    const createLetterToken = (
      char: string,
      letterIndex: number,
      lane: RunnerLane,
      y: number,
      z: number
    ) => {
      const t = threeRef.current;
      if (!t) return;

      const key = char.toUpperCase();
      let letterGeo = t.letterGeoCache.get(key);
      if (!letterGeo) {
        letterGeo = createExtrudedLetterGeometry(key);
        t.letterGeoCache.set(key, letterGeo);
      }

      const letterMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf97316,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.82,
      });

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.88,
      });

      const group = new THREE.Group();
      const letterMesh = new THREE.Mesh(letterGeo, letterMat);
      letterMesh.scale.setScalar(1.16);
      letterMesh.castShadow = true;
      group.add(letterMesh);

      const outerRing = new THREE.Mesh(t.letterRingGeo, ringMat);
      outerRing.rotation.x = 0.45;
      group.add(outerRing);

      group.position.set(LANE_POSITIONS[lane], y, z);
      t.scene.add(group);
      t.letters.push({
        id: t.entityIdCounter++,
        char: key,
        letterIndex,
        lane,
        x: LANE_POSITIONS[lane],
        y,
        baseY: y,
        z,
        mesh: group,
        letterMesh,
        outerRing,
        letterMat,
        ringMat,
      });
    };

    const spawnPowerUp = (lane: RunnerLane, z: number) => {
      const t = threeRef.current;
      if (!t) return;
      const types: RunnerPowerUpType[] = ['magnet', 'multiplier', 'shield'];
      const type = types[Math.floor(Math.random() * types.length)];
      const colorMap: Record<RunnerPowerUpType, number> = {
        magnet: 0x06b6d4,
        multiplier: 0xfacc15,
        shield: 0x10b981,
      };

      const group = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 0),
        new THREE.MeshStandardMaterial({
          color: colorMap[type],
          emissive: colorMap[type],
          emissiveIntensity: 0.55,
          roughness: 0.2,
          metalness: 0.6,
        })
      );
      group.add(core);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.045, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
      );
      group.add(ring);

      group.position.set(LANE_POSITIONS[lane], 1.15, z);
      t.scene.add(group);
      t.powerUps.push({
        id: t.entityIdCounter++,
        type,
        lane,
        y: 1.15,
        z,
        collected: false,
        mesh: group,
      });
    };

    const spawnWave = (spawnZ: number) => {
      const t = threeRef.current;
      if (!t) return;

      waveCounterRef.current += 1;
      const lanes: RunnerLane[] = [-1, 0, 1];
      const shuffled = [...lanes].sort(() => Math.random() - 0.5);
      const pattern = Math.floor(Math.random() * 7);
      let letterSpot: { lane: RunnerLane; y: number; z: number } = {
        lane: shuffled[2],
        y: 1.1,
        z: spawnZ,
      };

      if (pattern === 0) {
        // Ramped train + standard train + open lane
        t.obstacles.push(createTrain(shuffled[0], spawnZ, false, true));
        t.obstacles.push(createTrain(shuffled[1], spawnZ, false, false));
        spawnCoinLine(shuffled[0], spawnZ + 3.2, 5, 'roof');
        spawnCoinLine(shuffled[2], spawnZ + 3.5, 5, 'flat');
        letterSpot = { lane: shuffled[0], y: TRAIN_ROOF_Y + 0.95, z: spawnZ - 2.5 };
      } else if (pattern === 1) {
        // 1 ramped train + 1 low hurdle + 1 high beam
        t.obstacles.push(createTrain(shuffled[0], spawnZ, false, true));
        t.obstacles.push(createLowBarrier(shuffled[1], spawnZ));
        t.obstacles.push(createHighBeam(shuffled[2], spawnZ));
        spawnCoinLine(shuffled[0], spawnZ + 3.2, 4, 'roof');
        spawnCoinLine(shuffled[1], spawnZ + 3.8, 5, 'jump');
        spawnCoinLine(shuffled[2], spawnZ + 3.5, 4, 'low');
        letterSpot = { lane: shuffled[1], y: 2.2, z: spawnZ };
      } else if (pattern === 2) {
        // All 3 lanes low hurdles (must JUMP!)
        lanes.forEach((l) => t.obstacles.push(createLowBarrier(l, spawnZ)));
        spawnCoinLine(shuffled[0], spawnZ + 3.8, 5, 'jump');
        letterSpot = { lane: shuffled[1], y: 2.25, z: spawnZ };
      } else if (pattern === 3) {
        // 2 high beams + 1 ramped train
        t.obstacles.push(createHighBeam(shuffled[0], spawnZ));
        t.obstacles.push(createHighBeam(shuffled[1], spawnZ));
        t.obstacles.push(createTrain(shuffled[2], spawnZ, false, true));
        spawnCoinLine(shuffled[0], spawnZ + 3.2, 4, 'low');
        spawnCoinLine(shuffled[2], spawnZ + 3.2, 5, 'roof');
        letterSpot = { lane: shuffled[2], y: TRAIN_ROOF_Y + 0.95, z: spawnZ - 2.0 };
      } else if (pattern === 4) {
        // Ramped train chain / roof hop!
        t.obstacles.push(createTrain(shuffled[0], spawnZ, false, true));
        t.obstacles.push(createTrain(shuffled[1], spawnZ - 11, false, false));
        spawnCoinLine(shuffled[0], spawnZ + 3.2, 5, 'roof');
        spawnCoinLine(shuffled[1], spawnZ - 7.5, 5, 'roof');
        spawnCoinLine(shuffled[2], spawnZ + 2, 5, 'flat');
        letterSpot = { lane: shuffled[1], y: TRAIN_ROOF_Y + 0.95, z: spawnZ - 11 };
      } else if (pattern === 5) {
        // Moving train + open lanes
        t.obstacles.push(createTrain(shuffled[0], spawnZ, true, false));
        t.obstacles.push(createLowBarrier(shuffled[1], spawnZ));
        spawnCoinLine(shuffled[2], spawnZ + 2, 6, 'flat');
        letterSpot = { lane: shuffled[2], y: 1.15, z: spawnZ - 3 };
      } else {
        // High beam + low barrier + open lane
        t.obstacles.push(createHighBeam(shuffled[0], spawnZ));
        t.obstacles.push(createLowBarrier(shuffled[1], spawnZ));
        spawnCoinLine(shuffled[2], spawnZ + 2, 6, 'flat');
        letterSpot = { lane: shuffled[2], y: 1.15, z: spawnZ - 4 };
      }

      // Spawn next needed Letter of current Level Word if not already active on track
      const word = LEVEL_WORDS[levelIdxRef.current % LEVEL_WORDS.length];
      const missingIndices = word
        .split('')
        .map((_, idx) => idx)
        .filter((idx) => !collectedMaskRef.current[idx]);

      if (missingIndices.length > 0 && (waveCounterRef.current % 2 === 1 || t.letters.length === 0)) {
        const activeIndices = new Set(t.letters.map((l) => l.letterIndex));
        const nextMissing = missingIndices.find((idx) => !activeIndices.has(idx)) ?? missingIndices[0];
        createLetterToken(word[nextMissing], nextMissing, letterSpot.lane, letterSpot.y, letterSpot.z);
      } else if (Math.random() < 0.25) {
        spawnPowerUp(shuffled[2], spawnZ - 9);
      }
    };

    // Resize Observer
    const handleResize = () => {
      if (!stageRef.current || !threeRef.current) return;
      const w = stageRef.current.clientWidth;
      const h = stageRef.current.clientHeight;
      if (w <= 0 || h <= 0) return;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(stageEl);

    // Boss Fight Spawner & Boss Wave Builder (runs inside WebGL scene context)
    const startBossFight = (themeId: EnvironmentThemeId) => {
      const t = threeRef.current;
      if (!t) return;

      if (t.bossRig) {
        t.scene.remove(t.bossRig.root);
        t.bossRig.dispose();
        t.bossRig = null;
      }

      const cfg = BOSS_CONFIGS[themeId];
      const currentLevel = levelIdxRef.current + 1;
      const cycle = Math.floor(levelIdxRef.current / (ENVIRONMENT_ORDER.length * 3));
      // Scale Boss HP dynamically with current level (10x higher HP pool for epic boss battles)
      const scaledMaxHp = cfg.maxHp + currentLevel * 120;

      const rig = createBossRig(themeId);
      rig.root.position.set(0, 18.0, -96);
      rig.root.scale.setScalar(1.1);
      t.scene.add(rig.root);
      t.bossRig = rig;

      bossActiveRef.current = true;
      bossThemeRef.current = themeId;
      bossCycleRef.current = cycle;
      bossLaneRef.current = 0;
      bossXRef.current = 0;
      bossZRef.current = -96;
      bossRecoilRef.current = 0;
      bossIntroTimerRef.current = BOSS_INTRO_DURATION;
      bossTelegraphTimerRef.current = 0;
      bossTelegraphLaneRef.current = null;
      bossStaggerTimerRef.current = 0;
      bossEnragedRef.current = false;
      bossHpRef.current = scaledMaxHp;
      bossMaxHpRef.current = scaledMaxHp;
      bossShieldedRef.current = cfg.specialAction !== 'punch_only';
      bossMoveTimerRef.current = cfg.moveInterval * 0.85;
      bossAttackTimerRef.current = 1.25;
      bossSpecialTimerRef.current = cfg.specialAction === 'punch_only' ? 99 : 4.2;
      bossHitFlashRef.current = 0;
      doublePunchTimerRef.current = 0;
      doublePunchCountRef.current = 0;
      invulnTimerRef.current = Math.max(invulnTimerRef.current, BOSS_INTRO_DURATION + 0.35);

      // Clear all incoming obstacles ahead so Boss makes a clean dramatic entrance!
      for (let i = t.obstacles.length - 1; i >= 0; i--) {
        if (t.obstacles[i].z < -6) {
          t.scene.remove(t.obstacles[i].mesh);
          t.obstacles.splice(i, 1);
        }
      }
      t.letters.forEach((l) => {
        t.scene.remove(l.mesh);
        l.letterMat.dispose();
        l.ringMat.dispose();
      });
      t.letters = [];

      runnerAudio.playBossSpawn();
      runnerAudio.setMusicMode('monster');
      setBossActive(true);
      setBossIntroActive(true);
      setBossIntroHeadline(cfg.introHeadline);
      setBossWeaknessBadge(cfg.weaknessBadge);
      setBossWeaknessHint(cfg.weaknessHint);
      setBossDangerWarning(cfg.dangerWarning);
      setBossName(cfg.name);
      setBossTitle(`${cfg.title} · Nivel ${currentLevel}`);
      setBossHp(scaledMaxHp);
      setBossMaxHp(scaledMaxHp);
      setBossShielded(bossShieldedRef.current);
      setBossEnraged(false);
      setBossStaggered(false);
      setBossTelegraphLane(null);
      setBossPrompt(bossShieldedRef.current ? cfg.specialPrompt : cfg.defaultPrompt);
      setBossAccentColor(cfg.accentColor);
      setBannerMessage(null);
      bannerTimerRef.current = 0;
    };

    const spawnBossAttackWave = (themeId: EnvironmentThemeId, bossLane: RunnerLane) => {
      const t = threeRef.current;
      if (!t) return;
      const lanes: RunnerLane[] = [-1, 0, 1];
      const bCfg = BOSS_CONFIGS[themeId];
      const launchX = bossXRef.current;
      const launchY = Math.max(3.2, BOSS_BASE_Y - 1.1);
      const launchZ = bossZRef.current + 3.2;

      // Visual throw recoil + muzzle burst from the distant Boss
      bossRecoilRef.current = -1.8;
      spawnBurst(launchX, launchY, launchZ, bCfg.accentHex, 24);

      // Primary obstacle hurled directly from the Boss onto its target lane
      const primaryKind: 'low' | 'high' = Math.random() < 0.56 ? 'low' : 'high';
      const primary = createBossObstacleMesh(themeId, primaryKind);
      primary.group.position.set(launchX, launchY, launchZ);
      t.scene.add(primary.group);
      t.obstacles.push({
        id: t.entityIdCounter++,
        kind: primaryKind,
        lane: bossLane,
        z: launchZ,
        speedOffset: 4.5,
        width: primary.width,
        height: primary.height,
        depth: primary.depth,
        bottomY: primary.bottomY,
        thrown: {
          startX: launchX,
          startY: launchY,
          startZ: launchZ,
          targetX: LANE_POSITIONS[bossLane],
          landZ: -16.5,
          arcHeight: 2.8,
        },
        mesh: primary.group,
        passed: false,
      });

      // Secondary obstacle hurled onto a side lane (leaving at least one clear lane) + coins
      const otherLanes = lanes.filter((l) => l !== bossLane);
      if (Math.random() < 0.72) {
        const secondLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
        const secondKind: 'low' | 'high' = Math.random() < 0.5 ? 'low' : 'high';
        const secondary = createBossObstacleMesh(themeId, secondKind);
        const secondStartZ = launchZ - 4.5;
        secondary.group.position.set(launchX, launchY, secondStartZ);
        t.scene.add(secondary.group);
        t.obstacles.push({
          id: t.entityIdCounter++,
          kind: secondKind,
          lane: secondLane,
          z: secondStartZ,
          speedOffset: 4.5,
          width: secondary.width,
          height: secondary.height,
          depth: secondary.depth,
          bottomY: secondary.bottomY,
          thrown: {
            startX: launchX,
            startY: launchY,
            startZ: secondStartZ,
            targetX: LANE_POSITIONS[secondLane],
            landZ: -20.5,
            arcHeight: 3.4,
          },
          mesh: secondary.group,
          passed: false,
        });
      }

      const coinLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      spawnCoinLine(coinLane, launchZ + 2, 3, 'flat');
      if (Math.random() < 0.18) {
        spawnPowerUp(bossLane, launchZ - 5);
      }
    };

    // Pre-allocated Color helpers for zero-GC RGB loop updates
    const _letterRgbColor = new THREE.Color();
    const _ringRgbColor = new THREE.Color();

    // Main Animation Loop
    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = typeof gl.fenceSync === 'function' ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          timerId = window.setTimeout(cb, 80);
        }
      };
      timerId = window.setTimeout(poll, 5);
    };

    const scheduleNextFrame = () => {
      if (disposed) return;
      if (isSoftwareGl) {
        afterDraw(() => {
          if (!disposed) animate(performance.now());
        });
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };

    const animate = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const t = threeRef.current;
      if (!t) return;

      const state = gameStateRef.current;

      // Update ambient weather / fire / zombie animations across environments
      const posAttr = ambientGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const worldAdvance = state === 'PLAYING' ? speedRef.current * dt : 0;
      for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
        arr[i * 3] += Math.sin(now * 0.002 + i) * 0.45 * dt;
        arr[i * 3 + 1] += activeParticleVy * dt;
        arr[i * 3 + 2] += worldAdvance * 0.65;
        if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 10.8;
        if (arr[i * 3 + 1] > 11) arr[i * 3 + 1] = 0.2;
        if (arr[i * 3 + 2] > 8) arr[i * 3 + 2] = -70 - Math.random() * 10;
      }
      posAttr.needsUpdate = true;

      if (currentEnvRef.current === 'factory') {
        for (let i = 0; i < envBuilderCtx.animatedFlames.length; i++) {
          const f = envBuilderCtx.animatedFlames[i];
          const phase = (f.userData.phase as number) || 0;
          const flicker = 0.85 + Math.sin(now * 0.015 + phase) * 0.25 + Math.cos(now * 0.023 + phase) * 0.12;
          f.scale.set(0.95 + Math.sin(now * 0.01 + phase) * 0.1, flicker, 0.95);
          f.rotation.y += dt * 2.5;
        }
      } else if (currentEnvRef.current === 'zombies') {
        for (let i = 0; i < envBuilderCtx.animatedZombies.length; i++) {
          const zmb = envBuilderCtx.animatedZombies[i];
          const phase = (zmb.userData.phase as number) || 0;
          zmb.rotation.z = Math.sin(now * 0.0045 + phase) * 0.14;
          zmb.rotation.x = Math.cos(now * 0.003 + phase) * 0.08;
        }
      }

      // Ambient idle runner animation when READY
      if (state === 'READY') {
        const idleBob = Math.sin(now * 0.004) * 0.05;
        t.torsoGroup.position.y = 1.05 + idleBob;
        t.leftArm.rotation.x = Math.sin(now * 0.004) * 0.25;
        t.rightArm.rotation.x = -Math.sin(now * 0.004) * 0.25;
        t.leftLeg.rotation.x = 0;
        t.rightLeg.rotation.x = 0;
        t.camera.position.x = Math.sin(now * 0.0008) * 0.35;
        t.camera.lookAt(0, 1.4, -12);
        t.renderer.render(t.scene, t.camera);
        scheduleNextFrame();
        return;
      }

      if (state === 'PAUSED' || state === 'GAME_OVER') {
        if (shakeTimerRef.current > 0) {
          shakeTimerRef.current = Math.max(0, shakeTimerRef.current - dt);
          t.camera.position.x = (Math.random() - 0.5) * 0.45;
          t.camera.position.y = 4.4 + (Math.random() - 0.5) * 0.35;
        }
        t.renderer.render(t.scene, t.camera);
        scheduleNextFrame();
        return;
      }

      // ================= PLAYING STATE =================
      // 1. Speed progression every 1000 points (+0.15x per 1000 pts, capped by configurable slider)
      const maxMultiplier = maxSpeedMultiplierRef.current;
      const currentTier = Math.floor(scoreRef.current / 1000);
      if (currentTier > speedTierRef.current) {
        const prevFactor = Math.min(maxMultiplier, 1 + speedTierRef.current * 0.15);
        speedTierRef.current = currentTier;
        const newFactor = Math.min(maxMultiplier, 1 + currentTier * 0.15);
        if (newFactor > prevFactor + 0.01) {
          runnerAudio.playSpeedUp();
          setBannerMessage(`Velocidad ${newFactor.toFixed(1)}x · ${currentTier * 1000} pts`);
          bannerTimerRef.current = 2.4;
        }
      }

      const uncappedFactor = 1 + speedTierRef.current * 0.15;
      const targetSpeed = BASE_SPEED * Math.min(maxMultiplier, uncappedFactor);
      speedRef.current += (targetSpeed - speedRef.current) * Math.min(1, dt * 4);
      const currentSpeed = speedRef.current;
      const speedRatio = currentSpeed / BASE_SPEED;
      runnerAudio.setIntensity(speedRatio);

      // 2. Distance & Score accumulation
      const distDelta = currentSpeed * dt;
      distanceRef.current += distDelta;
      const mult = multiplierTimerRef.current > 0 ? 2 : 1;
      scoreRef.current += distDelta * 2.5 * mult;

      // Banner, Punch Flash & Powerup Timers
      if (bannerTimerRef.current > 0) {
        bannerTimerRef.current = Math.max(0, bannerTimerRef.current - dt);
        if (bannerTimerRef.current === 0) {
          setBannerMessage(null);
        }
      }
      if (punchFlashTimerRef.current > 0) {
        punchFlashTimerRef.current = Math.max(0, punchFlashTimerRef.current - dt);
        if (punchFlashTimerRef.current === 0) {
          setPunchFlashLabel(null);
        }
      }
      if (leftPunchAnimRef.current > 0) leftPunchAnimRef.current = Math.max(0, leftPunchAnimRef.current - dt);
      if (rightPunchAnimRef.current > 0) rightPunchAnimRef.current = Math.max(0, rightPunchAnimRef.current - dt);
      if (!isCameraActiveRef.current) {
        fistChargeRef.current.left = Math.round((leftPunchAnimRef.current / 0.28) * 100);
        fistChargeRef.current.right = Math.round((rightPunchAnimRef.current / 0.28) * 100);
      }
      if (bossSlowTimerRef.current > 0) bossSlowTimerRef.current = Math.max(0, bossSlowTimerRef.current - dt);
      if (comboWindowTimerRef.current > 0) {
        comboWindowTimerRef.current = Math.max(0, comboWindowTimerRef.current - dt);
        if (comboWindowTimerRef.current === 0 && comboHistoryRef.current.length > 0) {
          comboHistoryRef.current = [];
          setComboSequence([]);
          setComboWindowPct(0);
        }
      }
      if (comboNameTimerRef.current > 0) {
        comboNameTimerRef.current = Math.max(0, comboNameTimerRef.current - dt);
        if (comboNameTimerRef.current === 0) {
          setActiveComboName(null);
        }
      }
      if (overdriveActiveRef.current) {
        overdriveTimerRef.current = Math.max(0, overdriveTimerRef.current - dt);
        powerMeterRef.current = (overdriveTimerRef.current / OVERDRIVE_CONFIG.durationSec) * POWER_METER_MAX;
        if (overdriveTimerRef.current <= 0) {
          overdriveActiveRef.current = false;
          powerMeterRef.current = 0;
          setOverdriveActive(false);
          setOverdriveRemaining(0);
          setPowerMeter(0);
        }
      }
      if (doublePunchTimerRef.current > 0) {
        doublePunchTimerRef.current = Math.max(0, doublePunchTimerRef.current - dt);
        if (doublePunchTimerRef.current === 0) {
          doublePunchCountRef.current = 0;
        }
      }
      if (invulnTimerRef.current > 0) invulnTimerRef.current = Math.max(0, invulnTimerRef.current - dt);
      if (magnetTimerRef.current > 0) magnetTimerRef.current = Math.max(0, magnetTimerRef.current - dt);
      if (multiplierTimerRef.current > 0) multiplierTimerRef.current = Math.max(0, multiplierTimerRef.current - dt);

      // 3. Player Lateral Movement & Bank Tilt
      const targetX = LANE_POSITIONS[playerLaneRef.current];
      const prevX = playerXRef.current;
      playerXRef.current += (targetX - playerXRef.current) * Math.min(1, dt * 14);
      const lateralVel = (playerXRef.current - prevX) / Math.max(dt, 0.001);

      // 4. Advance Obstacles & Compute Roof / Ramp Support Surface Height (floorY)
      let floorY = 0;
      const playerHalfW = 0.34;
      for (let i = 0; i < t.obstacles.length; i++) {
        const obs = t.obstacles[i];
        obs.z += (currentSpeed + obs.speedOffset) * dt;
        if (obs.thrown) {
          const denom = Math.max(1, obs.thrown.landZ - obs.thrown.startZ);
          const tArc = THREE.MathUtils.clamp((obs.z - obs.thrown.startZ) / denom, 0, 1);
          const curX = THREE.MathUtils.lerp(obs.thrown.startX, obs.thrown.targetX, tArc);
          const arcLift = Math.sin(tArc * Math.PI) * obs.thrown.arcHeight;
          const curY = THREE.MathUtils.lerp(obs.thrown.startY, 0, tArc * tArc) + arcLift;
          obs.mesh.position.set(curX, curY, obs.z);
          obs.mesh.rotation.x = tArc < 1 ? (1 - tArc) * 0.65 : 0;
          if (tArc >= 1) {
            obs.mesh.position.set(obs.thrown.targetX, 0, obs.z);
            obs.mesh.rotation.x = 0;
            obs.thrown = undefined;
          }
        } else {
          obs.mesh.position.z = obs.z;
        }

        if (obs.kind === 'train') {
          const obsX = LANE_POSITIONS[obs.lane];
          if (Math.abs(playerXRef.current - obsX) < obs.width * 0.56) {
            const frontZ = obs.z + obs.depth / 2;
            const backZ = obs.z - obs.depth / 2;

            // Sloped Boarding Ramp check
            if (obs.hasRamp && obs.rampLength && frontZ <= 0.15 && frontZ + obs.rampLength >= -0.15) {
              const rampT = THREE.MathUtils.clamp((frontZ + obs.rampLength) / obs.rampLength, 0, 1);
              const rampY = rampT * TRAIN_ROOF_Y;
              if (playerYRef.current >= rampY - 0.65) {
                floorY = Math.max(floorY, rampY);
              }
            }

            // Train Roof Surface check
            if (backZ <= 0.3 && frontZ >= -0.3) {
              if (playerYRef.current >= TRAIN_ROOF_Y - 0.65) {
                floorY = Math.max(floorY, TRAIN_ROOF_Y);
              }
            }
          }
        }
      }

      // 5. Jump, Gravity & Duck Physics relative to dynamic floorY (ground or train roof/ramp)
      if (playerYRef.current > floorY + 0.02 || playerVyRef.current > 0) {
        playerYRef.current += playerVyRef.current * dt;
        playerVyRef.current += GRAVITY * dt;
        if (playerYRef.current <= floorY) {
          playerYRef.current = floorY;
          playerVyRef.current = 0;
          isJumpingRef.current = false;
        } else {
          isJumpingRef.current = true;
        }
      } else {
        playerYRef.current = floorY;
        playerVyRef.current = 0;
        isJumpingRef.current = false;
      }

      if (duckTimerRef.current > 0) {
        duckTimerRef.current = Math.max(0, duckTimerRef.current - dt);
        rollSpinRef.current += dt * 11.5;
      } else {
        rollSpinRef.current = 0;
      }

      // 6. Update Runner 3D Transform & Procedural Animation
      const isDucking = duckTimerRef.current > 0;
      const heightAboveFloor = Math.max(0, playerYRef.current - floorY);
      t.runnerGroup.position.set(playerXRef.current, playerYRef.current, 0);
      t.runnerGroup.rotation.z = THREE.MathUtils.clamp(-lateralVel * 0.032, -0.32, 0.32);

      // Shadow projects onto current support floor (ground or train roof!)
      t.shadowMesh.position.set(playerXRef.current, floorY + 0.04, 0);
      const shadowScale = Math.max(0.35, 1 - heightAboveFloor * 0.22);
      t.shadowMesh.scale.setScalar(shadowScale);
      (t.shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.45 * shadowScale;

      if (isDucking) {
        t.torsoGroup.position.y = 0.58;
        t.torsoGroup.scale.set(1.05, 0.65, 1.05);
        t.torsoGroup.rotation.x = -rollSpinRef.current;
        t.leftArm.rotation.x = -1.2;
        t.rightArm.rotation.x = -1.2;
        t.leftLeg.rotation.x = 1.1;
        t.rightLeg.rotation.x = 1.1;
      } else if (heightAboveFloor > 0.14) {
        t.torsoGroup.position.y = 1.08;
        t.torsoGroup.scale.set(1, 1, 1);
        t.torsoGroup.rotation.x = 0.14;
        t.leftArm.rotation.x = -2.2;
        t.rightArm.rotation.x = -2.0;
        t.leftLeg.rotation.x = 0.65;
        t.rightLeg.rotation.x = -0.45;
      } else {
        runCycleRef.current += dt * currentSpeed * 0.78;
        const swing = Math.sin(runCycleRef.current);
        t.torsoGroup.position.y = 1.05 + Math.abs(Math.cos(runCycleRef.current)) * 0.12;
        t.torsoGroup.scale.set(1, 1, 1);
        t.torsoGroup.rotation.x = 0.18;
        t.leftLeg.rotation.x = swing * 0.95;
        t.rightLeg.rotation.x = -swing * 0.95;
        t.leftArm.rotation.x = -swing * 0.85;
        t.rightArm.rotation.x = swing * 0.85;
      }

      // Override Punching Arm Pose when throwing CV/keyboard fists!
      if (leftPunchAnimRef.current > 0) {
        t.leftArm.rotation.x = -Math.PI * 0.58;
      }
      if (rightPunchAnimRef.current > 0) {
        t.rightArm.rotation.x = -Math.PI * 0.58;
      }

      if (invulnTimerRef.current > 0) {
        t.runnerGroup.visible = Math.floor(now / 70) % 2 === 0;
      } else {
        t.runnerGroup.visible = true;
      }

      t.shieldMesh.visible = shieldActiveRef.current;
      if (shieldActiveRef.current) {
        t.shieldMesh.rotation.y += dt * 1.8;
      }
      t.magnetRing.visible = magnetTimerRef.current > 0;
      if (magnetTimerRef.current > 0) {
        t.magnetRing.rotation.z += dt * 4;
        t.magnetRing.scale.setScalar(1 + Math.sin(now * 0.01) * 0.08);
      }
      t.overdriveMesh.visible = overdriveActiveRef.current;
      if (overdriveActiveRef.current) {
        t.overdriveMesh.rotation.y += dt * 4.8;
        t.overdriveMesh.rotation.x += dt * 3.1;
        t.overdriveMesh.scale.setScalar(1.06 + Math.sin(now * 0.018) * 0.12);
      }

      // 7. Scroll Subway Track Segments
      t.trackSegments.forEach((seg) => {
        seg.position.z += distDelta;
        if (seg.position.z > 20) {
          seg.position.z -= NUM_SEGMENTS * SEGMENT_LENGTH;
        }
      });

      // 8. Normal Obstacle Waves vs. Interactive Boss Battle (Closer Position + Intro + Telegraph + Counter)
      if (bossActiveRef.current && t.bossRig) {
        const bCfg = BOSS_CONFIGS[bossThemeRef.current];

        if (bossIntroTimerRef.current > 0) {
          // Dramatic 2.2s Swoop-In Animation into Colossal Titan scale while ¡PELIGRO! card displays Boss Name
          bossIntroTimerRef.current = Math.max(0, bossIntroTimerRef.current - dt);
          const progress = 1 - bossIntroTimerRef.current / BOSS_INTRO_DURATION;
          const eased = 1 - Math.pow(1 - progress, 3);
          const introZ = -96 + (BOSS_BASE_Z - -96) * eased;
          const introY = 18.0 + (BOSS_BASE_Y - 18.0) * eased;
          const introScale = 1.1 + (BOSS_COLOSSAL_SCALE - 1.1) * eased;

          bossZRef.current = introZ;
          bossXRef.current = 0;
          t.bossRig.root.position.set(0, introY, introZ);
          t.bossRig.root.scale.setScalar(introScale);
          t.bossRig.coreGroup.rotation.y = (1 - eased) * Math.PI * 2;
          t.bossRig.coreGroup.rotation.x = 0.14 * (1 - eased);
          t.bossRig.haloMesh.rotation.z += dt * 5.2;
          t.bossRig.shieldMesh.visible = bossShieldedRef.current;

          if (bossIntroTimerRef.current <= 0) {
            setBossIntroActive(false);
            spawnBurst(0, BOSS_BASE_Y, BOSS_BASE_Z + 2.5, bCfg.accentHex, 36);
          }
        } else {
          // Check Enrage (<50% HP) -> Boss speeds up and glows intensely
          if (!bossEnragedRef.current && bossHpRef.current <= bossMaxHpRef.current * 0.5) {
            bossEnragedRef.current = true;
            setBossEnraged(true);
            setBannerMessage(`¡${bCfg.name.toUpperCase()} ENFURECIDO (<50% HP)!`);
            bannerTimerRef.current = 2.4;
            spawnBurst(bossXRef.current, BOSS_BASE_Y, bossZRef.current + 1.5, 0xef4444, 34);
          }

          const enrageMult = bossEnragedRef.current ? 1.25 : 1.0;
          const slowMult = bossSlowTimerRef.current > 0 ? 0.5 : 1.0;
          const bossPaceMult = enrageMult * slowMult;

          // Stagger Recovery (triggered when player counterattacks during Boss wind-up!)
          const wasStaggered = bossStaggerTimerRef.current > 0;
          if (bossStaggerTimerRef.current > 0) {
            bossStaggerTimerRef.current = Math.max(0, bossStaggerTimerRef.current - dt);
            if (bossStaggerTimerRef.current === 0 && wasStaggered) {
              setBossStaggered(false);
            }
          }

          const isStaggered = bossStaggerTimerRef.current > 0;

          // Boss Lane Patrol across -1, 0, 1 (paused during wind-up or stagger)
          if (!isStaggered && bossTelegraphTimerRef.current <= 0) {
            bossMoveTimerRef.current -= dt * bossPaceMult;
            if (bossMoveTimerRef.current <= 0) {
              bossMoveTimerRef.current = bCfg.moveInterval;
              const allLanes: RunnerLane[] = [-1, 0, 1];
              const choices = allLanes.filter((l) => l !== bossLaneRef.current);
              bossLaneRef.current = choices[Math.floor(Math.random() * choices.length)];
            }
          }

          // Smooth Hit Recoil + Attack Lunge along Z around BOSS_BASE_Z (-48.0)
          bossRecoilRef.current *= Math.exp(-dt * 8.5);
          if (Math.abs(bossRecoilRef.current) < 0.01) bossRecoilRef.current = 0;

          const lungeZ = bossTelegraphTimerRef.current > 0 ? 3.2 : 0;
          const targetZ = BOSS_BASE_Z + lungeZ + bossRecoilRef.current;
          bossZRef.current += (targetZ - bossZRef.current) * Math.min(1, dt * 10);

          const bossTargetX = LANE_POSITIONS[bossLaneRef.current] * 1.35;
          bossXRef.current += (bossTargetX - bossXRef.current) * Math.min(1, dt * 7.2);

          const staggerJitter = isStaggered ? Math.sin(now * 0.045) * 0.45 : 0;
          const telegraphShake = bossTelegraphTimerRef.current > 0 ? Math.sin(now * 0.055) * 0.22 : 0;
          const bossBobY = BOSS_BASE_Y + Math.sin(now * 0.0046) * 0.48;

          t.bossRig.root.position.set(bossXRef.current + staggerJitter + telegraphShake, bossBobY, bossZRef.current);
          t.bossRig.root.scale.setScalar(BOSS_COLOSSAL_SCALE * (bossEnragedRef.current ? 1.07 : 1.0));
          t.bossRig.coreGroup.rotation.y = isStaggered
            ? Math.sin(now * 0.025) * 0.5
            : Math.sin(now * 0.0026) * 0.24;
          t.bossRig.coreGroup.rotation.x = bossRecoilRef.current * 0.16 + (bossTelegraphTimerRef.current > 0 ? 0.16 : 0);

          const haloPulse = bossTelegraphTimerRef.current > 0 ? 1.24 + Math.sin(now * 0.03) * 0.12 : 1.0;
          t.bossRig.haloMesh.scale.setScalar(haloPulse);
          t.bossRig.haloMesh.rotation.z += dt * (bossEnragedRef.current ? 3.2 : 1.9);

          t.bossRig.shieldMesh.visible = bossShieldedRef.current;
          if (bossShieldedRef.current) {
            t.bossRig.shieldMesh.rotation.y -= dt * 2.2;
            t.bossRig.shieldMesh.rotation.x += dt * 1.2;
          }

          // Boss Hit Flash Feedback
          if (bossHitFlashRef.current > 0) {
            bossHitFlashRef.current = Math.max(0, bossHitFlashRef.current - dt);
            const flashOn = bossHitFlashRef.current > 0;
            t.bossRig.hitFlashMats.forEach((m) => {
              m.emissive.setHex(flashOn ? 0xffffff : 0x000000);
              m.emissiveIntensity = flashOn ? 0.68 : 0.0;
            });
          } else if (bossTelegraphTimerRef.current > 0) {
            // Glow crimson/amber while winding up an attack so player knows to dodge or counterattack!
            const pulseInt = 0.25 + Math.abs(Math.sin(now * 0.02)) * 0.35;
            t.bossRig.hitFlashMats.forEach((m) => {
              m.emissive.setHex(0xef4444);
              m.emissiveIntensity = pulseInt;
            });
          } else {
            t.bossRig.hitFlashMats.forEach((m) => {
              m.emissive.setHex(bossEnragedRef.current ? 0x7f1d1d : 0x000000);
              m.emissiveIntensity = bossEnragedRef.current ? 0.18 : 0.0;
            });
          }

          // Boss Special Shield Cycle (for Bosses 2, 3, 4)
          if (bCfg.specialAction !== 'punch_only' && !isStaggered) {
            bossSpecialTimerRef.current -= dt * enrageMult;
            if (bossSpecialTimerRef.current <= 0) {
              bossShieldedRef.current = !bossShieldedRef.current;
              bossSpecialTimerRef.current = bossShieldedRef.current ? 5.6 : 4.2;
              setBossShielded(bossShieldedRef.current);
              setBossPrompt(bossShieldedRef.current ? bCfg.specialPrompt : bCfg.defaultPrompt);
            }
          }

          // Telegraphed Attack Wind-up -> Fires Obstacle Wave!
          if (!isStaggered) {
            if (bossTelegraphTimerRef.current > 0) {
              bossTelegraphTimerRef.current -= dt * bossPaceMult;
              if (bossTelegraphTimerRef.current <= 0) {
                const fireLane = bossTelegraphLaneRef.current ?? bossLaneRef.current;
                bossTelegraphTimerRef.current = 0;
                bossTelegraphLaneRef.current = null;
                setBossTelegraphLane(null);
                bossAttackTimerRef.current = bCfg.attackInterval;
                spawnBossAttackWave(bossThemeRef.current, fireLane);
              }
            } else {
              bossAttackTimerRef.current -= dt * bossPaceMult;
              if (bossAttackTimerRef.current <= 0) {
                bossTelegraphLaneRef.current = bossLaneRef.current;
                bossTelegraphTimerRef.current = 0.65;
                setBossTelegraphLane(bossLaneRef.current);
              }
            }
          }
        }
      } else {
        if (initialSeedNeededRef.current) {
          initialSeedNeededRef.current = false;
          spawnWave(-54);
          spawnWave(-86);
          t.nextSpawnZ = -114;
        }

        t.nextSpawnZ += distDelta;
        if (t.nextSpawnZ >= -110) {
          const waveGap = Math.max(22, 30 - (speedRatio - 1) * 5);
          spawnWave(-110);
          t.nextSpawnZ = -110 - waveGap;
        }
      }

      // 9. Collide Obstacles (skipping train collisions when safely on ramp/roof!)
      const playerBottom = playerYRef.current;
      const playerTop = playerYRef.current + (isDucking ? 0.92 : 1.72);

      for (let i = t.obstacles.length - 1; i >= 0; i--) {
        const obs = t.obstacles[i];
        const obsHalfD = obs.depth / 2;
        const obsHalfW = obs.width / 2;
        const obsX = LANE_POSITIONS[obs.lane];

        const zOverlap = obs.z + obsHalfD > -0.32 && obs.z - obsHalfD < 0.32;
        const xOverlap = Math.abs(playerXRef.current - obsX) < obsHalfW + playerHalfW - 0.12;
        let yOverlap = playerTop > obs.bottomY + 0.08 && playerBottom < obs.bottomY + obs.height - 0.08;

        // If on top of train roof or boarding ramp, don't crash into this train
        if (obs.kind === 'train' && playerBottom >= TRAIN_ROOF_Y - 0.65) {
          yOverlap = false;
        }
        if (
          obs.kind === 'train' &&
          obs.hasRamp &&
          obs.rampLength &&
          obs.z + obsHalfD <= 0.25 &&
          obs.z + obsHalfD + obs.rampLength >= -0.25
        ) {
          const rampT = THREE.MathUtils.clamp((obs.z + obsHalfD + obs.rampLength) / obs.rampLength, 0, 1);
          if (playerBottom >= rampT * TRAIN_ROOF_Y - 0.7) {
            yOverlap = false;
          }
        }

        if (zOverlap && xOverlap && yOverlap) {
          if (overdriveActiveRef.current) {
            // PODER SUPREMO: Inmortal + Rompe Obstáculos automáticamente!
            shakeTimerRef.current = 0.16;
            scoreRef.current += 150;
            runnerAudio.playObstacleSmash();
            spawnBurst(obsX, playerBottom + 1.0, 0, 0xfacc15, 22);
            spawnBurst(obsX, playerBottom + 1.2, 0, 0x38bdf8, 12);
            t.scene.remove(obs.mesh);
            t.obstacles.splice(i, 1);
            continue;
          } else if (invulnTimerRef.current <= 0) {
            if (shieldActiveRef.current) {
              shieldActiveRef.current = false;
              invulnTimerRef.current = 1.6;
              shakeTimerRef.current = 0.25;
              runnerAudio.playShieldBreak();
              spawnBurst(playerXRef.current, playerBottom + 1.0, 0, 0x10b981, 22);
              t.scene.remove(obs.mesh);
              t.obstacles.splice(i, 1);
              continue;
            } else {
              runnerAudio.playCrash();
              runnerAudio.stopMusic();
              shakeTimerRef.current = 0.45;
              spawnBurst(playerXRef.current, playerBottom + 1.0, 0, 0xf43f5e, 28);
              gameStateRef.current = 'GAME_OVER';
              setGameState('GAME_OVER');
              const finalScore = Math.floor(scoreRef.current);
              setScore(finalScore);
              setDistance(Math.floor(distanceRef.current));
              setCoins(coinsRef.current);
              onScoreUpdateRef.current(finalScore);
              break;
            }
          }
        }

        if (obs.z > 16) {
          t.scene.remove(obs.mesh);
          t.obstacles.splice(i, 1);
        }
      }

      // 10. Update & Collect Coins (with Magnet Pull)
      for (let i = t.coins.length - 1; i >= 0; i--) {
        const coin = t.coins[i];
        coin.z += distDelta;
        coin.mesh.rotation.y += dt * 4.5;

        if (magnetTimerRef.current > 0 && coin.z > -18 && coin.z < 2) {
          coin.x += (playerXRef.current - coin.x) * Math.min(1, dt * 11);
          coin.y += (playerYRef.current + 0.9 - coin.y) * Math.min(1, dt * 11);
          coin.z += (0 - coin.z) * Math.min(1, dt * 8);
        }

        coin.mesh.position.set(coin.x, coin.y, coin.z);

        const distToPlayer = Math.hypot(
          coin.x - playerXRef.current,
          coin.y - (playerYRef.current + 0.9),
          coin.z
        );

        if (distToPlayer < 1.15) {
          coinsRef.current += 1;
          coinWalletRef.current += 1;
          setCoinWallet(coinWalletRef.current);
          scoreRef.current += 50 * (multiplierTimerRef.current > 0 ? 2 : 1);
          runnerAudio.playCoin();
          spawnBurst(coin.x, coin.y, coin.z, 0xfacc15, 7);
          t.scene.remove(coin.mesh);
          t.coins.splice(i, 1);
          continue;
        }

        if (coin.z > 10) {
          t.scene.remove(coin.mesh);
          t.coins.splice(i, 1);
        }
      }

      // 11. Update & Collect True-3D Spinning RGB Letters (Gold / Orange / Green Shimmer)
      for (let i = t.letters.length - 1; i >= 0; i--) {
        const letter = t.letters[i];
        letter.z += distDelta;
        letter.y = letter.baseY + Math.sin(now * 0.0055 + letter.id) * 0.18;
        letter.mesh.position.set(letter.x, letter.y, letter.z);

        // Full 3D spinning motion (primary Y spin + subtle X/Z 3D tilt + counter-rotating gyro ring)
        letter.letterMesh.rotation.y += dt * 3.1;
        letter.letterMesh.rotation.x = Math.sin(now * 0.0032 + letter.id) * 0.26;
        letter.letterMesh.rotation.z = Math.cos(now * 0.0025 + letter.id) * 0.14;
        letter.outerRing.rotation.x += dt * 1.9;
        letter.outerRing.rotation.y -= dt * 2.2;

        const [lr, lg, lb] = sampleGoldOrangeGreenRgb((now * 0.00075 + letter.letterIndex * 0.14) % 1);
        _letterRgbColor.setRGB(lr / 255, lg / 255, lb / 255);
        letter.letterMat.color.copy(_letterRgbColor);
        letter.letterMat.emissive.copy(_letterRgbColor);

        const [rr, rg, rb] = sampleGoldOrangeGreenRgb((now * 0.00075 + letter.letterIndex * 0.14 + 0.35) % 1);
        _ringRgbColor.setRGB(rr / 255, rg / 255, rb / 255);
        letter.ringMat.color.copy(_ringRgbColor);

        const distToPlayer = Math.hypot(
          letter.x - playerXRef.current,
          letter.y - (playerYRef.current + 1.0),
          letter.z
        );

        if (distToPlayer < 1.35) {
          const activeWord = LEVEL_WORDS[levelIdxRef.current % LEVEL_WORDS.length];
          if (letter.letterIndex < collectedMaskRef.current.length) {
            collectedMaskRef.current[letter.letterIndex] = true;
          }
          scoreRef.current += 150 * (multiplierTimerRef.current > 0 ? 2 : 1);
          runnerAudio.playLetter();
          spawnBurst(letter.x, letter.y, letter.z, 0xfacc15, 10);
          spawnBurst(letter.x, letter.y, letter.z, 0xf97316, 8);
          spawnBurst(letter.x, letter.y, letter.z, 0x22c55e, 8);

          t.scene.remove(letter.mesh);
          letter.letterMat.dispose();
          letter.ringMat.dispose();
          t.letters.splice(i, 1);

          // Check if entire word is completed -> every 3 levels triggers a Boss Fight!
          if (collectedMaskRef.current.every(Boolean)) {
            const completedWord = activeWord;
            const bonus = 500 * (levelIdxRef.current + 1);
            scoreRef.current += bonus;
            runnerAudio.playLevelComplete();

            // Clear leftover letters from completed word
            t.letters.forEach((rem) => {
              t.scene.remove(rem.mesh);
              rem.letterMat.dispose();
              rem.ringMat.dispose();
            });
            t.letters = [];

            const completedLevelNum = levelIdxRef.current + 1;
            if (completedLevelNum % 3 === 0) {
              // Trigger Boss Fight for the current 3-level environment!
              startBossFight(currentEnvRef.current);
            } else {
              // Stay in the current 3-level environment until the 3rd level Boss is defeated
              levelIdxRef.current += 1;
              const nextWord = LEVEL_WORDS[levelIdxRef.current % LEVEL_WORDS.length];
              const envIdx = Math.floor(levelIdxRef.current / 3) % ENVIRONMENT_ORDER.length;
              const nextEnvId = ENVIRONMENT_ORDER[envIdx];
              currentEnvRef.current = nextEnvId;
              collectedMaskRef.current = Array(nextWord.length).fill(false);

              setCurrentEnv(nextEnvId);
              setBannerMessage(
                `¡Nivel ${levelIdxRef.current + 1} · ${ENVIRONMENT_THEMES[nextEnvId].label}! (${completedWord} +${bonus} pts)`
              );
              bannerTimerRef.current = 3.0;
              setLevelNumber(levelIdxRef.current + 1);
              setCurrentWord(nextWord);
              setCollectedMask([...collectedMaskRef.current]);
            }
          } else {
            setCollectedMask([...collectedMaskRef.current]);
          }
          continue;
        }

        if (letter.z > 10) {
          t.scene.remove(letter.mesh);
          letter.letterMat.dispose();
          letter.ringMat.dispose();
          t.letters.splice(i, 1);
        }
      }

      // 11B. Advance 3D Fist Shockwave Projectiles (Smash Obstacles + Colossal Boss Combat x10)
      for (let i = t.punchProjectiles.length - 1; i >= 0; i--) {
        const proj = t.punchProjectiles[i];
        proj.z -= proj.speed * dt;
        // Gently arc punches up toward the towering distant Boss when Boss battle is active
        if (bossActiveRef.current && bossIntroTimerRef.current <= 0 && proj.z < -2.5) {
          proj.y += (BOSS_BASE_Y - 0.6 - proj.y) * Math.min(1, dt * 6.8);
        }
        proj.mesh.position.set(proj.x, proj.y, proj.z);
        proj.mesh.rotation.z += dt * 10;

        let removeProj = proj.z < -66;

        // Obstacle-breaking shockwaves shatter obstacles ahead!
        if (proj.breaksObstacles) {
          for (let oi = t.obstacles.length - 1; oi >= 0; oi--) {
            const obs = t.obstacles[oi];
            const obsX = LANE_POSITIONS[obs.lane];
            const xHit = Math.abs(proj.x - obsX) < obs.width * 0.65 + 0.55;
            const zHit = proj.z <= obs.z + obs.depth / 2 + 0.8 && proj.z >= obs.z - obs.depth / 2 - 0.9;
            if (xHit && zHit) {
              runnerAudio.playObstacleSmash();
              shakeTimerRef.current = 0.14;
              scoreRef.current += 120;
              spawnBurst(obsX, obs.bottomY + obs.height * 0.5, obs.z, proj.isOverdrive ? 0xfacc15 : 0x38bdf8, 22);
              t.scene.remove(obs.mesh);
              t.obstacles.splice(oi, 1);
            }
          }
        }

        if (
          bossActiveRef.current &&
          bossIntroTimerRef.current <= 0 &&
          t.bossRig &&
          proj.z <= bossZRef.current + 5.6 &&
          proj.z >= bossZRef.current - 6.0
        ) {
          if (Math.abs(proj.x - bossXRef.current) < 6.4) {
            removeProj = true;
            const bCfg = BOSS_CONFIGS[bossThemeRef.current];
            const isOverdriveNow = proj.isOverdrive || overdriveActiveRef.current;
            const isSupremeAttack = isOverdriveNow || proj.comboId === 'champion_flurry';
            const dmgMult = isOverdriveNow ? OVERDRIVE_CONFIG.damageMultiplier : 1;
            let dmg = proj.damage * dmgMult;
            let deflected = false;

            if (proj.slowsBoss) {
              bossSlowTimerRef.current = 2.0;
            }

            // Counterattack Check: Hitting Boss during red wind-up with effective attack staggers Boss
            const canCounter =
              bossTelegraphTimerRef.current > 0 &&
              (proj.hand === 'right' || proj.damage >= 3 || dmgMult > 1);

            // STRICT ELEMENTAL COUNTER MECHANICS PER BOSS THEME:
            // 1) Monstruo de Nieve ('snow'): ONLY damaged by Bolas de Fuego (right) or Combo Supremo
            // 2) Monstruo de Fuego ('factory'): ONLY damaged by Bolas de Nieve (left) or Combo Supremo
            // 3) Dron Bio-Médico ('hospital'): Damaged by Boxing Combos, Airborne hits, or Combo Supremo
            // 4) Rey Zombie Mutante ('zombies'): Takes normal damage from EVERYTHING
            if (bCfg.id === 'snow') {
              const effectiveVsSnow = proj.hand === 'right' || isSupremeAttack;
              if (!effectiveVsSnow) {
                deflected = true;
                setBannerMessage('❄️ ¡El hielo no lo daña! ¡Usa BOLAS DE FUEGO (Brazo Der.) o COMBO SUPREMO!');
                bannerTimerRef.current = 2.1;
              }
            } else if (bCfg.id === 'factory') {
              const effectiveVsFire = proj.hand === 'left' || isSupremeAttack;
              if (!effectiveVsFire) {
                deflected = true;
                setBannerMessage('🔥 ¡Absorbe el fuego! ¡Lanza BOLAS DE NIEVE (Brazo Izq.) para dañarlo!');
                bannerTimerRef.current = 2.1;
              } else {
                // Snowballs extinguish Thermal Shield immediately & deal 1.5x counter damage!
                dmg = Math.max(dmg + 1, Math.round(dmg * 1.5));
                if (bossShieldedRef.current) {
                  bossShieldedRef.current = false;
                  bossSpecialTimerRef.current = 5.2;
                  setBossShielded(false);
                  setBossPrompt(bCfg.defaultPrompt);
                  setBannerMessage(`❄️ ¡Bola de Nieve apaga su Escudo Térmico! (-${dmg} HP)`);
                  bannerTimerRef.current = 2.0;
                }
              }
            } else if (bCfg.id === 'hospital') {
              const effectiveVsBio =
                proj.comboId !== null || proj.airborne || isSupremeAttack || proj.shattersShield;
              if (!effectiveVsBio) {
                deflected = true;
                setBannerMessage('⚡ ¡Campo Bio-Estático! ¡Conecta un COMBO DE BOXEO o SALTA + PUÑO!');
                bannerTimerRef.current = 2.0;
              } else if (bossShieldedRef.current) {
                bossShieldedRef.current = false;
                bossSpecialTimerRef.current = 4.8;
                dmg = Math.max(dmg, 2 * dmgMult);
                setBossShielded(false);
                setBossPrompt(bCfg.defaultPrompt);
                setBannerMessage(
                  proj.airborne
                    ? `⚡ ¡Golpe Aéreo rompe el Campo Estático! (-${dmg} HP)`
                    : `⚡ ¡Combo rompe el Campo Bio-Estático! (-${dmg} HP)`
                );
                bannerTimerRef.current = 1.9;
              }
            } else if (bCfg.id === 'zombies') {
              // Zombie Mutant receives normal damage from ALL attacks & elements!
              if (bossShieldedRef.current) {
                doublePunchCountRef.current += 1;
                doublePunchTimerRef.current = 1.25;
                if (doublePunchCountRef.current >= 2 || proj.damage >= 3 || isSupremeAttack) {
                  bossShieldedRef.current = false;
                  bossSpecialTimerRef.current = 4.8;
                  doublePunchCountRef.current = 0;
                  setBossShielded(false);
                  setBossPrompt(bCfg.defaultPrompt);
                  setBannerMessage(`☣️ ¡Furia Mutante quebrada! (-${dmg} HP)`);
                  bannerTimerRef.current = 1.7;
                }
              }
            }

            if (deflected) {
              runnerAudio.playBossDeflect();
              spawnBurst(bossXRef.current, BOSS_BASE_Y, bossZRef.current + 3.2, bCfg.shieldHex, 18);
            } else {
              if (canCounter) {
                bossTelegraphTimerRef.current = 0;
                bossTelegraphLaneRef.current = null;
                setBossTelegraphLane(null);
                bossStaggerTimerRef.current = 1.45;
                setBossStaggered(true);
                bossAttackTimerRef.current = bCfg.attackInterval * 0.9;
                dmg = Math.max(dmg + 1, Math.round(dmg * 1.5));
                setBannerMessage(`¡CONTRAATAQUE ELEMENTAL PERFECTO! (-${dmg} HP · Aturdido)`);
                bannerTimerRef.current = 1.9;
              }

              bossHpRef.current = Math.max(0, bossHpRef.current - dmg);
              bossHitFlashRef.current = 0.16;
              bossRecoilRef.current = canCounter ? -2.6 : -1.6;
              shakeTimerRef.current = dmgMult > 1 || canCounter ? 0.28 : 0.16;
              scoreRef.current += 120 * dmg;
              runnerAudio.playBossHit();
              spawnBurst(
                bossXRef.current,
                BOSS_BASE_Y,
                bossZRef.current + 3.2,
                canCounter ? 0xf43f5e : dmgMult > 1 ? 0xfacc15 : bCfg.accentHex,
                dmgMult > 1 || canCounter ? 36 : 24
              );
              setBossHp(bossHpRef.current);

              if (bossHpRef.current <= 0) {
                // BOSS DEFEATED -> Switch back to upbeat Nightcore Runner music & advance environment
                runnerAudio.playBossDefeat();
                runnerAudio.setMusicMode('runner');
                shakeTimerRef.current = 0.55;
                spawnBurst(bossXRef.current, BOSS_BASE_Y, bossZRef.current + 2.0, 0xfacc15, 44);
                spawnBurst(bossXRef.current, BOSS_BASE_Y, bossZRef.current + 2.0, bCfg.accentHex, 40);

                t.scene.remove(t.bossRig.root);
                t.bossRig.dispose();
                t.bossRig = null;
                bossActiveRef.current = false;
                bossShieldedRef.current = false;
                bossTelegraphTimerRef.current = 0;
                bossTelegraphLaneRef.current = null;
                bossStaggerTimerRef.current = 0;
                bossEnragedRef.current = false;

                // Clear far boss obstacles safely so scenario transition feels clean
                for (let oi = t.obstacles.length - 1; oi >= 0; oi--) {
                  if (t.obstacles[oi].z < -4) {
                    t.scene.remove(t.obstacles[oi].mesh);
                    t.obstacles.splice(oi, 1);
                  }
                }

                const defeatBonus = 1000 * (bossCycleRef.current + 1);
                scoreRef.current += defeatBonus;
                levelIdxRef.current += 1;

                const nextWord = LEVEL_WORDS[levelIdxRef.current % LEVEL_WORDS.length];
                const nextEnvIdx = Math.floor(levelIdxRef.current / 3) % ENVIRONMENT_ORDER.length;
                const nextEnvId = ENVIRONMENT_ORDER[nextEnvIdx];
                currentEnvRef.current = nextEnvId;
                collectedMaskRef.current = Array(nextWord.length).fill(false);

                t.applyEnvironment(nextEnvId);
                t.nextSpawnZ = -60;

                setBossActive(false);
                setBossIntroActive(false);
                setBossShielded(false);
                setBossEnraged(false);
                setBossStaggered(false);
                setBossTelegraphLane(null);
                setCurrentEnv(nextEnvId);
                setLevelNumber(levelIdxRef.current + 1);
                setCurrentWord(nextWord);
                setCollectedMask([...collectedMaskRef.current]);
                setBannerMessage(
                  `¡${bCfg.name} DERROTADO! +${defeatBonus} pts · Nuevo Mundo: ${ENVIRONMENT_THEMES[nextEnvId].label}`
                );
                bannerTimerRef.current = 3.6;
              }
            }
          }
        }

        if (removeProj) {
          t.scene.remove(proj.mesh);
          proj.orbMat.dispose();
          proj.ringMat.dispose();
          t.punchProjectiles.splice(i, 1);
        }
      }

      // 12. Update & Collect PowerUps
      for (let i = t.powerUps.length - 1; i >= 0; i--) {
        const pu = t.powerUps[i];
        pu.z += distDelta;
        pu.mesh.position.z = pu.z;
        pu.mesh.position.y = pu.y + Math.sin(now * 0.005 + pu.id) * 0.16;
        pu.mesh.rotation.y += dt * 2.8;

        const distToPlayer = Math.hypot(
          LANE_POSITIONS[pu.lane] - playerXRef.current,
          pu.mesh.position.y - (playerYRef.current + 1.0),
          pu.z
        );

        if (distToPlayer < 1.25) {
          runnerAudio.playPowerUp();
          if (pu.type === 'magnet') {
            magnetTimerRef.current = 8.0;
            spawnBurst(playerXRef.current, playerBottom + 1.1, 0, 0x06b6d4, 16);
          } else if (pu.type === 'multiplier') {
            multiplierTimerRef.current = 8.0;
            spawnBurst(playerXRef.current, playerBottom + 1.1, 0, 0xfacc15, 16);
          } else if (pu.type === 'shield') {
            shieldActiveRef.current = true;
            spawnBurst(playerXRef.current, playerBottom + 1.1, 0, 0x10b981, 16);
          }
          t.scene.remove(pu.mesh);
          t.powerUps.splice(i, 1);
          continue;
        }

        if (pu.z > 10) {
          t.scene.remove(pu.mesh);
          t.powerUps.splice(i, 1);
        }
      }

      // 13. Update 3D Particles
      for (let i = t.particles.length - 1; i >= 0; i--) {
        const p = t.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 14 * dt;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
        p.mesh.scale.setScalar(alpha);
        if (p.life >= p.maxLife) {
          t.scene.remove(p.mesh);
          (p.mesh.material as THREE.Material).dispose();
          t.particles.splice(i, 1);
        }
      }

      // 14. Dynamic Chase Camera Follow & Speed FOV Boost
      const targetCamX = playerXRef.current * 0.42;
      const targetCamY = 4.35 + playerYRef.current * 0.55;
      t.camera.position.x += (targetCamX - t.camera.position.x) * Math.min(1, dt * 8);
      t.camera.position.y += (targetCamY - t.camera.position.y) * Math.min(1, dt * 8);
      if (shakeTimerRef.current > 0) {
        shakeTimerRef.current = Math.max(0, shakeTimerRef.current - dt);
        t.camera.position.x += (Math.random() - 0.5) * 0.3;
        t.camera.position.y += (Math.random() - 0.5) * 0.25;
      }

      const targetFov = 62 + (speedRatio - 1) * 14;
      if (Math.abs(t.camera.fov - targetFov) > 0.1) {
        t.camera.fov += (targetFov - t.camera.fov) * Math.min(1, dt * 5);
        t.camera.updateProjectionMatrix();
      }
      t.camera.lookAt(playerXRef.current * 0.3, 1.3 + playerYRef.current * 0.45, -12);

      // 15. Throttled React HUD Sync (10Hz)
      hudSyncAccum += dt;
      if (hudSyncAccum >= 0.1) {
        hudSyncAccum = 0;
        const roundedScore = Math.floor(scoreRef.current);
        setScore(roundedScore);
        setDistance(Math.floor(distanceRef.current));
        setCoins(coinsRef.current);
        setSpeedFactor(parseFloat(speedRatio.toFixed(1)));
        setActiveShield(shieldActiveRef.current);
        setMagnetRemaining(Math.ceil(magnetTimerRef.current));
        setMultiplierRemaining(Math.ceil(multiplierTimerRef.current));
        setPowerMeter(Math.round(powerMeterRef.current));
        setOverdriveRemaining(Math.ceil(overdriveTimerRef.current));
        setComboWindowPct(
          comboWindowTimerRef.current > 0
            ? Math.round((comboWindowTimerRef.current / COMBO_WINDOW_SEC) * 100)
            : 0
        );
        setFistCharge({
          left: Math.round(fistChargeRef.current.left),
          right: Math.round(fistChargeRef.current.right),
        });
        setRgbPhase((now * 0.00075) % 1);
        onScoreUpdateRef.current(roundedScore);
      }

      t.renderer.render(t.scene, t.camera);
      scheduleNextFrame();
    };

    if (isSoftwareGl) {
      timerId = window.setTimeout(() => {
        if (!disposed) animate(performance.now());
      }, 16);
    } else {
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      letterGeoCache.forEach((geo) => geo.dispose());
      letterGeoCache.clear();
      letterRingGeo.dispose();
      punchOrbGeo.dispose();
      punchRingGeo.dispose();
      overdriveMesh.geometry.dispose();
      (overdriveMesh.material as THREE.Material).dispose();
      leftGauntletMat.dispose();
      rightGauntletMat.dispose();
      if (threeRef.current?.bossRig) {
        threeRef.current.bossRig.dispose();
      }
      ambientGeo.dispose();
      ambientMat.dispose();
      envBuilderCtx.disposePool.forEach((r) => r.dispose());
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === stageEl) {
        stageEl.removeChild(renderer.domElement);
      }
      threeRef.current = null;
    };
  }, [spawnBurst]);

  // ============================================================================
  // MEDIAPIPE POSE COMPUTER VISION TRACKING
  // ============================================================================
  const drawCvOverlay = useCallback(
    (landmarks: NormalizedLandmark[] | null, cx: number, cy: number, actionText: string) => {
      const canvas = poseCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.readyState < 2) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Draw mirrored webcam feed
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      // Subtle dark scrim for crisp HUD legibility
      ctx.fillStyle = 'rgba(2, 6, 23, 0.28)';
      ctx.fillRect(0, 0, w, h);

      const base = baselineRef.current;
      const laneThresh = cvSensitivityRef.current ? 0.08 : 0.13;
      const jumpThresh = cvSensitivityRef.current ? 0.065 : 0.095;
      const duckThresh = cvSensitivityRef.current ? 0.075 : 0.115;

      const centerX = base ? base.x : 0.5;
      const leftDividerX = Math.max(24, (centerX - laneThresh) * w);
      const rightDividerX = Math.min(w - 24, (centerX + laneThresh) * w);

      // Highlight active CV lane column subtly
      ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
      if (lastCvLaneRef.current === -1) {
        ctx.fillRect(0, 0, leftDividerX, h);
      } else if (lastCvLaneRef.current === 1) {
        ctx.fillRect(rightDividerX, 0, w - rightDividerX, h);
      } else {
        ctx.fillRect(leftDividerX, 0, rightDividerX - leftDividerX, h);
      }

      // Draw 3 Vertical Lane Zones
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(leftDividerX, 0);
      ctx.lineTo(leftDividerX, h);
      ctx.moveTo(rightDividerX, 0);
      ctx.lineTo(rightDividerX, h);
      ctx.stroke();

      // Draw Jump & Duck Threshold Horizontal Lines
      if (base) {
        const jumpY = (base.y - jumpThresh) * h;
        const duckY = (base.y + duckThresh) * h;

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.beginPath();
        ctx.moveTo(0, jumpY);
        ctx.lineTo(w, jumpY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.beginPath();
        ctx.moveTo(0, duckY);
        ctx.lineTo(w, duckY);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Skeleton & Active Body Anchor
      if (landmarks && landmarks.length > 24) {
        const connections: Array<[number, number]> = [
          [11, 12],
          [11, 13],
          [13, 15],
          [12, 14],
          [14, 16],
          [11, 23],
          [12, 24],
          [23, 24],
        ];
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        connections.forEach(([a, b]) => {
          const lmA = landmarks[a];
          const lmB = landmarks[b];
          if ((lmA.visibility ?? 1) > 0.3 && (lmB.visibility ?? 1) > 0.3) {
            ctx.beginPath();
            ctx.moveTo((1 - lmA.x) * w, lmA.y * h);
            ctx.lineTo((1 - lmB.x) * w, lmB.y * h);
            ctx.stroke();
          }
        });

        // Glowing body center anchor point
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx * w, cy * h, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glowing Left Crio-Cyan & Right Solar-Orange Fists with Live Punch-Extension Charge Arc (Landmarks 15 & 16)
        [
          {
            lm: landmarks[15],
            active: leftPunchAnimRef.current > 0,
            charge: fistChargeRef.current.left / 100,
            baseColor: '#06b6d4',
            activeColor: '#22d3ee',
          },
          {
            lm: landmarks[16],
            active: rightPunchAnimRef.current > 0,
            charge: fistChargeRef.current.right / 100,
            baseColor: '#f97316',
            activeColor: '#fb7185',
          },
        ].forEach(({ lm, active, charge, baseColor, activeColor }) => {
          if (lm && (lm.visibility ?? 0) > 0.35) {
            const fx = (1 - lm.x) * w;
            const fy = lm.y * h;
            const clampedCharge = Math.max(0, Math.min(1, charge));

            // Outer ring showing fist readiness toward punch threshold
            ctx.strokeStyle = 'rgba(255,255,255,0.22)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(fx, fy, 11, 0, Math.PI * 2);
            ctx.stroke();

            if (clampedCharge > 0.08) {
              ctx.strokeStyle = clampedCharge >= 0.9 || active ? '#facc15' : baseColor;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(fx, fy, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clampedCharge);
              ctx.stroke();
            }

            ctx.fillStyle = active ? activeColor : baseColor;
            ctx.beginPath();
            ctx.arc(fx, fy, active ? 8 : 5, 0, Math.PI * 2);
            ctx.fill();
            if (active) {
              ctx.strokeStyle = '#fef08a';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        });
      }

      // Action Feedback Text
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(6, h - 24, w - 12, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(actionText, w / 2, h - 11);
    },
    []
  );

  const startPoseCamera = async () => {
    if (!videoRef.current) return;
    setCameraLoading(true);
    setCameraError(null);
    setCvCalibrationStatus('calibrating');
    baselineSamplesRef.current = [];
    baselineRef.current = null;
    smoothedCvRef.current = null;

    try {
      const PoseCtor =
        mpPose.Pose ||
        (mpPose as unknown as { default?: { Pose?: typeof mpPose.Pose } }).default?.Pose ||
        (window as unknown as { Pose?: typeof mpPose.Pose }).Pose;
      if (!PoseCtor) {
        throw new Error('MediaPipe Pose constructor not available');
      }

      const pose = new PoseCtor({
        locateFile: (file) => `/mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });

      pose.onResults((results: PoseResults) => {
        const lms = results.poseLandmarks;
        if (!lms || lms.length < 13) {
          setPoseDetected(false);
          drawCvOverlay(null, 0.5, 0.5, 'Buscando cuerpo...');
          return;
        }

        setPoseDetected(true);

        const nose = lms[0];
        const leftShoulder = lms[11];
        const rightShoulder = lms[12];
        const shouldersInsideFrame =
          (leftShoulder.visibility ?? 0) > 0.45 &&
          (rightShoulder.visibility ?? 0) > 0.45 &&
          leftShoulder.x > 0.04 &&
          leftShoulder.x < 0.96 &&
          rightShoulder.x > 0.04 &&
          rightShoulder.x < 0.96;

        // Stable mirrored anchor: blend nose + shoulders when fully inside frame, nose-only near edges to avoid jump
        const noseMirroredX = Math.max(0.02, Math.min(0.98, 1 - nose.x));
        const shoulderMirroredX = 1 - (leftShoulder.x + rightShoulder.x) / 2;
        const instantX = shouldersInsideFrame
          ? shoulderMirroredX * 0.6 + noseMirroredX * 0.4
          : noseMirroredX;
        const instantY = shouldersInsideFrame
          ? ((leftShoulder.y + rightShoulder.y) / 2) * 0.65 + nose.y * 0.35
          : nose.y;

        // Smooth with EMA filter to prevent edge jitter
        const prevSmooth = smoothedCvRef.current;
        const rawX = prevSmooth ? prevSmooth.x * 0.5 + instantX * 0.5 : instantX;
        const rawY = prevSmooth ? prevSmooth.y * 0.5 + instantY * 0.5 : instantY;
        smoothedCvRef.current = { x: rawX, y: rawY };

        // Calibration sampling (first 15 stable frames)
        if (!baselineRef.current) {
          baselineSamplesRef.current.push({ x: rawX, y: rawY });
          if (baselineSamplesRef.current.length >= 15) {
            const avgX =
              baselineSamplesRef.current.reduce((acc, p) => acc + p.x, 0) /
              baselineSamplesRef.current.length;
            const avgY =
              baselineSamplesRef.current.reduce((acc, p) => acc + p.y, 0) /
              baselineSamplesRef.current.length;
            baselineRef.current = {
              x: Math.max(0.32, Math.min(0.68, avgX)),
              y: Math.max(0.25, Math.min(0.75, avgY)),
            };
            setCvCalibrationStatus('ready');
          }
          drawCvOverlay(lms, rawX, rawY, 'Calibrando postura...');
          return;
        }

        const base = baselineRef.current;
        const dx = rawX - base.x;
        const dy = rawY - base.y;

        const laneThresh = cvSensitivityRef.current ? 0.08 : 0.13;
        const hysteresis = 0.012;
        const jumpThresh = cvSensitivityRef.current ? 0.065 : 0.095;
        const duckThresh = cvSensitivityRef.current ? 0.075 : 0.115;

        // 1. Clean 3-Zone Horizontal Lane Detection (never locks at edges)
        let targetLane: RunnerLane = lastCvLaneRef.current;
        if (dx < -(laneThresh - (lastCvLaneRef.current === -1 ? hysteresis : 0))) {
          targetLane = -1;
        } else if (dx > laneThresh - (lastCvLaneRef.current === 1 ? hysteresis : 0)) {
          targetLane = 1;
        } else {
          targetLane = 0;
        }

        if (targetLane !== lastCvLaneRef.current) {
          lastCvLaneRef.current = targetLane;
          setLaneDirect(targetLane);
        }

        // 2. Determine Jump / Duck from Vertical Displacement & Velocity
        const now = performance.now();
        const prevY = prevBodyYRef.current ?? rawY;
        const velY = rawY - prevY;
        prevBodyYRef.current = rawY;

        let posture: RunnerPosture = 'neutral';
        if (dy < -jumpThresh || (velY < -0.04 && dy < -0.02)) {
          posture = 'jump';
          if (now - lastJumpTriggerRef.current > 380) {
            lastJumpTriggerRef.current = now;
            triggerJump();
          }
        } else if (dy > duckThresh || (velY > 0.045 && dy > 0.025)) {
          posture = 'duck';
          if (now - lastDuckTriggerRef.current > 350) {
            lastDuckTriggerRef.current = now;
            triggerDuck();
          }
        }
        currentPostureRef.current = posture;

        // 3. Refined Scale-Invariant Fist / Punch Detection anchored to Shoulder Width & Elbow Snap
        let punchText = '';
        const shoulderWidth = Math.max(
          0.12,
          Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y)
        );
        const detectHandPunch = (
          hand: 'left' | 'right',
          wrist: NormalizedLandmark | undefined,
          elbow: NormalizedLandmark | undefined,
          knuckle: NormalizedLandmark | undefined,
          shoulder: NormalizedLandmark | undefined,
          lastAtRef: React.MutableRefObject<number>
        ) => {
          if (
            !wrist ||
            !shoulder ||
            (wrist.visibility ?? 0) < 0.45 ||
            (shoulder.visibility ?? 0) < 0.45
          ) {
            prevWristsRef.current[hand] = null;
            fistChargeRef.current[hand] = 0;
            return false;
          }

          // Blend wrist + index knuckle if visible so closed fist center is tighter
          const fistX = knuckle && (knuckle.visibility ?? 0) > 0.45 ? wrist.x * 0.65 + knuckle.x * 0.35 : wrist.x;
          const fistY = knuckle && (knuckle.visibility ?? 0) > 0.45 ? wrist.y * 0.65 + knuckle.y * 0.35 : wrist.y;
          const fistZ = knuckle && (knuckle.visibility ?? 0) > 0.45 ? (wrist.z ?? 0) * 0.65 + (knuckle.z ?? 0) * 0.35 : (wrist.z ?? 0);

          const relX = fistX - shoulder.x;
          const relY = fistY - shoulder.y;
          const rawRelZ = (shoulder.z ?? 0) - fistZ;
          // Normalize Z forward reach by shoulder width so combos detect accurately at any camera distance
          const normZ = rawRelZ / Math.max(0.18, shoulderWidth * 1.15);
          const armSpan = Math.hypot(relX, relY) / shoulderWidth;
          const elbowExtended =
            !elbow || (elbow.visibility ?? 0) < 0.4
              ? true
              : Math.hypot(fistX - elbow.x, fistY - elbow.y) / shoulderWidth > 0.42;

          const prev = prevWristsRef.current[hand];
          const effectiveThresh = punchZThresholdRef.current * 1.15; // Default 0.30 -> 0.345 normalized
          const retractThreshold = Math.max(0.10, effectiveThresh * 0.56); // Schmitt hysteresis reset

          const smoothedNormZ = prev ? prev.smoothedNormZ * 0.38 + normZ * 0.62 : normZ;
          const smoothedSpan = prev ? prev.smoothedSpan * 0.45 + armSpan * 0.55 : armSpan;

          // Update live visual fist charge % for HUD & CV overlay
          const liveRatio = Math.max(0, Math.min(1, smoothedNormZ / Math.max(0.15, effectiveThresh)));
          fistChargeRef.current[hand] = Math.round(liveRatio * 100);

          // Extended stays latched until fist retracts below retractThreshold
          let nextExtended = prev ? prev.extended : smoothedNormZ > effectiveThresh;
          if (!nextExtended && smoothedNormZ > effectiveThresh) {
            nextExtended = true;
          } else if (nextExtended && smoothedNormZ < retractThreshold) {
            nextExtended = false;
          }

          const relSpeed2d = prev ? Math.hypot(relX - prev.relX, relY - prev.relY) : 0;
          const zDelta = prev ? normZ - prev.smoothedNormZ : 0;
          const spanDelta = prev ? armSpan - prev.smoothedSpan : 0;
          const maxGuardY = Math.min(0.42, Math.max(0.22, 0.34 * (shoulderWidth / 0.24)));
          const fistRaised = relY < maxGuardY;

          const zThrust = !prev?.extended && nextExtended && zDelta > 0.024;
          const snapJab = zDelta > 0.055 && smoothedNormZ > effectiveThresh * 0.66 && elbowExtended;
          const rapidHookThrust =
            (relSpeed2d > 0.085 || spanDelta > 0.22) && relY < maxGuardY * 0.78 && elbowExtended;

          prevWristsRef.current[hand] = {
            relX,
            relY,
            smoothedNormZ,
            smoothedSpan,
            extended: nextExtended,
          };

          if (
            (gameStateRef.current === 'PLAYING' || showComboMenuRef.current) &&
            fistRaised &&
            (zThrust || snapJab || rapidHookThrust) &&
            now - lastAtRef.current > 250
          ) {
            lastAtRef.current = now;
            triggerPunch(hand);
            return true;
          }
          return false;
        };

        const leftHit = detectHandPunch('left', lms[15], lms[13], lms[19], leftShoulder, lastLeftPunchAtRef);
        const rightHit = detectHandPunch('right', lms[16], lms[14], lms[20], rightShoulder, lastRightPunchAtRef);
        if (leftHit && rightHit) {
          punchText = ' · DOBLE PUÑO';
        } else if (leftHit) {
          punchText = ' · JAB IZQ';
        } else if (rightHit) {
          punchText = ' · RECTO DER';
        }

        const laneText = targetLane === -1 ? 'Izquierda' : targetLane === 1 ? 'Derecha' : 'Centro';
        const postureText =
          posture === 'jump' ? ' · SALTO' : posture === 'duck' ? ' · AGACHADO' : '';
        const label = `${laneText}${postureText}${punchText}`;
        setCvActionLabel(label);

        if (showCvPreviewRef.current) {
          drawCvOverlay(lms, rawX, rawY, label);
        }
      });

      mpPoseRef.current = pose;

      const CameraCtor =
        mpCamera.Camera ||
        (mpCamera as unknown as { default?: { Camera?: typeof mpCamera.Camera } }).default?.Camera ||
        (window as unknown as { Camera?: typeof mpCamera.Camera }).Camera;
      if (!CameraCtor) {
        throw new Error('MediaPipe Camera constructor not available');
      }

      const camera = new CameraCtor(videoRef.current, {
        onFrame: async () => {
          if (isProcessingPoseRef.current) return;
          if (videoRef.current && mpPoseRef.current && videoRef.current.readyState >= 2) {
            isProcessingPoseRef.current = true;
            try {
              await mpPoseRef.current.send({ image: videoRef.current });
            } catch {
              // Ignore dropped frame errors
            } finally {
              isProcessingPoseRef.current = false;
            }
          }
        },
        width: 480,
        height: 360,
      });

      await camera.start();
      mpCameraRef.current = camera;
      setIsCameraActive(true);
      isCameraActiveRef.current = true;
      setCameraLoading(false);
    } catch (err) {
      console.error('Pose camera error:', err);
      setCameraError(
        'No se pudo iniciar la cámara de cuerpo completo. Puedes jugar con las flechas del teclado o deslizando en pantalla.'
      );
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
      setCameraLoading(false);
      setCvCalibrationStatus('idle');
    }
  };

  const stopPoseCamera = useCallback(() => {
    if (mpCameraRef.current) {
      mpCameraRef.current.stop();
      mpCameraRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((tr) => tr.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    isCameraActiveRef.current = false;
    setPoseDetected(false);
    setCvCalibrationStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      stopPoseCamera();
    };
  }, [stopPoseCamera]);

  // Touch Swipe Controls on Stage
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      moveLane(dx > 0 ? 1 : -1);
    } else {
      if (dy < 0) triggerJump();
      else triggerDuck();
    }
  };

  return (
    <div
      ref={containerRef}
      id="metro-runner-container"
      className={`w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4'
          : 'max-w-5xl mx-auto flex flex-col'
      }`}
    >
      {/* Top Runner Telemetry Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-t-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="block text-[11px] font-medium text-slate-400">Puntaje</span>
            <span className="font-mono-num text-2xl font-bold text-cyan-300">{score}</span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="block text-[11px] font-medium text-slate-400">Distancia</span>
            <span className="font-mono-num text-xl font-bold text-white">{distance} m</span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="block text-[11px] font-medium text-slate-400">Monedas (Banco)</span>
            <span className="font-mono-num text-xl font-bold text-amber-400">
              {coins} <span className="text-xs text-slate-400">({coinWallet})</span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block" />

          <div className="hidden md:block">
            <span className="block text-[11px] font-medium text-slate-400">Velocidad</span>
            <div className="flex items-baseline gap-1 font-mono-num">
              <span className="text-lg font-semibold text-emerald-400">
                {speedFactor.toFixed(1)}x
              </span>
              <span className="text-[11px] text-slate-500">/ {maxSpeedMultiplier.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Active Power-Up Indicators & Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeShield && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-xs font-semibold text-emerald-300">
              <Shield className="w-3.5 h-3.5" />
              <span>Escudo Activo</span>
            </div>
          )}

          {magnetRemaining > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/35 text-xs font-semibold text-cyan-300 font-mono-num">
              <Magnet className="w-3.5 h-3.5" />
              <span>Imán {magnetRemaining}s</span>
            </div>
          )}

          {multiplierRemaining > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-xs font-semibold text-amber-300 font-mono-num">
              <Zap className="w-3.5 h-3.5" />
              <span>x2 Puntos {multiplierRemaining}s</span>
            </div>
          )}

          <button
            onClick={() => {
              if (gameStateRef.current === 'PLAYING') {
                pausedForCraftMenuRef.current = true;
                togglePause();
              } else {
                pausedForCraftMenuRef.current = false;
              }
              setShowCraftMenu(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 transition whitespace-nowrap shrink-0"
            title="Usa monedas para puntuar y forjar Elementos Creados"
          >
            <Hammer className="w-4 h-4" />
            <span>Taller Monedas ({coinWallet})</span>
          </button>

          <button
            onClick={() => {
              if (gameStateRef.current === 'PLAYING') {
                pausedForComboMenuRef.current = true;
                togglePause();
              } else {
                pausedForComboMenuRef.current = false;
              }
              setShowComboMenu(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition whitespace-nowrap shrink-0"
            title="Ver poderes de cada brazo y combos de boxeo"
          >
            <BookOpen className="w-4 h-4" />
            <span>Combos y Poderes</span>
          </button>

          <button
            onClick={() => {
              if (gameStateRef.current === 'PLAYING') {
                pausedForMusicBankRef.current = true;
                togglePause();
              } else {
                pausedForMusicBankRef.current = false;
              }
              setShowMusicBank(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/40 hover:bg-fuchsia-500/25 transition whitespace-nowrap shrink-0"
            title="Escucha el banco de canciones con voz y ritmo casual antes de aplicarlo"
          >
            <Music className="w-4 h-4" />
            <span>Banco Musical</span>
          </button>

          <button
            onClick={() => (isCameraActive ? stopPoseCamera() : startPoseCamera())}
            disabled={cameraLoading}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap shrink-0 ${
              isCameraActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <CameraIcon className="w-4 h-4" />
            <span>
              {cameraLoading
                ? 'Iniciando CV...'
                : isCameraActive
                ? poseDetected
                  ? 'Cámara CV Activa'
                  : 'Buscando Cuerpo...'
                : 'Activar Cámara CV'}
            </span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition whitespace-nowrap shrink-0"
            title="Pantalla Completa (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Ventana' : 'Completa'}</span>
          </button>
        </div>
      </div>

      {/* 3D Runner Stage */}
      <div
        ref={stageRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full bg-slate-950 border-x border-b border-slate-800 ${
          isFullscreen ? 'flex-1 rounded-2xl my-2' : 'aspect-[16/9] max-h-[600px] rounded-b-2xl'
        } overflow-hidden shadow-2xl`}
      >
        {/* Hidden webcam source */}
        <video ref={videoRef} className="hidden" playsInline muted />

        {/* Top-Left Level, Environment, Collected Letters & Quick Created Elements */}
        <div className="absolute top-3.5 left-3.5 z-20 flex flex-col gap-2 max-w-[260px]">
          <div className="w-fit pointer-events-none bg-slate-950/90 border border-white/15 rounded-xl px-3.5 py-2.5 shadow-xl">
            <div className="flex items-center gap-2 mb-1.5 text-[11px] font-bold">
              <span className="uppercase tracking-wider text-slate-300">Nivel {levelNumber}</span>
              <span className="text-slate-600">·</span>
              <span style={{ color: ENVIRONMENT_THEMES[currentEnv].badgeColor }}>
                {ENVIRONMENT_THEMES[currentEnv].label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {currentWord.split('').map((ch, idx) => {
                const isCollected = collectedMask[idx];
                const [r, g, b] = sampleGoldOrangeGreenRgb((rgbPhase + idx * 0.14) % 1);
                return (
                  <span
                    key={`${currentWord}-${idx}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-base font-extrabold border transition-all"
                    style={
                      isCollected
                        ? {
                            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.26)`,
                            borderColor: `rgb(${r}, ${g}, ${b})`,
                            color: `rgb(${r}, ${g}, ${b})`,
                            boxShadow: `0 0 14px rgba(${r}, ${g}, ${b}, 0.55)`,
                          }
                        : {
                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                            borderColor: 'rgba(71, 85, 105, 0.75)',
                            color: 'rgba(148, 163, 184, 0.45)',
                          }
                    }
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Usable Crafted Elements Quick Bar (1 / 2 / 3) */}
          {gameState === 'PLAYING' && (
            <div className="flex flex-wrap gap-1.5 pointer-events-auto">
              {CRAFTED_ELEMENTS.map((el) => {
                const qty = craftedInventory[el.id] || 0;
                return (
                  <button
                    key={el.id}
                    onClick={() => useCraftedElement(el.id)}
                    disabled={qty <= 0}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                      qty > 0
                        ? 'bg-slate-950/92 text-white hover:bg-slate-800 active:scale-95 shadow-lg'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800 cursor-not-allowed'
                    }`}
                    style={qty > 0 ? { borderColor: el.color } : undefined}
                    title={`Usar ${el.name} (Tecla ${el.hotkey})`}
                  >
                    <kbd className="px-1 rounded bg-slate-800 text-[10px] text-amber-300">{el.hotkey}</kbd>
                    <span>{el.shortName}</span>
                    <span className="font-mono-num text-emerald-300">×{qty}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Left & Right Slim Vertical Bars (Unobstructed Center Track) */}
        {gameState === 'PLAYING' && (() => {
          const powerPct = Math.min(100, (powerMeter / POWER_METER_MAX) * 100);
          const remainingToThreshold = Math.max(0, POWER_METER_MAX - powerMeter);
          const comboHint = getNextComboHint(comboSequence);
          return (
            <>
              {/* LEFT VERTICAL BAR: Carga de Poder & Umbral x10 (0 → 1,000) */}
              <div
                className={`absolute bottom-4 left-3 z-20 pointer-events-none w-[66px] sm:w-[74px] bg-slate-950/92 rounded-2xl px-2 py-2.5 shadow-2xl border-2 flex flex-col items-center gap-1.5 transition-colors ${
                  overdriveActive
                    ? 'border-amber-400 shadow-amber-500/35'
                    : powerPct >= 80
                    ? 'border-amber-400/75'
                    : 'border-cyan-500/45'
                }`}
              >
                <div className="text-center leading-tight">
                  <div className="flex items-center justify-center gap-0.5">
                    <Zap
                      className={`w-3 h-3 shrink-0 ${
                        overdriveActive ? 'text-amber-300 animate-pulse' : 'text-cyan-400'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider ${
                        overdriveActive ? 'text-amber-300' : 'text-cyan-200'
                      }`}
                    >
                      {overdriveActive ? 'x10!' : 'PODER'}
                    </span>
                  </div>
                  <span className="block font-mono-num text-[10px] font-black text-amber-300">
                    {powerMeter}
                  </span>
                </div>

                {/* Threshold Badge at Top of Bar */}
                <span className="px-1 py-0.5 rounded bg-amber-400/20 border border-amber-300/60 text-[8px] font-black text-amber-200 leading-none">
                  {overdriveActive ? `${overdriveRemaining}s` : '1,000'}
                </span>

                {/* Vertical Bottom-to-Top Power Fill Column */}
                <div className="relative w-5 sm:w-6 h-28 sm:h-36 rounded-full bg-slate-800/95 overflow-hidden border border-slate-600/80 flex flex-col justify-end">
                  <div
                    className="w-full transition-all duration-100 rounded-full"
                    style={{
                      height: `${powerPct}%`,
                      background: overdriveActive
                        ? 'linear-gradient(0deg, #f59e0b, #facc15, #fef08a)'
                        : powerPct >= 80
                        ? 'linear-gradient(0deg, #06b6d4, #f59e0b, #facc15)'
                        : 'linear-gradient(0deg, #0284c7, #06b6d4, #22d3ee)',
                      boxShadow: overdriveActive
                        ? '0 0 16px rgba(250, 204, 21, 0.9)'
                        : '0 0 12px rgba(34, 211, 238, 0.65)',
                    }}
                  />
                  {[25, 50, 75].map((pct) => (
                    <div
                      key={pct}
                      className="absolute left-0 right-0 h-px bg-slate-950/80"
                      style={{ bottom: `${pct}%` }}
                    />
                  ))}
                </div>

                <div className="text-center leading-tight">
                  <span
                    className={`block text-[8px] font-black uppercase ${
                      overdriveActive ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {overdriveActive ? 'INMORTAL' : 'INVULN+x10'}
                  </span>
                  <span className="block font-mono-num text-[9px] text-slate-300">
                    {overdriveActive ? 'ACTIVO' : `-${remainingToThreshold}`}
                  </span>
                </div>

                {/* Live Left Fist (Nieve) Charge */}
                <div className="w-full pt-1 border-t border-slate-800 flex items-center justify-between gap-1">
                  <Snowflake className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-mono-num text-[9px] font-bold text-cyan-300">
                    {fistCharge.left}%
                  </span>
                </div>
              </div>

              {/* RIGHT VERTICAL BAR: Combo Actual & Secuencia de Puños */}
              <div
                className={`absolute top-16 right-3 z-20 pointer-events-none w-[78px] sm:w-[88px] bg-slate-950/92 rounded-2xl px-2 py-2.5 shadow-2xl border-2 flex flex-col items-center gap-1.5 transition-colors ${
                  activeComboName
                    ? 'border-emerald-400 shadow-emerald-500/30'
                    : comboSequence.length > 0
                    ? 'border-amber-400/75'
                    : 'border-slate-700/80'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  COMBO ACTUAL
                </span>

                {/* Active Combo Badge or Current State */}
                <div
                  className={`w-full px-1 py-1 rounded-lg border text-center text-[9px] font-black leading-tight min-h-[28px] flex items-center justify-center ${
                    activeComboName
                      ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-200'
                      : comboSequence.length > 0
                      ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="line-clamp-2">
                    {activeComboName
                      ? activeComboName.replace(' · ¡ROMPE OBSTÁCULOS!', '')
                      : comboSequence.length > 0
                      ? `CADENA x${comboSequence.length}`
                      : 'LISTO'}
                  </span>
                </div>

                {/* 4 Vertical Punch Slots + Vertical Chain Timer Bar Side-by-Side */}
                <div className="w-full flex items-stretch gap-1.5">
                  <div className="flex-1 flex flex-col gap-1">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const punchedHand = comboSequence[slotIdx];
                      const isNextPreview =
                        !punchedHand &&
                        slotIdx === comboSequence.length &&
                        comboHint.nextHand !== null;
                      return (
                        <div
                          key={slotIdx}
                          className={`h-6 rounded-md border flex items-center justify-center gap-0.5 text-[9px] font-black transition-all ${
                            punchedHand === 'left'
                              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                              : punchedHand === 'right'
                              ? 'bg-orange-500/25 border-orange-400 text-orange-200 shadow-sm shadow-orange-500/30'
                              : isNextPreview
                              ? 'bg-slate-900/90 border-dashed border-amber-400/60 text-amber-300/85'
                              : 'bg-slate-900/60 border-slate-800 text-slate-600'
                          }`}
                        >
                          {punchedHand === 'left' ? (
                            <>
                              <Snowflake className="w-2.5 h-2.5" />
                              <span>IZQ</span>
                            </>
                          ) : punchedHand === 'right' ? (
                            <>
                              <Flame className="w-2.5 h-2.5" />
                              <span>DER</span>
                            </>
                          ) : isNextPreview ? (
                            <span>+{comboHint.nextHand === 'left' ? 'IZQ' : 'DER'}</span>
                          ) : (
                            <span>·</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Vertical Combo Window Timer Fill */}
                  <div
                    className="w-2 rounded-full bg-slate-800 overflow-hidden flex flex-col justify-end border border-slate-700/70"
                    title="Ventana de tiempo del combo"
                  >
                    <div
                      className="w-full transition-all duration-75 rounded-full"
                      style={{
                        height: `${comboWindowPct}%`,
                        backgroundColor:
                          comboWindowPct > 45
                            ? '#22d3ee'
                            : comboWindowPct > 20
                            ? '#facc15'
                            : '#fb7185',
                      }}
                    />
                  </div>
                </div>

                {/* Next Step Hint */}
                <span className="text-[8px] font-bold text-slate-300 text-center leading-tight line-clamp-2">
                  {comboSequence.length > 0 && comboHint.nextHand
                    ? `Sig: ${comboHint.nextHand === 'left' ? 'IZQ (K)' : 'DER (J)'}`
                    : 'K=Izq · J=Der'}
                </span>

                {/* Live Right & Left Fist Thrust Meters */}
                <div className="w-full pt-1 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <Flame className="w-3 h-3 text-orange-400 shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full transition-all duration-75 rounded-full"
                        style={{
                          width: `${fistCharge.right}%`,
                          backgroundColor: fistCharge.right >= 90 ? '#facc15' : '#f97316',
                        }}
                      />
                    </div>
                    <span className="font-mono-num text-[8px] font-bold text-orange-300 w-6 text-right">
                      {fistCharge.right}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <Snowflake className="w-3 h-3 text-cyan-400 shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full transition-all duration-75 rounded-full"
                        style={{
                          width: `${fistCharge.left}%`,
                          backgroundColor: fistCharge.left >= 90 ? '#facc15' : '#22d3ee',
                        }}
                      />
                    </div>
                    <span className="font-mono-num text-[8px] font-bold text-cyan-300 w-6 text-right">
                      {fistCharge.left}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Top-Center Boss Battle Health Bar & Interactive Tactical Prompt HUD */}
        {bossActive && !bossIntroActive && gameState === 'PLAYING' && (
          <div
            className={`absolute top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-[320px] sm:w-[430px] bg-slate-950/95 border-2 rounded-2xl px-4 py-3 shadow-2xl transition-colors ${
              bossTelegraphLane !== null
                ? 'border-rose-500'
                : bossEnraged
                ? 'border-orange-500'
                : 'border-white/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Swords className="w-4 h-4 shrink-0" style={{ color: bossAccentColor }} />
                <div className="min-w-0">
                  <span className="block font-display text-xs sm:text-sm font-extrabold text-white truncate">
                    {bossName}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400 truncate">
                    {bossTitle}
                  </span>
                </div>
              </div>
              <span
                className="font-mono-num text-xs sm:text-sm font-extrabold shrink-0"
                style={{ color: bossAccentColor }}
              >
                {bossHp}/{bossMaxHp} HP
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700 mb-1.5">
              <div
                className="h-full transition-all duration-150 rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, (bossHp / Math.max(1, bossMaxHp)) * 100))}%`,
                  backgroundColor: bossShielded ? '#f59e0b' : bossEnraged ? '#ef4444' : bossAccentColor,
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span
                className={`font-medium leading-tight ${
                  bossTelegraphLane !== null
                    ? 'text-rose-300 font-bold'
                    : bossStaggered
                    ? 'text-emerald-300 font-bold'
                    : 'text-slate-200'
                }`}
              >
                {bossTelegraphLane !== null
                  ? `¡ATACA CARRIL ${
                      bossTelegraphLane === -1 ? 'IZQUIERDO' : bossTelegraphLane === 0 ? 'CENTRO' : 'DERECHO'
                    }! · ¡CONTRAATACA CON J / COMBO!`
                  : bossStaggered
                  ? '¡JEFE ATURDIDO! ¡GOLPEA CON TODO AHORA!'
                  : bossPrompt}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {bossWeaknessBadge && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-200 font-bold text-[10px]">
                    {bossWeaknessBadge}
                  </span>
                )}
                {bossEnraged && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/60 text-rose-300 font-bold text-[10px]">
                    FURIA
                  </span>
                )}
                {bossShielded && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-[10px]">
                    ESCUDO
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Super Thematic Nightcore Monster Boss Intro Overlay */}
        {bossActive && bossIntroActive && gameState === 'PLAYING' && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center px-4 bg-slate-950/35">
            <div
              className="w-full max-w-lg bg-slate-950/95 border-2 rounded-2xl px-6 py-5 shadow-2xl text-center"
              style={{ borderColor: bossAccentColor, boxShadow: `0 0 54px ${bossAccentColor}66` }}
            >
              <div className="flex items-center justify-center gap-2 text-rose-400 font-extrabold text-xs tracking-[0.26em] uppercase mb-1.5 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span>¡PELIGRO MONSTER NIGHTCORE!</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              {bossIntroHeadline && (
                <p className="text-[11px] font-black tracking-[0.2em] uppercase text-amber-300 mb-1">
                  {bossIntroHeadline}
                </p>
              )}
              <h3
                className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight mb-1"
                style={{ color: bossAccentColor }}
              >
                {bossName}
              </h3>
              <p className="text-xs font-bold text-slate-300 mb-2.5">
                {bossTitle} · <span className="text-amber-300">{bossMaxHp} HP</span>
              </p>
              {bossWeaknessBadge && (
                <div
                  className="inline-block px-3 py-1 rounded-lg border text-[11px] font-black tracking-wider uppercase mb-2.5"
                  style={{
                    borderColor: bossAccentColor,
                    color: bossAccentColor,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  }}
                >
                  {bossWeaknessBadge}
                </div>
              )}
              <p className="text-xs text-slate-100 font-semibold leading-relaxed border-t border-slate-800 pt-2.5">
                {bossWeaknessHint || bossDangerWarning}
              </p>
            </div>
          </div>
        )}

        {/* Level Complete / Speed Tier Banner */}
        {bannerMessage && gameState === 'PLAYING' && (
          <div
            className={`absolute ${
              bossActive ? 'top-28' : 'top-5'
            } left-1/2 -translate-x-1/2 z-20 pointer-events-none px-5 py-2 rounded-xl bg-slate-950/92 border border-amber-400/50 shadow-xl text-center`}
          >
            <span className="font-display text-sm sm:text-base font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
              {bannerMessage}
            </span>
          </div>
        )}

        {/* Distinct Snowball (Left) & Fireball (Right) Punch Buttons + Action Flash during Gameplay */}
        {gameState === 'PLAYING' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <button
              onClick={() => triggerPunch('left')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-slate-950 font-extrabold text-xs border border-cyan-300/60 shadow-xl transition"
              title="Bola de Nieve Crio (K / CV Brazo Izq)"
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>Nieve (K)</span>
            </button>
            <button
              onClick={() => triggerPunch('right')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-extrabold text-xs border border-amber-300/60 shadow-xl transition"
              title="Bola de Fuego Solar (J / CV Brazo Der)"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Fuego (J)</span>
            </button>
            {punchFlashLabel && (
              <span className="px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-xs shadow">
                {punchFlashLabel}
              </span>
            )}
          </div>
        )}

        {/* WebGL Fallback */}
        {webglError && (
          <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Contexto 3D WebGL no disponible</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Tu navegador suspendió la aceleración gráfica WebGL. Recarga la página o habilita la aceleración por hardware.
            </p>
          </div>
        )}

        {/* Camera Warning */}
        {cameraError && (
          <div className="absolute bottom-28 left-4 right-4 sm:right-auto sm:max-w-md z-20 bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Live CV Pose Preview PIP (Bottom-Right) */}
        {isCameraActive && showCvPreview && (
          <div className="absolute bottom-4 right-4 z-20 w-52 sm:w-60 rounded-xl overflow-hidden border border-white/15 bg-slate-950/85 backdrop-blur-md shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 text-[11px] font-medium text-slate-300">
              <span>Seguimiento CV</span>
              <span className="text-cyan-300 font-semibold">{cvActionLabel}</span>
            </div>
            <canvas ref={poseCanvasRef} width={240} height={180} className="w-full h-auto block" />
          </div>
        )}

        {/* In-game Floating Pause/Restart Controls */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {isCameraActive && (
              <button
                onClick={recalibratePose}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/75 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-white/10 backdrop-blur-md transition"
                title="Recalibrar postura neutral (C)"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Recalibrar (C)</span>
              </button>
            )}
            <button
              onClick={togglePause}
              className="p-2.5 rounded-xl bg-slate-900/75 hover:bg-slate-800 text-slate-200 border border-white/10 backdrop-blur-md transition"
              title="Pausar (P)"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={startGame}
              className="p-2.5 rounded-xl bg-slate-900/75 hover:bg-slate-800 text-slate-200 border border-white/10 backdrop-blur-md transition"
              title="Reiniciar (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* READY / START OVERLAY */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 z-30 bg-slate-950/88 flex flex-col items-center justify-center p-4 sm:p-5 overflow-y-auto text-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center mb-2.5 shadow-xl shadow-cyan-500/20 shrink-0">
              <Zap className="w-6 h-6 text-slate-950" />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
              Metro Runner CV
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-3.5 leading-snug">
              Esquiva trenes, recoge letras 3D para cambiar de mundo y cada 3 niveles enfrenta a un Jefe lejano lanzando puños con tu cámara CV o teclado.
            </p>

            {/* Movement Guide Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl w-full mb-3 text-left">
              <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold mb-0.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Carriles</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">Muévete a izquierda o derecha frente a la cámara</p>
              </div>

              <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold mb-0.5">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Saltar</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">Salta o sube a los techos de los trenes</p>
              </div>

              <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold mb-0.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Rodar</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">Agáchate bajo vigas o rompe escudos térmicos</p>
              </div>

              <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold mb-0.5">
                  <Swords className="w-3.5 h-3.5" />
                  <span>Puños CV · Jefes</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">Empuja puños al frente o usa K (Izq) y J (Der)</p>
              </div>
            </div>

            {/* Compact Special Gesture Combos Preview Strip */}
            <div className="max-w-2xl w-full bg-slate-900/95 border border-amber-500/30 rounded-xl px-3 py-2 mb-3.5 text-left">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Comandos de Gestos Especiales Detectados (CV / K · J)
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {Object.keys(practicedCombos).length}/{BOXING_COMBOS.length} practicados
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BOXING_COMBOS.map((combo) => (
                  <div
                    key={combo.id}
                    className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold truncate" style={{ color: combo.color }}>
                        {combo.name}
                      </span>
                      {practicedCombos[combo.id] && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {combo.sequence.map((hand, idx) => (
                        <React.Fragment key={idx}>
                          <span
                            className={`px-1 py-0.5 rounded text-[9px] font-black ${
                              hand === 'left'
                                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                                : 'bg-orange-500/20 text-orange-200 border border-orange-500/40'
                            }`}
                          >
                            {hand === 'left' ? 'IZQ' : 'DER'}
                          </span>
                          {idx < combo.sequence.length - 1 && (
                            <span className="text-[9px] text-slate-500">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isCameraActive && (
                <button
                  onClick={startPoseCamera}
                  disabled={cameraLoading}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-white transition whitespace-nowrap"
                >
                  <CameraIcon className="w-4 h-4 text-cyan-400" />
                  <span>{cameraLoading ? 'Conectando...' : 'Conectar Cámara CV'}</span>
                </button>
              )}

              <button
                id="btn-practice-combos"
                onClick={() => {
                  pausedForComboMenuRef.current = false;
                  setShowComboMenu(true);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-sm font-semibold text-amber-300 transition whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                <span>Practicar Gestos y Combos</span>
              </button>

              <button
                onClick={() => {
                  pausedForMusicBankRef.current = false;
                  setShowMusicBank(true);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/40 text-sm font-semibold text-fuchsia-300 transition whitespace-nowrap"
              >
                <Music className="w-4 h-4" />
                <span>Pre-escuchar Canciones</span>
              </button>

              <button
                id="btn-start-runner"
                onClick={startGame}
                className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 hover:brightness-110 transition active:scale-95 whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Empezar Carrera</span>
              </button>
            </div>
          </div>
        )}

        {/* PAUSED OVERLAY */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="font-display text-3xl font-bold text-white mb-2">Carrera en Pausa</h2>
            <p className="text-xs text-slate-400 mb-6">La música y los trenes están detenidos.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={togglePause}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition"
              >
                Reanudar
              </button>
              <button
                onClick={startGame}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition"
              >
                Reiniciar
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 z-30 bg-slate-950/88 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>

            <h2 className="font-display text-3xl font-bold text-white mb-1">Fin de la Carrera</h2>
            <p className="text-xs text-slate-400 mb-5">Chocaste con un obstáculo en la vía.</p>

            <div className="grid grid-cols-3 gap-3 max-w-md w-full bg-slate-900/90 border border-slate-800 p-4 rounded-2xl mb-4">
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Puntaje</span>
                <span className="font-mono-num text-2xl font-bold text-cyan-300">{score}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Distancia</span>
                <span className="font-mono-num text-2xl font-bold text-white">{distance} m</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Monedas</span>
                <span className="font-mono-num text-2xl font-bold text-amber-400">{coins}</span>
              </div>
            </div>

            <div className="flex items-center justify-between max-w-md w-full bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl mb-6 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Récord Runner:</span>
                <strong className="font-mono-num text-amber-400 text-sm">{highScore} pts</strong>
              </div>
              {highScore > 0 && (
                <button
                  onClick={onResetHighScore}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reiniciar</span>
                </button>
              )}
            </div>

            <button
              id="btn-retry-runner"
              onClick={startGame}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar Otra Vez</span>
            </button>
          </div>
        )}

        {/* PRE-GAME GESTURE VISUALIZER & INTERACTIVE COMBO PRACTICE ARENA */}
        {showComboMenu && (() => {
          const masteredCount = BOXING_COMBOS.filter((c) => practicedCombos[c.id]).length;
          const comboHint = getNextComboHint(comboSequence);
          const practicePowerPct = Math.min(100, (powerMeter / POWER_METER_MAX) * 100);
          return (
            <div className="absolute inset-0 z-40 bg-slate-950/96 flex flex-col p-4 sm:p-5 overflow-y-auto">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                      Entrenador de Gestos y Combos Especiales
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                      Dominados: {masteredCount}/{BOXING_COMBOS.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visualiza los gestos de puños CV y practícalos aquí antes de empezar la carrera (Cámara CV, teclas K / J o botones).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isCameraActive ? (
                    <button
                      onClick={startPoseCamera}
                      disabled={cameraLoading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-xs font-semibold text-cyan-300 border border-cyan-500/40 transition"
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      <span>{cameraLoading ? 'Conectando...' : 'Activar Cámara CV'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={recalibratePose}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-semibold text-emerald-300 border border-emerald-500/40 transition"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Cámara CV Activa · Recalibrar</span>
                    </button>
                  )}

                  {gameState !== 'PLAYING' && (
                    <button
                      onClick={startGame}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 font-bold text-xs shadow transition hover:brightness-110"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Empezar Carrera</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowComboMenu(false);
                      if (pausedForComboMenuRef.current) {
                        pausedForComboMenuRef.current = false;
                        togglePause();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                    <span>Cerrar</span>
                  </button>
                </div>
              </div>

              {/* Interactive Live Practice Arena */}
              <div className="bg-slate-900/95 border border-cyan-500/35 rounded-2xl p-3.5 mb-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                      Arena de Práctica en Vivo
                    </span>
                    {practiceFeedMsg && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/50 text-[11px] font-bold text-amber-200">
                        {practiceFeedMsg}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-practice-left"
                      onClick={() => triggerPunch('left')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/60 text-[11px] font-extrabold text-cyan-200 active:scale-95 transition"
                    >
                      <Snowflake className="w-3.5 h-3.5" />
                      <span>Simular Jab IZQ (K)</span>
                    </button>
                    <button
                      id="btn-practice-right"
                      onClick={() => triggerPunch('right')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/35 border border-orange-400/60 text-[11px] font-extrabold text-orange-200 active:scale-95 transition"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Simular Recto DER (J)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Live Sequence Slots + Window Timer */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                      <span>CADENA DETECTADA</span>
                      <span className="font-mono-num text-cyan-300">
                        {activeComboName ? `¡${activeComboName}!` : comboWindowPct > 0 ? `${comboWindowPct}%` : 'LISTA'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 mb-1.5">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const punchedHand = comboSequence[slotIdx];
                        const isNextPreview =
                          !punchedHand &&
                          slotIdx === comboSequence.length &&
                          comboHint.nextHand !== null;
                        return (
                          <div
                            key={slotIdx}
                            className={`h-7 rounded-lg border flex items-center justify-center gap-0.5 text-[10px] font-black transition-all ${
                              punchedHand === 'left'
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                                : punchedHand === 'right'
                                ? 'bg-orange-500/25 border-orange-400 text-orange-200'
                                : isNextPreview
                                ? 'bg-slate-900 border-dashed border-amber-400/60 text-amber-300/80'
                                : 'bg-slate-900/60 border-slate-800 text-slate-600'
                            }`}
                          >
                            {punchedHand === 'left'
                              ? 'IZQ'
                              : punchedHand === 'right'
                              ? 'DER'
                              : isNextPreview
                              ? `+${comboHint.nextHand === 'left' ? 'IZQ' : 'DER'}`
                              : '·'}
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full transition-all duration-75 rounded-full"
                        style={{
                          width: `${comboWindowPct}%`,
                          backgroundColor: comboWindowPct > 45 ? '#22d3ee' : comboWindowPct > 20 ? '#facc15' : '#fb7185',
                        }}
                      />
                    </div>
                  </div>

                  {/* Live Fist Extension Detection (Left & Right Arms) */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400">
                      EMPUJE DE PUÑO CV EN VIVO
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-cyan-300 w-14">IZQ ❄️</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full transition-all duration-75 rounded-full"
                          style={{
                            width: `${fistCharge.left}%`,
                            backgroundColor: fistCharge.left >= 90 ? '#facc15' : '#22d3ee',
                          }}
                        />
                      </div>
                      <span className="font-mono-num text-[10px] font-bold text-cyan-200 w-8 text-right">
                        {fistCharge.left}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-orange-300 w-14">DER 🔥</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full transition-all duration-75 rounded-full"
                          style={{
                            width: `${fistCharge.right}%`,
                            backgroundColor: fistCharge.right >= 90 ? '#facc15' : '#f97316',
                          }}
                        />
                      </div>
                      <span className="font-mono-num text-[10px] font-bold text-orange-200 w-8 text-right">
                        {fistCharge.right}%
                      </span>
                    </div>
                  </div>

                  {/* Practice Power Bar toward 1,000 Threshold */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-amber-300">UMBRAL x10 (PRÁCTICA)</span>
                      <span className="font-mono-num text-amber-200">
                        {powerMeter} / {POWER_METER_MAX}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700 mb-1.5">
                      <div
                        className="h-full transition-all duration-100 rounded-full"
                        style={{
                          width: `${practicePowerPct}%`,
                          background: 'linear-gradient(90deg, #0284c7, #06b6d4, #facc15)',
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Cada combo carga rápido hacia <strong className="text-amber-300">1,000</strong> (Invulnerable + Daño x10).
                    </p>
                  </div>
                </div>
              </div>

              {/* Gesture Command Visualizer Cards for Each Special Combo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                {BOXING_COMBOS.map((combo) => {
                  const isPracticed = Boolean(practicedCombos[combo.id]);
                  const matchesPrefix =
                    comboSequence.length > 0 &&
                    comboSequence.length <= combo.sequence.length &&
                    comboSequence.every((h, i) => combo.sequence[i] === h);
                  return (
                    <div
                      key={combo.id}
                      className={`rounded-xl p-3.5 border transition-colors ${
                        isPracticed
                          ? 'bg-emerald-950/30 border-emerald-500/60'
                          : matchesPrefix
                          ? 'bg-slate-900 border-amber-400/70'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-sm font-bold" style={{ color: combo.color }}>
                              {combo.name}
                            </span>
                            {isPracticed && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-bold text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                Practicado
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {combo.subtitle}
                            {combo.breaksObstacles ? ' · Rompe Obstáculos' : ''}
                            {combo.shattersShield ? ' · Rompe Escudos' : ''}
                            {combo.multiLane ? ' · 3 Carriles' : ''}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 font-mono-num text-[11px] font-bold text-amber-300 shrink-0">
                          +{combo.powerCharge} ⚡ · {combo.damage} daño
                        </span>
                      </div>

                      {/* Step-by-Step Visual Arm Gesture Sequence */}
                      <div className="flex items-center flex-wrap gap-1.5 bg-slate-950/85 border border-slate-800/90 rounded-lg p-2 mb-2">
                        {combo.sequence.map((hand, idx) => {
                          const stepHit = matchesPrefix && idx < comboSequence.length;
                          const isNextStep = matchesPrefix && idx === comboSequence.length;
                          return (
                            <React.Fragment key={idx}>
                              <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-extrabold transition-all ${
                                  stepHit
                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 scale-105'
                                    : isNextStep
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                    : hand === 'left'
                                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                                    : 'bg-orange-500/15 border-orange-500/40 text-orange-200'
                                }`}
                              >
                                {hand === 'left' ? (
                                  <Snowflake className="w-3 h-3 shrink-0" />
                                ) : (
                                  <Flame className="w-3 h-3 shrink-0" />
                                )}
                                <span>
                                  {hand === 'left' ? 'Puño IZQ (K)' : 'Puño DER (J)'}
                                </span>
                              </div>
                              {idx < combo.sequence.length - 1 && (
                                <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">{combo.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Arm Powers & 1,000 Threshold Reference Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['left', 'right'] as ArmHand[]).map((handKey) => {
                  const arm = ARM_POWERS[handKey];
                  return (
                    <div
                      key={handKey}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-display text-xs font-bold" style={{ color: arm.color }}>
                          {arm.name}
                        </span>
                        <span className="text-[10px] font-mono-num text-slate-300">
                          {arm.keyHint}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{arm.cvHint}</p>
                    </div>
                  );
                })}

                <div className="bg-amber-500/10 border border-amber-400/50 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-display text-xs font-bold text-amber-300">
                      {OVERDRIVE_CONFIG.title}
                    </span>
                    <span className="font-mono-num text-[10px] font-bold text-amber-200">
                      Umbral {POWER_METER_MAX}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 leading-snug">
                    Invulnerable {OVERDRIVE_CONFIG.durationSec}s + Daño x{OVERDRIVE_CONFIG.damageMultiplier} + rompe todo.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* COINS & CRAFTED ELEMENTS SHOP MODAL ("Taller de Monedas y Elementos Creados") */}
        {showCraftMenu && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col p-5 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>Taller de Monedas y Elementos Creados</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Banco actual: <strong className="text-amber-300 font-mono-num">{coinWallet} monedas</strong> · Cada moneda vale +50 pts al recogerla y sirve para crear elementos usables.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCraftMenu(false);
                  if (pausedForCraftMenuRef.current && gameStateRef.current === 'PAUSED') {
                    pausedForCraftMenuRef.current = false;
                    togglePause();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
              >
                <X className="w-4 h-4" />
                <span>Cerrar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {CRAFTED_ELEMENTS.map((el) => {
                const qty = craftedInventory[el.id] || 0;
                const canAfford = coinWallet >= el.cost;
                return (
                  <div
                    key={el.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-display text-sm font-bold" style={{ color: el.color }}>
                          {el.name}
                        </span>
                        <span className="font-mono-num text-xs font-bold text-emerald-300">
                          Tienes: {qty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">{el.description}</p>
                      <span className="text-[11px] text-slate-400">
                        Usa durante la carrera con tecla <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300">{el.hotkey}</kbd>
                      </span>
                    </div>

                    <button
                      onClick={() => craftElement(el.id)}
                      disabled={!canAfford}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Crear ({el.cost} monedas)</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Direct Coin-to-Score Conversion Card */}
            <div className="bg-amber-500/10 border border-amber-400/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="block font-display text-sm font-bold text-amber-300">
                  Canjear Monedas por Puntuación (+1,000 pts)
                </span>
                <p className="text-xs text-amber-100/80">
                  Convierte 10 monedas de tu banco directamente en +1,000 puntos para superar tu récord.
                </p>
              </div>
              <button
                onClick={exchangeCoinsForScore}
                disabled={coinWallet < 10}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  coinWallet >= 10
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                Canjear 10 Monedas → +1,000 pts
              </button>
            </div>
          </div>
        )}
        {/* NIGHTCORE SONG BANK AUDITION MODAL ("Pre-escucha antes de implementar") */}
        {showMusicBank && (
          <NightcoreBankModal
            onClose={() => {
              setShowMusicBank(false);
              if (pausedForMusicBankRef.current && gameStateRef.current === 'PAUSED') {
                pausedForMusicBankRef.current = false;
                togglePause();
              }
            }}
          />
        )}
      </div>

      {/* Bottom Runner Control Bar */}
      <div className="w-full mt-4 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs backdrop-blur-md">
        {/* Max Speed, Music & CV Sensitivity Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold whitespace-nowrap">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Vel. Máxima:</span>
            </div>
            <input
              id="runner-max-speed-slider"
              type="range"
              min="0.6"
              max="2.2"
              step="0.1"
              value={maxSpeedMultiplier}
              onChange={(e) => setMaxSpeedMultiplier(parseFloat(e.target.value))}
              className="w-24 sm:w-32 accent-emerald-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
              title="Configura la velocidad máxima alcanzable cada 1,000 puntos"
            />
            <span className="font-mono-num font-bold text-emerald-300 min-w-[2.7rem] text-right">
              {maxSpeedMultiplier.toFixed(1)}x
            </span>
          </div>

          <button
            onClick={() => setMusicEnabled(!musicEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold border transition ${
              musicEnabled && soundEnabled
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {musicEnabled && soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Música {musicEnabled && soundEnabled ? 'Activa' : 'Silenciada'}</span>
          </button>

          <button
            onClick={() => {
              if (gameStateRef.current === 'PLAYING') {
                pausedForMusicBankRef.current = true;
                togglePause();
              } else {
                pausedForMusicBankRef.current = false;
              }
              setShowMusicBank(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/35 hover:bg-fuchsia-500/25 transition"
          >
            <Music className="w-4 h-4" />
            <span>Pre-escuchar Banco</span>
          </button>

          <button
            onClick={() => setCvSensitivityHigh(!cvSensitivityHigh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold border transition ${
              cvSensitivityHigh
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Sensibilidad Alta permite jugar incluso sentado moviendo cabeza y hombros"
          >
            <Sliders className="w-4 h-4" />
            <span>Sensibilidad CV: {cvSensitivityHigh ? 'Alta (Sentado / Rápida)' : 'Normal (Cuerpo Completo)'}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/80">
            <span className="text-slate-200 font-semibold whitespace-nowrap">Umbral Puño CV:</span>
            <input
              type="range"
              min="0.20"
              max="0.48"
              step="0.02"
              value={punchZThreshold}
              onChange={(e) => setPunchZThreshold(parseFloat(e.target.value))}
              className="w-20 sm:w-24 accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
              title="Profundidad mínima hombro-muñeca (Z) para disparar puño CV"
            />
            <span className="font-mono-num font-bold text-cyan-300 min-w-[2.4rem] text-right">
              {punchZThreshold.toFixed(2)}
            </span>
          </div>

          {isCameraActive && (
            <>
              <button
                onClick={recalibratePose}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
              >
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span>
                  {cvCalibrationStatus === 'calibrating' ? 'Calibrando...' : 'Recalibrar Centro (C)'}
                </span>
              </button>

              <button
                onClick={() => setShowCvPreview(!showCvPreview)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showCvPreview ? 'Ocultar Vista CV' : 'Mostrar Vista CV'}</span>
              </button>
            </>
          )}
        </div>

        {/* Keyboard Shortcuts Legend */}
        <div className="hidden lg:flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">← →</kbd>
            Carril
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">↑ / Espacio</kbd>
            Saltar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">↓</kbd>
            Rodar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300">K</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-orange-300">J</kbd>
            Combos
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">P</kbd>
            Pausa
          </span>
        </div>
      </div>
    </div>
  );
};
