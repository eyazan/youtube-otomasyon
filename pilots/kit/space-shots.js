// Engineering / spaceflight shot library. World from D.setup: vehicles (dimensioned specs), the setting (orbit or
// launch) and a motion model (roll profile, ascent). Shot text and numbers come from the plan; nothing topic-specific here.
import * as THREE from "three";
import { clamp, ease, lerp, V, O } from "./core.js";
import { stars, earth, sky, vehicle, jet, puff, reentryGlow, breakup, fireball, smokeTrail } from "./space.js";

const deg = (x) => x * Math.PI / 180;

export function buildWorld(S, D) {
  const { scene } = S; const st = D.setup;
  scene.add(new THREE.HemisphereLight(0x6f9ad6, 0x05070a, 0.35));
  const sun = new THREE.DirectionalLight(0xfff6e8, 3.0); sun.position.set(-40, 25, 30); scene.add(sun);
  const env = st.setting === "launch" ? { sky: sky(scene) } : { stars: stars(scene), earth: earth(scene) };
  const V1 = vehicle(scene, st.vehicles.main); const V2 = st.vehicles.target ? vehicle(scene, st.vehicles.target) : null;
  // thrusters on the main vehicle: the faulty one (index st.fault.thruster) and a ring of nose RCS puffs
  const jets = (st.thrusters || []).map((th) => { const j = jet(V1.body, th.color ? +th.color : 0xffa060); j.userData = th; return j; });
  const rcs = (st.rcs ? Array.from({ length: st.rcs.count }, (_, i) => { const ring = i % 2; const a = Math.floor(i / 2) / (st.rcs.count / 2) * Math.PI * 2 + ring * 0.39;
    const pz = puff(V1.body); pz.userData = { x: st.rcs.x + ring * 0.25, r: st.rcs.r, a, ring }; return pz; }) : []);
  const engines = (st.engines || []).map((e) => { const j = jet(V1.body, 0xffc890); j.userData = e; return j; }); // main engine / booster exhaust
  const glow = reentryGlow(scene); const fire = fireball(scene); const smoke = smokeTrail(scene, 40);
  const reset = () => { V1.position.set(0, 0, 0); V1.rotation.set(0, 0, 0); V1.body.rotation.set(0, 0, 0); V1.visible = true; if (V2) { V2.visible = true; V2.position.set(V1.length - (st.dockOverlap || 0.5), 0, 0); V2.rotation.set(0, 0, 0); }
    jets.forEach((j) => { j.visible = false; }); rcs.forEach((r) => { r.visible = false; }); engines.forEach((e) => { e.visible = false; }); glow.visible = false; fire.visible = false; smoke.hide();
    // undo per-shot changes (dropped adapter, breakup) so every frame is rendered from the same starting state
    V1.body.traverse((o) => { if (o.userData.home) { o.position.copy(o.userData.home.p); o.quaternion.copy(o.userData.home.q); } if (o.userData.y0 != null) o.position.y = o.userData.y0; if (o.isMesh) o.visible = true; }); };
  const fireJet = (j, strength = 1, t = 0) => { const th = j.userData; j.visible = true; j.set(new THREE.Vector3(...th.at), new THREE.Vector3(...th.dir), th.len || 1.4, th.width || 0.35, strength, t); };
  const fireRcs = (on, t) => rcs.forEach((r, i) => { const u = r.userData; r.visible = on && (i % 2 === 0); const tan = new THREE.Vector3(0, -Math.sin(u.a), Math.cos(u.a)).multiplyScalar(u.ring ? 1 : -1);
    r.position.set(u.x, u.r * Math.cos(u.a), u.r * Math.sin(u.a)).addScaledVector(tan, 0.22); const sz = 0.5 * (1 + 0.1 * Math.sin(t * 37 + i)); r.scale.set(sz, sz, 1); });
  // the motion model: roll rate profile (deg/s) and its angle (deg) by phase time; tumble adds the reported pitch/yaw wobble
  const tumble = (t, amt) => { V1.rotation.z = amt * 0.22 * Math.sin(t * 2.1); V1.rotation.y = amt * 0.18 * Math.sin(t * 1.7 + 1); };
  return { st, V1, V2, jets, rcs, engines, glow, fire, smoke, env, reset, fireJet, fireRcs, tumble, M: D.model };
}

