// YORUM YANITLA — kanal videolarindaki yeni yorumlara olculu, cesitli yanit yazar.
//
// Ucretsiz (AI yok): yorumu kategorize eder (soru / ovgu / diger), yalnizca
// ANLAMLI ve SORU yorumlara cevaplar (her yoruma degil -> spam degil), tekrar
// cevaplamaz, calisma basina sinirli sayida. Etkilesim = algoritma yakiti.
//
// force-ssl izni gerekir (youtube-yetki.js ile alinmis). Durum: icerik/yanitlanan.json
//
// Kullanim: node yorum-yanitla.js [--limit N]

const fs = require("fs");
const path = require("path");
const https = require("https");

const KOK = __dirname;
const DURUM = path.join(KOK, "icerik", "yanitlanan.json");
const LIMIT = Number((process.argv.find(a => a.startsWith("--limit=")) || "").split("=")[1]) ||
  (process.argv.includes("--limit") ? Number(process.argv[process.argv.indexOf("--limit") + 1]) : 0) || 8;

function env(ad) {
  if (process.env[ad]) return String(process.env[ad]).trim();
  try { for (const l of fs.readFileSync(path.join(KOK, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && m[1] === ad) return m[2].trim(); } } catch (e) {}
  return "";
}
function istek(opt, govde) {
  return new Promise((coz, red) => {
    const r = https.request(opt, (res) => { const p = []; res.on("data", d => p.push(d));
      res.on("end", () => coz({ durum: res.statusCode, govde: Buffer.concat(p).toString("utf8") })); });
    r.on("error", red); if (govde) r.write(govde); r.end();
  });
}
async function token() {
  const g = new URLSearchParams({ client_id: env("YT_CLIENT_ID"), client_secret: env("YT_CLIENT_SECRET"),
    refresh_token: env("YT_REFRESH_TOKEN"), grant_type: "refresh_token" }).toString();
  const y = await istek({ hostname: "oauth2.googleapis.com", path: "/token", method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(g) } }, g);
  if (y.durum !== 200) throw new Error("OAuth jetonu alinamadi (HTTP " + y.durum + ")");
  return JSON.parse(y.govde).access_token;
}
const api = (tok, yol) => istek({ hostname: "www.googleapis.com", path: "/youtube/v3/" + yol,
  headers: { Authorization: "Bearer " + tok } });

// --- Yanit havuzlari (cesitli, marka tonu) ---
const SORU_YANIT = [
  "Great question — that could be a whole video on its own! Which topic should we cover next?",
  "Good one. What's your guess?",
  "Ooh, good question. Might dig into that in a future short. 👀",
  "Honestly a great question — the science behind it is wild.",
  "Love this question. Anyone else wondering the same?",
];
const OVGU_YANIT = [
  "Thanks for watching! New disaster every day. 🙏",
  "Appreciate it! 💥 Which one hit hardest?",
  "Glad you enjoyed it! There's a new one tomorrow.",
  "Thank you! History is wild, right?",
  "Means a lot — more coming every single day. 🌊",
];
const rasgele = (a) => a[Math.floor(Math.random() * a.length)];

function kategori(metin) {
  const t = metin.trim();
  if (/\?/.test(t)) return "soru";
  // cok kisa / sadece emoji -> atla (spam olmasin diye cevaplamiyoruz)
  const harf = t.replace(/[^A-Za-z0-9]/g, "");
  if (harf.length < 6) return "atla";
  // olumsuz/troll isaretleri -> atla (guvenli taraf)
  if (/\b(fake|stupid|trash|hate|boring|bot)\b/i.test(t)) return "atla";
  return "ovgu";
}

async function main() {
  const tok = await token();
  const yanitlanan = new Set((() => { try { return JSON.parse(fs.readFileSync(DURUM, "utf8")); } catch (e) { return []; } })());

  // Kanalin son yuklemelerini al
  const ch = await api(tok, "channels?part=contentDetails&mine=true");
  const uploads = (JSON.parse(ch.govde).items || [{}])[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("Yuklemeler listesi bulunamadi (izin/kanal?).");
  const pl = await api(tok, "playlistItems?part=contentDetails&maxResults=15&playlistId=" + uploads);
  const videoIds = (JSON.parse(pl.govde).items || []).map(i => i.contentDetails.videoId);

  let yanit = 0;
  for (const vid of videoIds) {
    if (yanit >= LIMIT) break;
    const c = await api(tok, "commentThreads?part=snippet&maxResults=20&order=time&videoId=" + vid);
    const threads = (JSON.parse(c.govde).items || []);
    for (const th of threads) {
      if (yanit >= LIMIT) break;
      const top = th.snippet.topLevelComment;
      const cid = top.id;
      const yazar = top.snippet.authorChannelId?.value;
      const metin = top.snippet.textOriginal || "";
      if (yanitlanan.has(cid)) continue;
      // kendi yorumumuza cevap verme
      if (th.snippet.totalReplyCount > 0) { yanitlanan.add(cid); continue; }
      const kat = kategori(metin);
      if (kat === "atla") { yanitlanan.add(cid); continue; }
      const cevap = kat === "soru" ? rasgele(SORU_YANIT) : rasgele(OVGU_YANIT);
      const body = JSON.stringify({ snippet: { parentId: cid, textOriginal: cevap } });
      const r = await istek({ hostname: "www.googleapis.com", path: "/youtube/v3/comments?part=snippet",
        method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body) } }, body);
      if (r.durum === 200) { console.log(`  ✓ [${kat}] "${metin.slice(0, 40)}" -> yanitlandi`); yanit++; }
      else console.log(`  ✗ yanit basarisiz (HTTP ${r.durum}): ${r.govde.slice(0, 120)}`);
      yanitlanan.add(cid);
      await new Promise(r => setTimeout(r, 800));
    }
  }
  fs.mkdirSync(path.dirname(DURUM), { recursive: true });
  fs.writeFileSync(DURUM, JSON.stringify([...yanitlanan], null, 2) + "\n");
  console.log(`Bitti. ${yanit} yorum yanitlandi (limit ${LIMIT}).`);
}
main().catch(e => { console.error("Hata: " + e.message); process.exit(1); });
