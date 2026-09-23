// YOUTUBE GUNCELLE — yuklenmis bir videonun basligini/aciklamasini/etiketlerini
// gunceller (videos.update). Zaten yuklenmis videolarda eksik metni tamamlamak
// icin. Video dosyasini DEGISTIRMEZ, sadece metni.
//
// Metin kaynagi: uretim/<is>/YUKLEME.json ya da uretim/<is>/konu.json
// (baslik/aciklama/etiketler) — youtube-yukle.js ile ayni.
//
// Kullanim:
//   node youtube-guncelle.js <video-id> <is-adi>
//   ornek: node youtube-guncelle.js qkzRUqlEy5I tacoma-narrows

const fs = require("fs");
const path = require("path");
const https = require("https");

const KOK = __dirname;
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

function istek(opt, govde) {
  return new Promise((coz, red) => {
    const r = https.request(opt, (res) => {
      const p = []; res.on("data", d => p.push(d));
      res.on("end", () => coz({ durum: res.statusCode, govde: Buffer.concat(p).toString("utf8") }));
    });
    r.on("error", red); if (govde) r.write(govde); r.end();
  });
}

async function erisimJetonu() {
  const govde = new URLSearchParams({
    client_id: env("YT_CLIENT_ID"), client_secret: env("YT_CLIENT_SECRET"),
    refresh_token: env("YT_REFRESH_TOKEN"), grant_type: "refresh_token",
  }).toString();
  const y = await istek({ hostname: "oauth2.googleapis.com", path: "/token", method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(govde) } }, govde);
  if (y.durum !== 200) throw new Error("OAuth jetonu alinamadi (HTTP " + y.durum + ")");
  return JSON.parse(y.govde).access_token;
}

const temizle = (s) => String(s).replace(/[<>]/g, "");

function metniAl(BASE) {
  const oz = path.join(BASE, "YUKLEME.json");
  if (fs.existsSync(oz)) { const j = JSON.parse(fs.readFileSync(oz, "utf8"));
    return { baslik: j.baslik, aciklama: j.aciklama, etiketler: j.etiketler || [] }; }
  const k = JSON.parse(fs.readFileSync(path.join(BASE, "konu.json"), "utf8"));
  return { baslik: k.baslik || k.baslik_en, aciklama: k.aciklama || k._not || "", etiketler: k.etiketler || [] };
}

async function main() {
  const [id, is] = process.argv.slice(2);
  if (!id || !is) { console.error("Kullanim: node youtube-guncelle.js <video-id> <is-adi>"); process.exit(1); }
  const BASE = path.join(KOK, "uretim", is);
  if (!fs.existsSync(path.join(BASE, "konu.json"))) { console.error("Is yok: " + BASE); process.exit(1); }
  const m = metniAl(BASE);
  const token = await erisimJetonu();

  // Mevcut snippet'i al (categoryId gerekli).
  const mevcut = await istek({ hostname: "www.googleapis.com",
    path: "/youtube/v3/videos?part=snippet&id=" + encodeURIComponent(id),
    headers: { "Authorization": "Bearer " + token } });
  const items = JSON.parse(mevcut.govde).items || [];
  if (!items.length) throw new Error("Video bulunamadi (senin kanalinda mi?): " + id);
  const snip = items[0].snippet;

  const yeni = {
    id,
    snippet: {
      title: temizle(m.baslik || snip.title).slice(0, 100),
      description: temizle(m.aciklama || snip.description || ""),
      tags: (m.etiketler && m.etiketler.length ? m.etiketler : snip.tags || []).map(String).slice(0, 30),
      categoryId: snip.categoryId || "27",
    },
  };
  const body = JSON.stringify(yeni);
  const y = await istek({ hostname: "www.googleapis.com",
    path: "/youtube/v3/videos?part=snippet", method: "PUT",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, body);
  if (y.durum === 200) {
    console.log("✓ Guncellendi: " + id);
    console.log("  Baslik : " + yeni.snippet.title);
    console.log("  Etiket : " + (yeni.snippet.tags.join(", ") || "(yok)"));
    console.log("  https://youtu.be/" + id);
  } else {
    console.error("Guncelleme basarisiz (HTTP " + y.durum + "): " + y.govde.slice(0, 500));
    process.exit(1);
  }
}
main().catch(e => { console.error("Hata: " + e.message); process.exit(1); });
