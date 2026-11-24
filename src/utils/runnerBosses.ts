import * as THREE from 'three';
import { EnvironmentThemeId } from './runnerEnvironments';

export type BossSpecialAction = 'punch_only' | 'duck_break' | 'jump_punch' | 'double_punch';

export interface BossConfig {
  id: EnvironmentThemeId;
  name: string;
  title: string;
  introHeadline: string;
  weaknessBadge: string;
  weaknessHint: string;
  maxHp: number;
  moveInterval: number;
  attackInterval: number;
  specialAction: BossSpecialAction;
  accentColor: string;
  accentHex: number;
  shieldHex: number;
  defaultPrompt: string;
  specialPrompt: string;
  dangerWarning: string;
}

export const BOSS_CONFIGS: Record<EnvironmentThemeId, BossConfig> = {
  snow: {
    id: 'snow',
    name: 'Cabeza de Muñeco de Nieve',
    title: 'Monstruo Polar · Nieve',
    introHeadline: '¡TORMENTA ÁRTICA DESATADA!',
    weaknessBadge: 'DÉBIL A: FUEGO / SUPREMO',
    weaknessHint: '🔥 Solo sufre daño con BOLAS DE FUEGO (Brazo Der.) o COMBO SUPREMO. ¡El hielo no lo daña!',
    maxHp: 400,
    moveInterval: 2.05,
    attackInterval: 1.85,
    specialAction: 'punch_only',
    accentColor: '#38bdf8',
    accentHex: 0x38bdf8,
    shieldHex: 0xbae6fd,
    defaultPrompt: '🔥 ¡Usa BOLAS DE FUEGO (Brazo Der.) o COMBO SUPREMO!',
    specialPrompt: '🔥 ¡Lanza BOLAS DE FUEGO o activa PODER SUPREMO!',
    dangerWarning: 'El monstruo de nieve resiste el hielo. ¡Derrítelo con BOLAS DE FUEGO o COMBO SUPREMO!',
  },
  factory: {
    id: 'factory',
    name: 'Titán de la Forja',
    title: 'Monstruo Ígneo · Fábrica con Fuego',
    introHeadline: '¡ALERTA DE FUNDICIÓN INFERNAL!',
    weaknessBadge: 'DÉBIL A: BOLAS DE NIEVE',
    weaknessHint: '❄️ Solo sufre daño con BOLAS DE NIEVE / ATAQUE DE NIEVE (Brazo Izq.). ¡Absorbe el fuego!',
    maxHp: 550,
    moveInterval: 1.78,
    attackInterval: 1.65,
    specialAction: 'duck_break',
    accentColor: '#f97316',
    accentHex: 0xf97316,
    shieldHex: 0xf97316,
    defaultPrompt: '❄️ ¡Apágalo con BOLAS DE NIEVE (Brazo Izq.)!',
    specialPrompt: '❄️ ¡Lanza BOLAS DE NIEVE (Brazo Izq.) para apagar su Escudo Térmico!',
    dangerWarning: 'El monstruo de fuego absorbe las llamas. ¡Lanza BOLAS DE NIEVE (Brazo Izq.) para enfriarlo!',
  },
  hospital: {
    id: 'hospital',
    name: 'Dron Bio-Médico',
    title: 'Monstruo Clínico · Hospital',
    introHeadline: '¡CUARENTENA DE ALTA TENSIÓN!',
    weaknessBadge: 'DÉBIL A: COMBOS / AÉREO',
    weaknessHint: '⚡ Su campo estático bloquea golpes simples: usa COMBOS DE BOXEO, SALTO+PUÑO o SUPREMO.',
    maxHp: 700,
    moveInterval: 1.55,
    attackInterval: 1.5,
    specialAction: 'jump_punch',
    accentColor: '#14b8a6',
    accentHex: 0x14b8a6,
    shieldHex: 0x2dd4bf,
    defaultPrompt: '⚡ ¡Conecta COMBOS DE BOXEO o Golpes Aéreos!',
    specialPrompt: 'CAMPO ESTÁTICO: ¡SALTA (↑)+PUÑO o conecta un COMBO DE BOXEO!',
    dangerWarning: 'Protegido por Campo Bio-Estático. ¡Rómpelo con Combos, Salto+Puño o Combo Supremo!',
  },
  zombies: {
    id: 'zombies',
    name: 'Rey Zombie Mutante',
    title: 'Monstruo Final · Calle con Zombies',
    introHeadline: '¡INVASIÓN MUTANTE NIGHTCORE!',
    weaknessBadge: 'VULNERABLE A TODO',
    weaknessHint: '☣️ Recibe daño normal de NIEVE, FUEGO, COMBOS y PODER SUPREMO. ¡Desata todo tu arsenal!',
    maxHp: 850,
    moveInterval: 1.38,
    attackInterval: 1.35,
    specialAction: 'double_punch',
    accentColor: '#4ade80',
    accentHex: 0x4ade80,
    shieldHex: 0x84cc16,
    defaultPrompt: '☣️ ¡Todo ataque le hace daño! ¡Combos y poder máximo!',
    specialPrompt: 'FURIA MUTANTE: ¡Todo ataque lo daña! ¡Conecta doble puño rápido!',
    dangerWarning: 'El Rey Zombie recibe daño de cualquier ataque y elemento. ¡Golpea sin parar!',
  },
};

