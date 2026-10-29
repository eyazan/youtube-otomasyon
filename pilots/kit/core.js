// Shared stage for the isolated Three.js pilots (review only): renderer, camera, overlay HTML and the label vocabulary.
// Every pilot scene is built from these modules plus a plan (pilots/lib/planner.js); no topic-specific code lives here.
import * as THREE from "three";

export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const lerp = (a, b, k) => a + (b - a) * k;
export const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
export const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// Mobile legibility floor: scientific sub-labels are 24 px (a 1080 px wide frame shown ~390 pt wide on a phone gives
// ~8.7 pt), value lines 32 px, headlines 76 px, captions 54 px. pilots/lib/qa.js checks the floor on every frame.
const CSS = `
  @font-face { font-family: Inter; src: url(/fonts/inter-latin-600-normal.woff2) format("woff2"); font-weight: 600; }
  @font-face { font-family: Inter; src: url(/fonts/inter-latin-700-normal.woff2) format("woff2"); font-weight: 700; }
  @font-face { font-family: Inter; src: url(/fonts/inter-latin-800-normal.woff2) format("woff2"); font-weight: 800; }
  html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000; font-family: Inter, sans-serif; }
  canvas { position: absolute; inset: 0; width: 1080px !important; height: 1920px !important; }
  #ui { position: absolute; inset: 0; pointer-events: none; color: #fff; }
  .vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.5) 100%); }
  .scrim { position: absolute; left: 0; right: 0; top: 0; height: 520px; background: linear-gradient(rgba(4,6,10,.82), rgba(4,6,10,.55) 60%, rgba(4,6,10,0)); }
  .scrim.low { top: auto; bottom: 0; height: 760px; background: linear-gradient(rgba(4,6,10,0), rgba(4,6,10,.55) 45%, rgba(4,6,10,.72)); }
  .brand { position: absolute; left: 64px; top: 120px; font: 800 30px Inter; letter-spacing: .08em; color: #e8f0ff; opacity: .9; }
  .chip { position: absolute; left: 64px; top: 166px; font: 700 24px Inter; letter-spacing: .12em; color: #ffd36b; background: rgba(0,0,0,.6); padding: 10px 18px; border-radius: 8px; border: 1px solid rgba(255,211,107,.5); }
  .head { position: absolute; left: 0; right: 0; top: 230px; text-align: center; font: 800 76px/1.05 Inter; letter-spacing: -.01em; text-shadow: 0 6px 30px rgba(0,0,0,.6); padding: 0 70px; }
  .sub { position: absolute; left: 0; right: 0; top: 330px; text-align: center; font: 600 32px Inter; color: #c3cfdf; letter-spacing: .05em; padding: 0 60px; }
  .cap { position: absolute; left: 90px; right: 90px; bottom: 330px; text-align: center; font: 800 54px/1.18 Inter; text-shadow: 0 4px 18px rgba(0,0,0,.85); }
  .cap b { color: var(--accent); font-weight: 800; }
  .read { position: absolute; font: 700 32px Inter; color: #fff; background: rgba(0,0,0,.66); padding: 12px 18px; border-radius: 10px; border-left: 6px solid var(--accent); white-space: nowrap; }
  .read.warm { border-left-color: #ff8a3d; } .read.cool { border-left-color: #5fe1ff; }
  .read small { display: block; font: 600 24px Inter; color: #b4c2d4; letter-spacing: .05em; margin-top: 2px; }
  .card { position: absolute; left: 90px; right: 90px; top: 660px; border-radius: 16px; padding: 30px 36px; box-shadow: 0 30px 80px rgba(0,0,0,.5); }
  .card.paper { background: rgba(240,236,226,.96); color: #1b1f27; } .card.dark { background: rgba(14,18,26,.94); border: 1px solid #2b3646; }
  .card h3 { margin: 0 0 12px; font: 800 40px/1.15 Inter; } .card p { margin: 0; font: 600 30px/1.35 Inter; }
  .card.paper p { color: #39404c; } .card.dark p { color: #c9d3e0; }
  .card .k { font: 700 24px Inter; letter-spacing: .12em; color: var(--accent2); margin-bottom: 12px; }
  .lt { position: absolute; left: 60px; right: 60px; top: 1150px; display: flex; align-items: stretch; filter: drop-shadow(0 18px 40px rgba(0,0,0,.55)); }
  .lt .bar { width: 14px; background: var(--accent); border-radius: 4px 0 0 4px; }
  .lt .body { flex: 1; background: linear-gradient(90deg, rgba(8,12,20,.94), rgba(14,20,32,.88)); padding: 20px 28px; border-radius: 0 10px 10px 0; }
  .lt .name { font: 800 46px/1.12 Inter; color: #fff; letter-spacing: -.005em; }
  .lt .src { font: 700 24px Inter; color: #9fb3c9; letter-spacing: .1em; margin-top: 8px; }
  .yr { position: absolute; left: 56px; top: 400px; font: 800 150px/1 Inter; color: rgba(255,255,255,.08); -webkit-text-stroke: 2px rgba(255,255,255,.55); letter-spacing: -.02em; }
  .gauge { position: absolute; left: 60px; right: 60px; top: 1040px; padding: 18px 24px; border-radius: 14px; background: rgba(0,0,0,.62); }
  .row { display: flex; align-items: center; gap: 18px; font: 600 30px Inter; color: #d4dce8; margin: 14px 0; }
  .dot { width: 24px; height: 24px; border-radius: 50%; flex: none; }
`;

