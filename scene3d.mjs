/* =====================================================================
   Omar Elarabi portfolio: holographic hero scenes (three.js r160, vendored).
   One procedurally modelled hologram per discipline:
     structures  gear train with a planetary set that separates on scroll
     aero        swept wing with a turbofan that explodes axially
     control     wind turbine and grid (energy systems), nacelle drivetrain
     data        airport taxi routes lifting into a PCA point cloud
   API (window.Scene3D): new Scene3D(canvas) · set(id) · resize()
   · render({prog,time,mx,my,ink,acc,dark,level,scale,off}) -> {zoom}
   ===================================================================== */
import * as THREE from "./lib/three.module.min.js";
import { mergeGeometries } from "./lib/addons/utils/BufferGeometryUtils.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sm = (t) => t * t * (3 - 2 * t);
const cl = (v, a, b) => Math.min(b, Math.max(a, v));
const TAU = Math.PI * 2;
const UP = V(0, 1, 0);

/* ---------------- geometry helpers ---------------- */
function rod(a, b, r, seg = 10) {
  const d = b.clone().sub(a), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1, false);
  g.translate(0, L / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}
function cone(a, b, r0, r1, seg = 24, open = false) {
  const d = b.clone().sub(a), L = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, L, seg, 1, open);
  g.translate(0, L / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  g.translate(a.x, a.y, a.z);
  return g;
}
const pipe = (pts, r, tub = 80, rad = 14) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), tub, r, rad, false);
function naca(t, m = 0.02, p = 0.4, n = 36) {
  const up = [], lo = [];
  for (let i = 0; i <= n; i++) {
    const x = (1 - Math.cos((i / n) * Math.PI)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const yc = x < p ? (m / (p * p)) * (2 * p * x - x * x) : (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x);
    up.push([x, yc + yt]); lo.push([x, yc - yt]);
  }
  return up.reverse().concat(lo.slice(1)); // TE -> LE (upper) -> TE (lower)
}
function foilShape(chord, t, aoaDeg, invert = false, m = 0.04) {
  const a = (aoaDeg * Math.PI) / 180, s = new THREE.Shape();
  naca(t, m, 0.4, 28).forEach(([x, y], i) => {
    let X = x * chord, Y = (invert ? -y : y) * chord;
    const xr = X * Math.cos(a) + Y * Math.sin(a), yr = -X * Math.sin(a) + Y * Math.cos(a);
    i ? s.lineTo(xr, yr) : s.moveTo(xr, yr);
  });
  return s;
}
// extrude an airfoil along the span (x axis); leading edge points to +z
function foilSpan(chord, t, aoa, span, invert, m) {
  const g = new THREE.ExtrudeGeometry(foilShape(chord, t, aoa, invert, m), { depth: span, bevelEnabled: false, curveSegments: 4 });
  g.rotateY(Math.PI / 2); // shape x (chord) -> -z, extrude z (span) -> +x
  g.translate(-span / 2, 0, 0);
  return g;
}
// loft closed sections (arrays of Vector3 with equal counts) into a skin
function loft(sections, caps = true) {
  const n = sections[0].length, pos = [], idx = [];
  sections.forEach((s) => s.forEach((p) => pos.push(p.x, p.y, p.z)));
  for (let j = 0; j < sections.length - 1; j++)
    for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, b, b, c, d); }
  if (caps) [0, sections.length - 1].forEach((j, k) => {
    const s = sections[j], c = s.reduce((acc, p) => acc.add(p), V(0, 0, 0)).multiplyScalar(1 / n), ci = pos.length / 3;
    pos.push(c.x, c.y, c.z);
    for (let i = 0; i < n - 1; i++) k ? idx.push(ci, j * n + i, j * n + i + 1) : idx.push(ci, j * n + i + 1, j * n + i);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function lathe(profile, seg = 48) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
function roundBox(w, h, d, r = 0.02) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.8, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(d - 2 * r) / 2);
  return g;
}

/* ---------------- holographic materials ---------------- */
// every surface is drawn as light: fresnel rim, scanlines, a sweeping scan band and a slight flicker.
// Dark mode adds light (additive); light mode draws it as a deep-ink blueprint hologram.
const KINDS = { frame: 0.55, metal: 0.7, chrome: 0.85, dark: 0.5, rubber: 0.45, panel: 0.28, skin: 0.32, glass: 0.16, white: 0.62, ground: 0.12, runway: 0.3, mark: 0.85, amber: 0.8, accent: 1.3, hot: 1.05, water: 0.6, screen: 0.8 };
const HOLO_VS = `varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`;
const HOLO_FS = `uniform vec3 uCol; uniform float uTime; uniform float uA; uniform float uG; uniform float uDark; uniform float uBand; uniform float uFocus; uniform float uScale;
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){
  vec3 n = normalize(vN), v = normalize(vV);
  float f = pow(1.0 - abs(dot(n, v)), 1.7);
  float scan = 0.68 + 0.32 * sin(vW.y * 70.0 / uScale - uTime * 5.0);
  float band = smoothstep(0.22, 0.0, abs(vW.y - uBand) / uScale);
  float flick = 0.95 + 0.05 * sin(uTime * 29.0 + vW.x * 3.0);
  float a = uA * (0.06 + 0.9 * f) * scan * flick + band * 0.32 * uA;
  a *= mix(1.0, 0.1, uG * (1.0 - uFocus));
  vec3 c = mix(uCol, vec3(1.0), (f * 0.3 + band * 0.45) * uDark);
  if (uDark < 0.5) { a = a * 0.95 + 0.018 * uA; c = uCol * mix(0.75, 1.0, f); }
  gl_FragColor = vec4(c, clamp(a, 0.0, 0.95));
}`;
const BASE_FS = `uniform vec3 uCol; uniform float uDark; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 2.2) * (uDark > 0.5 ? 0.16 : 0.08); gl_FragColor = vec4(uCol, a); }`;
class Mats {
  constructor() {
    this.U = { uCol: { value: new THREE.Color(0x4da3ff) }, uTime: { value: 0 }, uG: { value: 0 }, uDark: { value: 1 }, uBand: { value: 0 }, uScale: { value: 1 } };
    this.cache = {}; this.acc = new THREE.Color(0x4da3ff); this.dark = true;
    const lm = () => new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
    this.lines = { f: lm(), n: lm() }; this.extra = [];
  }
  get(kind, focus) {
    const k = kind + (focus ? "|f" : "|n");
    if (!this.cache[k]) {
      this.cache[k] = new THREE.ShaderMaterial({ vertexShader: HOLO_VS, fragmentShader: HOLO_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { ...this.U, uA: { value: KINDS[kind] ?? 0.6 }, uFocus: { value: focus ? 1 : 0 } } });
    }
    return this.cache[k];
  }
  theme(ink, acc, dark) {
    this.acc.setRGB(acc[0], acc[1], acc[2], THREE.SRGBColorSpace); this.dark = dark;
    const c = this.acc.clone(); if (!dark) c.lerp(new THREE.Color().setRGB(ink[0], ink[1], ink[2], THREE.SRGBColorSpace), 0.25);
    this.U.uCol.value.copy(c); this.U.uDark.value = dark ? 1 : 0;
    const bl = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    [...Object.values(this.cache), this.lines.f, this.lines.n, ...this.extra].forEach((m) => { m.blending = bl; m.needsUpdate = true; });
    this.lines.f.color.copy(c); this.lines.n.color.copy(c);
  }
  ghost(g) { this.U.uG.value = g; this.lines.f.opacity = this.dark ? 0.75 : 0.7; this.lines.n.opacity = (this.dark ? 0.42 : 0.4) * (1 - g * 0.82); }
}