export interface BuiltBossRig {
  root: THREE.Group;
  coreGroup: THREE.Group;
  haloMesh: THREE.Mesh;
  shieldMesh: THREE.Mesh;
  hitFlashMats: THREE.MeshStandardMaterial[];
  dispose: () => void;
}

export function createBossRig(themeId: EnvironmentThemeId): BuiltBossRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(res: T): T => {
    disposables.push(res);
    return res;
  };

  const root = new THREE.Group();
  const coreGroup = new THREE.Group();
  root.add(coreGroup);

  const hitFlashMats: THREE.MeshStandardMaterial[] = [];
  let haloMesh: THREE.Mesh;

  if (themeId === 'snow') {
    // Giant Snowman Head Boss (Cabeza de Muñeco de Nieve)
    const snowMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.48, metalness: 0.05 })
    );
    const hatMat = track(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 }));
    const bandMat = track(
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, emissive: 0x7f1d1d, emissiveIntensity: 0.3 })
    );
    const carrotMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, emissive: 0x9a3412, emissiveIntensity: 0.25 })
    );
    const coalMat = track(new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 }));
    const eyeGlowMat = track(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));

    hitFlashMats.push(snowMat, hatMat);

    // Main Giant Snowman Head
    const headSphere = new THREE.Mesh(track(new THREE.SphereGeometry(1.72, 24, 20)), snowMat);
    headSphere.castShadow = true;
    coreGroup.add(headSphere);

    // Snow Collar Base
    const collar = new THREE.Mesh(track(new THREE.TorusGeometry(1.38, 0.36, 10, 24)), snowMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -1.35;
    coreGroup.add(collar);

    // Top Hat (Brim + Ribbon + Crown)
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 1.45, 0);
    hatGroup.rotation.z = -0.1;

    const brim = new THREE.Mesh(track(new THREE.CylinderGeometry(1.75, 1.75, 0.16, 22)), hatMat);
    hatGroup.add(brim);

    const ribbon = new THREE.Mesh(track(new THREE.CylinderGeometry(1.14, 1.14, 0.34, 22)), bandMat);
    ribbon.position.y = 0.24;
    hatGroup.add(ribbon);

    const crown = new THREE.Mesh(track(new THREE.CylinderGeometry(1.08, 1.12, 1.25, 22)), hatMat);
    crown.position.y = 0.95;
    hatGroup.add(crown);
    coreGroup.add(hatGroup);

    // Carrot Nose pointing directly toward runner (+Z)
    const nose = new THREE.Mesh(track(new THREE.ConeGeometry(0.28, 1.45, 12)), carrotMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.05, 1.98);
    coreGroup.add(nose);

    // Coal Eyes + Glowing Icy Pupils
    [-0.58, 0.58].forEach((ex) => {
      const eye = new THREE.Mesh(track(new THREE.SphereGeometry(0.22, 12, 12)), coalMat);
      eye.position.set(ex, 0.52, 1.52);
      coreGroup.add(eye);

      const pupil = new THREE.Mesh(track(new THREE.SphereGeometry(0.11, 8, 8)), eyeGlowMat);
      pupil.position.set(ex, 0.52, 1.69);
      coreGroup.add(pupil);
    });

    // Angry Snowman Eyebrows
    [-0.6, 0.6].forEach((bx, idx) => {
      const brow = new THREE.Mesh(track(new THREE.BoxGeometry(0.55, 0.14, 0.16)), coalMat);
      brow.position.set(bx, 0.88, 1.46);
      brow.rotation.z = idx === 0 ? -0.32 : 0.32;
      coreGroup.add(brow);
    });

    // Coal Smile Curve
    [-0.65, -0.33, 0, 0.33, 0.65].forEach((sx, idx) => {
      const drop = Math.abs(idx - 2) * 0.12;
      const tooth = new THREE.Mesh(track(new THREE.BoxGeometry(0.2, 0.2, 0.2)), coalMat);
      tooth.position.set(sx, -0.58 + drop, 1.56 - Math.abs(sx) * 0.25);
      coreGroup.add(tooth);
    });

    haloMesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(2.35, 0.08, 10, 32)),
      track(new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 }))
    );
    haloMesh.rotation.x = Math.PI / 2.4;
    coreGroup.add(haloMesh);
  } else if (themeId === 'factory') {
    // Armored Fire Furnace Titan Boss
    const ironMat = track(new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.38, metalness: 0.85 }));
    const magmaMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 0.85,
        roughness: 0.25,
      })
    );
    const flameMat = track(new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    hitFlashMats.push(ironMat, magmaMat);

    const chassis = new THREE.Mesh(track(new THREE.BoxGeometry(3.1, 2.9, 2.4)), ironMat);
    chassis.castShadow = true;
    coreGroup.add(chassis);

    const visor = new THREE.Mesh(track(new THREE.BoxGeometry(2.4, 0.68, 0.25)), magmaMat);
    visor.position.set(0, 0.55, 1.22);
    coreGroup.add(visor);

    // Furnace Mouth Grate
    const furnaceHole = new THREE.Mesh(track(new THREE.BoxGeometry(2.0, 0.95, 0.22)), flameMat);
    furnaceHole.position.set(0, -0.62, 1.2);
    coreGroup.add(furnaceHole);

    for (let gx = -0.75; gx <= 0.75; gx += 0.375) {
      const bar = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 1.05, 0.28)), ironMat);
      bar.position.set(gx, -0.62, 1.25);
      coreGroup.add(bar);
    }

    // Twin Smokestack Exhaust Horns
    [-1.1, 1.1].forEach((hx) => {
      const horn = new THREE.Mesh(track(new THREE.CylinderGeometry(0.32, 0.46, 1.5, 10)), ironMat);
      horn.position.set(hx, 2.0, -0.2);
      coreGroup.add(horn);

      const fireTip = new THREE.Mesh(track(new THREE.ConeGeometry(0.36, 0.95, 8)), magmaMat);
      fireTip.position.set(hx, 3.05, -0.2);
      coreGroup.add(fireTip);
    });

    haloMesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(2.45, 0.1, 8, 24)),
      track(new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.8 }))
    );
    coreGroup.add(haloMesh);
  } else if (themeId === 'hospital') {
    // Bio-Medical Laser Drone Boss
    const whitePodMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.35 })
    );
    const tealMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x14b8a6,
        emissive: 0x0d9488,
        emissiveIntensity: 0.5,
        roughness: 0.25,
      })
    );
    const redMat = track(new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    hitFlashMats.push(whitePodMat, tealMat);

    const sphereBody = new THREE.Mesh(track(new THREE.SphereGeometry(1.55, 24, 18)), whitePodMat);
    sphereBody.scale.set(1.15, 0.95, 1.0);
    sphereBody.castShadow = true;
    coreGroup.add(sphereBody);

    // Visor Scanner Eye
    const scanner = new THREE.Mesh(track(new THREE.BoxGeometry(2.1, 0.45, 0.4)), tealMat);
    scanner.position.set(0, 0.08, 1.45);
    coreGroup.add(scanner);

    // Red Cross Crest on Forehead
    const vCross = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.85, 0.16)), redMat);
    vCross.position.set(0, 0.92, 1.42);
    const hCross = new THREE.Mesh(track(new THREE.BoxGeometry(0.85, 0.28, 0.16)), redMat);
    hCross.position.set(0, 0.92, 1.42);
    coreGroup.add(vCross, hCross);

    // Twin Hover Wings
    [-2.0, 2.0].forEach((wx) => {
      const wing = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 0.42, 1.5)), whitePodMat);
      wing.position.set(wx, 0.2, 0);
      coreGroup.add(wing);

      const emitter = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 10)), tealMat);
      emitter.rotation.x = Math.PI / 2;
      emitter.position.set(wx, 0.15, 0.35);
      coreGroup.add(emitter);
    });

    haloMesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(2.35, 0.08, 10, 32)),
      track(new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.78 }))
    );
    haloMesh.rotation.x = Math.PI / 2;
    coreGroup.add(haloMesh);
  } else {
    // Zombie King Mutant Boss
    const zSkinMat = track(
      new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.7, metalness: 0.1 })
    );
    const crownMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x84cc16,
        emissive: 0x365314,
        emissiveIntensity: 0.55,
        roughness: 0.35,
        metalness: 0.6,
      })
    );
    const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    const fangMat = track(new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.4 }));
    hitFlashMats.push(zSkinMat, crownMat);

    const skull = new THREE.Mesh(track(new THREE.BoxGeometry(2.7, 2.7, 2.3)), zSkinMat);
    skull.castShadow = true;
    coreGroup.add(skull);

    // Jagged Crown Spikes
    [-0.95, 0, 0.95].forEach((cx, idx) => {
      const spike = new THREE.Mesh(track(new THREE.ConeGeometry(0.32, idx === 1 ? 1.25 : 0.95, 6)), crownMat);
      spike.position.set(cx, 1.85, 0.2);
      coreGroup.add(spike);
    });

    // Glowing Crimson Zombie Eyes
    [-0.65, 0.65].forEach((ex) => {
      const eye = new THREE.Mesh(track(new THREE.BoxGeometry(0.5, 0.3, 0.2)), eyeMat);
      eye.position.set(ex, 0.48, 1.18);
      coreGroup.add(eye);
    });

    // Jaw + Fangs
    [-0.6, 0, 0.6].forEach((fx) => {
      const fang = new THREE.Mesh(track(new THREE.ConeGeometry(0.16, 0.48, 6)), fangMat);
      fang.position.set(fx, -0.78, 1.2);
      coreGroup.add(fang);
    });

    // Outstretched Mutant Zombie Claws
    [-1.85, 1.85].forEach((ax) => {
      const arm = new THREE.Mesh(track(new THREE.BoxGeometry(0.55, 0.55, 1.85)), zSkinMat);
      arm.position.set(ax, -0.35, 0.9);
      coreGroup.add(arm);
    });

    haloMesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(2.5, 0.09, 10, 28)),
      track(new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.78 }))
    );
    haloMesh.rotation.x = Math.PI / 2.2;
    coreGroup.add(haloMesh);
  }

  // Translucent Protective Special-Action Shield Sphere around Boss
  const shieldMesh = new THREE.Mesh(
    track(new THREE.IcosahedronGeometry(2.65, 1)),
    track(
      new THREE.MeshBasicMaterial({
        color: BOSS_CONFIGS[themeId].shieldHex,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      })
    )
  );
  shieldMesh.visible = false;
  root.add(shieldMesh);

  return {
    root,
    coreGroup,
    haloMesh,
    shieldMesh,
    hitFlashMats,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/**
 * Builds themed boss-thrown obstacles ('low' to jump over, 'high' to duck under).
 */
export function createBossObstacleMesh(
  themeId: EnvironmentThemeId,
  kind: 'low' | 'high'
): { group: THREE.Group; width: number; height: number; depth: number; bottomY: number } {
  const group = new THREE.Group();

  if (kind === 'low') {
    if (themeId === 'snow') {
      // Giant Rolling Ice/Snow Block
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        roughness: 0.18,
        metalness: 0.25,
      });
      const iceBlock = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.05, 1.15), iceMat);
      iceBlock.position.y = 0.55;
      iceBlock.castShadow = true;
      group.add(iceBlock);

      const snowTop = new THREE.Mesh(
        new THREE.BoxGeometry(2.08, 0.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
      );
      snowTop.position.y = 1.08;
      group.add(snowTop);
    } else if (themeId === 'factory') {
      const ironMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.7 });
      const lavaMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const block = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.02, 0.85), ironMat);
      block.position.y = 0.51;
      group.add(block);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.42, 0.9), lavaMat);
      glow.position.y = 0.78;
      group.add(glow);
    } else if (themeId === 'hospital') {
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
      const tealMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });
      const gurney = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.95, 1.15), whiteMat);
      gurney.position.y = 0.52;
      group.add(gurney);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 1.2), tealMat);
      strip.position.y = 0.95;
      group.add(strip);
    } else {
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.6, metalness: 0.3 });
      const toxicMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
      [-0.58, 0.58].forEach((dx) => {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.05, 10), drumMat);
        drum.position.set(dx, 0.525, 0);
        group.add(drum);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 10), toxicMat);
        cap.position.set(dx, 1.05, 0);
        group.add(cap);
      });
    }
    return { group, width: 1.95, height: 1.08, depth: 0.9, bottomY: 0 };
  }

  // 'high' obstacle -> Duck / Roll underneath (bottomY = 1.08)
  const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 });
  [-1.08, 1.08].forEach((px) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.75, 0.22), postMat);
    post.position.set(px, 1.375, 0);
    group.add(post);
  });

  const beamColor =
    themeId === 'factory'
      ? 0xf97316
      : themeId === 'hospital'
      ? 0xef4444
      : themeId === 'zombies'
      ? 0x4ade80
      : 0x38bdf8;
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(2.16, 1.25, 0.38),
    new THREE.MeshBasicMaterial({ color: beamColor })
  );
  beam.position.set(0, 1.75, 0);
  group.add(beam);

  return { group, width: 2.0, height: 1.4, depth: 0.5, bottomY: 1.08 };
}
