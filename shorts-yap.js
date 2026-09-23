// SHORTS YAP — dikey (9:16) YouTube Shorts uretici.
//
// Gercek arsiv/stok goruntu (kamu mali) + dogal seslendirme + vurucu kinetik
// altyazi. Metin karti yok; gercek sahne var. Telifsiz, filigransiz.
//
// Girdi: uretim/<is>/konu.json
//   {
//     "kanal": "Failure Reconstructed",
//     "baslik": "...",
//     "ses": "en-US-AndrewNeural",      // Edge nöral ses (dogal)
//     "sesHizi": "+6%",
//     "altyaziFont": "Arial Black",     // istege bagli
//     "sahneler": [
//       { "metin": "cumle...", "kaynak": "Footage/x.mp4", "baslangic": 12 }
//     ]
//   }
// Kaynak klipler once indirilir (arsiv-bul.js). "baslangic" = kaynaktaki saniye.
//
// Cikti: uretim/<is>/Videos/<is>.mp4  (1080x1920)
//
// Kullanim: node shorts-yap.js <is-adi>

const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const FF = require("./ff-yol.js");
const font = require("./font-yol.js");

const KOK = __dirname;
const IS = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));
if (!IS) { console.error("Kullanim: node shorts-yap.js <is-adi>"); process.exit(1); }
const BASE = path.join(KOK, "uretim", IS);
if (!fs.existsSync(path.join(BASE, "konu.json"))) { console.error("Is yok: " + BASE); process.exit(1); }
const konu = JSON.parse(fs.readFileSync(path.join(BASE, "konu.json"), "utf8"));

const W = 1080, H = 1920, FPS = 30;
const SES = konu.ses || "en-US-AndrewNeural";
const HIZ = konu.sesHizi || "+6%";
const FONT = konu.altyaziFont || process.env.SHORTS_FONT || "Arial Black";
const KANAL = (konu.kanal || "Failure Reconstructed");
const HANDLE = konu.handle || ("@" + KANAL.replace(/[^A-Za-z0-9]/g, ""));
const ENDCARD = 1.8;   // saniye — markali kapanis karti (kisa = daha iyi retention)
const DFONT = font(true);   // drawtext icin acik font yolu
// Buyume: ekranda kanca (ilk ~2.5s) + sona etkilesim sorusu (yorum icin)
const cleanTxt = (s) => String(s || "").replace(/[{}]/g, "").replace(/\\/g, "").replace(/[<>]/g, "");
const HOOK = cleanTxt(konu.hook).toUpperCase();
const SORU = cleanTxt(konu.soru);
const sahneler = konu.sahneler || [];
if (!sahneler.length) { console.error("konu.json'da sahneler[] yok."); process.exit(1); }

const VID = path.join(BASE, "Videos");
fs.mkdirSync(VID, { recursive: true });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "shorts-" + IS + "-"));

