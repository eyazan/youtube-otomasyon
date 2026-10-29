"use strict";
// Free-kick flight model for the GoalLore Lab Magnus pilot (review only, never published).
//
// Physics (SI units):
//   gravity, quadratic drag  F_d = -1/2 rho Cd A |v| v
//   Magnus lift              F_m =  1/2 rho A r (omega x v)   (lift coefficient proportional to the spin ratio
//                            S = r|omega|/|v|, so the lift grows with omega*|v|, not |v|^2)
// With spin nearly constant and drag slowing the ball, the turning radius R = m|v| / (1/2 rho A r |omega|) shrinks as
// the ball slows: the path tightens into a spiral. This is the mechanism of Dupeux, Le Goff, Quere & Clanet,
// "The spinning ball spiral", New J. Phys. 12, 093004 (2010).
//
// The 1997 kick was never instrumented. Launch speed, spin and angles below are ILLUSTRATIVE values chosen to
// reproduce the reported shape (around the wall, heading wide, bending in late). Every on-screen value from this
// model carries the MODEL label; none is presented as a measurement.
const BALL = { m: 0.43, r: 0.11 };                      // FIFA size-5 ball: 410-450 g, circumference 68-70 cm
const AIR = { rho: 1.2, Cd: 0.25 };                     // sea-level air; Cd after the drag crisis (Dupeux et al. range)
const A = Math.PI * BALL.r * BALL.r;
const G = 9.81;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function accel(v, omega, gravity = true) {
  const s = len(v);
  const drag = mul(v, -0.5 * AIR.rho * AIR.Cd * A * s / BALL.m);
  const magnus = mul(cross(omega, v), 0.5 * AIR.rho * A * BALL.r / BALL.m);
  return add(add(drag, magnus), gravity ? [0, -G, 0] : [0, 0, 0]);
}

// RK4 integration; returns samples every dt with position, velocity, forces and turning radius
function fly({ p0, v0, omega, dt = 1 / 600, tMax = 3, stop = null, gravity = true }) {
  let p = p0.slice(), v = v0.slice(), t = 0; const out = [];
  const sample = () => { const s = len(v); const fm = mul(cross(omega, v), 0.5 * AIR.rho * A * BALL.r);
    const R = BALL.m * s / (0.5 * AIR.rho * A * BALL.r * len(omega));
    out.push({ t, p: p.slice(), v: v.slice(), speed: s, magnus: fm, drag: mul(v, -0.5 * AIR.rho * AIR.Cd * A * s), radius: R }); };
  sample();
  while (t < tMax) {
    const k1v = accel(v, omega, gravity), k1p = v;
    const k2v = accel(add(v, mul(k1v, dt / 2)), omega, gravity), k2p = add(v, mul(k1v, dt / 2));
    const k3v = accel(add(v, mul(k2v, dt / 2)), omega, gravity), k3p = add(v, mul(k2v, dt / 2));
    const k4v = accel(add(v, mul(k3v, dt)), omega, gravity), k4p = add(v, mul(k3v, dt));
    v = add(v, mul(add(add(k1v, mul(k2v, 2)), add(mul(k3v, 2), k4v)), dt / 6));
    p = add(p, mul(add(add(k1p, mul(k2p, 2)), add(mul(k3p, 2), k4p)), dt / 6));
    t += dt; sample();
    if (stop && stop(p, v)) break;
  }
  return out;
}

// The illustrative kick: ball 35 m from the goal line (reports range from about 33 m to 40 yards), launched to the
// right of the wall; the yaw and elevation are solved so the model ball crosses the goal line inside the right post
// at crossbar-safe height. Spin axis vertical: omega along +y pushes the ball toward -x (to the left).
const SETUP = { distance: 35, ballX: 4.5, target: { x: 3.0, y: 1.35 }, speed: 38, spinRps: 10 };

function kick(setup = SETUP) {
  const omega = [0, 2 * Math.PI * setup.spinRps, 0]; const p0 = [setup.ballX, BALL.r, 0];
  const atLine = (yaw, pitch) => { const v0 = [Math.sin(yaw) * Math.cos(pitch) * setup.speed, Math.sin(pitch) * setup.speed, -Math.cos(yaw) * Math.cos(pitch) * setup.speed];
    const s = fly({ p0, v0, omega, stop: (p) => p[2] <= -setup.distance }); return { s, v0, end: s[s.length - 1].p }; };
  // two-dimensional Newton iteration on (yaw, pitch) with finite differences
  let yaw = 0.2, pitch = 0.12;
  for (let k = 0; k < 40; k += 1) {
    const r = atLine(yaw, pitch); const ex = r.end[0] - setup.target.x, ey = r.end[1] - setup.target.y;
    if (Math.abs(ex) < 1e-4 && Math.abs(ey) < 1e-4) break;
    const h = 1e-5; const ry = atLine(yaw + h, pitch), rp = atLine(yaw, pitch + h);
    const a = (ry.end[0] - r.end[0]) / h, b = (rp.end[0] - r.end[0]) / h, c = (ry.end[1] - r.end[1]) / h, d = (rp.end[1] - r.end[1]) / h;
    const det = a * d - b * c; yaw -= (d * ex - b * ey) / det; pitch -= (-c * ex + a * ey) / det;
  }
  const flight = atLine(yaw, pitch);
  // the same launch with no spin: where the ball was heading
  const straight = fly({ p0, v0: flight.v0, omega: [0, 0, 0], stop: (p) => p[2] <= -setup.distance });
  // the spiral: the same ball if it kept flying in a horizontal plane (gravity off) for 12 s
  const spiral = fly({ p0, v0: [flight.v0[0], 0, flight.v0[2]], omega, gravity: false, tMax: 12 });
  return { setup, yaw, pitch, omega, flight: flight.s, straight, spiral, constants: { ...BALL, ...AIR, A } };
}

module.exports = { fly, kick, SETUP, BALL, AIR };

if (require.main === module) {
  const k = kick(); const f = k.flight; const last = f[f.length - 1];
  console.log(JSON.stringify({ yawDeg: +(k.yaw * 180 / Math.PI).toFixed(2), pitchDeg: +(k.pitch * 180 / Math.PI).toFixed(2), flightTime: +last.t.toFixed(3),
    end: last.p.map((x) => +x.toFixed(2)), speedStart: +f[0].speed.toFixed(1), speedEnd: +last.speed.toFixed(1), radiusStart: +f[0].radius.toFixed(1), radiusEnd: +last.radius.toFixed(1),
    straightEndX: +k.straight[k.straight.length - 1].p[0].toFixed(2), maxHeight: +Math.max(...f.map((s) => s.p[1])).toFixed(2),
    wallX: +f.find((s) => s.p[2] <= -9.15).p[0].toFixed(2), wallY: +f.find((s) => s.p[2] <= -9.15).p[1].toFixed(2) }, null, 1));
}
