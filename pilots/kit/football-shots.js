// Football shot library. A world is built once from D.setup; each shot kind is a function of the shot's normalised
// progress k (0..1), the scene time t and the plan's params (text, labels, which path). No topic text lives here: every
// headline, label and number on screen comes from the plan (pilots/lib/planner.js), which cites the topic's evidence.
import * as THREE from "three";
import { clamp, ease, lerp, V, O, arrow, H, W } from "./core.js";
import { buildStadium, buildGoal, athlete, KITS, MOTION, buildBall, sampleAt } from "./football.js";

export function buildWorld(S, D) {
  const { scene } = S; const st = D.setup; const GZ = st.goalZ;
  scene.background = new THREE.Color(0x070b12); scene.fog = new THREE.Fog(0x070b12, 90, 260);
  scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x1b2a12, 0.55));
  const key = new THREE.DirectionalLight(0xfff3df, 2.2); key.position.set(-30, 45, 10); key.castShadow = true; key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 140 }); key.shadow.bias = -0.0004; scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fc2ff, 0.6); fill.position.set(35, 25, -60); scene.add(fill);
  const B = V(st.ballStart);
  const strikeLight = new THREE.DirectionalLight(0xfff0dc, 0); strikeLight.position.set(B.x + 6, 4, B.z - 6); strikeLight.target.position.copy(B); scene.add(strikeLight, strikeLight.target);
  const stadium = buildStadium(scene, { goalZ: GZ }); buildGoal(scene, GZ);
  // model board for "if it kept flying" sequences: dark grid, 10 m squares (shown instead of the pitch)
  const board = new THREE.Group(); board.visible = false; scene.add(board);
  { const plane = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshBasicMaterial({ color: 0x0b1220 })); plane.rotation.x = -Math.PI / 2; plane.position.set(-25, -0.02, GZ); board.add(plane);
    const g = []; for (let v = -110; v <= 110; v += 10) g.push(-25 + v, 0, GZ - 110, -25 + v, 0, GZ + 110, -135, 0, GZ + v, 85, 0, GZ + v);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(g, 3)); board.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x24344d }))); }
  // people (representative positions): wall, keeper, kicker
  const wall = (st.wall ? Array.from({ length: st.wall.count }, (_, i) => { const a = athlete(scene, { ...KITS.neutral, h: 1.8 + (i % 2) * 0.05 });
    a.position.set(st.wall.x + (i - (st.wall.count - 1) / 2) * 0.6, 0, st.wall.z); a.rotation.y = Math.PI; a.pose(MOTION.wall()); a.userData.i = i; a.userData.x0 = a.position.x; return a; }) : []);
  const keeper = athlete(scene, { ...KITS.keeper, h: 1.88 }); keeper.rotation.y = Math.PI; const keeperHome = new THREE.Vector3(st.keeper.x, 0, GZ + 0.4); keeper.position.copy(keeperHome);
  const kicker = athlete(scene, { ...KITS.light, h: st.kickerHeight || 1.75 });
  const ballKit = buildBall(scene, { plain: st.ballPlain }); const P = D.paths; const T = P.flight[P.flight.length - 1].t;
  const tubes = { flight: ballKit.trail(P.flight, 0x5fe1ff, 0.05), flightWide: ballKit.trail(P.flight, 0x5fe1ff, 0.3, 1) };
  // every other path the plan supplies is a ghost: straight (no-spin counterfactual) red, other kicks orange
  for (const [name, path] of Object.entries(P)) if (path && name !== "flight" && name !== "spiral") tubes[name] = ballKit.trail(path, name === "straight" ? 0xff5a5a : 0xff8a3d, name === "straight" ? 0.035 : 0.04, 0.8);
  if (P.spiral) tubes.spiralWide = ballKit.trail(P.spiral, 0xffd36b, 0.6, 1);
  const arrows = { m: arrow(scene, 0x5fe1ff), d: arrow(scene, 0xff8a3d), v: arrow(scene, 0xffffff) };
  // dimension line on the grass (laws of the game: distances), grows from its start with set(from, to, f)
  const measure = new THREE.Group(); { const m = new THREE.MeshBasicMaterial({ color: 0xffd36b }); const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 1), m); measure.add(bar);
    const tick = () => { const t = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.12), m); measure.add(t); return t; }; const t0 = tick(), t1 = tick();
    measure.set = (from, to, f) => { const d = to.clone().sub(from); const L = d.length() * f; bar.scale.z = Math.max(0.001, L); measure.rotation.y = Math.atan2(d.x, d.z); measure.position.copy(from);
      bar.position.set(0, 0, L / 2); t0.position.set(0, 0, 0); t1.position.set(0, 0, L); t1.visible = f > 0.98; }; measure.visible = false; scene.add(measure); }
  // a team-mate (back-pass and passing laws); hidden unless the setup has one
  const mate = st.mate ? athlete(scene, { ...KITS.light, h: 1.8 }) : null; if (mate) mate.visible = false;
  // contact geometry: the kicking boot meets the ball's side opposite the curl (outside of the foot) or its underside
  // (chip); KICK_OFFSET places the kicker's pelvis so the boot reaches the ball at u = 0.55 (probed, pilots/gll-magnus-3d)
  const footSign = st.foot === "L" ? 1 : -1; const kickPos = B.clone().add(new THREE.Vector3(0.07 * footSign * (st.style === "outside" ? 1 : -1), 0, -0.02));
  const spinShown = (st.spinRps || 0) / 40; const spinSign = st.spinSign || 1;
  const reset = (s) => { Object.values(tubes).forEach((m) => m.show(0)); tubes.flightWide.visible = false; Object.values(arrows).forEach((a) => { a.visible = false; });
    ballKit.ring.visible = false; ballKit.halo.visible = true; stadium.group.visible = true; board.visible = false; scene.fog.far = 260; strikeLight.intensity = 0;
    wall.forEach((w) => { w.position.x = w.userData.x0; }); keeper.visible = true; keeper.position.copy(keeperHome); keeper.rotation.set(0, Math.PI, 0); keeper.pose(MOTION.keeperReady()); kicker.visible = false; measure.visible = false; if (mate) mate.visible = false; wall.forEach((a) => { a.visible = true; }); };
  const placeBall = (tt, path = P.flight, now = 0) => { const s = sampleAt(path, tt); ballKit.ball.position.copy(V(s.p)); ballKit.ball.rotation.set(0, spinSign * 2 * Math.PI * spinShown * now, 0); return s; };
  const ring = (pos, now) => { ballKit.ring.visible = spinShown > 0; ballKit.ring.position.copy(pos); ballKit.ring.rotation.y = spinSign * 2 * Math.PI * spinShown * now; ballKit.ring.scale.set(1, 1, spinSign); };
  // keeper behaviour at model time tt: static, or a dive starting at st.keeper.diveAt (model seconds)
  const keeperAt = (tt) => { if (st.keeper.action !== "dive") return; const u = clamp((tt - st.keeper.diveAt) / 0.75); const d = MOTION.dive(u, st.keeper.dir);
    keeper.pose(d.pose); keeper.position.copy(keeperHome).add(new THREE.Vector3(d.offset[0], d.offset[1], 0)); }; // keeper faces +z, so his left is world +x
  return { GZ, B, T, P, st, stadium, board, wall, keeper, kicker, kickPos, ballKit, tubes, arrows, strikeLight, reset, placeBall, ring, keeperAt, spinShown, measure, mate, keeperHome };
}

