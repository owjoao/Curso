// "O homem que inventou o avião foi barrado no aeroporto" — short de 20 s em 3D (23/11).
// Dois lugares num mundo só: o aeroporto de Guarulhos (origem) e Paris em 1906 (deslocado em x = 1000).
// Tempos das palavras no topo (rascunho a 3,7 palavras/s; acertar pelo words.json quando o Davi gravar a narração).
import * as THREE from "three";
import { Char, suitcase, roller, toon, Pose } from "./chars";
import { NOINK } from "../pisa/ink";

export const FPS = 30;
const TOTAL_OLD = 660;
// Âncoras [tempo na SUA narração, tempo da coreografia] (em segundos). A coreografia foi montada num rascunho de voz;
// depois que você grava a sua, ponha aqui o instante de cada palavra-chave (tirado do words.json) e tudo estica junto.
// Sem narração própria ainda: deixe só [[0, 0], [22, 22]].
const ANCH: [number, number][] = [
  [0, 0], [1.30, 1.36], [2.36, 2.87], [3.74, 4.58], [4.32, 5.12], [4.82, 5.46], [5.55, 6.22], [6.2, 6.76], [7.52, 7.6],
  [8.06, 8.38], [8.92, 9.48], [9.30, 10.02], [9.94, 10.68], [10.42, 11.0], [10.80, 11.68], [11.2, 12.5], [12.1, 13.58],
  [12.7, 14.2], [12.96, 14.84], [14.24, 15.54], [15.22, 16.88], [16.86, 18.3], [17.3, 18.9], [18.36, 20.38], [18.8, 20.86],
  [19.32, 21.1], [20.4, 22.0],
];
export const TOTAL = Math.round(20.4 * 30);
const interp = (x: number, A: [number, number][], i: 0 | 1) => {
  const j = 1 - i;
  if (x <= A[0][i]) return A[0][j];
  for (let k = 0; k < A.length - 1; k++) if (x <= A[k + 1][i]) { const u = (x - A[k][i]) / (A[k + 1][i] - A[k][i]); return A[k][j] + u * (A[k + 1][j] - A[k][j]); }
  return A[A.length - 1][j] + (x - A[A.length - 1][i]);
};
/** quadro na voz do Davi → quadro (fracionário) da coreografia */
export const warpF = (f: number) => interp(f / 30, ANCH, 0) * 30;
const unwarpF = (fo: number) => Math.round(interp(fo / 30, ANCH, 1) * 30);
// palavras (s)
export const T = {
  barrado: 1.36,
  chapeu: 4.58, bigode: 5.12, mala: 5.46,
  passagem: 6.76, passagem2: 7.6, inventei: 8.38,
  ri1: 10.02, fila: 10.68, ri2: 11.0,
  y1906: 12.5, paris: 13.58, voou: 14.2, bis: 14.84, todo: 15.54,
  patenteou: 16.88, graca1: 18.3,
  hoje: 18.92, graca2: 20.38, cobraram: 20.86, mala2: 21.1,
};
export type Light = "day" | "golden";
export type Shot = { id: number; a: number; b: number; light: Light };
export const SHOTS: Shot[] = [
  { id: 1, a: 0, b: 86, light: "day" },
  { id: 2, a: 86, b: 187, light: "day" },
  { id: 3, a: 187, b: 284, light: "day" },
  { id: 4, a: 284, b: 350, light: "day" },
  { id: 5, a: 350, b: 567, light: "golden" },
  { id: 6, a: 567, b: TOTAL_OLD + 999, light: "day" },
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const FLASHES = [86, 350, 567].map(unwarpF); // flash branco de 4 quadros nas trocas de lugar/tempo

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const eo = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PX = 1000; // Paris fica em x + 1000

// ------------------------------------------------------------------ texturas pintadas
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
};
const FONT = "800 {s}px Helvetica, Arial, sans-serif";
const sign = (text: string, w: number, h: number, bg: string, fg: string, size: number, sub?: string) =>
  canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = FONT.replace("{s}", String(size));
    g.fillText(text, w / 2, sub ? h * 0.4 : h / 2);
    if (sub) { g.font = FONT.replace("{s}", String(Math.round(size * 0.42))); g.globalAlpha = 0.85; g.fillText(sub, w / 2, h * 0.75); }
  });
const unlit = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, toneMapped: false });

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, pos: THREE.Vector3, opts: { cast?: boolean; recv?: boolean; noink?: boolean } = {}) => {
  const x = new THREE.Mesh(g, m);
  x.position.copy(pos);
  x.castShadow = opts.cast ?? false; x.receiveShadow = opts.recv ?? true;
  if (opts.noink) x.layers.set(NOINK);
  return x;
};
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

// ------------------------------------------------------------------ avião moderno (lá fora)
const jet = () => {
  const g = new THREE.Group();
  const white = toon("#f4f4f2"), blue = toon("#2f5fa8"), dark = toon("#2a2f3a");
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 22, 8, 24), white);
  body.rotation.z = Math.PI / 2; body.position.y = 3.2; body.castShadow = true;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 18, 24, 1, true, Math.PI * 0.35, Math.PI * 0.3), blue);
  stripe.rotation.z = Math.PI / 2; stripe.position.y = 3.2;
  const wing = new THREE.Mesh(box(6, 0.25, 28), white); wing.position.set(1, 2.6, 0); wing.castShadow = true;
  wing.geometry.translate(0, 0, 0);
  const tail = new THREE.Mesh(box(4, 6, 0.3), blue); tail.position.set(-11.5, 6, 0);
  const stab = new THREE.Mesh(box(3, 0.2, 9), white); stab.position.set(-11.5, 3.8, 0);
  const eng1 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.2, 20), dark); eng1.rotation.z = Math.PI / 2; eng1.position.set(2.4, 1.9, 6);
  const eng2 = eng1.clone(); eng2.position.z = -6;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), dark);
  nose.rotation.z = -Math.PI / 2; nose.position.set(12.5, 3.6, 0); nose.scale.set(0.6, 1, 1.3);
  for (const legx of [9, 0]) { const l = new THREE.Mesh(box(0.3, 1.6, 0.3), dark); l.position.set(legx, 0.8, 0); g.add(l); }
  g.add(body, stripe, wing, tail, stab, eng1, eng2, nose);
  return g;
};

