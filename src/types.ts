export type ActiveGame = 'slicer' | 'runner' | 'photobooth';

export type GameMode = 'arcade' | 'zen' | 'sprint';

export type InputMode = 'hand' | 'mouse';

export type RunnerLane = -1 | 0 | 1;

export type RunnerPosture = 'neutral' | 'jump' | 'duck';

export type RunnerPowerUpType = 'magnet' | 'multiplier' | 'shield';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'bomb' | 'freeze';

export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
  vRot: number;
}

export interface ShapeItem {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  radius: number;
  color: string;
  rotation: number;
  vx: number;
  vy: number;
  vRot: number;
  points: Point[]; // Relative polygon vertices
  isSliced: boolean;
  spawnTime: number;
  slicedHalves?: {
    leftPoints: Point[];
    rightPoints: Point[];
    leftX: number;
    leftY: number;
    rightX: number;
    rightY: number;
    leftVx: number;
    leftVy: number;
    rightVx: number;
    rightVy: number;
    leftRot: number;
    rightRot: number;
    leftVRot: number;
    rightVRot: number;
    opacity: number;
  };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
}

export interface TrailPoint extends Point {
  time: number;
}

export interface HandTrail {
  points: TrailPoint[];
  color: string;
  handIndex: number;
  label: string;
}

export interface PythonConfig {
  camWidth: number;
  camHeight: number;
  maxNumHands: number;
  ropeLength: number;
  ropeColor: string;
  ropeColorHand2?: string;
  ropeThickness: number;
  gravity: number;
  spawnRate: number;
  maxSpeedMultiplier: number;
  matchDuration: number;
  shapeTypes: ShapeType[];
  includePygame: boolean;
  playSound: boolean;
  showLandmarks: boolean;
  minDetectionConfidence: number;
}

