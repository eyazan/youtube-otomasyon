// Buyume motorlari icin birim testleri (node --test). Ag erisimi YOK; YouTube
// cagrilari yapilmaz. Paket dosyasi yazan calistir() fonksiyonlari degil, saf
// degerlendirme fonksiyonlari test edilir.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

const M = require("../../lib/metin");
const K = require("../../lib/kutuphane");
const TE = require("../../title-engine");
const HE = require("../../hook-engine");
const SP = require("../../scene-pacing");
const PC = require("../../pronunciation-check");
const OC = require("../../originality-check");
const SS = require("../../story-structure");
const A = require("../../lib/analitik");
const YP = require("../../yayin-plani");
const muzik = require("../../lib/muzik");
const sahne = require("../../lib/sahne");
const TS = require("../../thumbnail-strategy");
const KP = require("../../konu-puan");
const { birlestir } = require("../../lib/ayar");
const yt = require("../../lib/yt");

const tacoma = () => K.konuOku("tacoma-narrows");

test("metin: benzerlik ve baslik bicimi", () => {
  assert.equal(M.trigramBenzerlik("The Bridge That Fell", "The Bridge That Fell"), 1);
  assert.ok(M.kelimeBenzerlik("dams fail without warning", "why do bridges collapse") < 0.2);
  assert.equal(M.baslikBicim("the bridge that tore itself apart"), "The Bridge That Tore Itself Apart");
  assert.equal(M.diziBenzerlik(["a", "b", "c"], ["a", "b", "c"]), 1);
});

test("title engine: >=10 aday, puan detaylari saklanir", () => {
  const r = TE.degerlendir(tacoma(), { digerBasliklar: [], kaliplar: {} });
  assert.ok(r.adaySayisi >= 10, "en az 10 aday");
  for (const a of r.adaylar) {
    for (const k of ["curiosity", "clarity", "tension", "consequence", "specificity", "appeal", "engineering", "search", "suggested"]) assert.ok(k in a.kriterler);
    assert.ok("similarity" in a && "clickbaitRisk" in a);
  }
  // Secim yalnizca insan-yazimi adaylardan
  assert.ok(["current", "editorial"].includes(r.adaylar.find((a) => a.baslik === r.secilen).kaynak));
});

test("title engine: anahtar kelime tekrari ve desteklenmeyen iddia cezalandirilir", () => {
  const k = tacoma();
  const kuru = TE.puanla("Tacoma Narrows Explained", k, [], "short");
  const iyi = TE.puanla("The Bridge That Started Twisting — Then Tore Itself Apart", k, [], "short");
  assert.ok(iyi.toplam > kuru.toplam + 10);
  const uydurma = TE.puanla("Secret Nuclear Aliens Destroyed This Bridge", k, [], "short");
  assert.ok(uydurma.clickbaitRisk >= 4, "senaryoda olmayan iddia = clickbait riski");
});

test("hook engine: yasak acilis ve acilis CTA'si engelleyicidir", () => {
  const kotu = HE.puanla("Welcome to Failure Reconstructed. In today's video we look at a bridge. Subscribe for more.", "BIG BRIDGE", "short");
  assert.equal(kotu.engelleyici, true);
  const iyi = HE.puanla("This bridge tore itself apart in a forty mile an hour wind. But the wind was not the real problem. So why did it fail? The reason changed engineering.", "Filmed as it fell", "short");
  assert.equal(iyi.engelleyici, false);
  assert.ok(iyi.puan > kotu.puan);
});

test("scene pacing: rol anlamdan gelir, rastgele degil", () => {
  assert.equal(SP.rolBul("Then the center span lets go and drops into the water.", 3, 9), "event");
  assert.equal(SP.rolBul("Engineers call this the pressure mechanism.", 4, 9), "technical");
  const a = SP.sahnePlani("The dam collapses in seconds.", 2, 9, 6, "long");
  const b = SP.sahnePlani("The dam collapses in seconds.", 2, 9, 6, "long");
  assert.deepEqual(a, b);
  assert.equal(SP.sahnePlani("x", 3, 9, 20, "long", true).tempo, "diagram");
});

test("scene pacing: birlesik sahnelerin ses zamanlari", () => {
  const z = SP.sahneZamanlari(["One two three. Four five.", "Six seven"], ["One two three.", "Four five.", "Six seven"], [3, 2, 2], 0.5);
  assert.equal(z[0].bas, 0);
  assert.ok(Math.abs(z[1].bas - 6) < 1e-9);          // 3 + 0.5 + 2 + 0.5
});