/* ---------------- model kit ---------------- */
class Kit {
  constructor(mats) { this.M = mats; this.root = new THREE.Group(); this.groups = {}; this.labels = []; this.spin = []; this.focus = false; this.cur = this.root; }
  group(name, ex = V(0, 0, 0), parent) { const g = new THREE.Group(); g.userData = { ex, base: V(0, 0, 0) }; (parent || this.root).add(g); this.groups[name] = g; return g; }
  in(g) { this.cur = g || this.root; return this; }
  add(geo, kind, opt = {}) {
    const mesh = new THREE.Mesh(geo, this.M.get(kind, opt.focus ?? this.focus));
    if (opt.edges !== false) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, opt.edges || 32), (opt.focus ?? this.focus) ? this.M.lines.f : this.M.lines.n); mesh.add(e); }
    if (opt.pos) mesh.position.copy(opt.pos);
    if (opt.rot) mesh.rotation.set(opt.rot[0], opt.rot[1], opt.rot[2]);
    (opt.to || this.cur).add(mesh);
    return mesh;
  }
  label(name, p, to) { const o = new THREE.Object3D(); o.position.copy(p); (to || this.cur).add(o); this.labels.push([name, o]); return o; }
}

/* ======================= AERO: turbofan on its own (no wing) ======================= */
function buildWing(M) {
  const K = new Kit(M);
  // ---- turbofan (focus), axis along local y, rotated to world z ----
  K.focus = true;
  const E = V(0, 1.15, 0);
  const eng = new THREE.Group(); eng.position.copy(E); eng.rotation.x = Math.PI / 2; K.root.add(eng); // local +y -> world +z (intake forward)
  const g = (name, ex) => K.group(name, ex, eng);
  const gN = g("nacelle", V(0, 0.35, -1.25)), gF = g("fan", V(0, 1.55, 0)), gLC = g("lpc", V(0, 0.95, 0)), gHC = g("hpc", V(0, 0.35, 0)), gCB = g("comb", V(0, -0.25, 0)), gHT = g("hpt", V(0, -0.7, 0)), gLT = g("lpt", V(0, -1.15, 0)), gNZ = g("nozzle", V(0, -1.65, 0));
  K.add(lathe([[0.8, 1.5], [0.86, 1.47], [0.9, 1.3], [0.92, 1.0], [0.88, 0.4], [0.78, -0.3], [0.68, -0.75]], 64), "skin", { to: gN, edges: 70 });
  K.add(lathe([[0.8, 1.5], [0.77, 1.38], [0.79, 1.1], [0.8, 0.8]], 64), "metal", { to: gN, edges: 70 });
  K.add(new THREE.TorusGeometry(0.83, 0.035, 10, 64).rotateX(Math.PI / 2).translate(0, 1.5, 0), "accent", { to: gN, edges: false });
  // fan
  const fanR = new THREE.Group(); gF.add(fanR); K.spin.push({ o: fanR, axis: "y", k: 3.2 });
  K.add(lathe([[0.001, 1.45], [0.09, 1.38], [0.19, 1.2], [0.25, 1.0], [0.26, 0.92]], 40), "chrome", { to: fanR, edges: 60 });
  for (let i = 0; i < 22; i++) { const b = new THREE.BoxGeometry(0.56, 0.012, 0.2); b.rotateX(0.62); b.translate(0.52, 0, 0); b.rotateY((i / 22) * TAU); b.translate(0, 1.0, 0); K.add(b, "metal", { to: fanR, edges: 30 }); }
  K.add(new THREE.TorusGeometry(0.82, 0.03, 8, 64).rotateX(Math.PI / 2).translate(0, 1.0, 0), "metal", { to: gF, edges: false });
  const stage = (grp, y, r0, r1, n, kind, tw) => { K.add(new THREE.CylinderGeometry(r0, r0, 0.035, 36).translate(0, y, 0), "dark", { to: grp, edges: 40 }); for (let i = 0; i < n; i++) { const b = new THREE.BoxGeometry(r1 - r0, 0.006, 0.05); b.rotateX(tw); b.translate((r0 + r1) / 2, 0, 0); b.rotateY((i / n) * TAU); b.translate(0, y, 0); K.add(b, kind, { to: grp, edges: false }); } };
  const lpcR = new THREE.Group(); gLC.add(lpcR); K.spin.push({ o: lpcR, axis: "y", k: 3.2 });
  [0.72, 0.62, 0.52].forEach((y) => stage(lpcR, y, 0.22, 0.4, 34, "metal", 0.5));
  const hpcR = new THREE.Group(); gHC.add(hpcR); K.spin.push({ o: hpcR, axis: "y", k: 7 });
  Array.from({ length: 7 }, (_, i) => stage(hpcR, 0.38 - i * 0.065, 0.17 - i * 0.004, 0.29 - i * 0.012, 40, "metal", 0.45));
  K.add(lathe([[0.42, 0.8], [0.4, 0.45], [0.32, 0.0], [0.31, -0.1]], 48), "glass", { to: gHC, edges: 70 });
  K.add(new THREE.TorusGeometry(0.25, 0.065, 16, 48).rotateX(Math.PI / 2).translate(0, -0.22, 0), "accent", { to: gCB, edges: false });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; K.add(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8).translate(Math.cos(a) * 0.25, -0.1, Math.sin(a) * 0.25), "metal", { to: gCB, edges: false }); }
  const hptR = new THREE.Group(); gHT.add(hptR); K.spin.push({ o: hptR, axis: "y", k: 7 });
  [-0.4, -0.48].forEach((y) => stage(hptR, y, 0.17, 0.3, 44, "hot", -0.5));
  const lptR = new THREE.Group(); gLT.add(lptR); K.spin.push({ o: lptR, axis: "y", k: 3.2 });
  [-0.62, -0.72, -0.82, -0.92].forEach((y, i) => stage(lptR, y, 0.19, 0.33 + i * 0.03, 48, "hot", -0.5));
  K.add(new THREE.CylinderGeometry(0.045, 0.045, 2.3, 16).translate(0, -0.1, 0), "chrome", { to: gHC, edges: false });
  K.add(lathe([[0.62, -0.85], [0.6, -1.1], [0.54, -1.45]], 56), "metal", { to: gNZ, edges: 60 });
  K.add(lathe([[0.3, -0.92], [0.26, -1.2], [0.12, -1.5], [0.001, -1.62]], 40), "dark", { to: gNZ, edges: 60 });
  K.label("Fan", V(0.72, 1.0, 0), gF); K.label("Compressor", V(0.3, 0.2, 0), gHC); K.label("Combustor", V(0.31, -0.22, 0), gCB); K.label("Turbine", V(0.4, -0.8, 0), gLT); K.label("Nozzle", V(0.56, -1.3, 0), gNZ);
  K.focus = false;
  // a short mount stub on top of the nacelle so it reads as a real engine, not a floating can
  K.add(roundBox(0.16, 0.5, 1.2, 0.04), "skin", { pos: V(0, E.y + 1.05, E.z + 0.1), edges: 30 });
  return { K, cam: { t0: V(0, E.y + 0.1, 0), p0: V(4.6, E.y + 1.7, 5.0), t1: V(0, E.y, -0.15), p1: V(10.5, E.y + 1.9, 1.6) }, exStart: 0.4, fit: 0.78, explodeAxis: true };
}

