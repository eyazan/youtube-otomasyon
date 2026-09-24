// KUTUPHANE — konu spec'leri, yayin kaydi, kumeler (topic clusters), kaynak defteri.
//
// Kalici durum (Actions geri commit eder):
//   icerik/yayinlananlar.json  slug -> YouTube video kimligi (yukleyici yazar)
//   icerik/kaynak-defteri.json slug -> kullanilan goruntu kaynak kimlikleri + muzik profili
//   icerik/kalite-kayitlari.json kalite kapisi sonuclari (yayin sikligi bunu okur)
"use strict";
const fs = require("fs");
const path = require("path");
const { KOK, jsonOku, jsonYaz } = require("./ortak");

const YOL = {
  konular: path.join(KOK, "icerik", "konular"),
  yayinlananlar: path.join(KOK, "icerik", "yayinlananlar.json"),
  defter: path.join(KOK, "icerik", "kaynak-defteri.json"),
  kalite: path.join(KOK, "icerik", "kalite-kayitlari.json"),
  paket: path.join(KOK, "icerik", "paket"),
  uretim: path.join(KOK, "uretim"),
};

// Kumeler: ayni kumedeki videolar birbirini bilerek onerir (oturum suresi).
const KUMELER = {
  "bridge-failures": { ad: "Bridge Failures", anahtar: /\bbridges?\b/i,
    aciklama: "Bridges that twisted, cracked and fell — reconstructed from the evidence." },
  "structural-failures": { ad: "Structural Engineering Failures", anahtar: /\b(building|elevator|walkway|collapse|roof|house)s?\b/i,
    aciklama: "Why buildings and structures fail, and what engineers changed afterwards." },
  "aviation-failures": { ad: "Aviation Failures", anahtar: /\b(plane|aircraft|airship|flight|jet|zeppelin|airliner)s?\b/i,
    aciklama: "Air disasters traced link by link through the failure chain." },
  "spaceflight-disasters": { ad: "Spaceflight Disasters", anahtar: /\b(rocket|shuttle|orbiter|launch|spacecraft|challenger|columbia)s?\b/i,
    aciklama: "Launch and spaceflight failures — the engineering behind the fireball." },
  "maritime-disasters": { ad: "Maritime Disasters", anahtar: /\b(ship|ferry|titanic|hull|capsiz)\w*/i,
    aciklama: "How ships lose stability, flood and sink." },
  "nuclear-accidents": { ad: "Nuclear Accidents", anahtar: /\b(nuclear|reactor|radiation|radioactive|atomic)\b/i,
    aciklama: "Nuclear tests and accidents, reconstructed from the record." },
  "fire-and-explosions": { ad: "Fires & Explosions", anahtar: /\b(explosion|explode|blast|fire|gas|flashover|carbon monoxide)\b/i,
    aciklama: "Blasts, fires and invisible gases — the physics of how they kill." },
  "industrial-disasters": { ad: "Industrial Disasters", anahtar: /\b(mine|mining|factory|plant|chemical|refinery)s?\b/i,
    aciklama: "Industrial accidents and the organisational failures behind them." },
  "infrastructure-failures": { ad: "Infrastructure Failures", anahtar: /\b(dam|grid|blackout|levee|pipeline|power)s?\b/i,
    aciklama: "Dams, grids and the systems we only notice when they fail." },
  "materials-failures": { ad: "Materials & Fatigue", anahtar: /\b(rust|corrosion|concrete|glass|fatigue|steel)\b/i,
    aciklama: "When the material itself gives up: corrosion, fatigue and hidden flaws." },
  "natural-hazards": { ad: "Natural Hazards vs. Engineering", anahtar: /\b(earthquake|volcano|tsunami|flood|hurricane|avalanche|lightning|sinkhole|liquefaction|eruption)s?\b/i,
    aciklama: "What earthquakes, floods and eruptions do to the things we build." },
};