export function createStage({ background = 0x000000, fog = null, far = 700, shadows = false, accent = "#5fe1ff", accent2 = "#ffb36b" } = {}) {
  const OPT = Object.fromEntries(new URLSearchParams(location.search));
  const style = document.createElement("style"); style.textContent = CSS + `:root { --accent: ${accent}; --accent2: ${accent2}; }`; document.head.appendChild(style);
  const ui = document.createElement("div"); ui.id = "ui"; document.body.appendChild(ui);
  const renderer = new THREE.WebGLRenderer({ antialias: OPT.aa !== "0", preserveDrawingBuffer: true });
  // 3D drawn at 75% and scaled up; overlay text stays at full 1080x1920 (measured: 293 vs 395 ms per frame)
  renderer.setPixelRatio(+(OPT.pr || 0.75)); renderer.setSize(W, H);
  renderer.shadowMap.enabled = shadows && OPT.shadow !== "0"; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(background); if (fog) scene.fog = new THREE.Fog(background, fog[0], fog[1]);
  const cam = new THREE.PerspectiveCamera(38, W / H, 0.05, far);
  // labels project with this frame's camera, not the previous one
  const look = (pos, target, fov = 38, tilt = 0) => { cam.up.set(Math.sin(tilt), Math.cos(tilt), 0); cam.position.copy(pos); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(target); cam.updateMatrixWorld(); };
  const toScreen = (p) => { const v = p.clone().project(cam); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H }; };
  return { THREE, OPT, renderer, scene, cam, look, toScreen, ui, render: () => renderer.render(scene, cam) };
}

