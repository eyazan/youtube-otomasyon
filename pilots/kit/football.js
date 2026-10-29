// Football world: pitch, stadium, goal, faceless jointed athletes with a motion library, ball with spin cues.
// Coordinates: metres; the ball's kick spot is the origin, the goal line is at z = goalZ (< 0), +y up. Every athlete
// motion here is REPRESENTATIVE (no motion capture of the real event); scenes label it on screen.
import * as THREE from "three";
import { clamp, ease, lerp, V, glowTexture, pathTube } from "./core.js";

function stripeTexture() { const c = document.createElement("canvas"); c.width = 64; c.height = 1024; const g = c.getContext("2d");
  for (let i = 0; i < 16; i += 1) { g.fillStyle = i % 2 ? "#2f7d3a" : "#2a7034"; g.fillRect(0, i * 64, 64, 64); }
  const img = g.getImageData(0, 0, 64, 1024); for (let i = 0; i < img.data.length; i += 4) { const n = (Math.sin(i * 12.9898) * 43758.5453) % 1 * 14; img.data[i] += n; img.data[i + 1] += n; } g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function crowdTexture(seed) { const c = document.createElement("canvas"); c.width = 1024; c.height = 256; const g = c.getContext("2d"); g.fillStyle = "#0c1018"; g.fillRect(0, 0, 1024, 256);
  let r = seed; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; const pal = ["#6f7782", "#3f4856", "#6b3434", "#86703a", "#2e4470", "#8a8f96", "#2c3340", "#525c6a"];
  for (let row = 0; row < 32; row += 1) for (let col = 0; col < 170; col += 1) { if (rnd() < 0.12) continue; g.fillStyle = pal[Math.floor(rnd() * pal.length)]; g.fillRect(col * 6 + rnd() * 2, row * 8 + 2, 3, 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t; }

// pitch 105 x 68 m with the goal line at goalZ; stands, floodlights, haze and (deterministic) camera flashes
export function buildStadium(scene, { goalZ, night = true }) {
  const g = new THREE.Group(); scene.add(g); const zMid = goalZ + 52.5;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(76, 113), new THREE.MeshLambertMaterial({ map: stripeTexture() }));
  grass.rotation.x = -Math.PI / 2; grass.position.set(0, 0.002, zMid); grass.receiveShadow = true; g.add(grass);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshLambertMaterial({ color: 0x1d4a26 })); apron.rotation.x = -Math.PI / 2; apron.position.set(0, -0.01, zMid); g.add(apron);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2f5f0 });
  const line = (x1, z1, x2, z2, w = 0.12) => { const l = Math.hypot(x2 - x1, z2 - z1); const m = new THREE.Mesh(new THREE.PlaneGeometry(l, w), lineMat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(z2 - z1, x2 - x1); m.position.set((x1 + x2) / 2, 0.012, (z1 + z2) / 2); g.add(m); };
  const GZ = goalZ; line(-34, GZ, 34, GZ); line(-20.16, GZ, -20.16, GZ + 16.5); line(20.16, GZ, 20.16, GZ + 16.5); line(-20.16, GZ + 16.5, 20.16, GZ + 16.5);
  line(-9.16, GZ, -9.16, GZ + 5.5); line(9.16, GZ, 9.16, GZ + 5.5); line(-9.16, GZ + 5.5, 9.16, GZ + 5.5);
  { const pts = []; for (let a = -0.93; a <= 0.93; a += 0.02) pts.push([Math.sin(a) * 9.15, GZ + 11 + Math.cos(a) * 9.15]); for (let i = 1; i < pts.length; i += 1) line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); }
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), lineMat); spot.rotation.x = -Math.PI / 2; spot.position.set(0, 0.013, GZ + 11); g.add(spot);
  // stands
  const stands = new THREE.Group(); g.add(stands);
  const stand = (len, depth, height, x, z, rotY, seed) => { const s = new THREE.Group(); const tex = crowdTexture(seed); tex.repeat.set(len / 60, 1);
    const slope = new THREE.Mesh(new THREE.PlaneGeometry(len, Math.hypot(depth, height)), new THREE.MeshBasicMaterial({ map: tex, color: 0x8a909c }));
    slope.rotation.x = -Math.atan2(height, depth); slope.position.set(0, height / 2 + 1.2, -depth / 2); s.add(slope);
    const boards = new THREE.Mesh(new THREE.BoxGeometry(len, 1.0, 0.2), new THREE.MeshBasicMaterial({ color: 0x1c2534 })); boards.position.set(0, 0.5, 3); s.add(boards); // neutral perimeter boards, no sponsors
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len, 0.6, depth * 0.7), new THREE.MeshBasicMaterial({ color: 0x0e131c })); roof.position.set(0, height + 5, -depth * 0.55); s.add(roof);
    s.position.set(x, 0, z); s.rotation.y = rotY; stands.add(s); s.userData.tex = tex; return s; };
  const S = [stand(120, 26, 16, 0, GZ - 11, 0, 7), stand(120, 26, 16, 0, GZ + 116, Math.PI, 11), stand(130, 26, 18, -42, zMid, Math.PI / 2, 13), stand(130, 26, 18, 42, zMid, -Math.PI / 2, 17)];
  const glowTex = glowTexture(); const hazeTex = glowTexture("rgba(200,215,255,0.22)", "rgba(200,215,255,0.08)", "rgba(200,215,255,0)");
  for (const [x, z] of [[-48, GZ - 7], [48, GZ - 7], [-48, GZ + 112], [48, GZ + 112]]) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 42, 10), new THREE.MeshStandardMaterial({ color: 0x2a3140 })); mast.position.set(x, 21, z); g.add(mast);
    const bank = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dc, emissiveIntensity: 2.2 })); bank.position.set(x, 43, z); bank.lookAt(0, 0, zMid); g.add(bank);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(26, 26, 1); glow.position.set(x, 43, z); g.add(glow);
    // light shafts: a column of faint haze sprites below each bank (night atmosphere, cheap to fill)
    for (let i = 1; i <= 4; i += 1) { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: hazeTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); h.scale.set(30 + i * 6, 30 + i * 6, 1); h.position.set(x * (1 - i * 0.12), 43 - i * 8, z + (zMid - z) * i * 0.1); g.add(h); }
  }
  // camera flashes in the stands: a fixed pseudo-random schedule, so frames stay deterministic
  const flashMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const flashes = []; let r = 99; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i += 1) { const sp = new THREE.Sprite(flashMat.clone()); const side = Math.floor(rnd() * 4); const u = rnd() * 2 - 1, v = rnd();
    const pos = [[u * 55, 3 + v * 15, GZ - 13 - v * 20], [u * 55, 3 + v * 15, GZ + 118 + v * 20], [-44 - v * 22, 3 + v * 17, zMid + u * 60], [44 + v * 22, 3 + v * 17, zMid + u * 60]][side];
    sp.position.set(pos[0], pos[1], pos[2]); sp.scale.set(1.6, 1.6, 1); sp.userData.t0 = rnd() * 40; sp.userData.per = 4 + rnd() * 9; g.add(sp); flashes.push(sp); }
  const update = (t) => { for (const f of flashes) { const ph = ((t + f.userData.t0) % f.userData.per); f.material.opacity = ph < 0.08 ? 1 - ph / 0.08 : 0; f.visible = f.material.opacity > 0.01; }
    for (const s of S) s.userData.tex.offset.x = Math.sin(t * 1.7) * 0.0008; }; // the crowd shimmers very slightly
  return { group: g, grass, apron, stands, update };
}

