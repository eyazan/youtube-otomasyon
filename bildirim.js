// BILDIRIM — yeni video / engellenen video icin GitHub bildirimi (issue).
//
// Ek servis yok: GitHub Actions'in kendi GITHUB_TOKEN'i ile depoya bir issue
// acilir ve depo sahibi @etiketlenir -> GitHub e-postasi + mobil uygulama bildirimi.
// Onceki "yeni-video" bildirimleri otomatik kapatilir (liste temiz kalsin).
//
// Okunan: uretim/*/BILDIRIM.json (youtube-yukle.js yazar), icerik/engellenen.json (bugunkuler)
// Kullanim (Actions): node bildirim.js      — token yoksa yalnizca konsola yazar
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const { KOK, jsonOku, bugun } = require("./lib/ortak");
const { trSaat } = require("./lib/zamanlama");

const TOKEN = process.env.GITHUB_TOKEN || "";
const REPO = process.env.GITHUB_REPOSITORY || "eyazan/youtube-otomasyon";
const SAHIP = process.env.GITHUB_REPOSITORY_OWNER || REPO.split("/")[0];

function gh(yontem, yol, govde) {
  return new Promise((coz) => {
    const b = govde ? JSON.stringify(govde) : null;
    const r = https.request({ hostname: "api.github.com", path: yol, method: yontem, headers: {
      Authorization: "Bearer " + TOKEN, "User-Agent": "failure-reconstructed-bot", Accept: "application/vnd.github+json",
      ...(b ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(b) } : {}) } }, (res) => {
      const p = []; res.on("data", (d) => p.push(d));
      res.on("end", () => { let j = null; try { j = JSON.parse(Buffer.concat(p).toString("utf8")); } catch (e) {} coz({ durum: res.statusCode, j }); });
    });
    r.on("error", () => coz({ durum: 0, j: null }));
    if (b) r.write(b);
    r.end();
  });
}

// Yayin oncesi gorsel denetim ozeti (shorts-yap.js -> denetim.json)
function denetimOzeti(slug) {
  const d = jsonOku(path.join(KOK, "icerik", "paket", slug, "denetim.json"), null);
  if (!d) return ["- ⚠️ Görsel denetim verisi yok"];
  const t = d.yaziTasmasi;
  return [
    t === 0 ? "- ✅ Yazı taşması yok" + (d.yaziOlcegi < 1 ? ` (yazılar %${Math.round(d.yaziOlcegi * 100)}'e küçültülerek sığdırıldı)` : "")
      : t === "olculemedi" ? "- ⚠️ Yazı taşması ölçülemedi" : `- ❌ Yazı taşması: ${t} karede`,
    d.sureFarki != null && d.sureFarki <= 0.5 ? `- ✅ Ses ve görüntü uyumlu (${d.videoSure?.toFixed(1)} sn)` : `- ❌ Ses/görüntü süresi uyumsuz (${d.videoSure} / ${d.sesSure} sn)`,
    (d.siyahToplam || 0) <= 0.4 ? "- ✅ Siyah kare yok" : `- ⚠️ Siyah kare: ${d.siyahToplam} sn`,
    (d.donukEnUzun || 0) <= 4 ? "- ✅ Donmuş görüntü yok" : `- ⚠️ Donmuş görüntü: ${d.donukEnUzun} sn`,
    d.ton === "stok-belgesel" ? "- 🎨 Kanal tonu uygulandı (stok görüntü)" : "- 🎞️ Arşiv görüntüsü (orijinal ton)",
  ];
}

function videoMesaji(b) {
  const zaman = b.publishAt ? trSaat(new Date(b.publishAt)) : null;
  const inceleme = b.kalite === "REVIEW";
  const baslik = zaman ? `🎬 ${b.baslik} — ${zaman} yayında` : `🎬 ${b.baslik} — private (elle yayınla)`;
  const govde = [
    `@${SAHIP} yeni Short yüklendi.`, "",
    `**${b.baslik}**`, "",
    zaman ? `⏰ **${zaman}** otomatik olarak Public olacak (${new Date(b.publishAt).toISOString().slice(11, 16)} UTC).`
      : "🔒 Private yüklendi — otomatik yayın planlanmadı. Studio'dan Public yap.",
    `🧪 Kalite kapısı: **${b.kalite || "?"}**` + (inceleme ? " — bakmanı öneririm (rapor aşağıda)." : ""), "",
    "**Yayın öncesi otomatik kontrol:**", ...denetimOzeti(b.slug), "",
    `![önizleme](https://raw.githubusercontent.com/${REPO}/main/icerik/paket/${b.slug}/onizleme.jpg)`, "",
    `- İzle / kontrol et: https://studio.youtube.com/video/${b.videoId}/edit`,
    `- Video: https://youtu.be/${b.videoId}`,
    `- Kalite raporu: https://github.com/${REPO}/blob/main/icerik/paket/${b.slug}/quality-gate.md`,
    `- Sabit yorum metni: https://github.com/${REPO}/blob/main/icerik/paket/${b.slug}/pinned-comment.txt`, "",
    zaman ? "**Yayınlanmasını istemiyorsan:** Studio → video → Visibility → *Schedule*'ı kaldırıp **Private** bırak (yayın saatinden önce)." : "",
    "**Yayından sonra:** Studio → Comments → kanalın tartışma yorumunu ⋮ → **Pin**.",
  ].filter((x) => x !== undefined).join("\n");
  return { baslik, govde, etiket: inceleme ? ["yeni-video", "review"] : ["yeni-video"] };
}

async function main() {
  const uretim = path.join(KOK, "uretim");
  const bildirimler = fs.existsSync(uretim) ? fs.readdirSync(uretim).map((s) => jsonOku(path.join(uretim, s, "BILDIRIM.json"), null)).filter(Boolean) : [];
  const engel = Object.entries(jsonOku(path.join(KOK, "icerik", "engellenen.json"), {})).filter(([, e]) => String(e.tarih || "").startsWith(bugun()));
  const mesajlar = bildirimler.map(videoMesaji);
  for (const [slug, e] of engel) mesajlar.push({ baslik: `⛔ Kalite kapısı engelledi: ${slug}`, etiket: ["kalite-engeli"],
    govde: `@${SAHIP} bu konu yüklenmedi.\n\nNeden: ${e.neden}\n\nRapor: https://github.com/${REPO}/blob/main/icerik/paket/${slug}/quality-gate.md\n\nKonu dosyası düzeltilince otomatik tekrar denenir.` });
  if (!mesajlar.length) { console.log("Bildirim yok (bugun yeni video/engel yok)."); return; }
  if (!TOKEN) { for (const m of mesajlar) console.log("[bildirim]\n" + m.baslik + "\n" + m.govde + "\n"); return; }
  // Onceki video bildirimlerini kapat
  if (bildirimler.length) {
    const acik = await gh("GET", `/repos/${REPO}/issues?state=open&labels=yeni-video&per_page=50`);
    for (const i of (acik.j || [])) await gh("PATCH", `/repos/${REPO}/issues/${i.number}`, { state: "closed" });
  }
  for (const m of mesajlar) {
    const r = await gh("POST", `/repos/${REPO}/issues`, { title: m.baslik, body: m.govde, labels: m.etiket });
    console.log(r.durum === 201 ? `✓ bildirim: ${r.j.html_url}` : `✗ bildirim acilamadi (HTTP ${r.durum})`);
  }
}

module.exports = { videoMesaji };

if (require.main === module) main().catch((e) => { console.error("Hata: " + e.message); process.exit(0); });
