// TIKTOK YUKLEYICI — bitmis MP4'u TikTok gelen kutusuna gonderir.
//
// Guvenlik ilkeleri (youtube-yukle.js ile ayni):
//   1) Kendiliginden CALISMAZ: yalnizca acikca cagrildiginda ve uc kimlik
//      bilgisi de varken calisir.
//   2) Hicbir sey HERKESE ACIK yapilmaz. Video TikTok uygulamasindaki gelen
//      kutusuna duser; yayinlama karari ve son duzenleme SENDE kalir.
//   3) Ek npm bagimliligi yok.
//
// Ayni video iki kez gonderilmez: icerik/tiktok.json kaydi tutulur.
//
// Kullanim:
//   node tiktok-yukle.js <slug>              # gelen kutusuna gonder
//   node tiktok-yukle.js <slug> --dogrula    # KURU CALISMA: hicbir sey gonderilmez
"use strict";
const fs = require("fs");
const path = require("path");
const { KOK, jsonOku, jsonYaz, slugGecerli } = require("./lib/ortak");
const TT = require("./lib/tiktok");

const KAYIT = path.join(KOK, "icerik", "tiktok.json");
const kayitlar = () => jsonOku(KAYIT, []);
const kayitBul = (slug) => kayitlar().find((x) => x.slug === slug) || null;

function kaydet(k) {
  const l = kayitlar().filter((x) => x.slug !== k.slug);
  l.push(k);
  jsonYaz(KAYIT, l);
}

function videoYolu(slug) {
  const vd = path.join(KOK, "uretim", slug, "Videos");
  const tam = path.join(vd, slug + ".mp4");
  if (fs.existsSync(tam)) return tam;
  const l = fs.existsSync(vd) ? fs.readdirSync(vd).filter((f) => f.toLowerCase().endsWith(".mp4")).sort() : [];
  return l.length ? path.join(vd, l.pop()) : null;
}

// TikTok aciklamasi: YouTube aciklamasindan farkli (orada baglantilar ve
// kaynakca var; TikTok'ta kisa metin ve az etiket daha iyi calisir).
function aciklama(slug) {
  const K = require("./lib/kutuphane");
  const konu = K.uretimKonusu(slug) || {};
  const v = konu.vaka || {};
  const t = jsonOku(K.paketYolu(slug, "titles.json"), null);
  const baslik = (t && t.secilen) || konu.baslik || slug;
  const etiketler = ["#engineering", "#disaster", v.kume === "spaceflight-disasters" ? "#space"
    : v.kume === "aviation-failures" ? "#aviation" : v.kume === "maritime-disasters" ? "#ships" : "#history"];
  return [baslik, v.ders ? "What changed: " + v.ders + "." : "",
    "Narration uses a synthetic voice; footage is real archival film.",
    [...new Set(etiketler)].join(" ")].filter(Boolean).join("\n\n").slice(0, 2100);
}

async function main() {
  const argv = process.argv.slice(2);
  const slug = argv.find((a) => !a.startsWith("--"));
  const kuru = argv.includes("--dogrula");
  if (!slug) { console.error("Kullanim: node tiktok-yukle.js <slug> [--dogrula]"); process.exit(1); }
  if (!slugGecerli(slug)) { console.error("Gecersiz slug: " + slug); process.exit(1); }

  const dosya = videoYolu(slug);
  if (!dosya) { console.error("Yuklenecek MP4 yok: uretim/" + slug + "/Videos/"); process.exit(1); }
  const boyut = fs.statSync(dosya).size;

  console.log("Dosya    : " + path.relative(KOK, dosya) + "  (" + (boyut / 1e6).toFixed(1) + " MB)");
  console.log("Aciklama : " + aciklama(slug).split("\n")[0]);

  const varOlan = kayitBul(slug);
  if (varOlan && varOlan.publishId) {
    console.log("✓ Bu video TikTok'a zaten gonderilmis (" + varOlan.tarih.slice(0, 10) + ") — tekrar GONDERILMEDI.");
    return;
  }
  if (boyut > TT.TEK_PARCA_SINIR) { console.error("Video 128 MB sinirini asiyor."); process.exit(1); }

  if (kuru) {
    console.log("\n[--dogrula] KURU CALISMA. Hicbir sey gonderilmedi.");
    console.log("Kimlik bilgileri: " + (TT.kimlikVar() ? "hazir" : "EKSIK (TT_CLIENT_KEY/TT_CLIENT_SECRET/TT_REFRESH_TOKEN)"));
    return;
  }
  if (!TT.kimlikVar()) { console.log("TikTok kimligi yok — gonderim atlandi (bkz. docs/TIKTOK.md)."); return; }

  const tok = await TT.token();
  if (!/video\.upload/.test(tok.kapsam) && tok.kapsam) throw new Error("TikTok yetkisinde video.upload kapsami yok — node tiktok-yetki.js");
  console.log("Gonderiliyor (" + (boyut / 1e6).toFixed(1) + " MB)...");
  const { publishId } = await TT.inboxYukle(tok.erisim, dosya);
  const d = await TT.durumBekle(tok.erisim, publishId);
  const basarili = d.status === "SEND_TO_USER_INBOX";
  console.log(basarili ? "\n✓ TikTok gelen kutusuna dustu. Uygulamadaki bildirime dokunup yayinla."
    : "\n⚠ TikTok durumu: " + (d.status || "?") + (d.fail_reason ? " (" + d.fail_reason + ")" : ""));

  kaydet({ slug, publishId, durum: d.status || "?", tarih: new Date().toISOString(), boyut,
    aciklama: aciklama(slug), hata: d.fail_reason || null });
  if (!basarili && d.status === "FAILED") process.exit(1);
}

module.exports = { aciklama, kayitBul, videoYolu };

if (require.main === module) main().catch((e) => { console.error("Hata: " + e.message); process.exit(1); });
