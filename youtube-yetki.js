// YOUTUBE YETKI — bir kez calistir, YT_REFRESH_TOKEN uret.
//
// Bu, yuklemenin gerektirdigi "yenileme jetonunu" (refresh token) almanin
// tek seferlik yoludur. Tarayicida Google onayindan gecersin; jeton ekrana
// yazilir; onu .env'e (ya da GitHub Secrets'a) koyarsin. Yukleme betikleri
// bundan sonra jetonu kendisi tazeler — bir daha giris gerekmez.
//
// Once .env'e sunlari koy (Google Cloud > API & Services > Credentials):
//   YT_CLIENT_ID=...
//   YT_CLIENT_SECRET=...
// Adim adim kurulum: MALIYET-VE-YETKILER.md
//
// Kullanim:
//   node youtube-yetki.js

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const KOK = __dirname;
const PORT = 53682;
const REDIRECT = "http://localhost:" + PORT;
// force-ssl = yukleme + metadata guncelleme (youtube-guncelle.js icin gerekli).
// Not: bu scope'un etkili olmasi icin bir kez yeniden yetkilendirme gerekir.
const SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

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

function jetonDegistir(clientId, clientSecret, code) {
  const govde = new URLSearchParams({
    code, client_id: clientId, client_secret: clientSecret,
    redirect_uri: REDIRECT, grant_type: "authorization_code",
  }).toString();
  return new Promise((coz, red) => {
    const r = https.request({
      hostname: "oauth2.googleapis.com", path: "/token", method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded",
                 "Content-Length": Buffer.byteLength(govde) },
    }, (res) => {
      const p = [];
      res.on("data", (d) => p.push(d));
      res.on("end", () => coz({ durum: res.statusCode, govde: Buffer.concat(p).toString("utf8") }));
    });
    r.on("error", red);
    r.write(govde);
    r.end();
  });
}

const clientId = env("YT_CLIENT_ID");
const clientSecret = env("YT_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  console.error("Once .env dosyasina YT_CLIENT_ID ve YT_CLIENT_SECRET yaz.");
  console.error("Nasil alinir: MALIYET-VE-YETKILER.md (Google Cloud OAuth istemcisi).");
  process.exit(1);
}

const yetkiUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPE,
  access_type: "offline",   // refresh_token almak icin sart
  prompt: "consent",        // her seferinde refresh_token dondur
}).toString();

const sunucu = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT);
  if (!u.searchParams.get("code") && !u.searchParams.get("error")) {
    res.writeHead(404); res.end(); return;
  }
  const hata = u.searchParams.get("error");
  if (hata) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Iptal edildi: " + hata + "</h2>");
    console.error("Yetki iptal edildi: " + hata);
    sunucu.close(); process.exit(1);
  }
  const code = u.searchParams.get("code");
  const y = await jetonDegistir(clientId, clientSecret, code);
  const j = JSON.parse(y.govde || "{}");
  if (y.durum === 200 && j.refresh_token) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Tamam. Terminale don, jetonu kopyala.</h2>");
    // Jetonu dogrudan .env'e yaz (terminalden kopyalamaya gerek kalmasin).
    try {
      const envYol = path.join(KOK, ".env");
      let icerik = "";
      try { icerik = fs.readFileSync(envYol, "utf8"); } catch (e) {}
      if (/^YT_REFRESH_TOKEN=.*$/m.test(icerik)) {
        icerik = icerik.replace(/^YT_REFRESH_TOKEN=.*$/m, "YT_REFRESH_TOKEN=" + j.refresh_token);
      } else {
        icerik += (icerik && !icerik.endsWith("\n") ? "\n" : "") + "YT_REFRESH_TOKEN=" + j.refresh_token + "\n";
      }
      fs.writeFileSync(envYol, icerik);
      console.log("\n✓ Basarili. YT_REFRESH_TOKEN .env dosyasina yazildi.");
    } catch (e) {
      console.log("\n✓ Basarili. .env'e yazilamadi, elle ekle:\nYT_REFRESH_TOKEN=" + j.refresh_token);
    }
    console.log("Not: OAuth onay ekrani Production modunda olmali (Test'te jeton 7 gunde olur).");
  } else {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Jeton alinamadi. Terminale bak.</h2>");
    console.error("Jeton alinamadi (HTTP " + y.durum + "): " + y.govde.slice(0, 400));
    if (!j.refresh_token && j.access_token) {
      console.error("access_token geldi ama refresh_token gelmedi — Google onayini");
      console.error("iptal edip tekrar dene (prompt=consent zorunlu).");
    }
  }
  sunucu.close(); process.exit(0);
});

sunucu.listen(PORT, () => {
  console.log("Tarayicida su adresi ac ve Google ile onayla:\n");
  console.log(yetkiUrl + "\n");
  console.log("Onaydan sonra bu pencere " + REDIRECT + " adresine doner ve");
  console.log("jeton terminale yazilir. (Dinleniyor: " + PORT + ")");
});