// ------------------------------------------------------------------ 14-Bis (pipa de caixa de pano e bambu)
// v2 (23/11): antes eram caixas sólidas. Agora: células abertas de pano creme com costuras, armação de bambu escura em
// todas as arestas, asas em "V", fuselagem de treliça comprida até a caixa do leme na frente, hélice atrás, cesto, rodas.
const clothTex = canvasTex(256, 256, (g) => {
  g.fillStyle = "#fbf4e2"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(190,160,110,.35)"; g.lineWidth = 2;
  for (let i = 64; i < 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); }
});
const bisCloth = new THREE.MeshToonMaterial({ map: clothTex, gradientMap: (toon("#fff") as THREE.MeshToonMaterial).gradientMap, side: THREE.DoubleSide, color: "#ffffff", transparent: true, opacity: 0.82, depthWrite: false });
const bamboo = () => toon("#5a3b24");
const stick = (a: THREE.Vector3, b: THREE.Vector3, r = 0.035) => {
  const d = b.clone().sub(a), L = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), bamboo());
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  m.castShadow = true;
  return m;
};
/** célula de pipa aberta na frente e atrás: n vãos ao longo de x */
const kiteCells = (w: number, h: number, d: number, n: number) => {
  const r = new THREE.Group();
  for (const y of [0, h]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), bisCloth); p.position.y = y; p.castShadow = true; r.add(p); }
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (w * i) / n;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(d, h).rotateY(Math.PI / 2), bisCloth); p.position.set(x, h / 2, 0); p.castShadow = true; r.add(p);
    for (const z of [-d / 2, d / 2]) r.add(stick(V(x, 0, z), V(x, h, z)));
  }
  for (const y of [0, h]) for (const z of [-d / 2, d / 2]) r.add(stick(V(-w / 2, y, z), V(w / 2, y, z)));
  return r;
};
const bis14 = () => {
  const g = new THREE.Group();
  // asas em V (diedro) — a frente do avião é +z
  const wingL = kiteCells(5.6, 1.5, 2.2, 3); wingL.position.set(-2.75, 0.2, 0); wingL.rotation.z = 0.17;
  const wingR = kiteCells(5.6, 1.5, 2.2, 3); wingR.position.set(2.75, 0.2, 0); wingR.rotation.z = -0.17;
  g.add(wingL, wingR);
  // fuselagem: treliça de 4 varas que afina até a caixa do leme lá na frente, com pano nas laterais
  const L0 = 1.1, L1 = 7.2;
  const corners = (z: number, k: number) => [V(-0.38 * k, 0.35, z), V(0.38 * k, 0.35, z), V(0.38 * k, 1.05 - 0.2 * (1 - k), z), V(-0.38 * k, 1.05 - 0.2 * (1 - k), z)];
  const A = corners(L0, 1), B = corners(L1, 0.45);
  for (let i = 0; i < 4; i++) g.add(stick(A[i], B[i], 0.04));
  for (let k = 0; k <= 4; k++) {
    const u = k / 4, z = lerp(L0, L1, u), C = corners(z, lerp(1, 0.45, u));
    for (let i = 0; i < 4; i++) g.add(stick(C[i], C[(i + 1) % 4], 0.03));
  }
  for (const sx of [-1, 1]) {
    const geo = new THREE.BufferGeometry().setFromPoints([A[sx < 0 ? 0 : 1], A[sx < 0 ? 3 : 2], B[sx < 0 ? 3 : 2], B[sx < 0 ? 0 : 1]]);
    geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    const uv = new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.add(new THREE.Mesh(geo, bisCloth));
  }
  // leme: caixinha de pipa na ponta da frente
  const front = kiteCells(1.5, 1.1, 1.2, 1); front.position.set(0, 0.22, L1 + 0.5); g.add(front);
  // hélice atrás (duas pás largas) com cubo
  const prop = new THREE.Group();
  for (const sg of [1, -1]) { const b = new THREE.Mesh(box(0.28, 1.25, 0.06), toon("#8a5a34")); b.position.y = 0.66 * sg; b.rotation.y = 0.35 * sg; b.castShadow = true; prop.add(b); }
  prop.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), toon("#3a2a20")));
  prop.position.set(0, 0.95, -1.25); prop.name = "prop";
  // motor e cesto do piloto (ele fica em pé no cesto)
  const engine = new THREE.Mesh(box(0.55, 0.45, 0.7), toon("#3a3a40")); engine.position.set(0, 0.95, -0.8); engine.castShadow = true;
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.55, 14, 1, true), toon("#b07a3c")); basket.position.set(0, 0.28, 0.9);
  (basket.material as THREE.Material).side = THREE.DoubleSide;
  // trem de pouso: duas rodas com raios
  for (const x of [-1.0, 1.0]) {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 24), toon("#2a2730")));
    for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(box(0.025, 0.7, 0.025), toon("#2a2730")); sp.rotation.z = (i * Math.PI) / 4; w.add(sp); }
    w.position.set(x, -0.55, 0.6); w.rotation.y = Math.PI / 2; g.add(w);
    g.add(stick(V(x, -0.55, 0.6), V(x * 0.5, 0.2, 0.6), 0.03));
  }
  g.add(prop, engine, basket);
  return g;
};

// ------------------------------------------------------------------ Torre Eiffel simples
const eiffel = () => {
  const g = new THREE.Group();
  const m = toon("#7a5a44");
  const H = 90;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.2, 52, 6), m);
    leg.position.set(sx * 9, 25, sz * 9);
    leg.rotation.z = sx * 0.31; leg.rotation.x = -sz * 0.31;
    g.add(leg);
  }
  const p1 = new THREE.Mesh(box(26, 2.4, 26), m); p1.position.y = 18;
  const p2 = new THREE.Mesh(box(13, 2, 13), m); p2.position.y = 42;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 3.4, 44, 6), m); spire.position.y = 64;
  const top = new THREE.Mesh(box(3, 3, 3), m); top.position.y = H - 3;
  g.add(p1, p2, spire, top);
  // arco embaixo
  const arch = new THREE.Mesh(new THREE.TorusGeometry(7, 0.9, 8, 24, Math.PI), m); arch.position.y = 10; g.add(arch);
  return g;
};

