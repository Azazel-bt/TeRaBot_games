import * as THREE from 'three';

export type EnvironmentThemeId = 'snow' | 'factory' | 'hospital' | 'zombies';

export interface EnvironmentThemeConfig {
  id: EnvironmentThemeId;
  label: string;
  badgeColor: string;
  skyHex: number;
  fogHex: number;
  fogDensity: number;
  horizonHex: number;
  horizonOpacity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  keyHex: number;
  keyIntensity: number;
  rimHex: number;
  rimIntensity: number;
  bedHex: number;
  platformHex: number;
  curbHex: number;
  curbEmissiveHex: number;
  laneStripHex: number;
  pillarHex: number;
  lightStripHex: number;
  particleHex: number;
  particleVy: number;
}

export const ENVIRONMENT_ORDER: EnvironmentThemeId[] = [
  'snow',
  'factory',
  'hospital',
  'zombies',
];

export const ENVIRONMENT_THEMES: Record<EnvironmentThemeId, EnvironmentThemeConfig> = {
  snow: {
    id: 'snow',
    label: 'Nieve',
    badgeColor: '#38bdf8',
    skyHex: 0x162d4c,
    fogHex: 0x1e3a5f,
    fogDensity: 0.0105,
    horizonHex: 0xbae6fd,
    horizonOpacity: 0.32,
    hemiSkyHex: 0xe0f2fe,
    hemiGroundHex: 0x334155,
    hemiIntensity: 1.25,
    keyHex: 0xffffff,
    keyIntensity: 2.0,
    rimHex: 0x7dd3fc,
    rimIntensity: 0.95,
    bedHex: 0x1e293b,
    platformHex: 0xe2e8f0,
    curbHex: 0x38bdf8,
    curbEmissiveHex: 0x0369a1,
    laneStripHex: 0x67e8f9,
    pillarHex: 0x94a3b8,
    lightStripHex: 0xe0f2fe,
    particleHex: 0xf8fafc,
    particleVy: -6.5,
  },
  factory: {
    id: 'factory',
    label: 'Fábrica con Fuego',
    badgeColor: '#f97316',
    skyHex: 0x1c0b05,
    fogHex: 0x260e06,
    fogDensity: 0.0125,
    horizonHex: 0xea580c,
    horizonOpacity: 0.35,
    hemiSkyHex: 0xfb923c,
    hemiGroundHex: 0x1c1917,
    hemiIntensity: 1.05,
    keyHex: 0xffedd5,
    keyIntensity: 1.9,
    rimHex: 0xf97316,
    rimIntensity: 1.35,
    bedHex: 0x18181b,
    platformHex: 0x292524,
    curbHex: 0xf97316,
    curbEmissiveHex: 0x9a3412,
    laneStripHex: 0xfb923c,
    pillarHex: 0x44403c,
    lightStripHex: 0xf97316,
    particleHex: 0xfb923c,
    particleVy: 4.8,
  },
  hospital: {
    id: 'hospital',
    label: 'Hospital',
    badgeColor: '#14b8a6',
    skyHex: 0xcbe4f9,
    fogHex: 0xdbeafe,
    fogDensity: 0.0095,
    horizonHex: 0x99f6e4,
    horizonOpacity: 0.4,
    hemiSkyHex: 0xffffff,
    hemiGroundHex: 0x94a3b8,
    hemiIntensity: 1.35,
    keyHex: 0xf8fafc,
    keyIntensity: 1.8,
    rimHex: 0x14b8a6,
    rimIntensity: 0.8,
    bedHex: 0x334155,
    platformHex: 0xf8fafc,
    curbHex: 0x14b8a6,
    curbEmissiveHex: 0x0f766e,
    laneStripHex: 0x2dd4bf,
    pillarHex: 0xe2e8f0,
    lightStripHex: 0xffffff,
    particleHex: 0x99f6e4,
    particleVy: 1.2,
  },
  zombies: {
    id: 'zombies',
    label: 'Calle con Zombies',
    badgeColor: '#4ade80',
    skyHex: 0x08150d,
    fogHex: 0x0c1d13,
    fogDensity: 0.0135,
    horizonHex: 0x22c55e,
    horizonOpacity: 0.28,
    hemiSkyHex: 0x86efac,
    hemiGroundHex: 0x0f172a,
    hemiIntensity: 0.95,
    keyHex: 0xd9f99d,
    keyIntensity: 1.55,
    rimHex: 0x22c55e,
    rimIntensity: 1.25,
    bedHex: 0x1c1917,
    platformHex: 0x27272a,
    curbHex: 0x84cc16,
    curbEmissiveHex: 0x365314,
    laneStripHex: 0x4ade80,
    pillarHex: 0x3f3f46,
    lightStripHex: 0xbef264,
    particleHex: 0x4ade80,
    particleVy: 1.8,
  },
};

