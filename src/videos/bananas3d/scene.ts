import * as THREE from "three";
import { Char, LOOKS, Pose } from "../dumont3d/chars";
import { LightKey } from "../pisa/grade";
import wordsData from "../../../audio/bananas_radioativas_words.json";

function mouthAt(tSec: number): number {
  const words = wordsData.words as Array<{ word: string; start: number; end: number }>;
  const active = words.find((w) => tSec >= w.start && tSec <= w.end);
  if (!active) return 0;
  const dur = Math.max(0.08, active.end - active.start);
  const local = (tSec - active.start) / dur;
  const syllables = Math.max(1, Math.round(active.word.length / 2.4));
  return Math.max(0.25, Math.abs(Math.sin(local * Math.PI * syllables)));
}

export const TOTAL = 688; // 22.93s @ 30fps

export type Shot = { id: number; a: number; b: number; light: LightKey };
export const SHOTS: Shot[] = [
  { id: 1, a: 0, b: 55, light: "day" },     // Hook Close-up + Push-in rápido
  { id: 2, a: 55, b: 135, light: "day" },   // Over-the-shoulder / Plano médio 2 elementos
  { id: 3, a: 135, b: 230, light: "day" },  // Órbita baixa ao redor das bananas
  { id: 4, a: 230, b: 325, light: "day" },  // Macro-zoom no átomo Potássio-40
  { id: 5, a: 325, b: 435, light: "day" },  // Contra-plongée do Contador Geiger -> Professor
  { id: 6, a: 435, b: 565, light: "day" },  // Arco dinâmico ao redor do Professor
  { id: 7, a: 565, b: TOTAL, light: "day" } // Pull-back hero revelando todo o lab
];

export const shotAt = (f: number): Shot =>
  SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const mats = new Map<string, THREE.MeshToonMaterial>();
const GRAD = (() => {
  const d = new Uint8Array([170, 225, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const toon = (c: string) => {
  let m = mats.get(c);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD });
    mats.set(c, m);
  }
  return m;
};

/**
 * Constrói uma banana 3D orgânica real: cilindro deformado com perfil afilado nas pontas
 * (zero pontas abertas) + curvatura suave + cabinho marrom superior e pontinha inferior.
 */
function buildBanana(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const len = 0.52;
  const geo = new THREE.CylinderGeometry(0.062, 0.062, len, 10, 24, false);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // t vai de 0 (base) a 1 (topo)
    const t = clamp01((y + len / 2) / len);
    // Perfil afilado nas pontas (mais gordinha no meio, afina suavemente nos extremos)
    const radiusScale = Math.pow(Math.sin(t * Math.PI), 0.58) * 0.92 + 0.08;
    // Curvatura natural de banana em arco
    const bend = 0.13 * (1 - Math.pow(2 * t - 1, 2));

    pos.setXYZ(i, x * radiusScale + bend, y, z * radiusScale);
  }
  geo.computeVertexNormals();

  const body = new THREE.Mesh(geo, toon("#f7d02c"));
  body.castShadow = true;
  body.receiveShadow = true;
  // Deita a banana horizontalmente em arco
  body.rotation.z = Math.PI / 2;
  g.add(body);

  // Cabinho marrom (lado direito após rotation.z = PI/2 fica em x = -len/2)
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.022, 0.075, 8),
    toon("#5c3a1e")
  );
  stem.position.set(-len / 2 - 0.02, 0.02, 0);
  stem.rotation.z = 0.65;
  stem.castShadow = true;
  g.add(stem);

  // Pontinha escura na outra extremidade
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), toon("#422914"));
  tip.position.set(len / 2 + 0.005, 0.005, 0);
  g.add(tip);

  g.scale.setScalar(scale);
  return g;
}

export class BananasWorld {
  root = new THREE.Group();
  prof: Char;
  atomGroup = new THREE.Group();
  atomCore: THREE.Mesh;
  ringGroups: THREE.Group[] = [];
  electrons: THREE.Mesh[] = [];
  geigerNeedle = new THREE.Mesh();
  bananaHand: THREE.Group;
  targetPos = new THREE.Vector3(0, 1.3, 0);

