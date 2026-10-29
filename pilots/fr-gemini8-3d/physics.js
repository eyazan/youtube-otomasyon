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
// Model (ILLUSTRATIVE, labelled MODEL on screen): one constant roll torque tau from the stuck thruster; roll rate grows as
// omega(t) = tau * t / I. The same torque turns a smaller moment of inertia faster, which is why undocking made it worse.
// Inertias are rough solid-body estimates from published masses and diameters, NOT measured values:
//   Gemini spacecraft  ~3,790 kg, adapter base 3.05 m, re-entry module 2.3 m: I_roll ~ 0.35 m R^2 (tapered shell)
//   Agena target       ~3,175 kg (Mark Wade / astronautix), cylinder 1.52 m:  I_roll ~ 0.5 m r^2
// Durations are chosen so the docked phase ends well below the undocked rate and the undocked phase ends at the
// reported ~296 deg/s; they are not a reconstruction of the flight timeline.
const GEMINI = { mass: 3790, radius: 3.05 / 2 }; const AGENA = { mass: 3175, radius: 1.52 / 2 };
const I_GEMINI = 0.35 * GEMINI.mass * GEMINI.radius ** 2;       // kg m^2
const I_AGENA = 0.5 * AGENA.mass * AGENA.radius ** 2;
const I_DOCKED = I_GEMINI + I_AGENA;                            // coaxial: roll inertias add
const REPORTED_PEAK = 296;                                      // deg/s, reported

function profile({ docked = 30, undocked = null } = {}) {
  // pick tau so that docked + undocked phases end at the reported peak; undocked duration defaults to the docked one
  const tU = undocked == null ? docked : undocked;
  const peakRad = REPORTED_PEAK * Math.PI / 180;
  const tau = peakRad / (docked / I_DOCKED + tU / I_GEMINI);           // omega_end = tau (t_d / I_d + t_u / I_g)
  const atUndock = tau * docked / I_DOCKED;
  const rate = (t) => (t <= docked ? tau * t / I_DOCKED : atUndock + tau * (t - docked) / I_GEMINI) * 180 / Math.PI; // deg/s
  const angle = (t) => (t <= docked ? 0.5 * tau * t * t / I_DOCKED : 0.5 * tau * docked * docked / I_DOCKED + atUndock * (t - docked) + 0.5 * tau * (t - docked) ** 2 / I_GEMINI) * 180 / Math.PI;
  return { tau, I: { gemini: I_GEMINI, agena: I_AGENA, docked: I_DOCKED }, docked, undocked: tU, rateAtUndock: atUndock * 180 / Math.PI, peak: REPORTED_PEAK, rate, angle,
    ratio: I_DOCKED / I_GEMINI };
}

module.exports = { profile, GEMINI, AGENA, REPORTED_PEAK };
if (require.main === module) { const p = profile();
  console.log(JSON.stringify({ tauNm: +p.tau.toFixed(1), I: Object.fromEntries(Object.entries(p.I).map(([k, v]) => [k, Math.round(v)])), inertiaRatio: +p.ratio.toFixed(2),
    rateAtUndockDegS: +p.rateAtUndock.toFixed(1), peakDegS: p.peak, checkPeak: +p.rate(p.docked + p.undocked).toFixed(1) }, null, 1)); }