const tree = (x: number, z: number, s = 1) => {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 2 * s, 8), toon("#6b4a32")); trunk.position.y = s; trunk.castShadow = true;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.5 * s, 16, 12), toon("#4f9a3c")); crown.position.y = 2.7 * s; crown.castShadow = true;
  g.add(trunk, crown); g.position.set(x, 0, z);
  return g;
};

// ------------------------------------------------------------------ céu
const SKY: Record<Light, [string, string]> = { day: ["#2f73cf", "#bcd6f0"], golden: ["#6a4f8c", "#ffcf8a"] };
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
  vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
  fragmentShader: "uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float u = clamp(vP.y*1.6,0.0,1.0); gl_FragColor = vec4(mix(hor, top, pow(u,0.7)),1.0);} ",
});

// ------------------------------------------------------------------ o mundo
export class DumontWorld {
  root = new THREE.Group();
  sky: THREE.Mesh;
  hemi = new THREE.HemisphereLight("#dcecff", "#b49a78", 1.0);
  sun = new THREE.DirectionalLight("#fff3e0", 2.6);
  fog = new THREE.Fog("#bcd6f0", 40, 260);
  dumont: Char; agent: Char; guard: Char; queue: Char[] = []; crowd: Char[] = []; young: Char;
  plane: THREE.Group; skyJet: THREE.Group; papers: THREE.Mesh[] = []; screen: THREE.Mesh; bag: THREE.Group;

