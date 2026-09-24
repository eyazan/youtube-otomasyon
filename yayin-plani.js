// YAYIN PLANI — uyarlanabilir yayin sikligi. Kalite, takvimin ONUNDEDIR.
//
// Varsayilan (config/growth.json > publishing): Shorts her 1 gunde bir,
// uzun belgesel her 5 gunde bir. "Gun doldu" diye yayin YOK: video once
// kalite kapisini gecmeli (quality-gate.js). Gercek uretimlerin son final
// kapilarinda BLOCK birikiyorsa aralik otomatik uzar (maxStretchDays'e kadar) —
// sistem hiz icin kaliteden odun vermez, once kuyrugu duzeltmeye zaman tanir.
// REVIEW yavaslatmaz: REVIEW zaten "private yukle, insan yayinlasin" demektir
// (stretchOnReview: true ile REVIEW da sayilir).
//
// Kullanim: node yayin-plani.js            durum
//           node yayin-plani.js --kontrol short   (cikis kodu 0 = uygun, 3 = henuz degil)
"use strict";
const { ayar } = require("./lib/ayar");
const K = require("./lib/kutuphane");

const TOLERANS_SAAT = 3;   // cron gecikmesi: 16:05'teki dunku yukleme bugunku 16:00'i bloklamasin

function durum(format, simdi = new Date(), kayit = K.yayinlananlar(), kalite = K.kaliteKayitlari()) {
  const p = ayar().publishing;
  const f = p[format] || { everyDays: 1, maxStretchDays: 3 };
  const son = kayit.filter((y) => (y.format || "short") === format).map((y) => new Date(y.tarih)).sort((a, b) => b - a)[0] || null;
  // Son 3 GERCEK uretimin final kapi karari (kutuphane taramalari sayilmaz)
  const sonKararlar = kalite.filter((k) => k.asama === "final").slice(-3).map((k) => k.karar);
  const sorunlu = sonKararlar.filter((k) => k === "BLOCK" || (p.stretchOnReview && k === "REVIEW")).length;
  const esnetme = sorunlu >= (p.stretchWhenRecentBlocks || 2) ? Math.min(f.maxStretchDays - f.everyDays, sorunlu - 1) : 0;
  const aralik = f.everyDays + Math.max(0, esnetme);
  const sonraki = son ? new Date(son.getTime() + aralik * 86400000 - TOLERANS_SAAT * 3600000) : simdi;
  const uygun = !son || simdi >= sonraki;
  return { format, sonYayin: son ? son.toISOString() : null, aralikGun: aralik, taban: f.everyDays, esnetme,
    sonKararlar, uygun, sonrakiUygun: sonraki.toISOString(),
    neden: uygun ? "due" : `next slot ${sonraki.toISOString().slice(0, 16)}Z` + (esnetme ? ` (stretched +${esnetme}d: recent gate results ${sonKararlar.join(", ")})` : "") };
}

module.exports = { durum, TOLERANS_SAAT };

if (require.main === module) {
  const i = process.argv.indexOf("--kontrol");
  if (i > 0) {
    const d = durum(process.argv[i + 1] || "short");
    console.log(`${d.format}: ${d.uygun ? "UYGUN" : "BEKLE"} — ${d.neden}`);
    process.exit(d.uygun ? 0 : 3);
  }
  for (const f of ["short", "long"]) {
    const d = durum(f);
    console.log(`${f.padEnd(6)} her ${d.aralikGun} gun (taban ${d.taban}${d.esnetme ? ", +" + d.esnetme + " esnetme" : ""})  son: ${d.sonYayin || "-"}  -> ${d.uygun ? "UYGUN" : d.neden}`);
  }
}