/* ======================= DATA: airport -> PCA cloud ======================= */
function buildData(M) {
  const K = new Kit(M);
  K.add(new THREE.BoxGeometry(7, 0.02, 4.6), "ground", { pos: V(0, -0.01, 0), edges: false });
  K.add(new THREE.BoxGeometry(6.2, 0.02, 0.42), "runway", { pos: V(0, 0.005, -1.55), edges: false });
  const marks = []; for (let k = 0; k < 18; k++) marks.push(new THREE.BoxGeometry(0.18, 0.004, 0.02).translate(-2.8 + k * 0.33, 0.017, -1.55));
  [-2.95, 2.95].forEach((x) => { for (let k = 0; k < 6; k++) marks.push(new THREE.BoxGeometry(0.12, 0.004, 0.025).translate(x, 0.017, -1.72 + k * 0.065)); });
  K.add(mergeGeometries(marks), "mark", { edges: false });
  // taxiways (centre lines)
  const twy = [[V(-2.9, 0.02, -1.1), V(2.9, 0.02, -1.1)], [V(-2.4, 0.02, -1.1), V(-2.4, 0.02, -1.5)], [V(0, 0.02, -1.1), V(0, 0.02, -1.5)], [V(2.4, 0.02, -1.1), V(2.4, 0.02, -1.5)], [V(-1.6, 0.02, -1.1), V(-1.6, 0.02, 0.35)], [V(1.6, 0.02, -1.1), V(1.6, 0.02, 0.35)], [V(-2.2, 0.02, 0.35), V(2.2, 0.02, 0.35)]];
  K.add(new THREE.BoxGeometry(5.8, 0.012, 0.18), "runway", { pos: V(0, 0.0, -1.1), edges: false });
  K.add(mergeGeometries(twy.map(([a, b]) => rod(a, b, 0.008, 6))), "amber", { edges: false });
  // apron, terminal, piers, tower
  K.add(new THREE.BoxGeometry(5, 0.01, 1.2), "runway", { pos: V(0, 0.0, 0.95), edges: false });
  K.add(roundBox(4.4, 0.32, 0.5, 0.04), "white", { pos: V(0, 0.16, 1.85) });
  [-1.2, 0, 1.2].forEach((x) => K.add(roundBox(0.14, 0.14, 0.7, 0.03), "white", { pos: V(x, 0.12, 1.3) }));
  const tw = new THREE.Group(); tw.position.set(2.7, 0, 1.6); K.root.add(tw);
  K.add(new THREE.CylinderGeometry(0.07, 0.1, 1.1, 20).translate(0, 0.55, 0), "white", { to: tw, edges: 40 });
  K.add(new THREE.CylinderGeometry(0.19, 0.13, 0.16, 8).translate(0, 1.18, 0), "glass", { to: tw, edges: 30 });
  K.add(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 8).translate(0, 1.27, 0), "dark", { to: tw, edges: 30 });
  const radar = new THREE.Group(); radar.position.y = 1.33; tw.add(radar); K.add(new THREE.BoxGeometry(0.22, 0.05, 0.02), "accent", { to: radar, focus: false }); K.spin.push({ o: radar, axis: "y", k: 1.6 });
  // aircraft
  const plane = (s = 1) => { const g = new THREE.Group();
    K.add(new THREE.CapsuleGeometry(0.045 * s, 0.5 * s, 6, 16).rotateX(Math.PI / 2).translate(0, 0.06 * s, 0), "white", { to: g, edges: false });
    const w = new THREE.Shape(); w.moveTo(0, 0.08 * s); w.lineTo(0.34 * s, -0.08 * s); w.lineTo(0.34 * s, -0.12 * s); w.lineTo(0, -0.04 * s); w.lineTo(-0.34 * s, -0.12 * s); w.lineTo(-0.34 * s, -0.08 * s); w.closePath();
    K.add(new THREE.ExtrudeGeometry(w, { depth: 0.01 * s, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, 0.05 * s, 0), "white", { to: g, edges: 30 });
    const tl = new THREE.Shape(); tl.moveTo(0, 0); tl.lineTo(-0.1 * s, 0); tl.lineTo(-0.14 * s, 0.13 * s); tl.lineTo(-0.08 * s, 0.13 * s); tl.closePath();
    K.add(new THREE.ExtrudeGeometry(tl, { depth: 0.008 * s, bevelEnabled: false }).rotateY(Math.PI / 2).translate(0, 0.07 * s, -0.22 * s), "accent", { to: g, edges: false, focus: false });
    [-1, 1].forEach((k) => K.add(new THREE.CylinderGeometry(0.022 * s, 0.022 * s, 0.08 * s, 12).rotateX(Math.PI / 2).translate(k * 0.14 * s, 0.03 * s, 0.03 * s), "metal", { to: g, edges: false }));
    K.root.add(g); return g; };
  [-1.8, -0.6, 0.6, 1.8].forEach((x, i) => { const p = plane(); p.position.set(x + (i % 2 ? 0.05 : -0.05), 0, 0.98); p.rotation.y = Math.PI; });
  const taxi = plane(1.05);
  const route = new THREE.CatmullRomCurve3([V(-0.6, 0, 0.7), V(-0.6, 0, 0.35), V(-1.0, 0, 0.35), V(-1.6, 0, 0.1), V(-1.6, 0, -0.9), V(-1.4, 0, -1.1), V(0, 0, -1.1), V(1.8, 0, -1.1), V(2.3, 0, -1.25), V(2.4, 0, -1.5), V(1.8, 0, -1.55), V(-2.6, 0, -1.55)]);
  K.root.add(new THREE.Mesh(new THREE.TubeGeometry(route, 200, 0.012, 6), M.get("accent", true)));
  // ---- data cloud (focus) ----
  K.focus = true;
  const N = 1800, A = new Float32Array(N * 3), B = new Float32Array(N * 3), P = new Float32Array(N * 3), C = new Float32Array(N * 3), tq = new Float32Array(N);
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(TAU * rnd());
  const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.35, -0.5, 0.22)), ctr = V(0, 1.75, -0.2);
  const ax = [V(1, 0, 0).applyMatrix4(R), V(0, 1, 0).applyMatrix4(R), V(0, 0, 1).applyMatrix4(R)];
  for (let i = 0; i < N; i++) {
    const p = route.getPoint(rnd()); A.set([p.x + (rnd() - 0.5) * 0.12, 0.03 + rnd() * 0.04, p.z + (rnd() - 0.5) * 0.12], i * 3);
    const u = gauss() * 0.75, v = gauss() * 0.32, w = gauss() * 0.22, cluster = Math.floor(rnd() * 4), off = [-0.9, -0.2, 0.45, 1.1][cluster];
    const q = ctr.clone().addScaledVector(ax[0], u + off * 0.35).addScaledVector(ax[1], v + 0.18 * Math.sin(u * 2.2)).addScaledVector(ax[2], w);
    B.set([q.x, q.y, q.z], i * 3); tq[i] = cl((u + off * 0.35 + 1.6) / 3.2, 0, 1);
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(P, 3)); pg.setAttribute("color", new THREE.BufferAttribute(C, 3));
  const dot = document.createElement("canvas"); dot.width = dot.height = 64; const dc = dot.getContext("2d"); const gr = dc.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); dc.fillStyle = gr; dc.fillRect(0, 0, 64, 64);
  const pm = new THREE.PointsMaterial({ size: 0.075, map: new THREE.CanvasTexture(dot), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
  const pts = new THREE.Points(pg, pm); K.root.add(pts); M.extra.push(pm);
  // principal component axes
  const axes = new THREE.Group(); K.root.add(axes);
  [[2.3, "PC1"], [1.1, "PC2"], [0.8, "PC3"]].forEach(([len], k) => { const a = ctr.clone().addScaledVector(ax[k], -len / 2), b = ctr.clone().addScaledVector(ax[k], len / 2); K.add(rod(a, b, 0.012, 8), "accent", { to: axes, edges: false }); K.add(cone(b, b.clone().addScaledVector(ax[k], 0.12), 0.04, 0.001, 16), "accent", { to: axes, edges: false }); });
  // fuzzy inference surface
  const sg = new THREE.PlaneGeometry(2.8, 1.5, 28, 14), sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), h = 0.28 * Math.tanh(x * 1.2) + 0.08 * Math.sin(y * 3) ; const q = ctr.clone().addScaledVector(ax[0], x).addScaledVector(ax[2], y).addScaledVector(ax[1], h - 0.05); sp.setXYZ(i, q.x, q.y, q.z); }
  sg.computeVertexNormals();
  const surf = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0, depthWrite: false })); K.root.add(surf); M.extra.push(surf.material);
  K.label("Taxi routes · 2,000+ flights", V(-1.6, 0.05, -0.4)); K.label("PCA · 37 → 29 features", ctr.clone().addScaledVector(ax[1], 0.75));
  K.label("Principal components", ctr.clone().addScaledVector(ax[0], 1.25)); K.label("Fuzzy inference → taxi time", ctr.clone().addScaledVector(ax[0], -0.9).addScaledVector(ax[2], 0.7));
  K.focus = false;
  const update = (st, t) => {
    const m = sm(cl((st.prog + 0.22) / 0.72, 0, 1)), A0 = M.acc, c2 = new THREE.Color(M.dark ? 0xe8eef6 : 0x334155);
    for (let i = 0; i < N; i++) { const k = cl(m * 1.25 - (i % 97) / 97 * 0.25, 0, 1), e = sm(k), j = i * 3, lift = Math.sin(e * Math.PI) * 0.6;
      P[j] = A[j] + (B[j] - A[j]) * e; P[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * e + lift * 0.3 + Math.sin(t * 1.3 + i) * 0.01 * e; P[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * e;
      const c = c2.clone().lerp(A0, 0.35 + tq[i] * 0.65); C[j] = c.r; C[j + 1] = c.g; C[j + 2] = c.b; }
    pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    pm.opacity = 0.95; pm.size = 0.05 + m * 0.03;
    axes.visible = m > 0.3; axes.scale.setScalar(0.001 + sm(cl((m - 0.3) / 0.5, 0, 1)));
    surf.material.color.copy(A0); surf.material.opacity = 0.55 * sm(cl((st.prog - 0.6) / 0.3, 0, 1));
    const u = (t * 0.05) % 1; taxi.position.copy(route.getPoint(u)); const tg = route.getTangent(u); taxi.rotation.y = Math.atan2(tg.x, tg.z);
  };
  return { K, update, cam: { t0: V(0, 0.45, -0.1), p0: V(4.6, 3.9, 5.2), t1: V(0, 1.55, -0.2), p1: V(3.0, 2.4, 3.6) }, exStart: 1.1, grid: -0.02, fit: 0.92 };
}

/* ======================= STRUCTURES & MECHANICAL: gear train + planetary set ======================= */
function teeth(z, m, internal) {
  const r = (m * z) / 2, ra = internal ? r - m : r + m, rr = internal ? r + 1.25 * m : r - 1.25 * m, P = TAU / z, pts = [];
  for (let i = 0; i < z; i++) { const a0 = i * P; [[rr, -0.5], [rr, -0.29], [ra, -0.13], [ra, 0.13], [rr, 0.29]].forEach(([rad, fr]) => pts.push(new THREE.Vector2(Math.cos(a0 + fr * P) * rad, Math.sin(a0 + fr * P) * rad))); }
  return pts;
}
function gearGeo(z, m, thick, hole, spokes = 0) {
  const s = new THREE.Shape(teeth(z, m, false)), r = (m * z) / 2;
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, TAU, true); s.holes.push(h);
  if (spokes) { const rc = (hole + r - 1.4 * m) / 2, rh = (r - 1.4 * m - hole) * 0.34; for (let i = 0; i < spokes; i++) { const a = (i / spokes) * TAU, p = new THREE.Path(); p.absarc(Math.cos(a) * rc, Math.sin(a) * rc, rh, 0, TAU, true); s.holes.push(p); } }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -thick / 2); return g;
}
function ringGeo(z, m, thick, outer) {
  const s = new THREE.Shape(); s.absarc(0, 0, outer, 0, TAU, false);
  s.holes.push(new THREE.Path(teeth(z, m, true).reverse()));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 1, curveSegments: 48 });
  g.translate(0, 0, -thick / 2); return g;
}
function buildGears(M) {
  const K = new Kit(M), m = 0.066;
  K.add(roundBox(5.6, 3.7, 0.08, 0.03), "frame", { pos: V(0.5, -0.15, -0.5) });
  [[-2.1, 1.5], [3.1, 1.5], [-2.1, -1.8], [3.1, -1.8]].forEach(([x, y]) => K.add(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 6).rotateX(Math.PI / 2).translate(x, y, -0.44), "metal", { edges: 40 }));
  const gear = (z, c, zoff, thick, hole, spokes, w, ph, kind = "metal", focus = false, to) => {
    const g = new THREE.Group(); g.position.set(c.x, c.y, zoff); (to || K.root).add(g);
    const mesh = K.add(gearGeo(z, m, thick, hole, spokes), kind, { to: g, edges: 28, focus });
    K.add(new THREE.CylinderGeometry(hole * 1.6, hole * 1.6, thick * 1.3, 24).rotateX(Math.PI / 2), kind, { to: mesh, edges: 40, focus });
    K.spin.push({ o: mesh, axis: "z", k: w, ph }); return g;
  };
  const shaft = (c, z0, z1, r = 0.05, focus = false) => { K.add(rod(V(c.x, c.y, z0), V(c.x, c.y, z1), r, 16), "chrome", { edges: false, focus }); K.add(new THREE.TorusGeometry(r * 2.2, r * 0.5, 8, 24).translate(c.x, c.y, -0.42), "metal", { edges: false, focus }); };
  // gear 1 (36T) drives pinion 2 (14T); compound 2b (24T) drives gear 5 (16T)
  const mesh = (c1, z1, w1, ph1, phi, z2) => { const P2 = TAU / z2, d = (m * (z1 + z2)) / 2, c2 = V(c1.x + Math.cos(phi) * d, c1.y + Math.sin(phi) * d, 0); return { c2, w2: (-w1 * z1) / z2, ph2: phi + Math.PI + P2 / 2 - (z1 / z2) * (ph1 - phi) }; };
  const c1 = V(-1.15, 0.25, 0), w1 = 0.45;
  gear(36, c1, 0, 0.2, 0.14, 6, w1, 0, "metal"); shaft(c1, -0.45, 0.32);
  const A = mesh(c1, 36, w1, 0, -0.45, 14);
  gear(14, A.c2, 0, 0.2, 0.08, 0, A.w2, A.ph2, "accent"); shaft(A.c2, -0.45, 0.3);
  const B = mesh(A.c2, 24, A.w2, A.ph2, 1.05, 16);
  gear(24, A.c2, -0.27, 0.16, 0.08, 5, A.w2, A.ph2, "metal");
  gear(16, B.c2, -0.27, 0.16, 0.07, 0, B.w2, B.ph2, "metal"); shaft(B.c2, -0.45, -0.1);
  // planetary set (focus): sun 12T, three planets 10T, fixed ring 32T
  K.focus = true;
  const PC = V(2.2, -0.75, 0), zs = 12, zp = 10, zr = 32, ws = 1.1, wc = (ws * zs) / (zs + zr), rc = (m * (zs + zp)) / 2;
  const gRing = K.group("ring", V(0, 0, -0.75)), gSun = K.group("sun", V(0, 0, 0.95)), gCar = K.group("carrier", V(0, 0, 0.5));
  [gRing, gSun, gCar].forEach((g) => g.position.set(PC.x, PC.y, 0));
  K.add(ringGeo(zr, m, 0.2, 1.22), "accent", { to: gRing, edges: 28 });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; K.add(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8).rotateX(Math.PI / 2).translate(Math.cos(a) * 1.14, Math.sin(a) * 1.14, 0), "chrome", { to: gRing, edges: false }); }
  const sun = gear(zs, V(0, 0, 0), 0, 0.2, 0.06, 0, ws, Math.PI / zs, "hot", true, gSun);
  K.add(rod(V(0, 0, -0.1), V(0, 0, 0.6), 0.055, 16), "chrome", { to: gSun, edges: false });
  const carrier = new THREE.Group(); gCar.add(carrier); K.spin.push({ o: carrier, axis: "z", k: wc, ph: 0 });
  const plate = new THREE.Shape(); for (let i = 0; i <= 3; i++) { const a = (i / 3) * TAU; i ? plate.absarc(Math.cos(a) * rc, Math.sin(a) * rc, 0.2, a - Math.PI / 2, a + Math.PI / 2, false) : plate.moveTo(Math.cos(a) * rc + 0.2 * Math.cos(a - Math.PI / 2), Math.sin(a) * rc + 0.2 * Math.sin(a - Math.PI / 2)); }
  const pg = new THREE.ExtrudeGeometry(plate, { depth: 0.05, bevelEnabled: false, curveSegments: 12 }); pg.translate(0, 0, 0.16);
  K.add(pg, "metal", { to: carrier, edges: 30 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU, pc = V(Math.cos(a) * rc, Math.sin(a) * rc, 0), pl = new THREE.Group(); pl.position.copy(pc); carrier.add(pl);
    const pm = K.add(gearGeo(zp, m, 0.18, 0.05, 0), "accent", { to: pl, edges: 28 });
    K.spin.push({ o: pm, axis: "z", k: (-wc * zr) / zp + 0, ph: a + Math.PI / zp });
    K.add(rod(V(pc.x, pc.y, -0.12), V(pc.x, pc.y, 0.2), 0.03, 10), "chrome", { to: carrier, edges: false });
  }
  K.focus = false;
  shaft(PC, -0.45, -0.15);
  return { K, cam: { t0: V(0.55, -0.15, 0), p0: V(2.6, 2.2, 6.2), t1: V(PC.x, PC.y, 0.1), p1: V(PC.x + 2.4, PC.y + 1.7, 3.6) }, exStart: 0.45, fit: 0.9 };
}