  constructor() {
    const R = this.root;
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), skyMat);
    this.sky.layers.set(NOINK); this.sky.frustumCulled = false;
    R.add(this.sky, this.hemi, this.sun, this.sun.target);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0003; this.sun.shadow.normalBias = 0.02;

    // ============ AEROPORTO ============
    const floorTex = canvasTex(512, 512, (g) => {
      g.fillStyle = "#efe4d2"; g.fillRect(0, 0, 512, 512);
      g.strokeStyle = "rgba(90,80,70,.35)"; g.lineWidth = 4;
      for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
      g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(20, 20, 90, 30);
    }, [12, 12]);
    R.add(mesh(new THREE.PlaneGeometry(48, 48).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ map: floorTex, gradientMap: (toon("#fff") as THREE.MeshToonMaterial).gradientMap }), V(0, 0, -2)));
    // pista lá fora
    R.add(mesh(new THREE.PlaneGeometry(400, 300).rotateX(-Math.PI / 2), toon("#8d929a"), V(0, -0.02, -165)));
    for (let i = -6; i <= 6; i++) R.add(mesh(box(0.6, 0.02, 8), toon("#f2d24a"), V(i * 14, 0.01, -60), { noink: true }));
    // parede de vidro do fundo: montantes (o vão fica aberto e mostra a pista e o céu)
    const frame = toon("#3a404c");
    for (let x = -24; x <= 24; x += 4) R.add(mesh(box(0.25, 9, 0.35), frame, V(x, 4.5, -14)));
    for (const y of [0.15, 3.2, 6.2, 8.9]) R.add(mesh(box(48, 0.25, 0.35), frame, V(0, y, -14)));
    // teto com luminárias
    R.add(mesh(box(48, 0.4, 30), toon("#efece6"), V(0, 9.2, 0)));
    for (let z = -12; z <= 8; z += 5) R.add(mesh(box(40, 0.08, 0.6), new THREE.MeshBasicMaterial({ color: "#fffaf0" }), V(0, 8.95, z), { noink: true }));
    // paredes laterais
    R.add(mesh(box(0.4, 9.4, 30), toon("#e8e2d6"), V(-24, 4.7, 0)));
    R.add(mesh(box(0.4, 9.4, 30), toon("#e8e2d6"), V(24, 4.7, 0)));
    // letreiro grande
    const gru = mesh(new THREE.PlaneGeometry(14, 2.2), unlit(sign("GUARULHOS", 1400, 220, "#1f3f7a", "#ffffff", 150)), V(-4, 7.3, -13.7), { noink: true });
    R.add(gru);
    // painel de partidas
    const board = canvasTex(1000, 600, (g) => {
      g.fillStyle = "#141820"; g.fillRect(0, 0, 1000, 600);
      g.fillStyle = "#f2c14e"; g.font = FONT.replace("{s}", "56"); g.fillText("PARTIDAS", 40, 80);
      const rows = [["08:40", "PARIS", "EMBARQUE"], ["09:15", "LISBOA", "NO HORÁRIO"], ["09:50", "RIO", "NO HORÁRIO"], ["10:20", "SALVADOR", "ATRASADO"], ["11:05", "MIAMI", "NO HORÁRIO"]];
      g.font = FONT.replace("{s}", "42");
      rows.forEach((r, i) => { g.fillStyle = "#e9edf5"; g.fillText(r[0], 40, 170 + i * 90); g.fillText(r[1], 220, 170 + i * 90); g.fillStyle = r[2] === "ATRASADO" ? "#ff7a6b" : "#7be08f"; g.fillText(r[2], 640, 170 + i * 90); });
    });
    R.add(mesh(box(6.2, 3.7, 0.3), toon("#1c1f26"), V(-15, 5, -13.4)));
    R.add(mesh(new THREE.PlaneGeometry(6, 3.5), unlit(board), V(-15, 5, -13.2), { noink: true }));
    // balcão do check-in
    const desk = new THREE.Group();
    const top = mesh(box(5, 1.1, 1.1), toon("#f4f2ee"), V(0, 0.55, 0), { cast: true });
    const stripe = mesh(box(5.02, 0.18, 1.12), toon("#e0663b"), V(0, 0.85, 0));
    desk.add(top, stripe);
    desk.add(mesh(new THREE.PlaneGeometry(4.4, 1.0), unlit(sign("CHECK-IN", 880, 200, "#e0663b", "#ffffff", 120)), V(0, 3.1, -1.6), { noink: true }));
    desk.add(mesh(box(4.6, 1.2, 0.2), toon("#2a2f3a"), V(0, 3.1, -1.72)));
    // tela do valor da bagagem (vira na cena 6)
    this.screen = mesh(new THREE.PlaneGeometry(1.0, 0.62), unlit(sign("BAGAGEM", 600, 372, "#0f141d", "#f2c14e", 96, "PAGUE AQUI")), V(1.2, 1.55, 0.2), { noink: true });
    this.screen.rotation.x = -0.2;
    desk.add(mesh(box(1.1, 0.7, 0.08), toon("#1c1f26"), V(1.2, 1.55, 0.15)));
    desk.add(mesh(box(0.08, 0.5, 0.08), toon("#1c1f26"), V(1.2, 1.15, 0.15)));
    desk.add(this.screen);
    // balança da mala
    desk.add(mesh(box(1.0, 0.25, 0.8), toon("#9aa0aa"), V(-1.6, 0.13, 1.0), { cast: true }));
    desk.position.set(5, 0, -6);
    R.add(desk);
    // pórtico da segurança
    for (const x of [-4.4, -1.6]) R.add(mesh(box(0.35, 2.4, 0.6), toon("#c9ccd2"), V(x, 1.2, -4.5), { cast: true }));
    R.add(mesh(box(3.15, 0.35, 0.6), toon("#c9ccd2"), V(-3, 2.55, -4.5), { cast: true }));
    // fila com pedestais e fita
    for (let i = 0; i < 6; i++) {
      R.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 10), toon("#c0a060"), V(0.5 + i * 1.2, 0.5, -2.2), { cast: true }));
      R.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), toon("#c0a060"), V(0.5 + i * 1.2, 0.02, -2.2)));
      if (i < 5) R.add(mesh(box(1.2, 0.07, 0.02), toon("#c23a3a"), V(1.1 + i * 1.2, 0.92, -2.2)));
    }
    // avião parado lá fora + um decolando ao longe
    this.plane = jet(); this.plane.position.set(6, 0, -34); this.plane.rotation.y = -0.35; R.add(this.plane);
    this.skyJet = jet(); this.skyJet.scale.setScalar(0.6); this.skyJet.position.set(-60, 40, -180); this.skyJet.rotation.z = 0.15; R.add(this.skyJet);
    // vasos de planta (cor)
    for (const [x, z] of [[-19, -11], [14, -11], [-12, 4], [15, 4]]) {
      R.add(mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.8, 16), toon("#e0663b"), V(x, 0.4, z), { cast: true }));
      R.add(mesh(new THREE.SphereGeometry(0.8, 14, 10), toon("#3f8f45"), V(x, 1.3, z), { cast: true }));
    }

    // bonecos do aeroporto
    this.dumont = new Char({ shirt: "#3d3550", skin: "#f6d3b0", hair: "#2a1d18", hat: "panama", hatCol: "#ecd9a2", mustache: true, collar: true, tie: "#c8323f", scale: 0.92 });
    this.bag = suitcase(); this.dumont.hold.add(this.bag);
    this.agent = new Char({ shirt: "#2f7fc8", skin: "#e8b58a", hat: "bun", hair: "#1f1612", tie: "#f08a2c", collar: true });
    this.guard = new Char({ shirt: "#2b3a5c", skin: "#a8714a", hat: "cap", hatCol: "#1f2a44", scale: 1.06 });
    const qLooks = [
      { shirt: "#e2453c", skin: "#ffe0bf", hat: "hair" as const, hair: "#5a3b2a" },
      { shirt: "#f3d35a", skin: "#c99067", hat: "cap" as const, hatCol: "#3f6fb5" },
      { shirt: "#2f9a5f", skin: "#f1c7a0", hat: "curly" as const, hair: "#2a201a" },
      { shirt: "#f08a2c", skin: "#e9b98e", hat: "bun" as const, hair: "#c9893a" },
      { shirt: "#8a5ad8", skin: "#8a5a3c", hat: "curly" as const, hair: "#1d1612" },
    ];
    qLooks.forEach((l, i) => { const c = new Char(l); c.root.position.set(1.3 + i * 1.15, 0, -3.1 - (i % 2) * 0.25); this.queue.push(c); R.add(c.root); });
    R.add(this.dumont.root, this.agent.root, this.guard.root);
    const wLooks = [
      { shirt: "#2f9a5f", skin: "#f1c7a0", hat: "hair" as const, hair: "#5a3b2a" }, { shirt: "#e2453c", skin: "#8a5a3c", hat: "curly" as const, hair: "#1d1612" },
      { shirt: "#f2c14e", skin: "#ffe0bf", hat: "bun" as const, hair: "#c9893a" }, { shirt: "#3f6fb5", skin: "#e9b98e", hat: "cap" as const, hatCol: "#e2453c" },
      { shirt: "#e27aa0", skin: "#f1c7a0", hat: "bun" as const, hair: "#2a201a" }, { shirt: "#f08a2c", skin: "#c99067", hat: "hair" as const, hair: "#2a201a" },
      { shirt: "#8a5ad8", skin: "#ffe0bf", hat: "hair" as const, hair: "#c9893a" }, { shirt: "#2f8a8a", skin: "#a8714a", hat: "cap" as const, hatCol: "#f2c14e" },
    ];
    const bagCols = ["#e2453c", "#3f6fb5", "#2f9a5f", "#f2c14e", "#8a5ad8", "#f08a2c", "#2a2730", "#e27aa0"];
    wLooks.forEach((l, i) => {
      const c = new Char(l), bag = roller(bagCols[i]);
      const dir = i % 2 ? 1 : -1;
      this.walkers.push({ c, bag, x0: -18 + ((i * 7.3) % 36), z: -12.0 - (i % 3) * 0.6, sp: 1.05 + (i % 3) * 0.18, dir });
      R.add(c.root, bag);
    });
    // cartazes coloridos na parede lateral
    const ads: [string, string, string, number][] = [["#e0663b", "#ffffff", "BEM-VINDO", -6], ["#2f9a8f", "#ffffff", "BRASIL", 2]];
    for (const [bg, fg, txt, z] of ads) {
      const ad = mesh(new THREE.PlaneGeometry(6, 3), unlit(sign(txt, 900, 450, bg, fg, 150)), V(-23.7, 4.6, z), { noink: true });
      ad.rotation.y = Math.PI / 2; R.add(ad);
    }

    // ============ PARIS 1906 ============
    const grass = canvasTex(512, 512, (g) => {
      g.fillStyle = "#6fb24a"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) { g.strokeStyle = i % 3 ? "rgba(40,110,40,.35)" : "rgba(200,230,120,.35)"; g.lineWidth = 3; const x = (i * 97) % 512, y = (i * 211) % 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y - 14); g.stroke(); }
    }, [30, 30]);
    R.add(mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ map: grass, gradientMap: (toon("#fff") as THREE.MeshToonMaterial).gradientMap }), V(PX, 0, -150)));
    const tower = eiffel(); tower.position.set(PX + 70, 0, -260); tower.scale.setScalar(1.1); R.add(tower);
    for (let i = 0; i < 18; i++) R.add(tree(PX - 80 + i * 10 + (i % 3) * 3, -60 - (i % 4) * 6, 1.4 + (i % 3) * 0.3));
    // cerquinha de madeira
    for (let i = 0; i < 30; i++) R.add(mesh(box(0.12, 1, 0.12), toon("#8a6a4a"), V(PX - 15 + i, 0.5, -6), { cast: true }));
    R.add(mesh(box(30, 0.1, 0.1), toon("#8a6a4a"), V(PX, 0.8, -6)));
    this.young = new Char({ shirt: "#3d3550", skin: "#f6d3b0", hair: "#2a1d18", hat: "panama", hatCol: "#ecd9a2", mustache: true, collar: true, tie: "#c8323f", scale: 0.92 });
    R.add(this.young.root);
    const pLooks = [
      { shirt: "#2c2a40", skin: "#ffe0bf", hat: "top" as const, hatCol: "#1d1b22", mustache: true },
      { shirt: "#a83a3a", skin: "#f1c7a0", hat: "bowler" as const, hatCol: "#3a2e2a" },
      { shirt: "#e27aa0", skin: "#ffe0bf", hat: "bun" as const, hair: "#5a3b2a", skirt: true },
      { shirt: "#3a6ab0", skin: "#e9b98e", hat: "top" as const, hatCol: "#1d1b22" },
      { shirt: "#f2c14e", skin: "#ffe0bf", hat: "bun" as const, hair: "#c9893a", skirt: true },
      { shirt: "#4a8a3a", skin: "#f1c7a0", hat: "bowler" as const, hatCol: "#2a2420", mustache: true },
      { shirt: "#2c2a40", skin: "#c99067", hat: "top" as const, hatCol: "#1d1b22" },
      { shirt: "#c46a2f", skin: "#ffe0bf", hat: "bowler" as const, hatCol: "#3a2e2a", mustache: true },
      { shirt: "#7a4ab0", skin: "#f1c7a0", hat: "bun" as const, hair: "#2a201a", skirt: true },
      { shirt: "#2f8a8a", skin: "#e9b98e", hat: "bowler" as const, hatCol: "#2a2420" },
    ];
    pLooks.forEach((l, i) => {
      const c = new Char(l);
      c.root.position.set(PX - 7 + i * 1.45 + (i % 2) * 0.3, 0, -3.0 - (i % 3) * 0.9);
      this.crowd.push(c); R.add(c.root);
    });
    this.bis = bis14(); R.add(this.bis);
    for (let i = 0; i < 10; i++) {
      const p = mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(128, 92, (g) => {
        g.fillStyle = "#dfe9f7"; g.fillRect(0, 0, 128, 92); g.strokeStyle = "#2f5fa8"; g.lineWidth = 3;
        g.strokeRect(6, 6, 116, 80); g.beginPath(); g.moveTo(20, 60); g.lineTo(108, 60); g.moveTo(40, 30); g.lineTo(90, 30); g.moveTo(64, 20); g.lineTo(64, 70); g.stroke();
      }), side: THREE.DoubleSide }), V(PX, -10, 0), { noink: true });
      this.papers.push(p); R.add(p);
    }
  }
  bis: THREE.Group;
  walkers: { c: Char; bag: THREE.Group; x0: number; z: number; sp: number; dir: number }[] = [];

  /** pose de tudo no quadro f; devolve o ponto de foco */
  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    const t = f / FPS, s = shotAt(f);
    const c = camAt(f);
    cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.15; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    // luz
    const golden = s.light === "golden";
    const [top, hor] = SKY[s.light];
    (skyMat.uniforms.top.value as THREE.Color).set(top); (skyMat.uniforms.hor.value as THREE.Color).set(hor);
    this.sky.position.copy(cam.position);
    this.hemi.color.set(golden ? "#ffd9b0" : "#dcecff"); this.hemi.groundColor.set(golden ? "#7a5a7a" : "#b49a78"); this.hemi.intensity = golden ? 0.8 : 1.05;
    this.sun.color.set(golden ? "#ffb36b" : "#fff3e0"); this.sun.intensity = golden ? 2.9 : 2.3;
    const focus = c.look.clone();
    const sunDir = golden ? V(-0.35, 0.32, -0.88).normalize() : V(0.45, 0.8, 0.4).normalize();
    this.sun.position.copy(focus).addScaledVector(sunDir, 120); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; const Rr = golden ? 30 : 18;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.fog.color.set(hor); this.fog.near = golden ? 60 : 50; this.fog.far = golden ? 420 : 300;
    scene.fog = this.fog; scene.background = null;

    // piscadas
    const blink = (i: number) => { const k = (Math.round(f) + i * 37) % 71; return k === 0 || k === 3 ? 0.5 : k === 1 || k === 2 ? 1 : 0; };
    const D = this.dumont, A = this.agent, G = this.guard;
    const air = s.id !== 5;
    for (const ch of [D, A, G, ...this.queue]) ch.root.visible = air;
    for (const ch of [this.young, ...this.crowd]) ch.root.visible = !air;
    this.bis.visible = !air;
    for (const p of this.papers) p.visible = !air;
    this.skyJet.position.set(-60 + t * 6, 40 + t * 1.2, -180);

    const face = (ch: Char) => (x: number, z: number) => Math.atan2(x - ch.root.position.x, z - ch.root.position.z);
    // gesto com impulso: recua um pouco antes e passa do ponto depois (nada de braço de robô)
    const back = (x: number) => { const u = clamp01(x), c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
    const gest = (t0: number, d = 0.32) => (t < t0 - 0.14 ? 0 : t < t0 ? -0.22 * sm((t - (t0 - 0.14)) / 0.14) : back((t - t0) / d));
    const flap = (a: number, b: number) => (t >= a && t < b ? Math.abs(Math.sin(t * 17)) : 0);
    // figurantes andando lá no fundo (aeroporto)
    this.walkers.forEach((w, i) => {
      const on = air;
      w.c.root.visible = on; w.bag.visible = on;
      if (!on) return;
      let x = w.x0 + w.dir * w.sp * t; x = ((x + 22) % 44 + 44) % 44 - 22;
      w.c.root.position.set(x, 0, w.z); w.c.root.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      w.c.pose({ t, walk: t * 1.75 * w.sp + i * 0.37, face: i % 3 ? "smile" : "neutral", blink: blink(i + 11), armR: 0.35, fwdR: -0.3, elbowR: 0.1 });
      w.bag.position.set(x - w.dir * 0.55, 0, w.z + 0.15); w.bag.rotation.set(0, 0, w.dir * 0.25);
    });
    // fila: rostos neutros, viram e riem na cena 4
    this.queue.forEach((q, i) => {
      q.root.rotation.y = face(q)(cam.position.x, cam.position.z) * 0.5;
      const lt = T.fila - 0.1 + i * 0.06, laugh = s.id === 4 && t >= lt;
      const k = laugh ? Math.abs(Math.sin((t - lt) * 11 + i)) : 0;
      q.pose({ t: t + i, face: laugh ? "laugh" : s.id === 6 ? "smile" : "neutral", blink: blink(i + 3), hop: k * 0.06, squash: laugh ? (k - 0.5) * 0.12 : 0, lean: laugh ? 0.14 : 0,
        armL: laugh && i % 2 ? 0.7 : 0.18, fwdR: laugh && !(i % 2) ? 0.9 : 0, elbowR: laugh ? 1.4 : 0.25, tilt: laugh ? Math.sin(t * 9 + i) * 0.14 : 0, nod: laugh ? -0.15 : 0 });
    });

    if (s.id === 1) {
      // Dumont vem todo convencido até o pórtico; o segurança entra na frente com a mão levantada no "barrado"
      const u = clamp01(t / 1.25);
      D.root.position.set(-3, 0, lerp(-11, -6.0, eo(u)));
      D.root.rotation.y = 0.35;
      const walking = t < 1.25, stop = gest(T.barrado - 0.05, 0.28);
      D.pose({ t, walk: walking ? t * 1.7 : undefined, stride: walking ? 1.1 : 0, face: t >= T.barrado ? "shock" : "proud", blink: blink(1), lean: stop * 0.16, squash: t >= T.barrado ? (1 - clamp01((t - T.barrado) / 0.25)) * 0.12 : 0,
        hop: t >= T.barrado && t < T.barrado + 0.25 ? Math.sin(((t - T.barrado) / 0.25) * Math.PI) * 0.07 : 0, armL: 0.18 + stop * 0.5, nod: walking ? -0.05 : 0.05 });
      const g = eo((t - (T.barrado - 0.45)) / 0.35);
      G.root.position.set(lerp(0.2, -2.7, g), 0, -4.1); G.root.rotation.y = Math.PI + 0.9;
      const hand = gest(T.barrado - 0.1, 0.3);
      G.pose({ t, walk: g < 1 && g > 0 ? t * 2 : undefined, fwdR: hand * 1.5, elbowR: 0.15 + (1 - hand) * 0.4, face: "neutral", blink: blink(2), lean: -hand * 0.06 });
      A.root.position.set(5, 0, -6.9); A.root.rotation.y = 0; A.pose({ t, face: "smile", blink: blink(4) });
    } else if (s.id === 2) {
      // Dumont andando na frente do vidro (com ginga), câmera acompanhando
      const u = (t - 2.87) / 3.35;
      D.root.position.set(lerp(-10, -3.5, u), 0, -10.5);
      D.root.rotation.y = Math.PI / 2;
      const tip = gest(T.chapeu - 0.05, 0.25) * (t < T.chapeu + 0.6 ? 1 : Math.max(0, 1 - (t - T.chapeu - 0.6) / 0.3));
      D.pose({ t, walk: t * 1.7, stride: 1.1, face: "proud", blink: blink(1), fwdL: tip * 2.3, elbowL: tip * 1.6, tilt: t > T.bigode && t < T.bigode + 0.5 ? 0.14 : 0, nod: -0.04 });
      G.root.position.set(-3, 0, -3.4); G.pose({ t, face: "neutral" });
      A.root.position.set(5, 0, -6.9); A.pose({ t, face: "smile", blink: blink(4) });
    } else if (s.id === 3 || s.id === 4) {
      D.root.position.set(3.9, 0, -4.6); D.root.rotation.y = 2.45;
      const point = gest(T.inventei - 0.08, 0.3);
      D.pose({ t, face: s.id === 4 ? "neutral" : t >= T.passagem2 - 0.05 && t < T.inventei + 0.6 ? "talk" : t < T.passagem2 ? "smile" : "proud", mouth: flap(T.passagem2 - 0.05, T.inventei + 0.55),
        blink: blink(1), fwdL: point * 2.55, elbowL: 0.1, armL: 0.25, lean: point * 0.08, nod: -point * 0.12, armR: 0.3 });
      A.root.position.set(5.2, 0, -6.9); A.root.rotation.y = -0.62;
      const ask = t >= T.passagem - 0.2 && t < T.inventei + 0.6 ? gest(T.passagem - 0.15, 0.3) : 0;
      A.pose({ t, face: s.id === 4 ? "laugh" : t >= T.passagem - 0.1 && t < T.passagem2 ? "talk" : "smile", mouth: flap(T.passagem - 0.1, T.passagem2 - 0.1), blink: blink(4), fwdR: ask * 1.25, elbowR: 0.35, tilt: ask * 0.1,
        hop: s.id === 4 ? Math.abs(Math.sin(t * 10)) * 0.04 : 0 });
      G.root.position.set(1.2, 0, -2.6); G.root.rotation.y = face(G)(cam.position.x, cam.position.z) * 0.6;
      const gl = s.id === 4 && t >= T.ri1 - 0.08, gk = gl ? Math.abs(Math.sin((t - T.ri1) * 12)) : 0;
      G.pose({ t, face: gl ? "laugh" : "neutral", blink: blink(2), lean: gl ? 0.22 + gk * 0.06 : 0, hop: gk * 0.05, squash: gl ? (gk - 0.5) * 0.14 : 0, armR: gl ? 0.5 : 0.18, fwdL: gl ? 1.1 : 0, elbowL: gl ? 1.5 : 0.25, tilt: gl ? Math.sin(t * 10) * 0.16 : 0, nod: gl ? -0.25 : 0 });
    } else if (s.id === 5) {
      // Paris 1906: o 14-Bis passa voando, a multidão vibra; depois ele distribui o projeto de graça
      const u = (t - 11.68) / (T.patenteou - 11.68);
      this.bis.position.set(PX - 22 + u * 36, 2.0 + sm(u) * 2.6 + Math.sin(t * 3) * 0.1, -8.5);
      this.bis.rotation.set(0.06, Math.PI / 2 - 0.62, -0.12 + Math.sin(t * 2) * 0.04);
      const prop = this.bis.getObjectByName("prop"); if (prop) prop.rotation.z = t * 40;
      this.bis.visible = t < T.patenteou;
      const flying = t < T.patenteou;
      this.bis.updateMatrixWorld(true);
      this.young.root.position.copy(flying ? this.bis.localToWorld(V(0, 0.05, 0.9)) : V(PX + 1.2, 0, -1.2));
      this.young.root.rotation.y = flying ? Math.PI / 2 - 0.62 : 0;
      this.young.root.scale.setScalar(flying ? 0.55 : 0.92);
      const give = gest(T.graca1 - 0.55, 0.3);
      this.young.pose({ t, face: flying ? "cheer" : t >= T.graca1 - 0.6 ? "smile" : "proud", blink: blink(1), armR: flying ? 2.3 + Math.sin(t * 8) * 0.2 : 0.2 + give * 0.9, fwdR: give * 1.1, elbowR: flying ? 0.2 : 0.3,
        fwdL: !flying && t < T.graca1 - 0.6 ? 0.7 : 0, elbowL: !flying && t < T.graca1 - 0.6 ? 1.6 : 0.25, hop: !flying && t > T.graca1 - 0.2 && t < T.graca1 + 0.2 ? Math.sin(((t - T.graca1 + 0.2) / 0.4) * Math.PI) * 0.08 : 0 });
      this.crowd.forEach((c, i) => {
        c.root.rotation.y = flying ? -Math.PI / 2 + 0.5 + Math.sin(i) * 0.25 : face(c)(PX + 1.2, -1.2);
        const cheer = t >= T.voou - 0.1 + (i % 4) * 0.05, ck = cheer && flying ? Math.abs(Math.sin(t * 8 + i)) : 0;
        c.pose({ t: t + i, face: cheer ? (flying ? "cheer" : "smile") : "shock", blink: blink(i + 7), armL: cheer && flying ? 2.4 + Math.sin(t * 9 + i) * 0.25 : 0.2, armR: cheer && flying ? 2.4 + Math.cos(t * 9 + i) * 0.25 : 0.2,
          elbowL: cheer && flying ? 0.5 : 0.25, elbowR: cheer && flying ? 0.5 : 0.25, hop: ck * 0.12, squash: (ck - 0.5) * 0.1 * (cheer && flying ? 1 : 0), fwdR: !flying && t > T.graca1 - 0.3 ? 1.0 : 0, lean: !cheer ? 0.08 : 0 });
      });
      // papéis do projeto voando pra multidão no "de graça"
      this.papers.forEach((p, i) => {
        const tt = t - (T.graca1 - 0.5) - i * 0.06;
        if (tt < 0 || flying) { p.visible = false; return; }
        p.visible = true;
        const dest = this.crowd[i % this.crowd.length].root.position;
        const k = clamp01(tt / 0.9);
        p.position.set(lerp(PX + 1.2, dest.x, k), 1.5 + Math.sin(k * Math.PI) * 2.2 + (1 - k) * 0.2, lerp(-1.2, dest.z + 0.3, k));
        p.rotation.set(t * 4 + i, t * 3 + i, t * 2);
      });
    } else if (s.id === 6) {
      // de volta ao balcão: a tela da bagagem, a mala na balança, a cara de choque
      D.root.position.set(4.0, 0, -4.4); D.root.rotation.y = Math.PI - 0.25;
      const sh = gest(T.cobraram - 0.06, 0.22), shock = t >= T.cobraram - 0.06;
      D.pose({ t, face: shock ? "shock" : "neutral", blink: blink(1), lean: sh * 0.22, squash: shock ? -0.1 * (1 - clamp01((t - T.cobraram) / 0.3)) : 0,
        hop: shock && t < T.cobraram + 0.3 ? Math.sin(((t - T.cobraram + 0.06) / 0.36) * Math.PI) * 0.09 : 0, armL: 0.18 + sh * 0.9, elbowL: 0.25 + sh * 0.9, armR: 0.25, fwdR: 0.6 });
      A.root.position.set(6.1, 0, -6.9); A.root.rotation.y = -0.5;
      const pt = gest(T.graca2 - 0.1, 0.3);
      A.pose({ t, face: "smile", blink: blink(4), fwdL: pt * 1.3, armL: 0.18 + pt * 0.5, elbowL: 0.2 });
      G.root.position.set(-0.8, 0, -2.4); G.pose({ t, face: "smile" });
    }
    return focus;
  }
}

