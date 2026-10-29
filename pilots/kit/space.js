// Engineering / spaceflight world: starfield, Earth backdrop, launch sky, vehicles built from a dimensioned spec,
// soft thruster jets, RCS puffs, re-entry glow and a breakup effect. Geometry is SIMPLIFIED from published dimensions;
// scenes label it on screen. Scene units are metres; a vehicle's long axis is its local +x (nose direction).
import * as THREE from "three";
import { clamp, ease, lerp, glowTexture } from "./core.js";

export function stars(scene, n = 2600, radius = 1800) { let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; const p = [];
  for (let i = 0; i < n; i += 1) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u); p.push(radius * s * Math.cos(a), radius * u, radius * s * Math.sin(a)); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.6, sizeAttenuation: false })); scene.add(pts); return pts; }

function earthTexture() { const c = document.createElement("canvas"); c.width = 2048; c.height = 1024; const g = c.getContext("2d");
  g.fillStyle = "#0d3a6e"; g.fillRect(0, 0, 2048, 1024); let r = 11; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 9; k += 1) { const cx = rnd() * 2048, cy = 250 + rnd() * 520; for (let i = 0; i < 120; i += 1) { g.fillStyle = ["#3c6b35", "#56743a", "#8a7a4e"][Math.floor(rnd() * 3)];
      g.beginPath(); g.ellipse(cx + (rnd() - 0.5) * 380, cy + (rnd() - 0.5) * 200, 20 + rnd() * 60, 12 + rnd() * 40, rnd() * 3, 0, 7); g.fill(); } }
  g.globalAlpha = 0.35; for (let i = 0; i < 1400; i += 1) { g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(rnd() * 2048, rnd() * 1024, 8 + rnd() * 40, 2 + rnd() * 5, rnd() * 0.6 - 0.3, 0, 7); g.fill(); }
  const c2 = document.createElement("canvas"); c2.width = 2048; c2.height = 1024; const g2 = c2.getContext("2d"); g2.filter = "blur(4px)"; g2.drawImage(c, 0, 0); g.globalAlpha = 1; g.drawImage(c2, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// Earth as a distant backdrop (illustration, not a map, not to scale)
export function earth(scene, { radius = 9000, below = 1400, back = 3000 } = {}) { const g = new THREE.Group();
  const e = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.9 })); g.add(e);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.018, 96, 64), new THREE.MeshBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0.22, side: THREE.BackSide })));
  g.position.set(0, -radius - below, -back); g.rotation.x = 1.1; scene.add(g); return g; }

// launch sky: a big gradient dome, blue at the horizon to near black overhead (altitude: 0..1 darkens it)
export function sky(scene) { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#02040a"); gr.addColorStop(0.55, "#16335e"); gr.addColorStop(0.85, "#4f86c6"); gr.addColorStop(1, "#9cc3e6"); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 24), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, color: 0xffffff })); scene.add(dome);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(2900, 64), new THREE.MeshLambertMaterial({ color: 0x24402a })); ground.rotation.x = -Math.PI / 2; ground.position.y = -2; scene.add(ground);
  // cloud wisps at fixed, seeded positions: they stream past a climbing camera, so ascent reads as motion (illustrative)
  let r = 11; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; const tex = glowTexture("rgba(255,255,255,.9)", "rgba(235,242,255,.35)", "rgba(235,242,255,0)");
  for (let i = 0; i < 140; i += 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.25 + 0.3 * rnd(), fog: false }));
    const y = 150 + 5800 * rnd() ** 1.3; const sz = 60 + 160 * rnd(); s.scale.set(sz * 2.2, sz, 1); s.position.set((rnd() - 0.5) * 900, y, (rnd() - 0.5) * 900); scene.add(s); }
  return { dome, ground, setAltitude: (a) => { dome.material.color.setScalar(lerp(1, 0.45, clamp(a))); } }; }

// ---- materials ------------------------------------------------------------------------------------------------------
const MATS = {};
function mat(name) { if (MATS[name]) return MATS[name];
  if (name === "stringer" || name === "stringerWhite") { const c = document.createElement("canvas"); c.width = 1024; c.height = 64; const g = c.getContext("2d"); g.fillStyle = "#e8e6e0"; g.fillRect(0, 0, 1024, 64);
    for (let i = 0; i < 72; i += 1) { g.fillStyle = i % 9 === 0 ? "rgba(40,44,52,.55)" : "rgba(60,64,72,.22)"; g.fillRect(i * 1024 / 72, 0, i % 9 === 0 ? 5 : 2, 64); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (MATS[name] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.1 })); }
  const def = { white: [0xe8e6e0, 0.55, 0.1], black: [0x1b1d22, 0.6, 0.2], metal: [0x8c9098, 0.35, 0.8], silver: [0xc9ccd2, 0.4, 0.6], glass: [0x223040, 0.15, 0.6], cream: [0xd9d4c6, 0.6, 0.1], dark: [0x2a3140, 0.6, 0.3] }[name] || [0xcccccc, 0.5, 0.2];
  return (MATS[name] = new THREE.MeshStandardMaterial({ color: def[0], roughness: def[1], metalness: def[2], side: THREE.DoubleSide })); }