const run = (a) => cp.execFileSync(FF.ffmpeg, a, { stdio: ["ignore", "ignore", "pipe"] });
const sure = (f) => parseFloat(cp.execFileSync(FF.ffprobe,
  ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString().trim());

// --- 1) Seslendirme (tek parca) -----------------------------------------
function seslendir(metin, dosya) {
  return new Promise(async (coz, red) => {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(SES, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const res = tts.toStream(metin, { rate: HIZ });
      const audioStream = res.audioStream || res;
      const chunks = [];
      audioStream.on("data", c => chunks.push(c));
      audioStream.on("end", () => { fs.writeFileSync(dosya, Buffer.concat(chunks)); coz(); });
      audioStream.on("close", () => { if (chunks.length) { try { fs.writeFileSync(dosya, Buffer.concat(chunks)); } catch (e) {} coz(); } });
      audioStream.on("error", red);
    } catch (e) { red(e); }
  });
}

// Edge TTS ara sira baglantiyi dusurur ("Stream closed..."). Tekrar dene.
async function seslendirGuvenli(metin, dosya, deneme = 4) {
  for (let i = 1; ; i++) {
    try {
      await seslendir(metin, dosya);
      if (fs.existsSync(dosya) && fs.statSync(dosya).size > 2000) return;
      throw new Error("ses cikti cok kisa/bos");
    } catch (e) {
      try { fs.unlinkSync(dosya); } catch (_) {}
      if (i >= deneme) throw new Error("Seslendirme " + deneme + " denemede basarisiz: " + e.message);
      process.stdout.write(`  (ses tekrar ${i}/${deneme}) `);
      await new Promise(r => setTimeout(r, 1500 * i));
    }
  }
}

// --- ASS zaman bicimi + kacis ------------------------------------------
const assTime = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
  return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`; };
const assKacis = (s) => String(s).replace(/[{}]/g, "").replace(/\\/g, "");

(async () => {
  console.log(`Shorts: ${IS}  (${W}x${H}, ${sahneler.length} sahne, ses ${SES})`);
  const vo = path.join(TMP, "vo.mp3");
  const anlati = sahneler.map(s => s.metin.trim()).join(" ");
  await seslendirGuvenli(anlati, vo);
  if (!fs.existsSync(vo) || fs.statSync(vo).size < 1000) throw new Error("Seslendirme uretilemedi.");
  const VODUR = sure(vo);

  // sahne sureleri: kelime payina gore
  const kelime = (t) => t.trim().split(/\s+/).length;
  const toplamK = sahneler.reduce((a, s) => a + kelime(s.metin), 0);
  let acc = 0;
  for (const s of sahneler) { s.dur = VODUR * kelime(s.metin) / toplamK; s.start = acc; acc += s.dur; }

  // baslangic: elle verilmemisse kaynak boyunca otomatik dagit; her zaman
  // kaynak suresine gore kirp (trim kaynak sonunu asmasin).
  const gruplar = {};
  sahneler.forEach((s, i) => { (gruplar[s.kaynak] = gruplar[s.kaynak] || []).push(i); });
  for (const [k, idxs] of Object.entries(gruplar)) {
    const kaynakYol = path.join(BASE, k);
    if (!fs.existsSync(kaynakYol)) continue;
    const kDur = sure(kaynakYol) || 0;
    idxs.forEach((idx, n) => {
      const s = sahneler[idx];
      const ust = Math.max(0, kDur - s.dur - 0.1);
      if (s.baslangic == null) {
        // ayni kaynagi paylasan sahneleri kaynak boyunca esit dagit (cesitlilik)
        s.baslangic = idxs.length > 1 ? ust * (n + 0.05) / idxs.length : Math.min(1.5, ust);
      }
      s.baslangic = Math.max(0, Math.min(s.baslangic, ust));
    });
  }

  // --- 2) her sahne icin dikey bulanik-dolgu klip ---
  const vf =
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=26:2,eq=brightness=-0.20:contrast=1.05[bg];" +
    "[0:v]scale=1080:-2[fg];" +
    "[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,noise=alls=6:allf=t+u,vignette=angle=PI/4.5,fps=30,format=yuv420p[v]";
  const klipler = [];
  for (let i = 0; i < sahneler.length; i++) {
    const s = sahneler[i];
    const kaynak = path.join(BASE, s.kaynak);
    if (!fs.existsSync(kaynak)) throw new Error("Kaynak klip yok: " + s.kaynak + " (once: node arsiv-bul.js " + IS + ")");
    const out = path.join(TMP, "s" + String(i).padStart(2, "0") + ".mp4");
    run(["-hide_banner", "-loglevel", "error", "-ss", String(s.baslangic || 0), "-t", s.dur.toFixed(3),
      "-i", kaynak, "-filter_complex", vf, "-map", "[v]", "-r", String(FPS),
      "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-an", "-y", out]);
    klipler.push(out);
    process.stdout.write(`\r  sahne ${i + 1}/${sahneler.length}   `);
  }
  console.log("");

  // --- 3) markali kapanis karti (prosedurel) ---
  const kelimeler = KANAL.toUpperCase().split(/\s+/);
  const satir1 = (kelimeler.length > 1 ? kelimeler[0] : KANAL.toUpperCase()).replace(/'/g, "");
  const satir2 = (kelimeler.length > 1 ? kelimeler.slice(1).join(" ") : "").replace(/'/g, "");
  const wmFs = Math.round(W * 0.078);
  const y1 = Math.round(H * (satir2 ? 0.38 : 0.42));
  const y2 = y1 + Math.round(wmFs * 1.02);
  const followY = (satir2 ? y2 : y1) + Math.round(wmFs * 1.45);
  const wmDraw = (txt, y, delay) =>
    `drawtext=fontfile='${DFONT}':text='${txt}':fontcolor=white:fontsize=${wmFs}:x=(w-tw)/2:y=${y}:alpha='clip((t-${delay})/0.5\\,0\\,1)':shadowcolor=black@0.5:shadowy=3`;
  const endcard = path.join(TMP, "endcard.mp4");
  run(["-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", `color=c=0x0b1a2e:s=${W}x${H}:d=${ENDCARD}:r=${FPS}`,
    "-f", "lavfi", "-i", `gradients=s=${W}x${H}:c0=0x1d4e74:c1=0x00000000:type=radial:x0=${W/2}:y0=${H*0.4}:nb_colors=2:d=${ENDCARD}`,
    "-filter_complex",
      `[1]format=rgba,colorchannelmixer=aa=0.5[g];[0][g]overlay,vignette=angle=PI/4.2,noise=alls=5:allf=t+u,` +
      wmDraw(satir1, y1, 0) + "," +
      (satir2 ? wmDraw(satir2, y2, 0.12) + "," : "") +
      `drawtext=fontfile='${DFONT}':text='FOLLOW FOR MORE':fontcolor=0xd9a441:fontsize=${Math.round(W * 0.040)}:x=(w-tw)/2:y=${followY}:alpha='clip((t-0.5)/0.5\\,0\\,1)',format=yuv420p[v]`,
    "-map", "[v]", "-t", String(ENDCARD),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an", "-y", endcard]);

  // --- birlestir (sahneler + kapanis karti) ---
  const liste = path.join(TMP, "l.txt");
  fs.writeFileSync(liste, klipler.concat([endcard]).map(f => `file '${f}'`).join("\n"));
  const vid = path.join(TMP, "vid.mp4");
  run(["-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", liste, "-c", "copy", "-y", vid]);
  const TOPLAM = sure(vid);

  // --- muzik yatagi (prosedurel, telifsiz, konuya gore hafif farkli) ---
  const bed = path.join(TMP, "bed.wav");
  const kok = 50 + (IS.length % 6) * 4;                 // 50..70 Hz — konuya gore
  run(["-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", `sine=frequency=${kok}:duration=${TOPLAM.toFixed(2)}`,
    "-f", "lavfi", "-i", `sine=frequency=${(kok * 1.5).toFixed(2)}:duration=${TOPLAM.toFixed(2)}`,
    "-f", "lavfi", "-i", `anoisesrc=d=${TOPLAM.toFixed(2)}:c=pink:a=0.04`,
    "-filter_complex",
      `[0]volume=0.55,tremolo=f=0.12:d=0.5[a];[1]volume=0.26[b];` +
      `[2]highpass=f=180,lowpass=f=1100,volume=0.6[c];` +
      `[a][b][c]amix=inputs=3:normalize=0,lowpass=f=850,aecho=0.8:0.9:550|850:0.28|0.2,` +
      `afade=t=in:st=0:d=1.6,afade=t=out:st=${(TOPLAM - 1.6).toFixed(2)}:d=1.6[m]`,
    "-map", "[m]", "-t", TOPLAM.toFixed(2), "-y", bed]);

  // --- 4) ASS altyazi (2-3 kelimelik gruplar, orantisal zaman) ---
  const events = [];
  for (const s of sahneler) {
    const words = s.metin.replace(/[.,;:!?]/g, "").split(/\s+/).filter(Boolean);
    const wt = words.map(w => w.length + 1); const tw = wt.reduce((a, b) => a + b, 0);
    let c = 0; const bounds = words.map((w, i) => { const st = s.start + s.dur * c / tw; c += wt[i]; return { w, st, en: s.start + s.dur * c / tw }; });
    for (let i = 0; i < bounds.length;) {
      const n = (bounds.length - i === 3) ? 3 : Math.min(2, bounds.length - i);
      const grp = bounds.slice(i, i + n);
      events.push({ st: grp[0].st, en: grp[grp.length - 1].en, txt: grp.map(g => g.w.toUpperCase()).join(" ") });
      i += n;
    }
  }
  for (let i = 0; i < events.length - 1; i++) if (events[i + 1].st - events[i].en < 0.12) events[i].en = events[i + 1].st;

  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Pop,${FONT},90,&H00FFFFFF,&H00000000,&H64000000,1,1,7,3,2,60,60,470,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
` + events.map(e => {
    const eff = "{\\fad(70,60)\\t(0,120,\\fscx116\\fscy116)\\t(120,220,\\fscx100\\fscy100)}";
    return `Dialogue: 0,${assTime(e.st)},${assTime(e.en)},Pop,,0,0,0,,${eff}${assKacis(e.txt)}`;
  }).join("\n") + "\n" + (() => {
    // BUYUME: ekranda kanca (ilk ~2.5s, ust-orta, iri) + sona etkilesim sorusu.
    const cx = Math.round(W / 2);
    const ekstra = [];
    if (HOOK) {
      const fs = Math.round(W * 0.062), bord = Math.max(4, Math.round(W * 0.005));
      const y = Math.round(H * 0.40);
      const hookSon = Math.min(2.7, VODUR * 0.4);
      ekstra.push(`Dialogue: 0,${assTime(0.15)},${assTime(hookSon)},Pop,,0,0,0,,` +
        `{\\an5\\pos(${cx},${y})\\fs${fs}\\bord${bord}\\shad3\\fad(160,220)}${assKacis(HOOK.toUpperCase())}`);
    }
    if (SORU) {
      const fs = Math.round(W * 0.040), bord = Math.max(3, Math.round(W * 0.004));
      const y = Math.round(H * 0.30);
      const bas = Math.max(0, VODUR - 2.8);
      ekstra.push(`Dialogue: 0,${assTime(bas)},${assTime(VODUR)},Pop,,0,0,0,,` +
        `{\\an5\\pos(${cx},${y})\\fs${fs}\\bord${bord}\\1c&H41A4D9&\\fad(200,160)}${assKacis(SORU)}`);
    }
    return ekstra.join("\n") + (ekstra.length ? "\n" : "");
  })();
  const assPath = path.join(TMP, "cap.ass");
  fs.writeFileSync(assPath, ass);

  // --- 5) handle filigrani + altyazi + ses (loudnorm konusma + ducking'li muzik) ---
  const cikti = path.join(VID, IS + ".mp4");
  const hy = Math.round(H * 0.052);
  const vFilter =
    `[0:v]drawtext=fontfile='${DFONT}':text='${HANDLE.replace(/'/g, "")}':fontcolor=white@0.72:` +
    `fontsize=${Math.round(W * 0.030)}:x=(w-tw)/2:y=${hy}:shadowcolor=black@0.5:shadowx=0:shadowy=2,` +
    `subtitles='${assPath.replace(/:/g, "\\:")}',format=yuv420p[v]`;
  const aFilter =
    `[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad,asplit=2[vo1][vo2];` +
    `[2:a]volume=1.0[mus];` +
    `[mus][vo1]sidechaincompress=threshold=0.035:ratio=6:attack=6:release=340[duck];` +
    `[duck][vo2]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[a]`;
  run(["-hide_banner", "-loglevel", "error", "-i", vid, "-i", vo, "-i", bed,
    "-filter_complex", vFilter + ";" + aFilter,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-y", cikti]);

  console.log(`✓ Bitti: ${path.relative(KOK, cikti)}  (${sure(cikti).toFixed(1)}s, ${W}x${H})`);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
})().catch(e => { console.error("\nHata: " + e.message); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {} process.exit(1); });