// ---- overlay vocabulary -------------------------------------------------------------------------------------------
export const O = {
  frame: (brand) => `<div class="vig"></div><div class="scrim"></div><div class="scrim low"></div><div class="brand">${esc(brand)}</div>`,
  // long headlines step down in size so they stay on one line above the subtitle
  head: (t) => (t ? `<div class="head" style="font-size:${String(t).length <= 18 ? 76 : String(t).length <= 22 ? 64 : 56}px">${esc(t)}</div>` : ""),
  sub: (t) => (t ? `<div class="sub">${esc(t)}</div>` : ""),
  chip: (list) => (list && list.length ? `<div class="chip">${list.map(esc).join(" · ")}</div>` : ""),
  // value label: x/y in px; a label is kept inside the safe area (40..1040 x 400..1500) whatever the projection says
  read: ({ x = 60, y = 1100, title, small = "", tone = "" }) => { const cx = Math.max(60, Math.min(1040 - 22 * Math.max(String(title).length, String(small).length * 0.75) - 40, x)), cy = Math.max(400, Math.min(1480, y));
    return `<div class="read ${tone}" style="left:${cx.toFixed(0)}px;top:${cy.toFixed(0)}px">${esc(title)}${small ? `<small>${esc(small)}</small>` : ""}</div>`; },
  card: ({ kind = "dark", k = "", h = "", p = "", rows = null, opacity = 1, top = null }) => `<div class="card ${kind}" style="opacity:${opacity.toFixed(3)}${top != null ? `;top:${top}px` : ""}">${k ? `<div class="k">${esc(k)}</div>` : ""}${h ? `<h3>${esc(h)}</h3>` : ""}${p ? `<p>${esc(p)}</p>` : ""}${rows ? rows.map((r) => `<div class="row"><span class="dot" style="background:${r.color}"></span>${esc(r.text)}</div>`).join("") : ""}</div>`,
  gauge: ({ value, max, label, note = "", mark = null, unit = "" }) => { const f = clamp(value / max);
    return `<div class="gauge"><div style="font:700 26px Inter;letter-spacing:.1em;color:#b4c2d4">${esc(label)}</div>
      <div style="margin-top:14px;height:34px;border-radius:17px;background:#1a2230;position:relative;overflow:hidden"><div style="position:absolute;left:0;top:0;bottom:0;width:${(f * 100).toFixed(1)}%;background:linear-gradient(90deg,#ffb36b,#ff4a2e)"></div>
      ${mark != null ? `<div style="position:absolute;left:${(mark / max * 100).toFixed(1)}%;top:-4px;bottom:-4px;width:4px;background:#fff"></div>` : ""}</div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;font:800 44px Inter"><span>${value.toFixed(0)}${esc(unit)}</span><span style="font:600 24px Inter;color:#b4c2d4;align-self:center">${esc(note)}</span></div></div>`; },
  // broadcast lower third (name strip + source) and an outlined year, sliding in with progress f (0..1)
  lowerThird: ({ h = "", p = "", k = "" }, f = 1) => { const e = clamp(f), x = (1 - e) * -80;
    return `${k ? `<div class="yr" style="opacity:${e.toFixed(3)};transform:translateX(${(x * 0.5).toFixed(1)}px)">${esc(k)}</div>` : ""}<div class="lt" style="opacity:${e.toFixed(3)};transform:translateX(${x.toFixed(1)}px)"><div class="bar"></div><div class="body"><div class="name">${esc(h)}</div>${p ? `<div class="src">${esc(p)}</div>` : ""}</div></div>`; },
  // caption: the current narration cue, keywords highlighted
  caption: (cue, keywords) => cue ? `<div class="cap">${cue.lines.map((l) => l.split(" ").map((w) => keywords.has(w.toLowerCase().replace(/[^a-z0-9]/g, "")) ? `<b>${esc(w)}</b>` : esc(w)).join(" ")).join("<br>")}</div>` : "",
};

// shot timing from the narration cues: each plan shot names the narration line (cue text pattern) where it starts
export function timeShots(plan, cues, duration) {
  const at = (re) => { const c = cues.find((x) => new RegExp(re, "i").test(x.lines.join(" "))); if (!c) throw new Error("plan shot has no matching cue: " + re); return c.start; };
  const shots = plan.shots.map((s, i) => ({ ...s, a: i === 0 ? 0 : s.at ?? at(s.cue) })); // s.at: line start from the planner
  const end = duration || cues[cues.length - 1].end + 0.6;
  shots.forEach((s, i) => { s.b = i + 1 < shots.length ? shots[i + 1].a : end; });
  return { shots, end, cueAt: at };
}

// soft radial texture used for glows, puffs and plumes
export function glowTexture(inner = "rgba(255,250,235,1)", mid = "rgba(255,240,210,0.55)", outer = "rgba(255,240,210,0)") {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  gr.addColorStop(0, inner); gr.addColorStop(0.3, mid); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

// solid arrow (shaft + head) readable on a phone; set(origin, dir, length)
export function arrow(scene, color) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 14), m); const head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 18), m); g.add(shaft, head);
  g.set = (origin, dir, L) => { g.position.copy(origin); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const sL = Math.max(0.01, L - 0.16); shaft.scale.y = sL; shaft.position.y = sL / 2 + 0.12; head.position.y = 0.12 + sL + 0.08; };
  g.visible = false; scene.add(g); return g; }

// a tube that grows along sampled positions; show(f) reveals the first fraction f
export function pathTube(scene, samples, color, r, opacity = 0.95, segs = 400) {
  const curve = new THREE.CatmullRomCurve3(samples.filter((_, i) => i % 6 === 0 || i === samples.length - 1).map((s) => V(s.p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, r, 10, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
  const n = m.geometry.index.count; m.show = (f) => { m.geometry.setDrawRange(0, Math.floor(n * clamp(f) / 6) * 6); m.visible = f > 0; }; m.show(0); scene.add(m); return m;
}