function kumeBul(konu) {
  const v = (konu && konu.vaka) || {};
  if (v.kume && KUMELER[v.kume]) return v.kume;
  const metin = [konu.baslik, (konu.etiketler || []).join(" "), (konu.sahneler || []).map((s) => s.metin).join(" ")].join(" ");
  let en = null, enSay = 0;
  for (const [id, k] of Object.entries(KUMELER)) {
    const say = (metin.match(new RegExp(k.anahtar.source, "gi")) || []).length;
    if (say > enSay) { en = id; enSay = say; }
  }
  return en || "structural-failures";
}

function konuOku(slug) {
  const p = path.join(YOL.konular, slug + ".json");
  const k = jsonOku(p, null);
  if (k) k.slug = k.slug || slug;
  return k;
}

function konular() {
  if (!fs.existsSync(YOL.konular)) return [];
  return fs.readdirSync(YOL.konular).filter((f) => f.endsWith(".json")).sort()
    .map((f) => konuOku(f.replace(/\.json$/, ""))).filter(Boolean);
}

// Editoryal alanlar (vaka, baslik, hook...) her zaman GUNCEL spec'ten gelir;
// uretim kopyasindan yalnizca indirilen kaynak bilgisi (kaynak/baslangic/kaynakMeta)
// ayni metinli sahnelere tasinir. Spec yoksa (eski/deneme isi) uretim kopyasi kullanilir.
function uretimKonusu(slug) {
  const spec = konuOku(slug);
  const ur = jsonOku(path.join(YOL.uretim, slug, "konu.json"), null);
  if (!spec) return ur ? { ...ur, slug } : null;
  if (!ur) return spec;
  const sahneler = (spec.sahneler || []).map((s, i) => {
    const u = (ur.sahneler || []).find((x) => x.metin === s.metin) || (ur.sahneler || [])[i];
    if (!u || u.metin !== s.metin) return { ...s };
    const { kaynak, baslangic, kaynakMeta } = u;
    return { ...s, ...(kaynak ? { kaynak } : {}), ...(baslangic != null ? { baslangic } : {}), ...(kaynakMeta ? { kaynakMeta } : {}) };
  });
  return { ...spec, sahneler, slug };
}

const yayinlananlar = () => jsonOku(YOL.yayinlananlar, []);
function yayinKaydet(kayit) {
  const l = yayinlananlar().filter((x) => x.videoId !== kayit.videoId);
  l.push(kayit);
  l.sort((a, b) => String(a.tarih).localeCompare(String(b.tarih)));
  jsonYaz(YOL.yayinlananlar, l);
}
const yayinBul = (slug) => yayinlananlar().filter((x) => x.slug === slug).pop() || null;

const defter = () => jsonOku(YOL.defter, {});
function defterYaz(slug, kayit) {
  const d = defter();
  d[slug] = { ...(d[slug] || {}), ...kayit };
  jsonYaz(YOL.defter, d);
}

const kaliteKayitlari = () => jsonOku(YOL.kalite, []);
function kaliteKaydet(k) {
  const l = kaliteKayitlari().filter((x) => !(x.slug === k.slug && x.asama === k.asama));
  l.push(k);
  jsonYaz(YOL.kalite, l.slice(-500));
}

// Tum senaryo metni (sahneler ya da uzun format bolumler)
function anlati(konu) {
  if (Array.isArray(konu.bolumler) && konu.bolumler.length)
    return konu.bolumler.map((b) => (b.paragraflar || [b.metin || ""]).join("\n\n")).join("\n\n");
  return (konu.sahneler || []).map((s) => s.metin).join(" ");
}

const paketYolu = (slug, ...p) => path.join(YOL.paket, slug, ...p);
const formatBul = (konu) => (konu.format === "long" || konu.aspect === "16:9" ? "long" : "short");

module.exports = { YOL, KUMELER, kumeBul, konuOku, konular, uretimKonusu, yayinlananlar, yayinKaydet, yayinBul,
  defter, defterYaz, kaliteKayitlari, kaliteKaydet, anlati, paketYolu, formatBul };
