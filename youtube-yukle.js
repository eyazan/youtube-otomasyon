// YOUTUBE YUKLEYICI — bitmis MP4'u YouTube Data API v3 ile yukler.
//
// Guvenlik ilkeleri (bu dosyanin tamami bunlara gore yazildi):
//   1) Kendiliginden CALISMAZ. Sadece acikca cagrildiginda ve ucu birden
//      kimlik bilgisi (.env / ortam) varken yukler.
//   2) Varsayilan gizlilik "private". Video herkese acik olmaz; sen panelden
//      inceleyip elle "public" yaparsin. Otomatik yayin YOK.
//   3) Ek npm bagimliligi yok — reponun ham-HTTPS stili. OAuth2 refresh_token
//      ile access_token alinir, sonra "resumable upload" yapilir.
//
// Kullanim:
//   node youtube-yukle.js <is-adi>            # yukler (kimlik varsa)
//   node youtube-yukle.js <is-adi> --dogrula  # KURU CALISMA: ne yuklenecegini
//                                             # gosterir, hicbir sey gondermez
//   node youtube-yukle.js <is-adi> --herkese-acik   # gizlilik: public (dikkat)
//   node youtube-yukle.js <is-adi> --liste-disi     # gizlilik: unlisted
//
// Kimlik bilgileri (.env ya da ortam degiskeni; GitHub Actions'ta Secrets):
//   YT_CLIENT_ID      Google Cloud OAuth istemci kimligi
//   YT_CLIENT_SECRET  Google Cloud OAuth istemci sirri
//   YT_REFRESH_TOKEN  Bir kez alinan yenileme jetonu (offline erisim)
//   YT_PRIVACY        (istege bagli) private | unlisted | public  (varsayilan private)
//   YT_CATEGORY_ID    (istege bagli) YouTube kategori kimligi (varsayilan 27=Egitim)
//
// Yukleme metni oncelik sirasi:
//   uretim/<is>/YUKLEME.json  ({ "baslik":"", "aciklama":"", "etiketler":[] })
//   -> yoksa konu.json'dan (baslik_en, _not) turetilir.

const fs = require("fs");
const path = require("path");
const https = require("https");

const KOK = __dirname;

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

// --- Basit HTTPS yardimcisi (JSON / ham govde) ---------------------------
function istek(opt, govde) {
  return new Promise((coz, red) => {
    const r = https.request(opt, (res) => {
      const parcalar = [];
      res.on("data", (d) => parcalar.push(d));
      res.on("end", () => coz({
        durum: res.statusCode,
        basliklar: res.headers,
        govde: Buffer.concat(parcalar).toString("utf8"),
      }));
    });
    r.on("error", red);
    if (govde) r.write(govde);
    r.end();
  });
}

// refresh_token -> kisa omurlu access_token
async function erisimJetonu(clientId, clientSecret, refreshToken) {
  const govde = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }).toString();
  const y = await istek({
    hostname: "oauth2.googleapis.com",
    path: "/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(govde),
    },
  }, govde);
  if (y.durum !== 200) {
    throw new Error("OAuth jetonu alinamadi (HTTP " + y.durum + "). "
      + "YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN dogru mu?");
  }
  const j = JSON.parse(y.govde);
  if (!j.access_token) throw new Error("OAuth yaniti access_token icermiyor.");
  return j.access_token;
}

// --- Yukleme metni --------------------------------------------------------
function yuklemeMetni(BASE) {
  const ozelYol = path.join(BASE, "YUKLEME.json");
  if (fs.existsSync(ozelYol)) {
    const j = JSON.parse(fs.readFileSync(ozelYol, "utf8"));
    return {
      baslik: String(j.baslik || "").slice(0, 100),
      aciklama: String(j.aciklama || ""),
      etiketler: Array.isArray(j.etiketler) ? j.etiketler.map(String) : [],
    };
  }
  const konu = JSON.parse(fs.readFileSync(path.join(BASE, "konu.json"), "utf8"));
  const baslik = String(konu.baslik || konu.baslik_en || path.basename(BASE)).slice(0, 100);
  const aciklama = String(konu.aciklama || konu._not || "");
  const etiketler = Array.isArray(konu.etiketler) ? konu.etiketler.map(String) : [];
  return { baslik, aciklama, etiketler };
}

// YouTube baslik/aciklamada '<' ve '>' reddedilir.
const temizle = (s) => String(s).replace(/[<>]/g, "");

// --- Resumable upload -----------------------------------------------------
async function yuklemeOturumu(token, snippet, status) {
  const meta = JSON.stringify({ snippet, status });
  const y = await istek({
    hostname: "www.googleapis.com",
    path: "/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json; charset=UTF-8",
      "Content-Length": Buffer.byteLength(meta),
      "X-Upload-Content-Type": "video/*",
    },
  }, meta);
  if (y.durum !== 200 || !y.basliklar.location) {
    throw new Error("Yukleme oturumu acilamadi (HTTP " + y.durum + "): " + y.govde.slice(0, 400));
  }
  return y.basliklar.location; // yukleme URL'si
}

