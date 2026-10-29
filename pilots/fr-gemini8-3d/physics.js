"use strict";
// Roll-rate model for the Failure Reconstructed Gemini 8 pilot (review only, never published).
//
// Reported (NASA Gemini VIII mission page; Gemini 8 mission reports as summarised by Wikipedia):
//   - 16 March 1966, docked to the Agena Target Vehicle (GATV-8) in orbit
//   - OAMS roll thruster No. 8 shorted and kept firing; the docked pair began to roll
//   - after undocking, Gemini alone rolled faster, reaching about 296 deg/s (close to one turn per second)
//   - Armstrong shut the OAMS down and used the nose Re-entry Control System (RCS) to stop the roll; about 75% of the
//     RCS propellant was used, so mission rules required an early landing
//
// Reported motion after undocking: Gemini "rolled, pitched and yawed even more rapidly" (NASA history), the roll reaching
// about one rotation per second. This model treats only the roll; the scene adds a labelled pitch/yaw wobble.
//
// Model (ILLUSTRATIVE, labelled MODEL on screen): one constant roll torque from the stuck thruster; roll rate grows as
// omega(t) = tau * t / I. The same torque turns a smaller moment of inertia faster, which is why undocking made it worse.
//   tau = thrust x lever arm. Thrust: OAMS attitude thrusters were 25 lbf (~111 N), eight of them around the aft end of
//   the adapter (NASA artifact listing; Wikipedia, Orbit Attitude and Maneuvering System). Lever arm: the adapter base
//   radius, 1.525 m (ASSUMPTION: a tangential thruster at the rim).
// Inertias are rough solid-body estimates from published masses and diameters, NOT measured values:
//   Gemini spacecraft  ~3,790 kg, adapter base 3.05 m, re-entry module 2.3 m: I_roll ~ 0.35 m R^2 (tapered shell)
//   Agena target       ~3,175 kg (Mark Wade / astronautix), cylinder 1.52 m:  I_roll ~ 0.5 m r^2
// The two phase durations are equal and solved so the undocked phase ends at the reported ~296 deg/s; they are not a
// reconstruction of the flight timeline (exact times are not used anywhere on screen).
const GEMINI = { mass: 3790, radius: 3.05 / 2 }; const AGENA = { mass: 3175, radius: 1.52 / 2 };
const I_GEMINI = 0.35 * GEMINI.mass * GEMINI.radius ** 2;       // kg m^2
const I_AGENA = 0.5 * AGENA.mass * AGENA.radius ** 2;
const I_DOCKED = I_GEMINI + I_AGENA;                            // coaxial: roll inertias add
const REPORTED_PEAK = 296;                                      // deg/s, reported
const THRUST = 25 * 4.44822, LEVER = 3.05 / 2; const TAU = THRUST * LEVER;   // N, m, N m

function profile() {
  // equal phases t: omega_end = tau t (1 / I_d + 1 / I_g) = reported peak
  const tau = TAU; const peakRad = REPORTED_PEAK * Math.PI / 180;
  const docked = peakRad / (tau * (1 / I_DOCKED + 1 / I_GEMINI)); const tU = docked;
  const atUndock = tau * docked / I_DOCKED;
  const rate = (t) => (t <= docked ? tau * t / I_DOCKED : atUndock + tau * (t - docked) / I_GEMINI) * 180 / Math.PI; // deg/s
  const angle = (t) => (t <= docked ? 0.5 * tau * t * t / I_DOCKED : 0.5 * tau * docked * docked / I_DOCKED + atUndock * (t - docked) + 0.5 * tau * (t - docked) ** 2 / I_GEMINI) * 180 / Math.PI;
  return { tau, thrust: THRUST, lever: LEVER, I: { gemini: I_GEMINI, agena: I_AGENA, docked: I_DOCKED }, docked, undocked: tU, rateAtUndock: atUndock * 180 / Math.PI, peak: REPORTED_PEAK, rate, angle,
    ratio: I_DOCKED / I_GEMINI };
}

module.exports = { profile, GEMINI, AGENA, REPORTED_PEAK };
if (require.main === module) { const p = profile();
  console.log(JSON.stringify({ thrustN: +p.thrust.toFixed(0), leverM: p.lever, tauNm: +p.tau.toFixed(1), phaseSeconds: +p.docked.toFixed(1), I: Object.fromEntries(Object.entries(p.I).map(([k, v]) => [k, Math.round(v)])), inertiaRatio: +p.ratio.toFixed(2),
    rateAtUndockDegS: +p.rateAtUndock.toFixed(1), peakDegS: p.peak, checkPeak: +p.rate(p.docked + p.undocked).toFixed(1) }, null, 1)); }