// FIFA goal: posts and bar 12 cm, 7.32 x 2.44 m, net as a fine grid
export function buildGoal(scene, goalZ) { const g = new THREE.Group(); scene.add(g); const post = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 });
  const bar = (len, x, y, z, rot) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 20), post); m.position.set(x, y, z); if (rot) m.rotation.z = Math.PI / 2; m.castShadow = true; g.add(m); };
  bar(2.44, -3.66, 1.22, goalZ); bar(2.44, 3.66, 1.22, goalZ); bar(7.44, 0, 2.44, goalZ, true);
  const p = []; const depth = 2.0; for (let x = -3.66; x <= 3.661; x += 0.18) { p.push(x, 2.44, goalZ, x, 2.44, goalZ - depth, x, 2.44, goalZ - depth, x, 0, goalZ - depth); }
  for (let y = 0; y <= 2.441; y += 0.18) p.push(-3.66, y, goalZ - depth, 3.66, y, goalZ - depth);
  for (let z = 0; z <= depth + 0.01; z += 0.18) { p.push(-3.66, 2.44, goalZ - z, 3.66, 2.44, goalZ - z); for (const s of [-3.66, 3.66]) p.push(s, 0, goalZ - z, s, 2.44, goalZ - z); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xdfe6ee, transparent: true, opacity: 0.45 })));
  return g; }