const labels = (S, list, extra = {}) => (list || []).map((l) => O.read({ ...l, ...extra })).join("");

export const SHOTS = {
  // frame 0 close on the ball in flight (spin readable), then the camera releases to show the whole path
  "ball-close-hook": (S, C, k, t, p) => { const tt = lerp(p.from ?? 0.12, C.T, ease(clamp(k * 1.25))); const smp = C.placeBall(tt, C.P.flight, t); C.tubes.flight.show(tt / C.T); C.keeperAt(tt);
    const Pp = V(smp.p); const rel = ease(clamp((t - 0.7) / 1.2)); const B = C.B, GZ = C.GZ;
    const wideCam = new THREE.Vector3(B.x + 0.8, 2.1, 7.5 - k * 2), wideTgt = new THREE.Vector3(lerp(B.x + 1.5, 1.8, ease(k)), 1.1, GZ + 6);
    if (C.spinShown > 0 && rel < 0.9) C.ring(Pp, t); C.ballKit.halo.visible = rel > 0.6;
    S.look(Pp.clone().add(new THREE.Vector3(0.55, 0.35, 1.3)).lerp(wideCam, rel), Pp.clone().add(new THREE.Vector3(-0.08, -0.05, -0.5)).lerp(wideTgt, rel), lerp(36, 32, rel));
    return O.head(p.head) + labels(S, p.labels); },
  "payoff-loop": (S, C, k, t, p) => { const tt = lerp(0, C.T, ease(clamp((k - 0.05) * 1.3))); C.placeBall(tt, C.P.flight, t); C.tubes.flight.show(tt / C.T); C.keeperAt(tt);
    S.look(new THREE.Vector3(C.B.x + 0.8, 2.1, 7.5 - k * 2), new THREE.Vector3(lerp(C.B.x + 1.5, 1.8, ease(k)), 1.1, C.GZ + 6), 32); return O.head(p.head); },
  // high crane over the set piece; the kicker walks back to his mark, the wall shuffles (representative motion)
  "establish": (S, C, k, t, p) => { C.placeBall(0); const a = lerp(-0.35, 0.15, ease(k)); const B = C.B;
    C.kicker.visible = true; const back = p.runFrom || [1.4, 0, 5.5]; const ph = (t * 0.9) % 1; C.kicker.pose(MOTION.run(ph, 0.35)); C.kicker.position.set(B.x + back[0], 0, B.z + lerp(back[2] - 2, back[2], ease(k))); C.kicker.rotation.y = Math.PI;
    C.wall.forEach((w) => { w.position.x = w.userData.x0 + Math.sin(t * 2 + w.userData.i) * 0.04; }); // absolute: a frame never depends on the frames before it
    S.look(new THREE.Vector3(B.x + 24 * Math.sin(a), 30 - 6 * k, B.z - 8 + 26 * Math.cos(a)), new THREE.Vector3(1.5, 0, (B.z + C.GZ) / 2), 40);
    return O.head(p.head) + O.sub(p.sub) + labels(S, p.labels); },
  // last steps of the run-up, the strike, then a slow-motion follow of the ball
  "strike": (S, C, k, t, p) => { const dur = p.swing || 1.6; const runT = p.runIn || 0; const B = C.B;
    let u; if (t - S.shotStart < runT) { const r = (t - S.shotStart) / runT; C.kicker.pose(MOTION.run((r * 3) % 1, 0.9)); C.kicker.position.copy(C.kickPos).add(new THREE.Vector3(0.6 * (1 - r), 0, 2.4 * (1 - r))); u = 0; }
    else { u = clamp((t - S.shotStart - runT) / dur); C.kicker.pose(MOTION.kick(u, C.st.foot, C.st.style)); C.kicker.position.copy(C.kickPos); }
    C.kicker.visible = true; C.kicker.rotation.y = 0; C.strikeLight.intensity = 1.6; C.ballKit.halo.visible = false;
    const tc = S.shotStart + runT + dur * 0.55; const tt = t < tc ? 0 : Math.min(C.T * 0.1, (t - tc) * 0.05); C.placeBall(tt, C.P.flight, t < tc ? 0 : t - tc);
    if (t >= tc) C.ring(C.ballKit.ball.position, t - S.shotStart);
    const follow = ease(clamp((t - tc) / 0.7)); const BP = C.ballKit.ball.position.clone(); const orbit = lerp(0.2, -0.25, ease(k));
    const side = C.st.foot === "L" ? 1 : -1;
    const camA = new THREE.Vector3(B.x + side * (3.0 + orbit), 0.75, B.z - 2.4), tgtA = new THREE.Vector3(B.x + side * 0.2, 0.45, B.z + 0.1);
    const camB = BP.clone().add(new THREE.Vector3(side * 1.0, 0.75, 1.4)), tgtB = BP.clone().add(new THREE.Vector3(-0.1 * side, 0.05, -0.4));
    S.look(camA.lerp(camB, follow), tgtA.lerp(tgtB, follow), lerp(30, 36, follow));
    return O.head(p.head) + (t >= tc ? labels(S, p.labels) : ""); },
  // chase camera behind the ball, the alternative path (no spin, or another kick) drawn as a ghost
  "chase": (S, C, k, t, p) => { const tt = lerp(p.from || 0, C.T * (p.to || 0.7), ease(k)); const smp = C.placeBall(tt, C.P.flight, t); C.tubes.flight.show(tt / C.T); C.keeperAt(tt);
    const ghost = C.tubes[p.ghost || "straight"]; if (ghost) ghost.show(ease(clamp(k * 1.4)));
    S.look(V(smp.p).add(new THREE.Vector3(1.0, 0.8, 4.2)), V(smp.p).add(new THREE.Vector3(-0.6, -0.15, -9)), 42);
    let html = O.head(p.head); const end = C.P[p.ghost || "straight"]; if (end && p.ghostLabel && k > 0.35) { const g = S.toScreen(V(end[end.length - 1].p)); html += O.read({ ...p.ghostLabel, x: g.x - 60, y: g.y - 110 }); }
    return html + labels(S, p.labels); },
  // from behind the goal, slow push-in; the keeper stays or dives per setup
  "goal-reverse": (S, C, k, t, p) => { const tt = lerp(C.T * (p.from ?? 0.55), C.T, ease(k)); C.placeBall(tt, C.P.flight, t); C.tubes.flight.show(tt / C.T); if (C.tubes[p.ghost]) C.tubes[p.ghost].show(1); C.keeperAt(tt);
    const GZ = C.GZ; const side = p.side ?? -1;
    S.look(new THREE.Vector3(side * 7.5 - side * 2.2 * k, 3.4 - 0.8 * k, GZ - 9 + 2.5 * k), new THREE.Vector3(-side * 1.5, 1.0, GZ + 7), 40 - 4 * k);
    let html = O.head(p.head); if (p.keeperLabel) { const kp = S.toScreen(C.keeper.position.clone().add(new THREE.Vector3(0, 2.2, 0))); html += O.read({ ...p.keeperLabel, x: kp.x - 140, y: kp.y - 120 }); }
    return html + labels(S, p.labels); },
  // a source card over a slow aerial drift of the finished path
  "card": (S, C, k, t, p) => { C.placeBall(C.T); C.tubes.flight.show(1); if (C.tubes[p.ghost]) C.tubes[p.ghost].show(1); C.keeperAt(C.T);
    const mz = (C.B.z + C.GZ) / 2; S.look(new THREE.Vector3(1 + 4 * k, 52 - 6 * k, mz - 3 * k), new THREE.Vector3(1 + 2 * k, 0, mz - 0.5 - 3 * k), 42);
    return O.head(p.head) + O.card({ ...p.card, opacity: clamp(k * 4) }); },
  // forces at the ball: velocity (white), Magnus (cyan, after p.magnusAt), drag (orange, after p.dragAt)
  "forces": (S, C, k, t, p) => { const tt = lerp(0.15, C.T * 0.9, k); const smp = C.placeBall(tt, C.P.flight, t); C.tubes.flight.show(tt / C.T);
    const Pp = V(smp.p), v = V(smp.v).normalize(), fm = V(smp.magnus), fd = V(smp.drag); C.ballKit.halo.visible = false;
    C.arrows.v.set(Pp, v, smp.speed * 0.03); C.arrows.m.set(Pp, fm, fm.length() * 0.12); C.arrows.d.set(Pp, fd, fd.length() * 0.12);
    C.arrows.v.visible = true; C.arrows.m.visible = t > (p.magnusAt ?? 0); C.arrows.d.visible = t > (p.dragAt ?? 0); C.ring(Pp, t);
    S.look(Pp.clone().add(new THREE.Vector3(1.6, 2.6, 2.6)), Pp.clone().add(new THREE.Vector3(-0.3, 0, -0.6)), 34);
    const head = p.heads ? (t < (p.dragAt ?? 1e9) ? p.heads[0] : p.heads[1]) : p.head; const fmt = (s) => s.replace("{speed}", smp.speed.toFixed(1)).replace("{magnus}", fm.length().toFixed(1)).replace("{drag}", fd.length().toFixed(1));
    return O.head(head) + (p.labels || []).map((l) => O.read({ ...l, title: fmt(l.title), small: fmt(l.small || "") })).join(""); },
  // top-down model board: the path continued under the model's assumptions (labelled MODEL by the plan)
  "model-board": (S, C, k, t, p) => { const f = ease(clamp(k * 1.1)); C.tubes.spiralWide.show(f); C.tubes.flightWide.visible = true; const sp = C.P.spiral[Math.floor(f * (C.P.spiral.length - 1))];
    C.ballKit.ball.position.copy(V(sp.p)); C.keeper.visible = false; C.stadium.group.visible = false; C.board.visible = true; S.scene.fog.far = 900;
    S.look(new THREE.Vector3(-27 + 4 * k, 175 - 22 * k, C.GZ + 0.5 + 3 * k), new THREE.Vector3(-27 + 4 * k, 0, C.GZ + 0.49 + 3 * k), 46);
    const fmt = (s) => s.replace("{radius}", sp.radius.toFixed(0)).replace("{t}", sp.t.toFixed(1));
    return O.head(p.head) + O.sub(p.sub) + (p.labels || []).map((l) => O.read({ ...l, title: fmt(l.title), small: fmt(l.small || "") })).join(""); },
  // aerial over the stadium with a score / state card (penalty shoot-out, scoreline)
  "scoreboard": (S, C, k, t, p) => { C.placeBall(0); C.ballKit.halo.visible = false; const a = lerp(0.5, 0.1, ease(k)); C.wall.forEach((w) => { w.visible = false; });
    S.look(new THREE.Vector3(60 * Math.sin(a), 48 - 8 * k, C.GZ + 40 + 50 * Math.cos(a)), new THREE.Vector3(0, 0, C.GZ + 30), 44);
    return O.head(p.head) + O.sub(p.sub) + (p.card ? O.card({ ...p.card, opacity: clamp(k * 4), top: 760 }) : ""); },
  // a kick along an alternative path (e.g. over the bar), seen from behind the kicker
  "alt-kick": (S, C, k, t, p) => { const path = C.P[p.path]; const T2 = path[path.length - 1].t; const tt = lerp(0, T2, ease(clamp((k - 0.15) * 1.4)));
    C.placeBall(tt, path, t); C.tubes[p.path].show(tt / T2); C.kicker.visible = true; C.kicker.rotation.y = 0; C.kicker.position.copy(C.kickPos);
    C.kicker.pose(MOTION.kick(clamp(k * 2.2), p.foot || "R", "drive"));
    S.look(new THREE.Vector3(C.B.x + 1.4, 1.9, C.B.z + 5.2 - k), new THREE.Vector3(0, 1.6, C.GZ), 36); return O.head(p.head) + labels(S, p.labels); },
  // penalty: run-up, the keeper commits (dive), the kick
  "penalty-run": (S, C, k, t, p) => { const B = C.B; const runEnd = 0.62; C.kicker.visible = true; C.kicker.rotation.y = 0; C.ballKit.halo.visible = false;
    if (k < runEnd) { const r = k / runEnd; C.kicker.pose(MOTION.run((r * 4.5) % 1, 0.75)); C.kicker.position.copy(C.kickPos).add(new THREE.Vector3(0.8 * (1 - r), 0, 5.0 * (1 - r))); C.placeBall(0); }
    else { const u = clamp((k - runEnd) / (1 - runEnd)); C.kicker.pose(MOTION.kick(u, C.st.foot, C.st.style)); C.kicker.position.copy(C.kickPos); C.placeBall(u < 0.55 ? 0 : (u - 0.55) * 0.5); }
    // the keeper commits as the kicker plants (the dive starts before the ball moves)
    if (C.st.keeper.action === "dive") { const u = clamp((k - runEnd + 0.12) / 0.4); const d = MOTION.dive(u, C.st.keeper.dir); C.keeper.pose(d.pose); C.keeper.position.set(C.st.keeper.x + d.offset[0], d.offset[1], C.GZ + 0.4); }
    S.look(new THREE.Vector3(B.x + 0.5 - 0.3 * k, 1.8, B.z + 9.5 - 2.5 * k), new THREE.Vector3(0, 1.1, C.GZ), 36); // behind the run-up, the kicker in frame
    return O.head(p.head) + (k > 0.38 ? labels(S, p.labels) : ""); }, // label as the keeper commits
  // a fact as a broadcast graphic: a low tracking shot along the touchline (stands, lights, the goal in depth) with a
  // lower third naming the line's anchor and its source, and the year in outline; replaces the empty aerial card
  "fact-graphic": (S, C, k, t, p) => { C.placeBall(0); C.ballKit.halo.visible = false; C.wall.forEach((w) => { w.visible = false; }); C.keeper.visible = true;
    const side = p.side ?? 1; const x = side * (34 - 3 * k), z = C.GZ + 26 - 14 * k;
    S.look(new THREE.Vector3(x, 1.7 + 0.4 * k, z), new THREE.Vector3(side * 6, 1.4, C.GZ + 4 - 6 * k), 34);
    return O.head(p.head) + (p.card ? O.lowerThird(p.card, clamp((t - S.shotStart) / 0.45)) : ""); },
  // a distance from the laws of the game, measured on the pitch (from the ball's spot to the goal line)
  "measure": (S, C, k, t, p) => { C.placeBall(0); C.ballKit.halo.visible = false; C.wall.forEach((w) => { w.visible = false; });
    const from = new THREE.Vector3(C.B.x, 0.03, C.B.z), to = new THREE.Vector3(C.B.x, 0.03, C.GZ); C.measure.visible = true; C.measure.set(from, to, ease(clamp(k * 1.6)));
    const mid = from.clone().lerp(to, 0.5); const a = lerp(0.95, 0.75, ease(k));
    S.look(new THREE.Vector3(mid.x + 17 * Math.sin(a), 12 - 2 * k, mid.z + 17 * Math.cos(a)), mid.clone().add(new THREE.Vector3(0, 0.5, 0)), 40);
    const m = S.toScreen(mid); return O.head(p.head) + O.sub(p.sub) + (k > 0.3 ? labels(S, (p.labels || []).map((l) => ({ ...l, x: m.x - 120, y: m.y - 150 }))) : ""); },
  // back pass: a team-mate plays the ball back to the keeper; mode "hands" (keeper picks it up) or "feet" (no handling:
  // the keeper controls it with a foot and clears). Motion REPRESENTATIVE; what is allowed is the law (cited by the plan).
  "back-pass": (S, C, k, t, p) => { const GZ = C.GZ; const M = C.mate; M.visible = true; C.wall.forEach((w) => { w.visible = false; }); C.ballKit.halo.visible = false;
    const from = new THREE.Vector3(7, 0.11, GZ + 24), to = new THREE.Vector3(0.4, 0.11, GZ + 3.2); const kickU = clamp(k / 0.18), roll = clamp((k - 0.1) / 0.45);
    M.position.set(from.x + 0.35, 0, from.z + 0.5); M.rotation.y = Math.atan2(to.x - from.x, to.z - from.z) + Math.PI; M.pose(MOTION.kick(kickU, "R", "drive"));
    const K = C.keeper; K.position.copy(C.keeperHome).add(new THREE.Vector3(0.3 * roll, 0, 2.6 * roll));
    const ball = C.ballKit.ball; ball.position.copy(from.clone().lerp(to, ease(roll))); ball.rotation.x = -roll * 60;
    if (p.mode === "hands" && k > 0.55) { const g = ease(clamp((k - 0.55) / 0.2)); K.pose({ lean: 0.5 * g, drop: 0.25 * g, L: { hip: 0.6 * g, knee: 0.9 * g, sh: 1.2 * g, elbow: 0.3 }, R: { hip: 0.6 * g, knee: 0.9 * g, sh: 1.2 * g, elbow: 0.3 } });
      ball.position.copy(K.position).add(new THREE.Vector3(0, lerp(0.11, 0.75, g), lerp(0.2, 0.45, g))); }
    else if (p.mode === "feet" && k > 0.55) { const u = clamp((k - 0.55) / 0.3); K.pose(MOTION.kick(u, "R", "drive")); if (u > 0.55) { const f = (u - 0.55) / 0.45; ball.position.copy(to).add(new THREE.Vector3(-3 * f, 5 * f * (1.2 - f), 22 * f)); } }
    S.look(new THREE.Vector3(11 - 1.5 * k, 9.5 - k, GZ + 39 - 3 * k), new THREE.Vector3(3.2, 0.4, GZ + 12), 42);
    let html = O.head(p.head) + O.sub(p.sub);
    if (p.mode && k > 0.4) { const kp = S.toScreen(K.position.clone().add(new THREE.Vector3(0, 2.3, 0))); const ok = p.mode === "hands";
      html += O.read({ x: kp.x - 120, y: kp.y - 120, title: `${ok ? "✓" : "✕"} HANDS`, small: p.ruleNote || "", tone: ok ? "cool" : "warm" }); }
    return html + labels(S, p.labels); },
  // side view of the flight with the alternative path for comparison (both model paths)
  "compare-paths": (S, C, k, t, p) => { const tt = lerp(0, C.T, ease(clamp(k * 1.2))); C.placeBall(tt, C.P.flight, t); C.tubes.flight.show(tt / C.T); if (C.tubes[p.ghost]) C.tubes[p.ghost].show(ease(clamp(k * 1.2))); C.keeperAt(tt);
    const mz = (C.B.z + C.GZ) / 2; if (p.view === "behind") S.look(new THREE.Vector3(C.B.x + 0.6, 4.2 - k, C.B.z + 7), new THREE.Vector3(0, 1.0, C.GZ + 4), 36);
    else S.look(new THREE.Vector3(14 - 2 * k, 2.4, mz + 1), new THREE.Vector3(0, 1.2, mz - 0.5), 38);
    const fmt = (s) => s.replace("{h}", V(sampleAt(C.P.flight, tt).p).y.toFixed(1)); return O.head(p.head) + (p.labels || []).map((l) => O.read({ ...l, title: fmt(l.title) })).join(""); },
};
