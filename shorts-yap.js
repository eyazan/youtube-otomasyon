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

// --- ASS zaman bicimi + kacis ------------------------------------------
const assTime = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
  return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`; };
const assKacis = (s) => String(s).replace(/[{}]/g, "").replace(/\\/g, "");

(async () => {
  console.log(`Shorts: ${IS}  (${W}x${H}, ${sahneler.length} sahne, ses ${SES})`);
  const vo = path.join(TMP, "vo.mp3");
  const anlati = sahneler.map(s => s.metin.trim()).join(" ");
  await seslendir(anlati, vo);
  if (!fs.existsSync(vo) || fs.statSync(vo).size < 1000) throw new Error("Seslendirme uretilemedi.");
  const VODUR = sure(vo);

  // sahne sureleri: kelime payina gore
  const kelime = (t) => t.trim().split(/\s+/).length;
  const toplamK = sahneler.reduce((a, s) => a + kelime(s.metin), 0);
  let acc = 0;
  for (const s of sahneler) { s.dur = VODUR * kelime(s.metin) / toplamK; s.start = acc; acc += s.dur; }

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

  // --- 3) birlestir ---
  const liste = path.join(TMP, "l.txt");
  fs.writeFileSync(liste, klipler.map(f => `file '${f}'`).join("\n"));
  const vid = path.join(TMP, "vid.mp4");
  run(["-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", liste, "-c", "copy", "-y", vid]);

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
  }).join("\n") + "\n";
  const assPath = path.join(TMP, "cap.ass");
  fs.writeFileSync(assPath, ass);

  // --- 5) altyazi yak + ses mux ---
  const cikti = path.join(VID, IS + ".mp4");
  run(["-hide_banner", "-loglevel", "error", "-i", vid, "-i", vo,
    "-filter_complex", `[0:v]subtitles='${assPath.replace(/:/g, "\\:")}',format=yuv420p[v]`,
    "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", "-y", cikti]);

  console.log(`✓ Bitti: ${path.relative(KOK, cikti)}  (${sure(cikti).toFixed(1)}s, ${W}x${H})`);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
})().catch(e => { console.error("\nHata: " + e.message); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {} process.exit(1); });
