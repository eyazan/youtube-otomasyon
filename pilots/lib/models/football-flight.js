"use strict";
// Generic ball-flight model for the football pilots (review only). SI units; RK4.
//   gravity; quadratic drag F_d = -1/2 rho Cd A |v| v; Magnus F_m = 1/2 rho A r (omega x v)
// (Dupeux, Le Goff, Quere & Clanet, "The spinning ball spiral", New J. Phys. 12, 093004, 2010)
// Launch speed, spin and the aim point are ILLUSTRATIVE inputs chosen by the planner from the topic's evidence; the
// launch angles are SOLVED so the model ball reaches the aim point. Nothing here is a measurement of a real kick.
const BALL = { m: 0.43, r: 0.11 }; const AIR = { rho: 1.2, Cd: 0.25 }; const A = Math.PI * BALL.r * BALL.r; const G = 9.81;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], len = (a) => Math.hypot(a[0], a[1], a[2]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const accel0 = (v, w, g = true) => add(add(mul(v, -0.5 * AIR.rho * AIR.Cd * A * len(v) / BALL.m), mul(cross(w, v), 0.5 * AIR.rho * A * BALL.r / BALL.m)), g ? [0, -G, 0] : [0, 0, 0]);
// optional side force for a non-spinning ball (knuckle effect): F = 1/2 rho A |v|^2 C(t) along x, C(t) = amp sin(2 pi f t + phase).
// ILLUSTRATIVE: the fluctuating side force of a low-spin ball is real (unsteady wake), its amplitude and frequency here are not measured.
let EXTRA = null;
const accel = (v, w, g = true, t = 0) => { const a0 = accel0(v, w, g); if (!EXTRA) return a0; const q = 0.5 * AIR.rho * A * (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) / BALL.m;
  return add(a0, [q * EXTRA.amp * Math.sin(2 * Math.PI * EXTRA.freq * t + (EXTRA.phase || 0)), 0, 0]); };
function fly({ p0, v0, omega, dt = 1 / 600, tMax = 3, stop = null, gravity = true }) {
  let p = p0.slice(), v = v0.slice(), t = 0; const out = []; const wl = len(omega);
  const sample = () => { const s = len(v); out.push({ t, p: p.slice(), v: v.slice(), speed: s, magnus: mul(cross(omega, v), 0.5 * AIR.rho * A * BALL.r), drag: mul(v, -0.5 * AIR.rho * AIR.Cd * A * s), radius: wl ? BALL.m * s / (0.5 * AIR.rho * A * BALL.r * wl) : Infinity }); };
  sample();
  while (t < tMax) { const k1v = accel(v, omega, gravity, t), k1p = v, k2v = accel(add(v, mul(k1v, dt / 2)), omega, gravity, t + dt / 2), k2p = add(v, mul(k1v, dt / 2));
    const k3v = accel(add(v, mul(k2v, dt / 2)), omega, gravity, t + dt / 2), k3p = add(v, mul(k2v, dt / 2)), k4v = accel(add(v, mul(k3v, dt)), omega, gravity, t + dt), k4p = add(v, mul(k3v, dt));
    v = add(v, mul(add(add(k1v, mul(k2v, 2)), add(mul(k3v, 2), k4v)), dt / 6)); p = add(p, mul(add(add(k1p, mul(k2p, 2)), add(mul(k3p, 2), k4p)), dt / 6)); t += dt; sample();
    if (stop && stop(p, v)) break; }
  return out;
}
// kick({ ballStart, goalZ, aim: {x,y}, speed, spinRps, spinSign, pitchGuess }) -> { flight, straight, spiral, yaw, pitch }
function kick({ ballStart = [0, BALL.r, 0], goalZ, aim, speed, spinRps = 0, spinSign = 1, pitchGuess = 0.12, yawGuess = 0.0, spiralSeconds = 0, knuckle = null }) {
  EXTRA = knuckle; try { return kick0({ ballStart, goalZ, aim, speed, spinRps, spinSign, pitchGuess, yawGuess, spiralSeconds }); } finally { EXTRA = null; } }
function kick0({ ballStart, goalZ, aim, speed, spinRps, spinSign, pitchGuess, yawGuess, spiralSeconds }) {
  const omega = [0, spinSign * 2 * Math.PI * spinRps, 0]; const p0 = ballStart.slice(); p0[1] = BALL.r;
  const atLine = (yaw, pitch) => { const v0 = [Math.sin(yaw) * Math.cos(pitch) * speed, Math.sin(pitch) * speed, -Math.cos(yaw) * Math.cos(pitch) * speed];
    const s = fly({ p0, v0, omega, stop: (p) => p[2] <= goalZ || p[1] < 0 }); return { s, v0, end: s[s.length - 1].p }; };
  let yaw = yawGuess, pitch = pitchGuess;
  for (let i = 0; i < 50; i += 1) { const r = atLine(yaw, pitch); const ex = r.end[0] - aim.x, ey = r.end[1] - aim.y; if (Math.abs(ex) < 1e-4 && Math.abs(ey) < 1e-4) break;
    const h = 1e-5, ry = atLine(yaw + h, pitch), rp = atLine(yaw, pitch + h); const a = (ry.end[0] - r.end[0]) / h, b = (rp.end[0] - r.end[0]) / h, c = (ry.end[1] - r.end[1]) / h, d = (rp.end[1] - r.end[1]) / h;
    const det = a * d - b * c; yaw -= (d * ex - b * ey) / det; pitch -= (-c * ex + a * ey) / det; }
  const f = atLine(yaw, pitch); const end = f.end; if (Math.abs(end[0] - aim.x) > 0.01 || Math.abs(end[1] - aim.y) > 0.01) throw new Error(`kick solver did not converge (end ${end.map((x) => x.toFixed(2))})`);
  const straight = spinRps ? fly({ p0, v0: f.v0, omega: [0, 0, 0], stop: (p) => p[2] <= goalZ }) : null;
  const spiral = spiralSeconds ? fly({ p0, v0: [f.v0[0], 0, f.v0[2]], omega, gravity: false, tMax: spiralSeconds }) : null;
  return { flight: f.s, straight, spiral, yaw, pitch, v0: f.v0, constants: { ...BALL, ...AIR } };
}
const thin = (a, n) => (a ? a.filter((_, i) => i % n === 0 || i === a.length - 1) : null);
module.exports = { fly, kick, thin, BALL, AIR };
