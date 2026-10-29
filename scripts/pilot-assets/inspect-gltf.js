"use strict";
// Lists what a .glb/.gltf actually contains (no three.js needed): meshes and triangle counts, skins and joint names,
// animation clips with durations and the joints they drive. Used to judge whether a free pack covers football motion.
//   node scripts/pilot-assets/inspect-gltf.js <file.glb|file.gltf>...
const fs = require("fs"); const path = require("path");
function load(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) === 0x46546c67) { const len = buf.readUInt32LE(12); return { json: JSON.parse(buf.slice(20, 20 + len).toString("utf8")), bin: buf.slice(20 + len + 8) }; }
  return { json: JSON.parse(buf.toString("utf8")), bin: null };
}
for (const file of process.argv.slice(2)) {
  const { json: g } = load(file);
  const acc = g.accessors || [];
  const tris = (g.meshes || []).reduce((s, m) => s + m.primitives.reduce((t, p) => t + (p.indices != null ? acc[p.indices].count / 3 : acc[p.attributes.POSITION].count / 3), 0), 0);
  console.log(`## ${path.basename(file)}: ${(g.meshes || []).length} meshes, ${Math.round(tris)} triangles, ${(g.skins || []).length} skins, ${(g.animations || []).length} clips, ${(g.materials || []).length} materials, ${(g.textures || []).length} textures`);
  for (const s of g.skins || []) console.log(`- skin ${s.name || ""}: ${s.joints.length} joints: ${s.joints.map((j) => g.nodes[j].name).join(", ")}`);
  for (const a of g.animations || []) {
    const dur = Math.max(...a.channels.map((c) => { const i = a.samplers[c.sampler].input; return acc[i].max ? acc[i].max[0] : 0; }));
    console.log(`- clip "${a.name}": ${dur.toFixed(2)} s, ${new Set(a.channels.map((c) => c.target.node)).size} nodes`);
  }
}