  constructor() {
    this.root.background = new THREE.Color("#bcd6f0");

    // Luzes
    const hemi = new THREE.HemisphereLight("#fff9eb", "#7f8fa6", 1.15);
    const sun = new THREE.DirectionalLight("#fff5dc", 2.1);
    sun.position.set(4, 7, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 25;
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    this.root.add(hemi, sun);

    // Piso do Laboratório
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon("#c79a63"));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.root.add(floor);

    // Parede de fundo + Janela pro céu azul
    const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 0.3), toon("#efe6d2"));
    wall.position.set(0, 3.5, -2.5);
    wall.receiveShadow = true;
    this.root.add(wall);

    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 0.36), toon("#594433"));
    winFrame.position.set(-2.2, 2.6, -2.45);
    const winGlass = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.9, 0.38), toon("#7bc8ff"));
    winGlass.position.set(-2.2, 2.6, -2.44);
    this.root.add(winFrame, winGlass);

    // Lousa Verde atrás do Professor
    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.12), toon("#69462b"));
    boardFrame.position.set(1.2, 2.5, -2.3);
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.15, 1.75, 0.14), toon("#234d38"));
    board.position.set(1.2, 2.5, -2.28);
    this.root.add(boardFrame, board);

    // Mesa de Laboratório
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.1), toon("#8b5d3b"));
    tableTop.position.set(1.15, 0.95, 0.15);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.root.add(tableTop);

    for (const lx of [0.2, 2.1]) {
      for (const lz of [-0.3, 0.6]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), toon("#5e3c24"));
        leg.position.set(lx, 0.475, lz);
        leg.castShadow = true;
        this.root.add(leg);
      }
    }

    // Prato branco + 3 Bananas bem espaçadas na mesa
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.35, 0.04, 28), toon("#f7f7f7"));
    plate.position.set(1.0, 1.03, 0.2);
    plate.receiveShadow = true;
    this.root.add(plate);

    const bananaPlacements = [
      { pos: [0.95, 1.12, 0.05], rot: [0.25, 0.15, 0.05] },
      { pos: [1.02, 1.13, 0.22], rot: [0.3, -0.1, -0.05] },
      { pos: [0.98, 1.12, 0.38], rot: [0.2, -0.35, 0.08] },
    ];
    for (const bp of bananaPlacements) {
      const b = buildBanana(1.08);
      b.position.set(bp.pos[0], bp.pos[1], bp.pos[2]);
      b.rotation.set(bp.rot[0], bp.rot[1], bp.rot[2]);
      this.root.add(b);
    }

    // Contador Geiger na mesa
    const geiger = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.42), toon("#3a424d"));
    geiger.position.set(1.7, 1.11, 0.22);
    geiger.rotation.y = -0.35;
    geiger.castShadow = true;
    this.root.add(geiger);

    const dial = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.03), toon("#f4f6e8"));
    dial.position.set(1.65, 1.13, 0.42);
    dial.rotation.y = -0.35;
    this.root.add(dial);

    this.geigerNeedle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.09, 0.04), toon("#e63946"));
    this.geigerNeedle.position.set(1.65, 1.11, 0.43);
    this.root.add(this.geigerNeedle);

    // Átomo de Potássio-40 com animação 100% determinística e elétrons orbitando
    this.atomCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 20, 16),
      new THREE.MeshBasicMaterial({ color: "#4dff88" })
    );
    this.atomGroup.add(this.atomCore);

    const ringConfigs = [
      [0.35, 0.2, 0],
      [0.35, -0.2, Math.PI / 3],
      [-0.35, 0.4, (2 * Math.PI) / 3],
    ];
    for (const [rx, ry, rz] of ringConfigs) {
      const rg = new THREE.Group();
      rg.rotation.set(rx, ry, rz);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.013, 10, 48),
        new THREE.MeshBasicMaterial({ color: "#7affaa" })
      );
      rg.add(ring);

      const electron = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 12, 10),
        new THREE.MeshBasicMaterial({ color: "#ffffff" })
      );
      rg.add(electron);
      this.electrons.push(electron);
      this.ringGroups.push(rg);
      this.atomGroup.add(rg);
    }
    this.atomGroup.position.set(1.0, 1.66, 0.2);
    this.root.add(this.atomGroup);

    // Professor Canônico
    this.prof = new Char(LOOKS.professor);
    this.prof.root.position.set(-0.45, 0, 0);
    this.prof.root.rotation.y = 0.25;
    this.root.add(this.prof.root);

    // Banana na mão do Professor
    this.bananaHand = buildBanana(0.85);
    this.bananaHand.position.set(0.06, 0.08, 0.06);
    this.bananaHand.rotation.set(0.2, 0.3, 1.1);
    this.prof.hold.add(this.bananaHand);
  }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    scene.background = new THREE.Color("#bcd6f0");
    const t = f / 30;
    const s = shotAt(f);

    // Animação determinística e fluida do Átomo Potássio-40 (sem += para funcionar em paralelo!)
    this.atomGroup.position.y = 1.66 + Math.sin(t * 2.4) * 0.05;
    this.atomGroup.rotation.y = t * 0.55;
    this.atomCore.scale.setScalar(1 + 0.08 * Math.sin(t * 5));

    this.ringGroups.forEach((rg, idx) => {
      rg.rotation.z = idx * (Math.PI / 3) + t * (0.45 + idx * 0.15);
      const el = this.electrons[idx];
      const ang = t * (3.2 + idx * 0.8) + idx * 2.1;
      el.position.set(Math.cos(ang) * 0.3, Math.sin(ang) * 0.3, 0);
    });

    // Agulha do Geiger tremendo suavemente
    this.geigerNeedle.rotation.z = -0.25 + Math.sin(t * 14) * 0.2 + Math.cos(t * 23) * 0.1;

    // Poses e Lip-Sync real sincronizado com as palavras faladas
    const mouthOpen = mouthAt(t);
    const isSpeaking = mouthOpen > 0;
    const blink = f % 95 >= 90 ? 1 : 0;
    const u = smooth(clamp01((f - s.a) / Math.max(1, s.b - s.a)));
    const swayX = Math.sin(t * 1.7) * 0.018;
    const swayY = Math.cos(t * 2.1) * 0.012;

    let pose: Pose = {
      t,
      face: isSpeaking ? "talk" : "smile",
      blink,
      mouth: mouthOpen,
      armR: 0.28,
      fwdR: 0.75,
      elbowR: 0.85,
      armL: 0.25 + Math.sin(t * 3) * 0.12,
      fwdL: 0.35 + Math.cos(t * 2.5) * 0.15,
      elbowL: 0.55,
    };

    if (s.id === 1) {
      // Ato 1 Hook: pulinho de surpresa + inclina pra frente + mostra a banana
      const hopEnv = f < 22 ? Math.sin((f / 22) * Math.PI) * 0.06 : 0;
      pose.face = isSpeaking ? "talk" : "shock";
      pose.hop = hopEnv;
      pose.lean = -0.06;
      pose.armR = 0.35;
      pose.fwdR = 1.15 + Math.sin(t * 6) * 0.08;
      pose.elbowR = 1.0;
      pose.armL = 0.55;
      pose.fwdL = 0.65;
      pose.elbowL = 0.75;
      pose.tilt = Math.sin(t * 2.5) * 0.07;
    } else if (s.id === 2) {
      // Plano 2: aponta para a mesa enquanto olha para o público
      pose.face = isSpeaking ? "talk" : "smile";
      pose.armR = 0.28;
      pose.fwdR = 0.85;
      pose.elbowR = 0.9;
      pose.armL = 0.65 + Math.sin(t * 4) * 0.1;
      pose.fwdL = 0.85;
      pose.elbowL = 0.45;
      pose.nod = Math.sin(t * 4) * 0.05;
    } else if (s.id <= 5) {
      // Planos 3-5: explicando e apontando para o experimento
      pose.face = isSpeaking ? "talk" : "smile";
      pose.armR = 0.24;
      pose.fwdR = 0.75;
      pose.elbowR = 0.8;
      pose.armL = 0.6;
      pose.fwdL = 0.98 + Math.sin(t * 5) * 0.08;
      pose.elbowL = 0.35;
      pose.nod = Math.sin(t * 4.5) * 0.07;
    } else if (s.id === 6) {
      // Plano 6: gesticulação animada ("dez milhões de bananas!")
      pose.face = isSpeaking ? "talk" : "grin";
      pose.armR = 0.35 + Math.sin(t * 5) * 0.14;
      pose.fwdR = 0.95 + Math.cos(t * 5) * 0.15;
      pose.elbowR = 0.75;
      pose.armL = 0.55 + Math.cos(t * 5) * 0.18;
      pose.fwdL = 0.85 + Math.sin(t * 5) * 0.18;
      pose.elbowL = 0.65;
      pose.tilt = Math.sin(t * 3) * 0.08;
    } else {
      // Plano 7: aceno amigável olhando direto para a câmera!
      pose.face = isSpeaking ? "talk" : "grin";
      pose.armR = 0.28;
      pose.fwdR = 0.85;
      pose.elbowR = 0.85;
      pose.armL = 1.05 + Math.sin(t * 10) * 0.24;
      pose.fwdL = 0.45;
      pose.elbowL = 0.85 + Math.sin(t * 10) * 0.22;
      pose.tilt = -0.06 + Math.sin(t * 2) * 0.04;
    }

    this.prof.pose(pose);

    // Jogo de câmera cinematográfico em 7 planos dinâmicos + micro-respiro orgânico
    if (s.id === 1) {
      // 1. Hook Close-up centrado no Professor com push-in
      cam.position.set(mix(-0.45, -0.35, u) + swayX, mix(1.52, 1.44, u) + swayY, mix(3.6, 2.85, u));
      this.targetPos.set(-0.45, 1.3, 0);
    } else if (s.id === 2) {
      // 2. Plano 3/4 aberto mostrando Professor + Mesa + Átomo com margem lateral
      cam.position.set(mix(-0.35, -0.05, u) + swayX, mix(1.8, 1.65, u) + swayY, mix(4.6, 4.2, u));
      this.targetPos.set(mix(0.15, 0.25, u), 1.32, 0.1);
    } else if (s.id === 3) {
      // 3. Órbita baixa ao redor das bananas no prato (sem cortar pontas)
      const ang = mix(-0.6, 0.5, u);
      const rad = mix(1.8, 1.55, u);
      cam.position.set(1.0 + Math.sin(ang) * rad + swayX, mix(1.32, 1.52, u) + swayY, 0.2 + Math.cos(ang) * rad);
      this.targetPos.set(1.0, 1.22, 0.2);
    } else if (s.id === 4) {
      // 4. Macro-zoom no Átomo de Potássio-40 (anéis 100% dentro do quadro)
      const ang = mix(0.38, -0.32, u);
      const rad = mix(1.75, 1.4, u);
      cam.position.set(1.0 + Math.sin(ang) * rad + swayX, mix(1.72, 1.68, u) + swayY, 0.2 + Math.cos(ang) * rad);
      this.targetPos.set(1.0, 1.62, 0.2);
    } else if (s.id === 5) {
      // 5. Plano diagonal do Contador Geiger + Bananas + Professor inteiros
      cam.position.set(mix(2.65, 2.3, u) + swayX, mix(1.5, 1.58, u) + swayY, mix(2.75, 2.55, u));
      this.targetPos.set(mix(0.45, 0.25, u), 1.28, 0.1);
    } else if (s.id === 6) {
      // 6. Arco panorâmico dinâmico centrado no Professor
      const ang = mix(0.55, -0.5, u);
      const rad = mix(2.95, 2.65, u);
      cam.position.set(-0.45 + Math.sin(ang) * rad + swayX, mix(1.55, 1.44, u) + swayY, Math.cos(ang) * rad);
      this.targetPos.set(-0.45, 1.28, 0);
    } else {
      // 7. Pull-back hero revelando todo o laboratório com folga lateral
      cam.position.set(mix(0.1, 0.25, u) + swayX, mix(1.55, 1.85, u) + swayY, mix(3.3, 4.65, u));
      this.targetPos.set(mix(0.15, 0.22, u), 1.28, 0.05);
    }
    cam.lookAt(this.targetPos);

    // Faz o Professor girar o corpo e a cabeça para olhar diretamente para a câmera!
    const angleToCam = Math.atan2(
      cam.position.x - this.prof.root.position.x,
      cam.position.z - this.prof.root.position.z
    );
    if (s.id === 5) {
      // Olha alternando entre as bananas e a câmera
      const lookWeight = smooth(clamp01(u * 1.4));
      const targetYaw = mix(0.55, angleToCam, lookWeight);
      this.prof.root.rotation.y = targetYaw * 0.65;
      this.prof.head.rotation.y = targetYaw * 0.35;
    } else {
      this.prof.root.rotation.y = angleToCam * 0.62;
      this.prof.head.rotation.y = angleToCam * 0.38;
    }
  }
}

export function focusAt(_f: number, world: BananasWorld): THREE.Vector3 {
  return world.targetPos.clone();
}
