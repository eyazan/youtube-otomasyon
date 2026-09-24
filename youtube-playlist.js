// YOUTUBE PLAYLIST — videoyu dogru seriye (playlist) ekler; liste yoksa olusturur.
//
// Seriler binge izlemeyi artirir (oturum suresi = algoritma odulu) ve kanal
// sayfasini duzenli gosterir. force-ssl izni gerekir.
//
// Modul:  const pl = require("./youtube-playlist"); await pl.ekle(token, videoId, listeAdi)
// CLI:    node youtube-playlist.js <video-id> "<liste adi>"
//         node youtube-playlist.js --hepsi     # kanaldaki tum videolari serilere dagit

const fs = require("fs");
const path = require("path");
const https = require("https");

const KOK = __dirname;

// Konu turune gore varsayilan seri
const SERILER = {
  arsiv: { ad: "Disasters Caught on Film",
    aciklama: "Real archival footage of history's greatest disasters and engineering failures - reconstructed in under a minute." },
  stok: { ad: "The Science of Failure",
    aciklama: "How bridges, buildings, planes and ships actually fail - the physics and engineering behind disaster." },
};
function seriAdi(konu) {
  if (konu && konu.playlist) return konu.playlist;
  return (konu && konu.tur === "stok") ? SERILER.stok.ad : SERILER.arsiv.ad;
}

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
const get = (tok, yol) => istek({ hostname: "www.googleapis.com", path: "/youtube/v3/" + yol,
  headers: { Authorization: "Bearer " + tok } }).then(r => JSON.parse(r.govde));
async function post(tok, yol, obj) {
  const body = JSON.stringify(obj);
  const r = await istek({ hostname: "www.googleapis.com", path: "/youtube/v3/" + yol, method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, body);
  if (r.durum !== 200) throw new Error(yol.split("?")[0] + " HTTP " + r.durum + ": " + r.govde.slice(0, 200));
  return JSON.parse(r.govde);
}

// Adi verilen listeyi bul; yoksa herkese acik olarak olustur.
async function listeBulYaDaOlustur(tok, ad) {
  const d = await get(tok, "playlists?part=snippet&mine=true&maxResults=50");
  const var_ = (d.items || []).find(p => p.snippet.title === ad);
  if (var_) return var_.id;
  const bilgi = Object.values(SERILER).find(s => s.ad === ad);
  const yeni = await post(tok, "playlists?part=snippet,status", {
    snippet: { title: ad, description: bilgi ? bilgi.aciklama : "" },
    status: { privacyStatus: "public" },
  });
  console.log("  + yeni seri olusturuldu: " + ad);
  return yeni.id;
}

async function ekle(tok, videoId, ad) {
  const listeId = await listeBulYaDaOlustur(tok, ad);
  // zaten listede mi?
  const mevcut = await get(tok, "playlistItems?part=contentDetails&maxResults=50&playlistId=" + listeId);
  if ((mevcut.items || []).some(i => i.contentDetails.videoId === videoId)) {
    console.log("  = zaten serinin icinde: " + ad); return;
  }
  await post(tok, "playlistItems?part=snippet", {
    snippet: { playlistId: listeId, resourceId: { kind: "youtube#video", videoId } },
  });
  console.log("  ✓ seriye eklendi: " + ad);
}

module.exports = { ekle, seriAdi, token, SERILER };

// --- CLI ---
if (require.main === module) {
  (async () => {
    const tok = await token();
    const argv = process.argv.slice(2);
    if (argv[0] === "--hepsi") {
      // Kanaldaki videolari basliga gore konu dosyasiyla eslestirip serilere dagit.
      const konular = fs.readdirSync(path.join(KOK, "icerik", "konular"))
        .filter(f => f.endsWith(".json"))
        .map(f => JSON.parse(fs.readFileSync(path.join(KOK, "icerik", "konular", f), "utf8")));
      const ch = await get(tok, "channels?part=contentDetails&mine=true");
      const up = ch.items[0].contentDetails.relatedPlaylists.uploads;
      const vids = await get(tok, "playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=" + up);
      for (const v of vids.items || []) {
        const baslik = v.snippet.title;
        const k = konular.find(x => x.baslik === baslik) || null;
        console.log(`- ${baslik.slice(0, 50)}`);
        await ekle(tok, v.contentDetails.videoId, seriAdi(k));
      }
    } else {
      const [vid, ad] = argv;
      if (!vid || !ad) { console.error('Kullanim: node youtube-playlist.js <video-id> "<liste adi>"  |  --hepsi'); process.exit(1); }
      await ekle(tok, vid, ad);
    }
  })().catch(e => { console.error("Hata: " + e.message); process.exit(1); });
}