/* ======================= ENERGY & CONTROL: wind turbine and grid ======================= */
function blade(len, root, tip) {
  const n = 12, secs = [];
  for (let j = 0; j <= n; j++) {
    const u = j / n, r = 0.32 + u * (len - 0.32), c = root + (tip - root) * Math.pow(u, 0.8), tw = ((18 - 16 * u) * Math.PI) / 180, t = 0.28 - 0.18 * u;
    secs.push(naca(t, 0.03, 0.4, 16).map(([x, y]) => { const X = (x - 0.3) * c, Y = y * c; return V(X * Math.cos(tw) - Y * Math.sin(tw), r, X * Math.sin(tw) + Y * Math.cos(tw)); }));
  }
  return loft(secs);
}
function turbine(K, pos, s, focus, groups) {
  const top = 6.1 * s;
  K.add(lathe([[0.6 * s, 0], [0.62 * s, 0.12 * s], [0.24 * s, 0.14 * s], [0.13 * s, top - 0.05 * s], [0.0, top]], 40).translate(pos.x, pos.y, pos.z), "white", { edges: 40, focus: false });
  const head = new THREE.Group(); head.position.set(pos.x, pos.y + top + 0.12 * s, pos.z); K.root.add(head);
  const gc = groups ? K.group("cover", V(0, 0.75, 0.1), head) : head, gr = groups ? K.group("rotor", V(0, 0, 2.6), head) : head;
  K.add(roundBox(0.58 * s, 0.5 * s, 1.55 * s, 0.12 * s), "skin", { to: gc, pos: V(0, 0.05 * s, -0.3 * s), edges: 40, focus });
  for (let k = 0; k < 5; k++) K.add(new THREE.BoxGeometry(0.004, 0.12 * s, 0.2 * s).translate(0.22 * s - k * 0.11 * s, 0.33 * s, -0.85 * s), "metal", { to: gc, edges: false, focus });
  const rotor = new THREE.Group(); rotor.position.set(0, 0.05 * s, 0.5 * s); gr.add(rotor); K.spin.push({ o: rotor, axis: "z", k: focus ? 1.1 : 0.8 + s * 0.4, ph: pos.x });
  K.add(lathe([[0.001, 0.6], [0.14, 0.5], [0.26, 0.3], [0.32, 0.0], [0.3, -0.12]], 36).rotateX(Math.PI / 2).scale(s, s, s), "white", { to: rotor, edges: 50, focus });
  for (let b = 0; b < 3; b++) { const g = blade(4.4 * s, 0.5 * s, 0.12 * s); g.rotateZ((b / 3) * TAU); K.add(g, "white", { to: rotor, edges: 60, focus }); }
  return { head, rotor };
}
function buildTurbine(M) {
  const K = new Kit(M);
  const T = turbine(K, V(0, 0, 0), 1, true, true);
  // drivetrain inside the nacelle (focus)
  K.focus = true;
  const gD = K.group("drive", V(0, 0, 0), T.head), gG = K.group("gearbox", V(0, 0, -0.35), T.head), gE = K.group("generator", V(0, 0, -0.95), T.head), gC = K.group("controller", V(0, 0.15, -1.4), T.head);
  K.add(rod(V(0, 0.05, 0.45), V(0, 0.05, -0.15), 0.07, 16), "chrome", { to: gD, edges: false });
  K.add(new THREE.TorusGeometry(0.12, 0.035, 10, 32).translate(0, 0.05, 0.3), "metal", { to: gD, edges: false });
  K.add(new THREE.CylinderGeometry(0.2, 0.18, 0.42, 32).rotateX(Math.PI / 2).translate(0, 0.02, -0.32), "accent", { to: gG, edges: 40 });
  for (let k = 0; k < 4; k++) K.add(new THREE.TorusGeometry(0.205, 0.012, 6, 32).translate(0, 0.02, -0.18 - k * 0.09), "metal", { to: gG, edges: false });
  K.add(new THREE.CylinderGeometry(0.17, 0.17, 0.36, 32).rotateX(Math.PI / 2).translate(0, 0.02, -0.78), "hot", { to: gE, edges: 40 });
  for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; K.add(new THREE.BoxGeometry(0.01, 0.05, 0.34).translate(Math.cos(a) * 0.18, 0.02 + Math.sin(a) * 0.18, -0.78), "metal", { to: gE, edges: false }); }
  K.add(roundBox(0.32, 0.26, 0.18, 0.02), "metal", { to: gC, pos: V(0, 0.05, -1.0) });
  K.add(new THREE.TorusGeometry(0.24, 0.03, 8, 40).rotateX(Math.PI / 2).translate(0, -0.2, -0.2), "metal", { to: gD, edges: false });
  K.focus = false;
  // the wider grid: two more turbines, substation, battery storage, solar, pylons with live power flow
  turbine(K, V(-4.2, 0, -3.4), 0.55, false); turbine(K, V(4.0, 0, -4.4), 0.48, false);
  const sub = new THREE.Group(); sub.position.set(3.0, 0, 1.4); K.root.add(sub);
  K.add(new THREE.BoxGeometry(2.2, 0.02, 1.5), "ground", { to: sub, edges: 10 });
  [-0.55, 0.15].forEach((x) => { K.add(roundBox(0.5, 0.45, 0.4, 0.03), "metal", { to: sub, pos: V(x, 0.24, 0) }); for (let k = 0; k < 6; k++) K.add(new THREE.BoxGeometry(0.01, 0.36, 0.42).translate(x + 0.28 + k * 0.025, 0.22, 0), "metal", { to: sub, edges: false }); for (let k = 0; k < 3; k++) K.add(new THREE.CylinderGeometry(0.025, 0.04, 0.3, 10).translate(x - 0.12 + k * 0.12, 0.6, 0), "white", { to: sub, edges: false }); });
  K.add(roundBox(0.4, 0.5, 0.6, 0.03), "white", { to: sub, pos: V(0.8, 0.25, 0.1) });
  const fence = []; [[-1.1, -0.75], [1.1, -0.75], [1.1, 0.75], [-1.1, 0.75]].forEach((p, i, a) => { const q = a[(i + 1) % 4]; fence.push(V(p[0], 0.25, p[1]), V(q[0], 0.25, q[1])); fence.push(V(p[0], 0, p[1]), V(p[0], 0.25, p[1])); });
  sub.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fence), M.lines.n));
  const bess = new THREE.Group(); bess.position.set(-3.0, 0, 1.6); K.root.add(bess);
  for (let i = 0; i < 4; i++) { K.add(roundBox(0.38, 0.4, 1.1, 0.02), "metal", { to: bess, pos: V(i * 0.48 - 0.72, 0.2, 0) }); K.add(new THREE.BoxGeometry(0.26, 0.06, 0.06).translate(i * 0.48 - 0.72, 0.43, 0.3), "accent", { to: bess, edges: false }); }
  const solar = new THREE.Group(); solar.position.set(-0.6, 0, 3.0); K.root.add(solar);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const p = new THREE.Group(); p.position.set(c * 0.62 - 0.93, 0.18, r * 0.55 - 0.55); p.rotation.x = -0.55; solar.add(p); K.add(new THREE.BoxGeometry(0.56, 0.02, 0.36), "glass", { to: p, edges: 10 }); const cells = []; for (let k = 1; k < 4; k++) cells.push(V(-0.28 + k * 0.14, 0.012, -0.18), V(-0.28 + k * 0.14, 0.012, 0.18)); p.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cells), M.lines.n)); K.add(rod(V(0, -0.18, 0), V(0, 0, 0), 0.012, 6), "metal", { to: p, edges: false }); }
  const pylon = (p, h) => { const g = new THREE.Group(); g.position.copy(p); K.root.add(g); const L = []; const lv = [[0, 0.45], [h * 0.45, 0.28], [h * 0.8, 0.16], [h, 0.06]];
    for (let i = 0; i < lv.length; i++) { const [y, w] = lv[i]; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((q, k, a) => { const n = a[(k + 1) % 4]; L.push(V(q[0] * w, y, q[1] * w), V(n[0] * w, y, n[1] * w)); if (i < lv.length - 1) { const [y2, w2] = lv[i + 1]; L.push(V(q[0] * w, y, q[1] * w), V(q[0] * w2, y2, q[1] * w2), V(q[0] * w, y, q[1] * w), V(n[0] * w2, y2, n[1] * w2)); } }); }
    [h * 0.8, h * 0.62].forEach((y) => L.push(V(-0.55, y, 0), V(0.55, y, 0)));
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(L), M.lines.n)); return g; };
  pylon(V(5.2, 0, 0.6), 2.6); pylon(V(7.2, 0, -0.4), 2.6);
  const cable = (a, b, sag) => new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(V(0, -sag, 0)), b]);
  const cables = [cable(V(0.05, 0.3, 0.2), V(2.2, 0.6, 1.3), 0.15), cable(V(-2.3, 0.4, 1.6), V(2.0, 0.6, 1.5), 0.25), cable(V(3.9, 0.7, 1.4), V(4.65, 2.08, 0.6), 0.2), cable(V(4.65, 2.08, 0.6), V(6.65, 2.08, -0.4), 0.35), cable(V(-4.2, 0.3, -3.4), V(-0.05, 0.3, -0.1), 0.1), cable(V(4.0, 0.3, -4.4), V(0.05, 0.3, -0.15), 0.1)];
  cables.forEach((c) => K.root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(30)), M.lines.n)));
  const NP = 120, fp = new Float32Array(NP * 3), fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fp, 3));
  const dot = document.createElement("canvas"); dot.width = dot.height = 32; const dc = dot.getContext("2d"), gr = dc.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); dc.fillStyle = gr; dc.fillRect(0, 0, 32, 32);
  const fm = new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); M.extra.push(fm);
  K.root.add(new THREE.Points(fg, fm));
  const update = (st, t) => { fm.color.copy(M.U.uCol.value); fm.opacity = 0.9 * (1 - M.U.uG.value * 0.8);
    for (let i = 0; i < NP; i++) { const c = cables[i % cables.length], u = ((t * 0.18 + i * 0.137) % 1), p = c.getPoint(u); fp[i * 3] = p.x; fp[i * 3 + 1] = p.y; fp[i * 3 + 2] = p.z; } fg.attributes.position.needsUpdate = true; };
  return { K, update, cam: { t0: V(0.4, 3.6, -0.6), p0: V(6.8, 5.2, 10.5), t1: V(0, 6.2, -0.2), p1: V(5.6, 7.4, -4.6) }, exStart: 0.5, fit: 0.94 };
}