test("lib/sahne: bolum basliklari seslendirilmez", () => {
  const r = sahne.bolumAyir("## COLD OPEN\nA.\n\n## THE CAUSE\n\nB is here.");
  assert.deepEqual(r.paragraflar, ["A.", "B is here."]);
  assert.deepEqual(r.harita.map((h) => h.baslik), ["COLD OPEN", "THE CAUSE"]);
});

test("telaffuz: sozluk yalnizca TTS metnine uygulanir, klise yakalanir", () => {
  assert.equal(PC.ttsMetni("The O-rings failed."), "The O rings failed.");
  const d = PC.dogrula("Let's dive in. The RBMK reactor and the XQZT valve failed.");
  assert.ok(d.kliseler.includes("let's dive in"));
  assert.ok(d.supheli.some((s) => s.kelime === "XQZT"));
  assert.ok(!d.supheli.some((s) => s.kelime === "RBMK"), "sozlukteki kisaltma supheli degil");
});

test("originality: ayni senaryo BLOCK, farkli konu PASS", () => {
  const k = tacoma();
  const kopya = { ...k, slug: "tacoma-kopya" };
  const r = OC.degerlendir(kopya, { konular: [k] });
  assert.equal(r.aksiyon, "BLOCK");
  assert.ok(r.metrikler.sentences.deger >= 0.9);
  const farkli = OC.degerlendir(K.konuOku("why-dams-fail"), { konular: [k] });
  assert.notEqual(farkli.aksiyon, "BLOCK");
});

test("story structure: bolumler kanita gore uyarlanir, donguler sonra kapanir", () => {
  const k = tacoma();
  const b = SS.bolumler(k);
  assert.equal(b.sira[0].id, "COLD_OPEN");
  const d = SS.donguler(k, b.sira);
  for (const x of d) assert.ok(b.sira.findIndex((s) => s.id === x.kapatBolum) > b.sira.findIndex((s) => s.id === x.acBolum));
  assert.equal(SS.cta(k, 40, b.sira).strateji, "none", "Shorts: konusulan CTA yok");
  const uzun = SS.cta({ ...k, format: "long" }, 600, b.sira);
  assert.match(uzun.strateji, /mid/);
  const aciklayici = SS.bolumler(K.konuOku("why-dams-fail"));
  assert.equal(aciklayici.tip, "explainer");
});

test("analitik: veri uydurulmaz, kucuk orneklemde yetersiz veri", () => {
  const v = { videoId: "x", format: "short", yasGun: 1, metrikler: {
    views: A.ok(40, "t"), likes: A.ok(1, "t"), comments: A.ok(0, "t"), impressions: A.yok("n"), ctr: A.yok("n"),
    averageViewPercentage: A.yok("n"), subscribersGained: A.yok("n"), returningViewers: A.yok("n") }, trafik: null, tutma: null };
  const t = A.teshis(v, {}, { minViewsForRates: 100 });
  assert.ok(t.some((x) => x.kod === "INSUFFICIENT_DATA"));
  assert.ok(!t.some((x) => x.kod === "HIGH_IMPRESSIONS_LOW_CTR"), "gosterim yokken CTR teshisi konmaz");
  const ustun = A.teshis({ ...v, yasGun: 3, metrikler: { ...v.metrikler, views: A.ok(1000, "t") } }, {}, { minViewsForRates: 100 }, { medyan: 120, n: 4 });
  assert.ok(ustun.some((x) => x.kod === "OUTPERFORMER"));
});

test("analitik: bos trafik ve kucuk orneklemde abone teshisi konmaz", () => {
  const v = { videoId: "x", format: "short", yasGun: 3, metrikler: {
    views: A.ok(178, "t"), likes: A.ok(5, "t"), comments: A.ok(0, "t"), impressions: A.yok("n"), ctr: A.yok("n"),
    averageViewPercentage: A.ok(68, "t"), subscribersGained: A.ok(0, "t"), returningViewers: A.yok("n") }, trafik: [], tutma: null };
  const t = A.teshis(v, {}, { minViewsForRates: 100 }).map((x) => x.kod);
  assert.ok(!t.includes("SHORTS_FEED_NOT_PICKED_UP"), "bos trafik = veri yok");
  assert.ok(!t.includes("HIGH_VIEWS_LOW_SUB_CONVERSION"), "178 izlenmede abone teshisi yok");
});