export interface EnvironmentBuilderContext {
  animatedFlames: THREE.Group[];
  animatedZombies: THREE.Group[];
  disposePool: Array<{ dispose: () => void }>;
}

export function createEnvironmentSegmentGroups(
  segmentIndex: number,
  ctx: EnvironmentBuilderContext
): Record<EnvironmentThemeId, THREE.Group> {
  const track = <T extends { dispose: () => void }>(res: T): T => {
    ctx.disposePool.push(res);
    return res;
  };

  // ==================== 1. SNOW (NIEVE) ====================
  const snowGroup = new THREE.Group();
  const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 }));
  const pineMat = track(new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 }));
  const snowCapMat = track(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 }));
  const lanternGlowMat = track(new THREE.MeshBasicMaterial({ color: 0xbae6fd }));

  [-9.5, 9.5].forEach((tx, idx) => {
    const zOff = idx === 0 ? -3.5 : 3.5;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.28, 0.38, 2.0, 8)), trunkMat);
    trunk.position.y = 1.0;
    tree.add(trunk);

    [
      { r: 1.7, h: 2.2, y: 2.6 },
      { r: 1.3, h: 1.9, y: 4.0 },
      { r: 0.85, h: 1.5, y: 5.2 },
    ].forEach((tier) => {
      const cone = new THREE.Mesh(track(new THREE.ConeGeometry(tier.r, tier.h, 8)), pineMat);
      cone.position.y = tier.y;
      tree.add(cone);

      const cap = new THREE.Mesh(
        track(new THREE.ConeGeometry(tier.r * 0.82, tier.h * 0.45, 8)),
        snowCapMat
      );
      cap.position.y = tier.y + tier.h * 0.28;
      tree.add(cap);
    });
    tree.position.set(tx, 0.9, zOff);
    snowGroup.add(tree);

    // Snowdrift mound near platform edge
    const drift = new THREE.Mesh(track(new THREE.SphereGeometry(1.3, 10, 8)), snowCapMat);
    drift.scale.set(1.2, 0.45, 2.6);
    drift.position.set(tx > 0 ? 7.8 : -7.8, 0.95, -zOff);
    snowGroup.add(drift);

    // Frosted lamp post
    const lampGlow = new THREE.Mesh(track(new THREE.SphereGeometry(0.32, 10, 10)), lanternGlowMat);
    lampGlow.position.set(tx > 0 ? 6.1 : -6.1, 6.2, 0);
    snowGroup.add(lampGlow);
  });

  // ==================== 2. FACTORY WITH FIRE (FÁBRICA CON FUEGO) ====================
  const factoryGroup = new THREE.Group();
  const steelMat = track(new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.45, metalness: 0.75 }));
  const brickMat = track(new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 }));
  const emberMat = track(new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  const flameOuterMat = track(new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.88 }));
  const flameMidMat = track(new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.92 }));
  const flameCoreMat = track(new THREE.MeshBasicMaterial({ color: 0xfef08a }));

  [-11.8, 11.8].forEach((fx, idx) => {
    // Factory hall block & smokestack
    const hall = new THREE.Mesh(track(new THREE.BoxGeometry(5.2, 9.5, 11.5)), brickMat);
    hall.position.set(fx, 4.5, 0);
    factoryGroup.add(hall);

    const chimney = new THREE.Mesh(track(new THREE.CylinderGeometry(0.85, 1.15, 7.5, 10)), steelMat);
    chimney.position.set(fx + (fx > 0 ? -1.1 : 1.1), 11.2, idx === 0 ? -2.5 : 2.5);
    factoryGroup.add(chimney);

    // Glowing furnace vent on side wall
    const vent = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 2.2, 5.5)), emberMat);
    vent.position.set(fx > 0 ? fx - 2.65 : fx + 2.65, 2.4, 0);
    factoryGroup.add(vent);

    // 3D Fire Brazier + Animated Multi-layered Flame Jet on platform edge
    const brazierX = fx > 0 ? 6.2 : -6.2;
    const brazierZ = idx === 0 ? -4.0 : 4.0;
    const cauldron = new THREE.Mesh(track(new THREE.CylinderGeometry(0.72, 0.52, 0.75, 10)), steelMat);
    cauldron.position.set(brazierX, 1.35, brazierZ);
    factoryGroup.add(cauldron);

    const flameGroup = new THREE.Group();
    flameGroup.position.set(brazierX, 1.72, brazierZ);

    const outerCone = new THREE.Mesh(track(new THREE.ConeGeometry(0.62, 2.1, 8)), flameOuterMat);
    outerCone.position.y = 1.05;
    flameGroup.add(outerCone);

    const midCone = new THREE.Mesh(track(new THREE.ConeGeometry(0.42, 1.6, 8)), flameMidMat);
    midCone.position.y = 0.85;
    flameGroup.add(midCone);

    const coreCone = new THREE.Mesh(track(new THREE.ConeGeometry(0.24, 1.05, 8)), flameCoreMat);
    coreCone.position.y = 0.55;
    flameGroup.add(coreCone);

    flameGroup.userData.phase = segmentIndex * 0.9 + idx * 1.7;
    factoryGroup.add(flameGroup);
    ctx.animatedFlames.push(flameGroup);
  });

  // ==================== 3. HOSPITAL ====================
  const hospitalGroup = new THREE.Group();
  const wallMat = track(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45, metalness: 0.08 }));
  const glassMat = track(new THREE.MeshStandardMaterial({ color: 0x99f6e4, roughness: 0.2, emissive: 0x0d9488, emissiveIntensity: 0.25 }));
  const redCrossMat = track(new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  const monitorMat = track(new THREE.MeshBasicMaterial({ color: 0x22c55e }));

  [-11.2, 11.2].forEach((hx, idx) => {
    const wall = new THREE.Mesh(track(new THREE.BoxGeometry(4.4, 9.2, 14.2)), wallMat);
    wall.position.set(hx, 4.5, 0);
    hospitalGroup.add(wall);

    // Frosted teal corridor window band
    const winBand = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 2.2, 10.0)), glassMat);
    winBand.position.set(hx > 0 ? hx - 2.22 : hx + 2.22, 4.2, 0);
    hospitalGroup.add(winBand);

    // Bold 3D Red Medical Cross (+)
    const crossGroup = new THREE.Group();
    const vBar = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 1.65, 0.52)), redCrossMat);
    const hBar = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 0.52, 1.65)), redCrossMat);
    crossGroup.add(vBar, hBar);
    crossGroup.position.set(hx > 0 ? hx - 2.28 : hx + 2.28, 6.6, idx === 0 ? -2.2 : 2.2);
    hospitalGroup.add(crossGroup);

    // Clinical Monitor Stand on sidewalk
    const stand = new THREE.Mesh(track(new THREE.BoxGeometry(0.85, 1.6, 0.85)), wallMat);
    stand.position.set(hx > 0 ? 6.6 : -6.6, 1.8, 0);
    hospitalGroup.add(stand);

    const screen = new THREE.Mesh(track(new THREE.BoxGeometry(0.55, 0.35, 0.88)), monitorMat);
    screen.position.set(hx > 0 ? 6.6 : -6.6, 2.25, 0);
    hospitalGroup.add(screen);
  });

  // ==================== 4. ZOMBIE STREET (CALLE CON ZOMBIES) ====================
  const zombiesGroup = new THREE.Group();
  const ruinMat = track(new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.92 }));
  const toxicMat = track(new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
  const zSkinMat = track(new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 }));
  const zClothMat = track(new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
  const zEyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
  const drumMat = track(new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.65, metalness: 0.35 }));

  [-11.8, 11.8].forEach((zx, idx) => {
    const ruin = new THREE.Mesh(track(new THREE.BoxGeometry(5.2, 8 + ((segmentIndex + idx) % 5) * 1.4, 12.2)), ruinMat);
    ruin.position.set(zx, 4.5, 0);
    zombiesGroup.add(ruin);

    // Toxic biohazard drum on sidewalk
    const drum = new THREE.Mesh(track(new THREE.CylinderGeometry(0.45, 0.45, 1.15, 10)), drumMat);
    drum.position.set(zx > 0 ? 6.8 : -6.8, 1.55, idx === 0 ? 4.2 : -4.2);
    zombiesGroup.add(drum);

    const drumGlow = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 10)), toxicMat);
    drumGlow.position.set(zx > 0 ? 6.8 : -6.8, 2.13, idx === 0 ? 4.2 : -4.2);
    zombiesGroup.add(drumGlow);

    // Composite 3D Animated Zombie on sidewalk facing the track
    const zombie = new THREE.Group();
    const zTorso = new THREE.Mesh(track(new THREE.BoxGeometry(0.62, 0.78, 0.34)), zClothMat);
    zTorso.position.y = 1.05;
    zombie.add(zTorso);

    const zHead = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.42, 0.42)), zSkinMat);
    zHead.position.y = 1.72;
    zombie.add(zHead);

    [-0.1, 0.1].forEach((ex) => {
      const eye = new THREE.Mesh(track(new THREE.BoxGeometry(0.08, 0.06, 0.05)), zEyeMat);
      eye.position.set(ex, 1.76, 0.22);
      zombie.add(eye);
    });

    // Outstretched zombie arms reaching toward the street
    [-0.42, 0.42].forEach((ax) => {
      const arm = new THREE.Mesh(track(new THREE.BoxGeometry(0.18, 0.18, 0.68)), zSkinMat);
      arm.position.set(ax, 1.28, 0.35);
      zombie.add(arm);
    });

    [-0.16, 0.16].forEach((lx) => {
      const leg = new THREE.Mesh(track(new THREE.BoxGeometry(0.22, 0.65, 0.24)), zClothMat);
      leg.position.set(lx, 0.325, 0);
      zombie.add(leg);
    });

    const sideX = zx > 0 ? 6.4 : -6.4;
    zombie.position.set(sideX, 1.0, idx === 0 ? -1.5 : 1.5);
    zombie.rotation.y = zx > 0 ? -Math.PI / 2 : Math.PI / 2;
    zombie.userData.phase = segmentIndex * 1.1 + idx * 2.1;
    zombiesGroup.add(zombie);
    ctx.animatedZombies.push(zombie);
  });

  // Only first theme visible initially
  snowGroup.visible = true;
  factoryGroup.visible = false;
  hospitalGroup.visible = false;
  zombiesGroup.visible = false;

  return {
    snow: snowGroup,
    factory: factoryGroup,
    hospital: hospitalGroup,
    zombies: zombiesGroup,
  };
}