// behind a data card in the launch setting: the rocket keeps climbing in the lower third (illustrative ascent, as launch-ascent)
const ALT = (s) => 4 * s * s;
function backdrop(S, C, t, p) { const tf = (p.t0 ?? 30) + (t - S.shotStart) * 0.8; const P = new THREE.Vector3(0, ALT(tf), 0); C.V1.rotation.z = Math.PI / 2; C.V1.position.copy(P);
  C.engines.forEach((e) => C.fireJet(e, 1, t)); C.smoke.set((s) => new THREE.Vector3(0, ALT(s) - 2, 0), tf, 6); C.env.sky.setAltitude(clamp(ALT(tf) / 16000));
  const a = 0.6 + 0.12 * (t - S.shotStart); // slow orbit keeps the backdrop moving
  S.look(P.clone().add(new THREE.Vector3(200 * Math.sin(a), 40, 200 * Math.cos(a))), P.clone().add(new THREE.Vector3(0, 58, 0)), 40); }

const labels = (list) => (list || []).map((l) => O.read(l)).join("");
const mid = (C) => new THREE.Vector3((C.V1.length + (C.V2 ? C.V2.length : 0)) * 0.45, 0, 0);

export const SHOTS = {
  // the vehicle at the reported peak rate about its long axis, the faulty thruster firing, Earth below
  "hero-spin": (S, C, k, t, p) => { if (C.V2) C.V2.visible = false; C.V1.body.rotation.x = deg(p.rate) * t; C.tumble(t, p.tumble ?? 1); C.jets.forEach((j) => C.fireJet(j, 1, t));
    const L = C.V1.length; S.look(new THREE.Vector3(-11 + k * 2, 9.5, 19).multiplyScalar(L / 4.2), new THREE.Vector3(L * 0.45, -2.2 * L / 4.2, 0), 32, -0.6); return O.head(p.head) + O.sub(p.sub) + labels(p.labels); },
  // the rate climbing to the peak; gauge
  "rate-climb": (S, C, k, t, p) => { if (C.V2) C.V2.visible = false; const dt = t - S.shotStart; C.V1.body.rotation.x = deg(p.from * dt + (p.to - p.from) * dt * k * 0.5); C.tumble(t, 1); C.jets.forEach((j) => C.fireJet(j, 1, t));
    S.look(new THREE.Vector3(-12 + k, 3.0, 10), new THREE.Vector3(2.8, 0.6, 0), 34, -0.5); return O.head(p.head) + O.gauge({ value: lerp(p.from, p.to, ease(k)), max: p.max, label: p.gaugeLabel, note: p.note, mark: p.mark, unit: "°/s" }); },
  // two vehicles docked, stable, corner-to-corner composition
  "docked-pair": (S, C, k, t, p) => { const a = lerp(-0.4, 0.25, ease(k)); const m = mid(C); S.look(new THREE.Vector3(m.x + 30 * Math.sin(a), 8, 30 * Math.cos(a)), m, 34, -0.75); return O.head(p.head) + O.sub(p.sub) + labels(p.labels); },
  // close on the faulty thruster as the docked pair begins to roll
  "thruster-close": (S, C, k, t, p) => { const ang = deg(0.5 * (p.rateEnd || 0) / (p.span || 1) * (k * (p.span || 1)) ** 2); C.V1.body.rotation.x = ang; if (C.V2) C.V2.rotation.x = ang; C.jets.forEach((j) => C.fireJet(j, 1, t));
    // the camera rides with the roll so the thruster stays framed; Earth and stars sweeping past show the spin
    const th = C.st.thrusters[0].at; C.V1.updateMatrixWorld(true); const b = C.V1.body;
    const tgt = b.localToWorld(new THREE.Vector3(th[0] - 0.4, th[1] + 0.2, th[2] + 1.8)); S.look(b.localToWorld(new THREE.Vector3(th[0] + 4.2 - 1.2 * k, th[1] + 1.8, th[2] + 9.5)), tgt, 42);
    S.cam.up.set(0, Math.cos(ang), Math.sin(ang)); S.cam.lookAt(tgt); S.cam.updateMatrixWorld(); return O.head(p.head) + labels(p.labels); },
  // separation: the target drifts off, the main vehicle rolls faster (same torque, less inertia)
  "separation": (S, C, k, t, p) => { const sep = ease(clamp(k * 1.6)) * 6; if (C.V2) { C.V2.position.x = C.V1.length - (C.st.dockOverlap || 0.5) + sep; C.V2.rotation.x = deg(p.from * 0.4) * (t - S.shotStart); }
    C.V1.body.rotation.x = deg(p.from) * (t - S.shotStart) + deg(p.to - p.from) * (t - S.shotStart) * ease(k) * 0.5; C.jets.forEach((j) => C.fireJet(j, 1, t)); C.tumble(t, ease(k));
    S.look(new THREE.Vector3(C.V1.length * 0.5 + sep * 0.5, 9, 30 + 3 * k), new THREE.Vector3(C.V1.length * 0.55 + sep * 0.5, 0, 0), 34, -0.75);
    return O.head(p.head) + O.sub(p.sub) + O.gauge({ value: lerp(p.from, p.to, ease(k)), max: p.max, label: p.gaugeLabel, note: p.note, mark: p.mark, unit: "°/s" }); },
  // nose RCS fires against the roll; the rate falls to zero
  "rcs-recovery": (S, C, k, t, p) => { if (C.V2) C.V2.visible = false; const dt = t - S.shotStart; C.V1.body.rotation.x = deg(p.from * dt - 0.5 * p.from * dt * ease(k)); C.tumble(t, 1 - ease(k)); C.fireRcs(k < 0.9, t);
    S.look(new THREE.Vector3(11 - k, 2.6, 7.5), new THREE.Vector3(3.6, 0.2, 0), 34); return O.head(p.head) + O.sub(p.sub) + O.gauge({ value: p.from * (1 - ease(k)), max: p.max, label: p.gaugeLabel, note: p.note, unit: "°/s" }); },
  // re-entry: the adapter drops away, the re-entry module turns heat shield first, the plasma glow builds
  "reentry": (S, C, k, t, p) => { if (C.V2) C.V2.visible = false; const drop = ease(clamp(k * 2)); const cut = p.adapterLength || 0;
    C.V1.body.children.forEach((c) => { if (c.position.x < cut) { c.visible = drop < 0.98; c.position.y = (c.userData.y0 ??= c.position.y) - drop * 3; } });
    const turn = ease(clamp((k - 0.3) / 0.4)); C.V1.rotation.z = lerp(0, Math.PI, turn); // heat shield (aft end) forward
    const fwd = new THREE.Vector3(-1, 0, 0).applyEuler(C.V1.rotation); const shield = new THREE.Vector3(cut, 0, 0).applyEuler(C.V1.rotation);
    C.glow.visible = k > 0.55; C.glow.set(shield.addScaledVector(fwd, 0.6), fwd, 2.6, ease(clamp((k - 0.55) / 0.35)), t);
    S.look(new THREE.Vector3(-12 + 4 * k, 5 - 2 * k, 14), new THREE.Vector3(cut + 1.5, -1, 0), 34); return O.head(p.head) + O.sub(p.sub) + labels(p.labels); },
  // fault-isolation schematic: one switch per thruster; the shorted one stays on until its circuit is isolated
  "fault-circuit": (S, C, k, t, p) => { if (C.V2) C.V2.visible = false; C.V1.body.rotation.x = deg(30) * (t - S.shotStart);
    if (C.env.sky) backdrop(S, C, t, p); // launch setting: the climbing rocket below the card
    else S.look(new THREE.Vector3(-14 + 6 * k, 5 + 2 * k, 16 - 2 * k), new THREE.Vector3(2.4, -3 + k, 0), 32);
    // mode "isolate": the faulty unit is switched out after mid-shot; mode "cascade": the fault spreads to every unit (common cause)
    const n = p.count || 8, bad = (p.faulty || n) - 1, iso = k > 0.45, cascade = p.mode === "cascade"; const cells = Array.from({ length: n }, (_, i) => { const on = cascade ? i === bad || iso : i === bad && !iso; const isolated = !cascade && i === bad && iso;
      return `<div style="flex:1;text-align:center"><div style="height:120px;margin:0 6px;border-radius:12px;background:${on ? "#ff6b4a" : isolated ? "#1a2230" : "#22303f"};border:3px solid ${isolated ? "#5fe1ff" : on ? "#ffb39f" : "#3a4a5e"};position:relative">
        ${on ? `<div style="position:absolute;inset:-14px;border-radius:18px;box-shadow:0 0 ${(20 + 10 * Math.sin(t * 12)).toFixed(0)}px #ff6b4a"></div>` : ""}</div>
        <div style="font:700 26px Inter;margin-top:10px;color:${i === bad ? "#fff" : "#9fb0c6"}">${i + 1}</div></div>`; }).join("");
    return O.head(p.head) + `<div class="card dark" style="top:640px;opacity:${clamp(k * 5).toFixed(3)}"><div class="k">${p.k}</div><h3>${iso ? p.after : p.before}</h3><div style="display:flex;margin-top:18px">${cells}</div>
      <div class="row" style="margin-top:20px"><span class="dot" style="background:${iso && !cascade ? "#5fe1ff" : "#ff6b4a"}"></span>${iso ? p.afterNote : p.beforeNote}</div></div>`; },
  // launch and ascent: engines and boosters firing, smoke trail, the camera tracks up through the sky
  "launch-ascent": (S, C, k, t, p) => { const T0 = p.t0 ?? 0; const tf = T0 + (t - S.shotStart) * (p.timeScale || 1); const alt = (s) => 4 * s * s; // illustrative ascent
    const pos = (s) => new THREE.Vector3(0, alt(s), 0); C.V1.rotation.z = Math.PI / 2; C.V1.position.copy(pos(tf));
    C.engines.forEach((e) => C.fireJet(e, 1, t)); C.smoke.set((s) => pos(s).add(new THREE.Vector3(0, -2, 0)), tf, 6); if (C.env.sky) C.env.sky.setAltitude(clamp(alt(tf) / 16000));
    const P = C.V1.position; S.look(P.clone().add(new THREE.Vector3(60 - 20 * k, -18 + 10 * k, 70)), P.clone().add(new THREE.Vector3(0, 15, 0)), 38);
    return O.head(p.head) + O.sub(p.sub) + labels(p.labels) + (p.clock ? O.read({ x: 60, y: 1180, title: `T+${(p.clockFrom + k * (p.clockTo - p.clockFrom)).toFixed(0)} s`, small: p.clock }) : ""); },
  // the nozzles swing to their limits, the vehicle pitches over, breaks up and explodes (sequence REPRESENTATIVE)
  "veer-breakup": (S, C, k, t, p) => { const base = new THREE.Vector3(0, 4 * (p.t0 || 37) ** 2, 0); C.V1.position.copy(base); const pitch = ease(clamp(k / 0.4)) * deg(p.maxPitch || 60);
    C.V1.rotation.z = Math.PI / 2 - pitch; C.engines.forEach((e) => C.fireJet(e, k < 0.55 ? 1 : 0, t));
    const bu = clamp((k - 0.4) / 0.35); if (bu > 0) breakup(C.V1, bu); C.fire.visible = k > 0.62; C.fire.set(base.clone().add(new THREE.Vector3(10, 22, 0)), clamp((k - 0.62) / 0.38));
    S.look(base.clone().add(new THREE.Vector3(80, -25, 95)), base.clone().add(new THREE.Vector3(5, 18, 0)), 38);
    return O.head(p.head) + O.sub(p.sub) + labels(p.labels); },
  // data card: a value that does not fit its register (bit boxes fill, then overflow)
  "data-overflow": (S, C, k, t, p) => { if (C.env.sky) backdrop(S, C, t, p); else { C.V1.visible = false; S.look(new THREE.Vector3(0, 300, 400), new THREE.Vector3(0, 500, 0), 40); }
    const bits = p.bits || 16, fill = Math.min(bits + 4, Math.floor(ease(k) * (bits + 4)));
    const box = (i) => `<div style="width:${(860 / bits - 6).toFixed(0)}px;height:56px;margin:3px;border-radius:6px;background:${i < fill ? (i < bits ? "#5fe1ff" : "#ff6b4a") : "#1a2230"}"></div>`;
    const over = fill > bits;
    return O.head(p.head) + `<div class="card dark" style="top:600px"><div class="k">${p.k}</div><h3>${over ? p.overflowTitle : p.title}</h3>
      <div style="display:flex;flex-wrap:wrap;margin:18px 0">${Array.from({ length: bits }, (_, i) => box(i)).join("")}</div>
      <div style="display:flex;flex-wrap:wrap">${over ? Array.from({ length: fill - bits }, (_, i) => box(bits + i)).join("") : ""}</div>
      <p style="margin-top:14px">${over ? p.overflowNote : p.note}</p></div>`; },
};