test("yayin plani: tolerans + yalnizca gercek BLOCK'lar aralik esnetir", () => {
  const simdi = new Date("2026-09-25T16:00:00Z");
  const kayit = [{ format: "short", tarih: "2026-09-24T16:05:00Z" }];
  assert.equal(YP.durum("short", simdi, kayit, []).uygun, true, "cron gecikmesi toleransi");
  const gecKalmis = [{ format: "short", tarih: "2026-09-24T19:50:00Z" }];   // dunku cron 3s50dk gecikti
  assert.equal(YP.durum("short", simdi, gecKalmis, []).uygun, true, "gec calisma ertesi gunu atlatmaz");
  assert.equal(YP.durum("short", new Date("2026-09-25T02:00:00Z"), gecKalmis, []).uygun, false, "ayni gece ikinci yayin yok");
  const tarama = [{ asama: "pre", karar: "REVIEW" }, { asama: "pre", karar: "REVIEW" }, { asama: "pre", karar: "REVIEW" }];
  assert.equal(YP.durum("short", simdi, kayit, tarama).esnetme, 0, "kutuphane taramalari sayilmaz");
  const bloklar = [{ asama: "final", karar: "BLOCK" }, { asama: "final", karar: "BLOCK" }];
  const d = YP.durum("short", simdi, kayit, bloklar);
  assert.ok(d.esnetme >= 1 && !d.uygun);
});

test("zamanlama: sabit saat, en az 1 saat once; bildirim metni", () => {
  const z = require("../../lib/zamanlama");
  assert.equal(z.sonrakiSlot(new Date("2026-09-25T10:05:00Z"), 18, 1).toISOString(), "2026-09-25T18:00:00.000Z");
  assert.equal(z.sonrakiSlot(new Date("2026-09-25T17:30:00Z"), 18, 1).toISOString(), "2026-09-26T18:00:00.000Z");
  assert.equal(z.trSaat(new Date("2026-09-25T18:00:00Z")), "25 Eylül 21:00 (TR)");
  const m = require("../../bildirim").videoMesaji({ slug: "x", videoId: "abcdefghijk", baslik: "T", kalite: "REVIEW", publishAt: "2026-09-25T18:00:00Z" });
  assert.match(m.baslik, /21:00/);
  assert.ok(m.etiket.includes("review"));
});

test("muzik profili: deterministik ve videolar arasi farkli", () => {
  assert.deepEqual(muzik.profil("a", "bridge-failures"), muzik.profil("a", "bridge-failures"));
  assert.ok(muzik.benzerlik(muzik.profil("a", "bridge-failures"), muzik.profil("b", "nuclear-accidents")) < 0.95);
});

test("muzik profili: tum konularda ffmpeg sinirlari icinde (tremolo >= 0.1 Hz)", () => {
  for (const k of K.konular()) {
    const p = muzik.profil(k.slug, K.kumeBul(k));
    assert.ok(p.trem >= 0.1 && p.trem <= 20, `${k.slug}: tremolo ${p.trem}`);
    assert.ok(p.kok > 20 && p.alcak > p.kok, `${k.slug}: frekans`);
    assert.ok(["white", "pink", "brown"].includes(p.renk), `${k.slug}: gurultu rengi`);
  }
});

test("gorsel denetim: sigdir uzun metni kucultur, kisa metni tavanda birakir", () => {
  const D = require("../../lib/gorsel-denetim");
  assert.equal(D.sigdir("CAN START", 90, 1080, 0.76), 90);
  assert.ok(D.sigdir("WAS AEROELASTIC FLUTTER", 90, 1080, 0.76) < 70);
  assert.ok(D.sigdir("ONE STEP, A\\NMOVING MOUNTAIN", 67, 1080) <= 67);
});

test("kapak: mobil okunabilirlik ve 3 farkli konsept", () => {
  assert.equal(TS.mobilKontrol("40 MPH", "long").gecti, true);
  assert.equal(TS.mobilKontrol("THIS IS WAY TOO MANY WORDS", "long").gecti, false);
  const l = TS.konseptler(tacoma(), tacoma().baslik);
  assert.equal(l.length, 3);
  assert.equal(new Set(l.map((c) => c.metin)).size, 3);
});

test("konu puani: erisilemeyen sinyal 'unavailable', guven dusuk", () => {
  const r = KP.puanla({ pageviews: { aylikOrtalama: 50000, sonAy: 60000, ivme: 1.2, degiskenlik: 0.2 }, ozet: { muhendislikTerimi: 20, yil: 1986 },
    commonsVideo: 10, commonsGorsel: 300, nasa: 500, archiveOrg: 40 });
  assert.ok(r.unavailable.includes("searchDemand"));
  assert.ok(r.guven < 1 && r.puan > 0);
  assert.match(r.oncelik, /PRIORITY/);
});

test("ayar birlestirme ve ISO sure", () => {
  assert.deepEqual(birlestir({ a: 1, b: { c: 2 } }, { b: { d: 3 } }), { a: 1, b: { c: 2, d: 3 } });
  assert.equal(yt.sureSn("PT1M5S"), 65);
});
