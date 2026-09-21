// SHORTS SIRA — otomatik Shorts orkestratoru.
//
// icerik/konular/<slug>.json altindaki onayli konulari sirayla uretir:
//   konu spec -> uretim/<slug>/konu.json -> arsiv-bul (goruntu) ->
//   shorts-yap (render) -> (istege bagli) youtube-yukle (private).
//
// Uretilenler icerik/uretilenler.json'a yazilir; sonraki calisma sonrakini alir.
// Hicbir sey elle yapilmaz. Tek istisna: YouTube'a yukleme kimlik bilgileri
// (bir kerelik OAuth) ve PUBLISH=1 varsa yukler; yoksa sadece uretir.
//
// Kullanim:
//   node shorts-sira.js              # sonraki uretilmemis konuyu uret
//   node shorts-sira.js <slug>       # belirli konuyu uret
//   node shorts-sira.js --hepsi      # tum uretilmemis konulari uret

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const KOK = __dirname;
const KONULAR = path.join(KOK, "icerik", "konular");
const DURUM = path.join(KOK, "icerik", "uretilenler.json");

function slugGecerli(s) { return /^[a-z0-9][a-z0-9-]{0,79}$/.test(s); }

function uretilenler() {
  try { return JSON.parse(fs.readFileSync(DURUM, "utf8")); } catch (e) { return []; }
}
function isaretle(slug) {
  const u = uretilenler();
  if (!u.includes(slug)) { u.push(slug); fs.mkdirSync(path.dirname(DURUM), { recursive: true }); fs.writeFileSync(DURUM, JSON.stringify(u, null, 2) + "\n"); }
}

function konuListesi() {
  if (!fs.existsSync(KONULAR)) return [];
  return fs.readdirSync(KONULAR).filter(f => f.endsWith(".json")).map(f => f.replace(/\.json$/, "")).sort();
}

function calistir(script, slug) {
  const r = cp.spawnSync("node", [script, slug], { cwd: KOK, stdio: "inherit" });
  if (r.status !== 0) throw new Error(script + " basarisiz (slug: " + slug + ")");
}

function uploadHazir() {
  return ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"].every(k => process.env[k]);
}

function uretBir(slug) {
  if (!slugGecerli(slug)) throw new Error("Gecersiz slug: " + slug);
  const spec = path.join(KONULAR, slug + ".json");
  if (!fs.existsSync(spec)) throw new Error("Konu bulunamadi: " + spec);
  const job = path.join(KOK, "uretim", slug);
  fs.mkdirSync(job, { recursive: true });
  // spec -> konu.json (uretim slug'a sabit)
  const konu = JSON.parse(fs.readFileSync(spec, "utf8"));
  konu.slug = slug;
  fs.writeFileSync(path.join(job, "konu.json"), JSON.stringify(konu, null, 2));
  console.log(`\n=== ${slug} ===`);
  calistir("arsiv-bul.js", slug);
  calistir("shorts-yap.js", slug);

  // Yukleme: yalnizca PUBLISH=1 ve kimlik varsa; her zaman private.
  const publish = process.env.PUBLISH === "1";
  if (publish && uploadHazir()) {
    const r = cp.spawnSync("node", ["youtube-yukle.js", slug], { cwd: KOK, stdio: "inherit" });
    console.log(r.status === 0 ? "yukleme: private (yayindan once incele)" : "yukleme basarisiz");
  } else {
    console.log("yukleme atlandi (" + (publish ? "kimlik yok" : "PUBLISH!=1") + "); video: uretim/" + slug + "/Videos/");
  }
  isaretle(slug);
  return slug;
}

function main() {
  const argv = process.argv.slice(2);
  const hepsi = argv.includes("--hepsi");
  const acikSlug = argv.find(a => !a.startsWith("--"));
  const tum = konuListesi();
  if (!tum.length) { console.log("icerik/konular/ bos. Once konu ekle."); return 0; }

  if (acikSlug) { uretBir(acikSlug); return 0; }

  const kalan = tum.filter(s => !uretilenler().includes(s));
  if (!kalan.length) { console.log("Tum konular uretildi (" + tum.length + "). Yeni konu ekle."); return 0; }
  const hedef = hepsi ? kalan : [kalan[0]];
  for (const s of hedef) uretBir(s);
  return 0;
}

try { process.exit(main()); }
catch (e) { console.error("Hata: " + e.message); process.exit(1); }