function govdeyiGonder(yuklemeUrl, dosya, boyut) {
  const u = new URL(yuklemeUrl);
  return new Promise((coz, red) => {
    const r = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "PUT",
      headers: { "Content-Length": boyut, "Content-Type": "video/*" },
    }, (res) => {
      const parcalar = [];
      res.on("data", (d) => parcalar.push(d));
      res.on("end", () => coz({ durum: res.statusCode, govde: Buffer.concat(parcalar).toString("utf8") }));
    });
    r.on("error", red);
    fs.createReadStream(dosya).pipe(r);
  });
}

// --- Ana akis -------------------------------------------------------------
async function main() {
  const argv = process.argv.slice(2);
  const IS = argv.find((a) => !a.startsWith("--"));
  const kuru = argv.includes("--dogrula");
  let gizlilik = (env("YT_PRIVACY") || "private").toLowerCase();
  if (argv.includes("--herkese-acik")) gizlilik = "public";
  if (argv.includes("--liste-disi")) gizlilik = "unlisted";
  if (!["private", "unlisted", "public"].includes(gizlilik)) gizlilik = "private";

  if (!IS) {
    console.error("Kullanim: node youtube-yukle.js <is-adi> [--dogrula] [--herkese-acik|--liste-disi]");
    process.exit(1);
  }

  const BASE = path.join(KOK, "uretim", IS);
  if (!fs.existsSync(path.join(BASE, "konu.json"))) {
    console.error("Is bulunamadi: " + BASE);
    process.exit(1);
  }

  // Bitmis videoyu bul.
  const VID = path.join(BASE, "Videos");
  let dosya = path.join(VID, IS + ".mp4");
  if (!fs.existsSync(dosya)) {
    const mp4ler = fs.existsSync(VID)
      ? fs.readdirSync(VID).filter((f) => f.toLowerCase().endsWith(".mp4"))
      : [];
    if (!mp4ler.length) {
      console.error("Yuklenecek MP4 yok. Once render: node video-yap.js " + IS);
      process.exit(1);
    }
    dosya = path.join(VID, mp4ler.sort().pop());
  }
  const boyut = fs.statSync(dosya).size;

  const metin = yuklemeMetni(BASE);
  const snippet = {
    title: temizle(metin.baslik) || IS,
    description: temizle(metin.aciklama),
    tags: metin.etiketler.slice(0, 30),
    categoryId: env("YT_CATEGORY_ID") || "27",
  };
  const status = { privacyStatus: gizlilik, selfDeclaredMadeForKids: false };

  console.log("Dosya      : " + path.relative(KOK, dosya) + "  (" + (boyut / 1e6).toFixed(1) + " MB)");
  console.log("Baslik     : " + snippet.title);
  console.log("Gizlilik   : " + gizlilik + (gizlilik === "public" ? "  ⚠ HERKESE ACIK" : ""));
  console.log("Etiket     : " + (snippet.tags.join(", ") || "(yok)"));

  const clientId = env("YT_CLIENT_ID");
  const clientSecret = env("YT_CLIENT_SECRET");
  const refreshToken = env("YT_REFRESH_TOKEN");
  const kimlikVar = clientId && clientSecret && refreshToken;

  if (kuru) {
    console.log("\n[--dogrula] KURU CALISMA. Hicbir sey yuklenmedi.");
    console.log("Kimlik bilgileri: " + (kimlikVar ? "hazir (yukleme yapilabilir)" : "EKSIK"));
    if (!kimlikVar) {
      console.log("  Gereken: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN");
      console.log("  Kurulum: MALIYET-VE-YETKILER.md");
    }
    return;
  }

  if (!kimlikVar) {
    console.error("\nKimlik bilgileri eksik — yukleme YAPILMADI.");
    console.error("Gereken: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (.env ya da ortam).");
    console.error("Kurulum adimlari: MALIYET-VE-YETKILER.md");
    console.error("Ne yuklenecegini gormek icin: node youtube-yukle.js " + IS + " --dogrula");
    process.exit(2);
  }

  console.log("\nOAuth jetonu aliniyor...");
  const token = await erisimJetonu(clientId, clientSecret, refreshToken);
  console.log("Yukleme oturumu aciliyor...");
  const yuklemeUrl = await yuklemeOturumu(token, snippet, status);
  console.log("Video gonderiliyor (" + (boyut / 1e6).toFixed(1) + " MB)...");
  const son = await govdeyiGonder(yuklemeUrl, dosya, boyut);
  if (son.durum === 200 || son.durum === 201) {
    const j = JSON.parse(son.govde);
    console.log("\n✓ Yuklendi. Video kimligi: " + j.id);
    console.log("  https://youtu.be/" + j.id + "  (gizlilik: " + gizlilik + ")");
    if (gizlilik !== "public") {
      console.log("  Herkese acmak icin YouTube Studio'dan inceleyip yayinla.");
    }
  } else {
    console.error("\nYukleme basarisiz (HTTP " + son.durum + "): " + son.govde.slice(0, 600));
    process.exit(1);
  }
}

main().catch((e) => { console.error("Hata: " + e.message); process.exit(1); });