// vehicle from a spec: parts stacked along +x from x = 0 (aft) to the nose.
//   part: { shape: "frustum", r0, r1, len, mat } | { shape: "dome", r, mat } | { shape: "cone-open", r0, r1, len, mat } (docking cone, open)
//   strapons: [{ y, z, spec }] parallel boosters; nozzles: [{ x, r, len }] engine bells at the aft end
export function vehicle(scene, spec) { const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); let x = 0;
  const along = (m) => { m.rotation.z = -Math.PI / 2; return m; };
  for (const p of spec.parts) {
    if (p.shape === "frustum" || p.shape === "cone-open") { const m = along(new THREE.Mesh(new THREE.CylinderGeometry(p.r1, p.r0, p.len, 48, 1, p.shape === "cone-open"), mat(p.mat))); m.position.x = x + p.len / 2; body.add(m); x += p.len; }
    else if (p.shape === "dome") { const m = new THREE.Mesh(new THREE.SphereGeometry(p.r, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(p.mat)); m.rotation.z = -Math.PI / 2; m.position.x = x; body.add(m); x += p.r; }
  }
  for (const n of spec.nozzles || []) { const m = along(new THREE.Mesh(new THREE.CylinderGeometry(n.r * 0.45, n.r, n.len, 24, 1, true), mat("metal"))); m.position.set(-n.len / 2, n.y || 0, n.z || 0); m.rotation.z = Math.PI / 2; body.add(m); }
  root.strapons = (spec.strapons || []).map((s) => { const v = vehicle(scene, s.spec); scene.remove(v); v.position.set(s.x || 0, s.y || 0, s.z || 0); body.add(v); return v; });
  root.body = body; root.length = x; scene.add(root); return root; }

// soft jet: a chain of additive sprites along -dir from the nozzle plus a faint core cone; set(origin, dir, length, strength)
export function jet(parent, color = 0xffd2a0) { const g = new THREE.Group(); const tex = glowTexture("rgba(255,255,245,1)", "rgba(255,220,170,.5)", "rgba(255,200,140,0)"); const sprites = [];
  for (let i = 0; i < 9; i += 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(s); sprites.push(s); }
  g.set = (origin, dir, len = 1.4, w = 0.35, strength = 1, flicker = 0) => { const d = dir.clone().normalize();
    sprites.forEach((s, i) => { const f = i / (sprites.length - 1); s.position.copy(origin).addScaledVector(d, f * len); const sz = w * (0.6 + 1.6 * f) * (1 + 0.08 * Math.sin(flicker * 40 + i));
      s.scale.set(sz, sz, 1); s.material.opacity = strength * (1 - f) * 0.9; }); };
  g.visible = false; parent.add(g); return g; }

// RCS puff: one soft sprite; used in rings
export function puff(parent, color = 0xd8f0ff) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,255,255,1)", "rgba(200,230,255,.55)", "rgba(200,230,255,0)"), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  s.scale.set(0.5, 0.5, 1); s.visible = false; parent.add(s); return s; }

// re-entry glow: plasma sheath ahead of a heat shield; set(position, dirForward, size, strength)
export function reentryGlow(scene) { const g = new THREE.Group(); const tex = glowTexture("rgba(255,240,220,1)", "rgba(255,150,80,.6)", "rgba(255,90,40,0)"); const sp = [];
  for (let i = 0; i < 6; i += 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(s); sp.push(s); }
  g.set = (pos, fwd, size, strength, t = 0) => { sp.forEach((s, i) => { s.position.copy(pos).addScaledVector(fwd, -i * size * 0.45); const sz = size * (1.4 + i * 0.5) * (1 + 0.05 * Math.sin(t * 30 + i)); s.scale.set(sz, sz, 1); s.material.opacity = strength * (1 - i / sp.length); }); };
  g.visible = false; scene.add(g); return g; }

// breakup: the vehicle body's meshes drift apart and tumble; u 0..1, deterministic directions
export function breakup(root, u) { let r = 5; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; const e = ease(u);
  root.body.traverse((o) => { if (!o.isMesh) return; if (!o.userData.home) o.userData.home = { p: o.position.clone(), q: o.quaternion.clone() };
    const d = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(); o.position.copy(o.userData.home.p).addScaledVector(d, e * (6 + rnd() * 18));
    o.quaternion.copy(o.userData.home.q); o.rotateOnAxis(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), e * (2 + rnd() * 4)); }); }

// fireball for a destroyed vehicle; set(pos, u)
export function fireball(scene) { const g = new THREE.Group(); const tex = glowTexture("rgba(255,250,230,1)", "rgba(255,140,60,.65)", "rgba(120,60,40,0)"); const sp = [];
  for (let i = 0; i < 14; i += 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); g.add(s); sp.push(s); }
  g.set = (pos, u) => { let r = 3; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; const e = ease(u);
    sp.forEach((s) => { const d = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(); s.position.copy(pos).addScaledVector(d, e * (8 + rnd() * 16)); const sz = (6 + rnd() * 14) * (0.3 + e); s.scale.set(sz, sz, 1); s.material.opacity = (1 - e) * 0.9; }); };
  g.visible = false; scene.add(g); return g; }

// exhaust/smoke trail behind a moving point: a fixed number of sprites placed on a recorded path
export function smokeTrail(scene, n = 40) { const tex = glowTexture("rgba(235,235,235,.9)", "rgba(200,200,200,.4)", "rgba(200,200,200,0)"); const sp = [];
  for (let i = 0; i < n; i += 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); scene.add(s); sp.push(s); }
  return { set: (pathFn, tNow, span = 6) => { sp.forEach((s, i) => { const f = i / (n - 1); const tt = tNow - f * span; const p = pathFn(Math.max(0, tt)); s.position.copy(p); const sz = 6 + f * 30; s.scale.set(sz, sz, 1); s.material.opacity = tt > 0 ? (1 - f) * 0.7 : 0; s.visible = tt > 0; }); },
    hide: () => sp.forEach((s) => { s.visible = false; }) }; }
