# GLL-P01 Roberto Carlos frikiği: mevcut motor ve izole Three.js pilotu (29 Ekim 2026)

Yalnızca inceleme içindir. GLL yayını kapalı. Bu dal production render hattına, kök `package.json` dosyasına veya
workflow'lara dokunmaz.

## Aynı girdi

İki video da aynı anlatım metni (`GLL-P01/topic.json`), aynı ses miksi ve aynı altyazı zamanlarıyla üretildi.
Ses ve altyazı, bugün mevcut motorla yapılan render'dan alındı.

- **Ses:** Kokoro af_heart önizleme sesi, 33,03 s. Onaylı ses değil; Edge bu ortamdan erişilemiyor (DNS).
- **Sahne zamanları:** Three.js pilotu sahnelerini altyazı metninden türetiyor (`Lyon`, `Spin pushes` gibi).
  Böylece yeniden seslendirilen bir kayıt kendi kendine yeniden zamanlanır.

## Ölçümler (bu container, 1080×1920, 30 fps)

| | Mevcut motor (SVG + Chromium) | Three.js pilotu (WebGL, SwiftShader CPU) |
|---|---|---|
| Toplam süre | 2 dk 52 s (anlatım ~50 s, QA ve paket dahil; 3 paralel worker) | 14 dk 48 s (tek sayfa, yalnızca kare + mux; QA yok) |
| Kare başına | — (paralel) | 893 ms |
| Çıktı | 12,5 MB, 3,0 Mbit/s | 18,6 MB, 4,5 Mbit/s |
| Determinizm | QA PASS (4 kare, iki temiz sayfa) | Aynı karenin iki ayrı render'ı byte düzeyinde aynı (3,0 / 12,3 / 24,9 s) |
| Teknik QA | `qa.js` PASS | Henüz `qa.js`'den geçirilmedi (izole pilot) |

Render maliyeti hakkında not: Three.js tarafı paralelleştirilmedi. Üç worker ile yaklaşık 5 dakikaya inmesi beklenir,
ancak bu **ölçülmedi**. GitHub Actions süresi de ölçülmedi.

## Bilimsel doğruluk

| | Mevcut motor | Three.js pilotu |
|---|---|---|
| Fizik | Sürüklenme + Magnus RK4, **birimsiz katsayılar** (`kd`, `km`). Ekrandaki 2D projeksiyon elle yerleştirilmiş. | SI birimleriyle 3D: m = 0,43 kg, r = 0,11 m, ρ = 1,2, Cd = 0,25; F_m = ½ρA r (ω×v); RK4, 1/600 s |
| Hedef | Yörünge görsel olarak kaleye yönlendirilmiş | Yaw ve pitch Newton yöntemiyle çözülüyor: top sağ direğin içinden, 1,35 m yükseklikten giriyor |
| Spin yoksa | Gösterilmiyor | Aynı vuruş spinsiz: direğin 6,6 m dışından geçiyor (kırmızı iz) |
| Kuvvetler | Yön şeması, değer yok | Anlık değerler: 32 m/s'de Magnus ≈ 5,0 N, sürüklenme ≈ 5,8 N (top ağırlığı 4,2 N) |
| Spiral | Birimsiz model, "a kick's length" işareti | Aynı model, yerçekimi kapalıyken 12 s boyunca; dönme yarıçapı 104 m'den 15 m'ye iniyor |
| Etiketleme | ANIMATION · RECONSTRUCTION · PHYSICS MODEL | ILLUSTRATION · MODEL; mesafe "≈35 m, kaynaklarda 33 m – 40 yd" |

Bilinmeyen tarihsel değerler ölçüm gibi sunulmuyor:

- Hız 38 m/s ve spin 10 tur/s, raporlanan şekli üreten **örnek** değerlerdir.
- Gerçek 1997 vuruşu hiçbir zaman ölçülmedi.
- Duvar ve kaleci temsilidir ve yüzsüz mankenlerle gösteriliyor. Gerçek takım renkleri ve benzerlik kullanılmıyor.

## Görsel kalite (kontak sayfaları: `review/`)

Three.js pilotunda gerçekten daha iyi olanlar:

- **Derinlik ve ışık:** biçilmiş çim şeritleri, gölgeler, ACES ton eşleme, fog.
- **Gerçek 3D:** ağ, direk ve üst direk gerçek 3D nesneler.
- **Kamera dili:** sahneye göre değişiyor; kuruluş, yakın plan, takip, kalecinin arkası, kuşbakışı.
- **Okunabilirlik:** kuvvet okları ve hız göstergesi aynı karede.

Mevcut motorda daha iyi olanlar:

- Stadyum atmosferi (tribün, projektörler).
- Tamamlanmış QA ve paket hattı.
- Daha hızlı render.

Pilotta kalan kusurlar (dürüst liste):

1. **27 s, spiral sahnesi:** kamera 185 m yükseklikte. Çim düzleminin kenarı görünüyor (soldaki koyu şerit).
2. **Vuruş yakın planı:** oyuncunun ayağı yok, top yerinde dönüyor. "Outside of his left foot" görsel olarak
   anlatılmıyor.
3. **Mankenler kaba:** kapsül geometrisi.
4. **Stadyum yok:** arka plan koyu boşluk.
5. **Spinin görünürlüğü:** spin, top dokusunun dönüşüyle gösteriliyor. Ancak 30 fps'de 10 tur/s gerçek hızda
   okunmuyor (yakın planda yavaşlatılmış).
6. **Hook ve payoff aynı kamera:** bu döngü için kasıtlı, ama tekrar gibi okunabilir.

## Değerlendirme

| Ölçüt | Mevcut | Three.js | Yorum |
|---|---|---|---|
| Görsel profesyonellik | Düz 2D | Belirgin şekilde daha iyi (derinlik, ışık, kamera) | Kusurlar 1–4 giderilmeden yayın kalitesi değil |
| Bilimsel doğruluk | Mekanizma doğru, sayılar birimsiz | Mekanizma ve sayılar SI; spinsiz karşılaştırma var | Pilot daha güçlü |
| Render maliyeti | 2 dk 52 s | 14 dk 48 s (tek worker) | Pilot ~5 kat yavaş; paralelleştirme ölçülmeli |
| Otomasyon | Tam hat | Konuya özel sahne kodu | Pilotun genellenmesi (şablon) gerekiyor |

**Öneri:** production entegrasyonu henüz önerilmiyor. Önce şunlar yapılmalı:

- kusur 1–2 düzeltilmeli;
- 3 worker ile paralel render süresi ölçülmeli;
- pilot `qa.js`'den geçirilmeli;
- aynı yaklaşım FR Gemini 8 pilotunda ikinci kez kanıtlanmalı.

Karar ve onay sende.

## Yeniden üretme

```
cd pilots/gll-magnus-3d && npm install       # three@0.170.0, kök package.json'dan bağımsız
node physics.js                              # model çıktısı
node render.js --audio-from <GLL-P01 out klasörü> --fps 30
```