// ---- athletes -----------------------------------------------------------------------------------------------------
// proportions from standard adult anthropometry (segment lengths as fractions of height h); faceless, neutral kits
export const KITS = { neutral: { shirt: 0x34404f, shorts: 0x1f2630, socks: 0x34404f }, light: { shirt: 0x5a6576, shorts: 0x1f2630, socks: 0x5a6576 },
  keeper: { shirt: 0x9a6b2c, shorts: 0x1f2630, socks: 0x9a6b2c, gloves: 0xe8e2d0 } };
export function athlete(scene, { h = 1.82, shirt, shorts, socks, skinTone = 0x9a8578, hairTone = 0x2a221d, gloves = null } = KITS.neutral) {
  const M = (c, r = 0.75) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const mShirt = M(shirt), mShorts = M(shorts), mSock = M(socks), mSkin = M(skinTone, 0.85), mBoot = M(0x101318, 0.5), mGlove = gloves ? M(gloves, 0.6) : mSkin;
  const root = new THREE.Group(); const pelvis = new THREE.Group(); pelvis.position.y = h * 0.53; root.add(pelvis);
  const seg = (rTop, rBot, len, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 14), mat); m.position.y = -len / 2; return m; };
  const prof = [[0.15, 0], [0.165, 0.08], [0.16, 0.16], [0.175, 0.26], [0.2, 0.36], [0.205, 0.42], [0.16, 0.47], [0.06, 0.5]].map(([r, y]) => new THREE.Vector2(r * h / 1.82, y * h / 1.82 * 1.05));
  // chest: a spine joint above the pelvis, so the upper body can twist and bend against the hips (counter-rotation)
  const chestY = h * 0.1; const chest = new THREE.Group(); chest.position.y = chestY; pelvis.add(chest);
  const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 22), mShirt); torso.scale.z = 0.68; torso.position.y = -chestY; chest.add(torso);
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.17, 0.2, 16), mShorts); hips.scale.z = 0.72; hips.position.y = -0.02; pelvis.add(hips);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.1, 12), mSkin); neck.position.y = h * 0.29 - chestY; chest.add(neck);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.014, 8, 20), mShirt); collar.rotation.x = Math.PI / 2; collar.position.y = h * 0.275 - chestY; chest.add(collar);
  // head: skull, jaw and a hair cap; no face (generic, no likeness)
  const headG = new THREE.Group(); headG.position.y = h * 0.29 + 0.06 - chestY; chest.add(headG);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 18), mSkin); head.scale.set(0.9, 1.1, 1.0); head.position.y = 0.09; headG.add(head);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), mSkin); jaw.scale.set(0.95, 0.8, 0.95); jaw.position.set(0, 0.03, -0.03); headG.add(jaw);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), M(hairTone, 0.9)); hair.scale.set(0.92, 1.08, 1.03); hair.position.set(0, 0.1, 0.01); hair.rotation.x = 0.25; headG.add(hair);
  const limbs = {};
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.095 * side, -0.06, 0); pelvis.add(hip); const thighLen = h * 0.245, shinLen = h * 0.245;
    const thigh = new THREE.Mesh(new THREE.LatheGeometry([[0.05, 0], [0.068, 0.12], [0.08, 0.42], [0.072, 0.78], [0.062, 1]].map(([r, y]) => new THREE.Vector2(r, -y * thighLen)), 16), mSkin);
    thigh.scale.z = 0.92; hip.add(thigh); hip.add(seg(0.094, 0.088, thighLen * 0.45, mShorts)); hip.add(new THREE.Mesh(new THREE.SphereGeometry(0.088, 14, 10), mShorts));
    const knee = new THREE.Group(); knee.position.y = -thighLen; hip.add(knee); knee.add(new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 10), mSkin));
    knee.add(seg(0.056, 0.04, shinLen, mSock)); const calf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mSock); calf.scale.set(0.95, 1.6, 0.95); calf.position.set(0, -shinLen * 0.3, 0.015); knee.add(calf);
    const ankle = new THREE.Group(); ankle.position.y = -shinLen; knee.add(ankle); ankle.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), mSock));
    const boot = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.17, 6, 12), mBoot); boot.rotation.x = Math.PI / 2; boot.scale.set(1.05, 1, 0.8); boot.position.set(0, -0.04, -0.06); ankle.add(boot);
    const sh = new THREE.Group(); sh.position.set(0.2 * side * h / 1.82, h * 0.25 - chestY, 0); chest.add(sh); const upLen = h * 0.17, foreLen = h * 0.15;
    sh.add(seg(0.048, 0.042, upLen, mSkin)); sh.add(seg(0.058, 0.053, upLen * 0.48, mShirt)); sh.add(new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 10), mShirt));
    const elbow = new THREE.Group(); elbow.position.y = -upLen; sh.add(elbow); elbow.add(seg(0.04, 0.032, foreLen, mSkin)); elbow.add(new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 8), mSkin));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), mGlove); hand.scale.set(0.8, 1.2, 0.5); hand.position.y = -foreLen - 0.04; elbow.add(hand);
    limbs[side < 0 ? "L" : "R"] = { hip, knee, ankle, sh, elbow };   // the figure faces -z, so its right side is +x
  }
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  root.pose = (p) => { for (const k of ["L", "R"]) { const q = p[k] || {}; const L = limbs[k]; const sgn = k === "L" ? -1 : 1;
      L.hip.rotation.set(q.hip || 0, 0, (q.hipOut || 0) * sgn); L.knee.rotation.set(-(q.knee || 0), 0, 0); L.ankle.rotation.set(q.ankle || 0, 0, 0);
      L.sh.rotation.set(q.sh || 0, 0, (q.shOut || 0.08) * sgn); L.elbow.rotation.set(q.elbow || 0, 0, 0); }
    pelvis.rotation.set(p.lean || 0, p.twist || 0, p.tilt || 0); pelvis.position.y = h * 0.53 - (p.drop || 0);
    chest.rotation.set(p.chestBend || 0, p.chestTwist || 0, p.chestSide || 0); headG.rotation.set(p.nod || 0, p.look || 0, 0); return root; };
  root.limbs = limbs; root.h = h; root.pose({}); scene.add(root); return root;
}