/* ---------------- hologram projector base ---------------- */
function makeBase(M, box) {
  const g = new THREE.Group(), c = box.getCenter(V(0, 0, 0)), sz = box.getSize(V(0, 0, 0)), R = Math.max(sz.x, sz.z) * 0.56, H = sz.y;
  g.position.set(c.x, box.min.y - 0.02 * R, c.z);
  const rings = new THREE.Group(); g.add(rings);
  [[1, 0.006], [0.84, 0.004], [1.08, 0.003], [0.42, 0.004]].forEach(([k, t]) => rings.add(new THREE.Mesh(new THREE.TorusGeometry(R * k, R * t, 6, 128).rotateX(Math.PI / 2), M.get("accent", false))));
  const L = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU, r0 = i % 4 ? R * 0.9 : R * 0.44; L.push(V(Math.cos(a) * r0, 0, Math.sin(a) * r0), V(Math.cos(a) * R, 0, Math.sin(a) * R)); }
  for (let k = 1; k < 5; k++) { const r = (R * k) / 5; for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU, b = ((i + 1) / 64) * TAU; L.push(V(Math.cos(a) * r, 0, Math.sin(a) * r), V(Math.cos(b) * r, 0, Math.sin(b) * r)); } }
  rings.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(L), M.lines.n));
  const cm = new THREE.ShaderMaterial({ vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: BASE_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uCol: M.U.uCol, uDark: M.U.uDark } });
  M.extra.push(cm);
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 1.02, R * 0.9, H * 1.05, 64, 1, true).translate(0, H * 0.525, 0), cm));
  const N = 220, pp = new Float32Array(N * 3), seed = []; for (let i = 0; i < N; i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * R * 0.95; seed.push([Math.cos(a) * r, Math.sin(a) * r, Math.random(), 0.3 + Math.random() * 0.7]); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const dot = document.createElement("canvas"); dot.width = dot.height = 32; const dc = dot.getContext("2d"), gr = dc.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); dc.fillStyle = gr; dc.fillRect(0, 0, 32, 32);
  const pm = new THREE.PointsMaterial({ size: R * 0.018, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); M.extra.push(pm);
  g.add(new THREE.Points(pg, pm));
  g.userData.update = (t, z) => { rings.rotation.y = t * 0.12; pm.color.copy(M.U.uCol.value); pm.opacity = (M.dark ? 0.8 : 0.55) * (1 - z * 0.6);
    for (let i = 0; i < N; i++) { const s = seed[i], y = ((s[2] + t * 0.06 * s[3]) % 1) * H; pp[i * 3] = s[0]; pp[i * 3 + 1] = y; pp[i * 3 + 2] = s[1]; } pg.attributes.position.needsUpdate = true; g.visible = true; };
  return g;
}

