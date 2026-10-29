"use strict";
// Generic roll-rate model for an attitude-control failure (review only): one constant torque from a stuck thruster,
// omega(t) = tau t / I. With a docked partner the roll inertias add; after undocking the same torque turns less inertia.
// Only the reported peak rate is data; torque (thrust x lever arm) and inertias (solid-body estimates) are MODEL inputs.
function profile({ thrustN, leverM, inertiaMain, inertiaPartner = 0, peakDegS }) {
  const tau = thrustN * leverM, Id = inertiaMain + inertiaPartner, Ig = inertiaMain; const peak = peakDegS * Math.PI / 180;
  const phase = peak / (tau * (1 / Id + 1 / Ig)); const atUndock = tau * phase / Id;
  return { tau, I: { main: Ig, partner: inertiaPartner, docked: Id }, phase, rateAtUndock: atUndock * 180 / Math.PI, peak: peakDegS, ratio: Id / Ig };
}
// rough roll inertias: tapered shell ~0.35 m R^2, solid cylinder 0.5 m r^2
const shell = (m, R) => 0.35 * m * R * R, cylinder = (m, r) => 0.5 * m * r * r;
module.exports = { profile, shell, cylinder };