// motion library (angles in radians; all REPRESENTATIVE). Each returns a pose object for athlete.pose().
const mir = (p) => ({ ...p, L: p.R, R: p.L, twist: -(p.twist || 0), tilt: -(p.tilt || 0), chestTwist: -(p.chestTwist || 0), chestSide: -(p.chestSide || 0), look: -(p.look || 0) });
const seg3 = (u, a, b, c, m = 0.5) => (u < m ? lerp(a, b, ease(u / m)) : lerp(b, c, ease((u - m) / (1 - m))));
export const MOTION = {
  stand: () => ({ L: { sh: 0.05, elbow: 0.15 }, R: { sh: 0.05, elbow: 0.15 } }),
  wall: () => ({ L: { sh: 0.5, shOut: -0.35, elbow: 1.2, hipOut: 0.04 }, R: { sh: 0.5, shOut: -0.35, elbow: 1.2, hipOut: 0.04 } }),
  keeperReady: () => ({ lean: 0.22, drop: 0.12, L: { hip: 0.45, knee: 0.7, ankle: 0.25, sh: 0.5, shOut: 0.55, elbow: 0.6, hipOut: 0.12 }, R: { hip: 0.45, knee: 0.7, ankle: 0.25, sh: 0.5, shOut: 0.55, elbow: 0.6, hipOut: 0.12 } }),
  // gait cycle, phase in [0,1): opposite arm and leg, elbows near 90 degrees, knee drive in swing, the chest counter-rotates
  // against the hips, a small vertical bounce (REPRESENTATIVE; proportions of a running stride, not motion capture)
  run: (ph, speed = 1) => { const a = ph * Math.PI * 2, s = Math.sin(a), c = Math.cos(a); const amp = 0.6 * speed;
    return { lean: 0.1 * speed, chestBend: 0.08 * speed, twist: -0.12 * s * speed, chestTwist: 0.2 * s * speed, drop: 0.035 * Math.abs(c), nod: -0.05,
      L: { hip: amp * s + 0.1, knee: 0.3 + 1.4 * speed * Math.max(0, -s) ** 1.3, ankle: 0.25 * s, sh: -0.75 * amp * s, shOut: 0.12, elbow: 1.45 },
      R: { hip: -amp * s + 0.1, knee: 0.3 + 1.4 * speed * Math.max(0, s) ** 1.3, ankle: -0.25 * s, sh: 0.75 * amp * s, shOut: 0.12, elbow: 1.45 } }; },
  // strike, u: 0 .. 0.3 backswing (hip extended, knee flexed ~100 deg) .. 0.55 contact .. 1 follow-through. Contact angles
  // are the probed ones (the boot meets the ball at u = 0.55); the arm opposite the kicking leg opens wide for balance,
  // the hips turn into the kick while the chest counter-rotates, the head stays over the ball. Phases after the
  // instep-kick literature (Lees & Nolan 1998; Lees et al. 2010); angles REPRESENTATIVE, not measured for any player.
  kick: (u, foot = "R", style = "drive") => { const chip = style === "chip";
    const [back, contact, follow] = chip ? [-0.35, 0.15, 0.55] : [-0.6, 0.3, 1.15]; const [kb, kc, kf] = chip ? [1.3, 0.35, 0.2] : [1.8, 0.55, 0.15];
    const hipA = u < 0.3 ? lerp(-0.1, back, ease(u / 0.3)) : u < 0.55 ? lerp(back, contact, ease((u - 0.3) / 0.25) ** 1.4) : lerp(contact, follow, ease((u - 0.55) / 0.45));
    const kneeA = u < 0.3 ? lerp(0.4, kb, ease(u / 0.3)) : u < 0.55 ? lerp(kb, kc, ((u - 0.3) / 0.25) ** 1.6) : lerp(kc, kf, ease((u - 0.55) / 0.45));
    const turn = seg3(u, -0.3, 0.05, 0.3, 0.55);
    const p = { lean: chip ? -0.2 : seg3(u, 0.05, -0.12, 0.05, 0.55), tilt: 0.16, twist: turn, chestTwist: -0.7 * turn, chestBend: seg3(u, 0.1, 0.2, 0.05, 0.55), chestSide: -0.08, nod: 0.45, drop: 0.04,
      L: { hip: hipA, knee: kneeA, ankle: chip ? 0.1 : 0.6, hipOut: -0.06, sh: seg3(u, 0.5, -0.1, -0.5, 0.55), shOut: 0.45, elbow: 0.5 },
      R: { hip: seg3(u, 0.05, 0.18, 0.05, 0.55), knee: seg3(u, 0.2, 0.38, 0.2, 0.55), ankle: 0.1, hipOut: 0.05, sh: seg3(u, -0.1, 0.35, 0.6, 0.55), shOut: seg3(u, 0.9, 1.35, 1.0, 0.55), elbow: 0.35 } };
    return foot === "L" ? p : mir(p); },
  // goalkeeper dive toward the keeper's own left (+x when facing +z) or right; u 0..1; returns pose + root offset
  dive: (u, dir = "left") => { const e = ease(u); const s = dir === "left" ? 1 : -1;
    // body nearly horizontal, both arms stretched overhead toward the dive, the leading leg pushing off (REPRESENTATIVE)
    return { pose: { lean: 0.1, tilt: 1.25 * e * s, chestSide: 0.15 * e * s, look: 0.3 * e * s, L: { hip: 0.3 + 0.2 * e, knee: 0.4 * (1 - e) + 0.15, sh: 2.9 * e, shOut: 0.25, elbow: 0.15 }, R: { hip: 0.25, knee: 0.5 - 0.3 * e, sh: 2.9 * e, shOut: 0.25, elbow: 0.15 } },
      offset: [s * 1.9 * e, 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.2)) - 0.45 * e, 0] }; },
};