const BUILD = { structures: buildGears, aero: buildWing, control: buildTurbine, data: buildData };

/* ======================= SCENE ======================= */
class Scene3D {
  constructor(canvas) {
    this.canvas = canvas; this.ok = false; this.models = {};
    try {
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0); r.outputColorSpace = THREE.SRGBColorSpace;
      this.r = r; this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(30, 1, 0.05, 300);
      this.M = new Mats(); this.ok = true; this.resize();
    } catch (e) { console.warn("3D unavailable", e); }
  }
  set(id) {
    if (!this.ok || this.id === id) return; this.id = id;
    if (this.cur) { this.scene.remove(this.cur.K.root); this.scene.remove(this.cur.base); }
    if (!this.models[id]) {
      const m = BUILD[id](this.M); m.id = id;
      m.K.root.traverse((o) => { if (o.userData && o.userData.ex) o.userData.base = o.position.clone(); });
      m.K.root.updateMatrixWorld(true); m.box = new THREE.Box3().setFromObject(m.K.root); m.sphere = m.box.getBoundingSphere(new THREE.Sphere());
      m.base = makeBase(this.M, m.box); this.models[id] = m; this.themeKey = "";
    }
    this.cur = this.models[id]; this.scene.add(this.cur.K.root); this.scene.add(this.cur.base); this.fitKey = "";
  }
  resize() {
    if (!this.ok) return; const rc = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rc.width); this.h = Math.max(1, rc.height); this.r.setSize(this.w, this.h, false); this.cam.aspect = this.w / this.h; this.cam.updateProjectionMatrix();
  }
  render(st) {
    if (!this.ok || !this.cur) return null;
    const m = this.cur, z = sm(cl(st.prog, 0, 1)), t = st.time || 0;
    const key = st.ink.join() + st.acc.join() + st.dark;
    if (key !== this.themeKey) { this.themeKey = key; this.M.theme(st.ink, st.acc, !!st.dark); }
    this.M.ghost(z);
    const bh = m.box.max.y - m.box.min.y; this.M.U.uTime.value = t; this.M.U.uScale.value = Math.max(0.6, bh / 2.2); this.M.U.uBand.value = m.box.min.y + ((t * 0.22) % 1.3) * bh * 1.1;
    const e = sm(cl((z - m.exStart) / Math.max(0.05, 1 - m.exStart), 0, 1));
    Object.values(m.K.groups).forEach((g) => { g.position.copy(g.userData.base).addScaledVector(g.userData.ex, e); });
    m.K.spin.forEach((s) => { s.o.rotation[s.axis] = t * s.k + (s.ph || 0); });
    if (m.update) m.update(st, t);
    m.base.userData.update(t, z);
    const S = m.sphere, t0 = S.center.clone().lerp(m.cam.t0, 0.35), dir0 = m.cam.p0.clone().sub(m.cam.t0).normalize(), fk = m.id + this.cam.aspect.toFixed(3);
    if (this.fitKey !== fk) {
      this.fitKey = fk; const c = new THREE.PerspectiveCamera(this.cam.fov, this.cam.aspect, 0.05, 300), b = m.box, pts = [];
      for (let i = 0; i < 8; i++) pts.push(V(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
      let d = S.radius * 2.5;
      for (let it = 0; it < 6; it++) { c.position.copy(t0).addScaledVector(dir0, d); c.lookAt(t0); c.updateMatrixWorld(); let mx = 0; pts.forEach((p) => { const q = p.clone().project(c); mx = Math.max(mx, Math.abs(q.x), Math.abs(q.y)); }); d *= Math.pow(mx / (m.fit || 0.86), 0.9); }
      this.fitD = d;
    }
    const p0 = t0.clone().addScaledVector(dir0, this.fitD);
    const p1 = m.cam.t1.clone().addScaledVector(m.cam.p1.clone().sub(m.cam.t1), Math.max(1, Math.pow(1.3 / this.cam.aspect, 0.85)));
    const tg = t0.lerp(m.cam.t1, z), p = p0.lerp(p1, z), d = p.sub(tg);
    d.applyAxisAngle(UP, (st.mx || 0) * 0.3 + Math.sin(t * 0.22) * 0.12 * (1 - z));
    const side = V(0, 0, 0).crossVectors(d, UP).normalize(); d.applyAxisAngle(side, (st.my || 0) * 0.1);
    d.multiplyScalar(1 / (st.scale || 1));
    this.cam.position.copy(tg).add(d); this.cam.lookAt(tg);
    const off = st.off || [0, 0];
    if (off[0] || off[1]) this.cam.setViewOffset(this.w, this.h, (-off[0] * this.w) / 2, (off[1] * this.h) / 2, this.w, this.h); else this.cam.clearViewOffset();
    this.cam.updateMatrixWorld();
    this.r.render(this.scene, this.cam);
    return { labels: [], zoom: z, explode: e };
  }
  dispose() { if (this.ok) { this.r.dispose(); this.r.forceContextLoss && this.r.forceContextLoss(); } }
}
window.Scene3D = Scene3D;
window.dispatchEvent(new Event("scene3d-ready"));