// ------------------------------------------------------------------ câmera
type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll: number };
type Key = { t: number; pos: [number, number, number]; look: [number, number, number]; fov: number; roll?: number };
const KEYS: Record<number, Key[]> = {
  1: [
    { t: 0.0, pos: [0.4, 1.3, 0.8], look: [-3.2, 1.3, -7.5], fov: 40 },
    { t: 1.79, pos: [-0.4, 1.35, -1.4], look: [-3.0, 1.35, -5.4], fov: 36 },
    { t: 2.87, pos: [-0.9, 1.4, -2.3], look: [-3.0, 1.45, -5.3], fov: 32, roll: 0.06 },
  ],
  2: [
    { t: 2.87, pos: [-5.0, 1.5, -6.2], look: [-9.6, 1.15, -10.5], fov: 44 },
    { t: 4.66, pos: [-3.7, 1.55, -7.4], look: [-6.6, 1.3, -10.5], fov: 38 },
    { t: 6.22, pos: [-1.5, 1.2, -8.0], look: [-3.5, 0.95, -10.4], fov: 40 },
  ],
  3: [
    { t: 6.22, pos: [2.6, 1.62, -4.3], look: [5.2, 1.6, -6.9], fov: 34 },
    { t: 7.58, pos: [2.8, 1.62, -4.55], look: [5.2, 1.62, -6.9], fov: 30 },
    { t: 7.6, pos: [6.3, 1.66, -7.3], look: [3.9, 1.5, -4.6], fov: 36 },
    { t: 8.88, pos: [6.2, 1.64, -7.2], look: [3.9, 1.55, -4.6], fov: 31 },
    { t: 9.48, pos: [6.2, 1.8, -7.2], look: [4.6, 3.6, -34], fov: 44 },
  ],
  4: [
    { t: 9.48, pos: [-0.4, 1.5, -0.4], look: [1.2, 1.55, -2.6], fov: 32 },
    { t: 10.25, pos: [0.6, 1.55, -0.6], look: [3.0, 1.3, -3.6], fov: 46 },
    { t: 11.68, pos: [0.2, 1.65, 0.6], look: [3.3, 1.2, -3.6], fov: 48 },
  ],
  5: [
    { t: 11.68, pos: [PX - 14, 1.2, 4], look: [PX - 10, 3.6, -14], fov: 46 },
    { t: 14.09, pos: [PX - 3, 1.0, 5], look: [PX + 2, 4.0, -14], fov: 48, roll: -0.04 },
    { t: 16.7, pos: [PX + 6, 1.4, 5.5], look: [PX + 12, 4.2, -14], fov: 46 },
    { t: 16.88, pos: [PX + 1.8, 1.5, 5.4], look: [PX + 0.6, 1.2, -2.4], fov: 40 },
    { t: 18.9, pos: [PX + 1.6, 1.6, 4.2], look: [PX + 0.4, 1.4, -2.6], fov: 44 },
  ],
  6: [
    { t: 18.9, pos: [-0.5, 2.2, -3.7], look: [5.0, 1.4, -5.9], fov: 40 },
    { t: 20.3, pos: [4.7, 1.75, -3.4], look: [6.2, 1.6, -5.9], fov: 40 },
    { t: 20.78, pos: [4.5, 1.55, -6.6], look: [4.0, 1.45, -4.4], fov: 36, roll: -0.05 },
    { t: 22.0, pos: [4.4, 1.52, -6.2], look: [4.0, 1.45, -4.4], fov: 30, roll: -0.08 },
  ],
};
/** cortes secos dentro da cena (tempos das chaves que pulam em vez de deslizar) */
const CUTS = new Set([16.88, 20.78, 7.6]);
export const camAt = (f: number): Cam => {
  const t = f / FPS, s = shotAt(f), ks = KEYS[s.id];
  let i = 0;
  while (i < ks.length - 1 && t >= ks[i + 1].t) i++;
  const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)];
  let u = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
  if (CUTS.has(b.t)) u = 0;
  // movimentos "ease-out burst" (pico no começo, decai), esperas com empurrão lento
  const w = sm(u);
  const L = (x: [number, number, number], y: [number, number, number]) => V(lerp(x[0], y[0], w), lerp(x[1], y[1], w), lerp(x[2], y[2], w));
  // tremida curtinha nos impactos
  const kick = [T.barrado, T.inventei, T.ri1, T.cobraram].reduce((acc, k) => { const d = t - k; return d >= 0 && d < 0.23 ? acc + (1 - d / 0.23) * 0.035 * (Math.round(d * FPS) % 2 ? 1 : -1) : acc; }, 0);
  const pos = L(a.pos, b.pos); pos.x += kick;
  return { pos, look: L(a.look, b.look), fov: lerp(a.fov, b.fov, w), roll: lerp(a.roll ?? 0, b.roll ?? 0, w) };
};
/** foco da lente por cena: distância até o boneco principal */
export const focusAt = (f: number, world: DumontWorld): THREE.Vector3 => {
  const s = shotAt(f);
  if (s.id === 5) return f / FPS < T.patenteou ? world.bis.position.clone() : world.young.root.position.clone().add(V(0, 1.5, 0));
  if (s.id === 4) return world.guard.root.position.clone().add(V(0, 1.5, 0));
  return world.dumont.root.position.clone().add(V(0, 1.5, 0));
};
export type { Pose };
