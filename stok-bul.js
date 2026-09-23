// STOK BUL — Pexels'ten sahne basina dikey stok video klibi indirir.
//
// "tur": "stok" konularinda kullanilir. Her sahnenin "arama" terimine gore
// Pexels'te dikey (portrait) HD klip bulur, indirir, sahne.kaynak'i ayarlar.
// Boylece belirli arsiv goruntusu olmayan konular (bilim/muhendislik acikla-
// yicilari) icin SINIRSIZ konu uretilebilir.
//
// Pexels lisansi: ucretsiz, ticari kullanima uygun, atif zorunlu degil
// (yine de GORSEL-KAYNAKLARI.txt'ye kaydedilir).
//
// Anahtar: PEXELS_KEY (.env ya da ortam). Ucretsiz: pexels.com/api
//
// Kullanim: node stok-bul.js <is-adi>

const fs = require("fs");
const path = require("path");
const https = require("https");

const KOK = __dirname;
const IS = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));
if (!IS) { console.error("Kullanim: node stok-bul.js <is-adi>"); process.exit(1); }
const BASE = path.join(KOK, "uretim", IS);
const konuYol = path.join(BASE, "konu.json");
if (!fs.existsSync(konuYol)) { console.error("Is yok: " + BASE); process.exit(1); }
const konu = JSON.parse(fs.readFileSync(konuYol, "utf8"));
const FOOT = path.join(BASE, "Footage");
fs.mkdirSync(FOOT, { recursive: true });

function env(ad) {
  if (process.env[ad]) return String(process.env[ad]).trim();
  try {
    for (const l of fs.readFileSync(path.join(KOK, ".env"), "utf8").split(/\r?\n/)) {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && m[1] === ad) return m[2].trim();
    }
  } catch (e) {}
  return "";
}
const KEY = env("PEXELS_KEY");
if (!KEY) { console.error("PEXELS_KEY eksik (.env). Ucretsiz: pexels.com/api"); process.exit(2); }

function getJSON(url) {
  return new Promise((coz, red) => {
    https.get(url, { headers: { Authorization: KEY, "User-Agent": "FailureReconstructedBot/1.0" } }, (res) => {
      const p = []; res.on("data", d => p.push(d));
      res.on("end", () => { try { coz(JSON.parse(Buffer.concat(p).toString("utf8"))); } catch (e) { red(e); } });
    }).on("error", red);
  });
}
function indir(url, hedef, kalan = 5) {
  return new Promise((coz, red) => {
    https.get(url, { headers: { "User-Agent": "FailureReconstructedBot/1.0" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (kalan <= 0) return red(new Error("cok yonlendirme"));
        res.resume(); return indir(res.headers.location, hedef, kalan - 1).then(coz, red);
      }
      if (res.statusCode !== 200) { res.resume(); return red(new Error("HTTP " + res.statusCode)); }
      const ws = fs.createWriteStream(hedef);
      res.pipe(ws); ws.on("finish", () => ws.close(() => coz())); ws.on("error", red);
    }).on("error", red);
  });
}

// Bir arama terimi icin en iyi dikey klibi sec (kullanilan id'leri atla).
async function klipSec(terim, kullanilan) {
  const url = "https://api.pexels.com/videos/search?query=" + encodeURIComponent(terim) +
    "&orientation=portrait&size=medium&per_page=15";
  const d = await getJSON(url);
  const vids = (d.videos || []).filter(v => !kullanilan.has(v.id));
  for (const v of vids) {
    // Dikey, yeterince uzun, iyi cozunurluklu bir dosya sec
    const dosyalar = (v.video_files || [])
      .filter(f => f.height >= f.width && f.height >= 960 && /mp4/i.test(f.file_type || "mp4"))
      .sort((a, b) => (a.height - 1920) ** 2 - (b.height - 1920) ** 2 > 0 ? 1 : -1);
    if (dosyalar.length) return { id: v.id, url: dosyalar[0].link, sure: v.duration, kaynak: v.url };
  }
  return null;
}

(async () => {
  const sahneler = konu.sahneler || [];
  if (!sahneler.length) { console.error("konu.json'da sahneler yok."); process.exit(1); }
  console.log(`Stok video (Pexels): ${IS}  (${sahneler.length} sahne)`);
  const kullanilan = new Set();
  const kayit = [];
  for (let i = 0; i < sahneler.length; i++) {
    const s = sahneler[i];
    const terim = s.arama || s.metin.split(/\s+/).slice(0, 3).join(" ");
    const ad = "s-" + String(i).padStart(2, "0") + ".mp4";
    const hedef = path.join(FOOT, ad);
    process.stdout.write(`  sahne ${i + 1}/${sahneler.length}: "${terim}" ... `);
    let sec = await klipSec(terim, kullanilan);
    if (!sec) { // yedek: konunun genel temasi
      sec = await klipSec(konu.arama_yedek || konu.baslik || "engineering", kullanilan);
    }
    if (!sec) throw new Error("Pexels klip bulunamadi: " + terim);
    kullanilan.add(sec.id);
    for (let d = 1; ; d++) {
      try { await indir(sec.url, hedef); break; }
      catch (e) { if (d >= 3) throw e; await new Promise(r => setTimeout(r, d * 2000)); }
    }
    s.kaynak = "Footage/" + ad;
    s.baslangic = 0;
    console.log((fs.statSync(hedef).size / 1e6).toFixed(1) + " MB");
    kayit.push(ad + "  <=  Pexels " + sec.kaynak);
  }
  fs.writeFileSync(konuYol, JSON.stringify(konu, null, 2));
  fs.writeFileSync(path.join(BASE, "GORSEL-KAYNAKLARI.txt"),
    kayit.join("\n") + "\n\nPexels License (free, commercial use OK).\n");
  console.log("✓ Bitti. Klipler indi + konu.json guncellendi.");
})().catch(e => { console.error("Hata: " + e.message); process.exit(1); });