// ---- ball ---------------------------------------------------------------------------------------------------------
// plain: a generic ball with seam lines only, for topics whose ball design is not the classic 32 panels
function ballTexture(plain = false) { const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d");
  g.fillStyle = "#f2f2ef"; g.fillRect(0, 0, 1024, 512); g.fillStyle = "#171b23";
  if (plain) { g.strokeStyle = "rgba(40,44,52,0.55)"; g.lineWidth = 4; for (let i = 0; i < 4; i += 1) { g.beginPath(); for (let x = 0; x <= 1024; x += 16) g.lineTo(x, 256 + 150 * Math.sin((x / 1024) * 2 * Math.PI * 2 + i * Math.PI / 2)); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  for (const [y, n, off] of [[70, 5, 0], [190, 7, 0.5], [322, 7, 0], [442, 5, 0.5]]) { const lat = (0.5 - y / 512) * Math.PI; const sx = 1 / Math.max(0.35, Math.cos(lat));
    for (let i = 0; i < n; i += 1) { const x = ((i + off) / n) * 1024; g.beginPath(); for (let k = 0; k < 5; k += 1) { const a = k * 2 * Math.PI / 5 + i; g.lineTo(x + Math.cos(a) * 30 * sx, y + Math.sin(a) * 30); } g.fill(); } }
  g.strokeStyle = "rgba(40,44,52,0.35)"; g.lineWidth = 2; for (let x = 0; x < 1024; x += 73) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 512); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function buildBall(scene, { plain = false } = {}) {
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 48, 32), new THREE.MeshStandardMaterial({ map: ballTexture(plain), roughness: 0.45 })); ball.castShadow = true; scene.add(ball);
  // spin ring: 300 degree arc + arrowhead, counter-clockwise from above (the sense of omega = +y); flip() for the other sense
  const ring = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0xffd36b });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 10, 72, Math.PI * 5 / 3), m); arc.rotation.x = -Math.PI / 2; ring.add(arc);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.11, 16), m); const a = Math.PI * 5 / 3;
  head.position.set(0.2 * Math.cos(a), 0, -0.2 * Math.sin(a)); head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a))); ring.add(head);
  ring.visible = false; scene.add(ring);
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 18, 64, 64, 62);
  gr.addColorStop(0, "rgba(95,225,255,0)"); gr.addColorStop(0.55, "rgba(95,225,255,0)"); gr.addColorStop(0.7, "rgba(95,225,255,0.9)"); gr.addColorStop(0.85, "rgba(95,225,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), sizeAttenuation: false, depthTest: false, transparent: true })); halo.scale.set(0.05, 0.05, 1); halo.renderOrder = 5; scene.add(halo);
  return { ball, ring, halo, trail: (samples, color, r, op) => pathTube(scene, samples, color, r, op) };
}

// sample lookup by model time
export const sampleAt = (samples, tt) => samples[clamp(Math.round(tt / (samples[1].t - samples[0].t)), 0, samples.length - 1)];
export { V };
