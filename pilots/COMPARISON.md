# İzole Three.js pilotları ile mevcut motor: ikinci tur (29 Ekim 2026)

Yalnızca inceleme içindir. Hiçbir pilot yüklenmez. Production render hattına, kök `package.json` dosyasına ve
workflow'lara dokunulmadı. Her pilotun kendi `package.json` dosyası var ve `three@0.170.0` sabitlendi.

| Pilot | Konu | Ses ve altyazı |
|---|---|---|
| `gll-magnus-3d/` | GLL-P01: Roberto Carlos 1997, Magnus etkisi | Mevcut motorun bugünkü render'ı (Kokoro önizleme) |
| `fr-gemini8-3d/` | FR Gemini 8 (1966): takılı kalan roll iticisi | Mevcut motorun gölge render'ı (`--shadow`, yayınlanamaz; Kokoro önizleme) |

Her iki karşılaştırmada iki video aynı ses dosyasını ve aynı altyazı zamanlarını kullanıyor.

## 1. Render maliyeti (aynı paralellik: 2 worker, önbellek yok, bu container, 4 vCPU)

Ölçülen süre yalnızca karelerin render'ıdır. Anlatım ve QA dahil değil.

| | Mevcut motor | Three.js | Oran |
|---|---|---|---|
| GLL-P01 (991 kare, 33 s) | 119,7 s (121 ms/kare) | 313 s (316 ms/kare) | 2,6× |
| FR Gemini 8 (747 kare, 24,9 s) | 104,6 s (140 ms/kare) | 106 s (142 ms/kare) | 1,0× |

İlk turda "2:52 ile 14:48" ölçülmüştü. Bu iki ölçüm karşılaştırılabilir değildi:

- mevcut motor 3 worker kullanıyordu, Three.js 1 worker;
- mevcut motorun süresine anlatım ve QA da dahildi.

Darboğaz profil ölçümüyle bulundu ve şu iyileştirmeler yapıldı:

| Ölçüm / değişiklik | Kare başına süre |
|---|---|
| Sahne kodu (JS + çizim komutları) | ~30 ms |
| SwiftShader'ın piksel doldurması (ekran yakalama anında) | ~560 ms |
| CPU kompozitörü (`--disable-gpu-compositing`) | −%20 |
| Büyük yüzeylerde ucuz materyaller (çim Lambert, tribün unlit) ve PCF gölge | 395 ms |
| 3D katman %75 çözünürlükte, yazılar tam 1080×1920 | 293 ms |

- **GLL sonucu:** kare başına 556 ms'den 293 ms'ye.
- **Kalan fark:** stadyum ve çim gibi tam ekran 3D yüzeyler. Uzay sahnesinde (Gemini) fark yok.
- **Paralellik:** 4 çekirdekte 3. worker hız kazandırmıyor (2 worker: 39,7 s; 3 worker: 39,8 s; 90 kare). SwiftShader
  zaten bütün çekirdekleri kullanıyor.

## 2. Teknik QA (`pilots/lib/qa.js`)

Mevcut motorun ölçüm araçları kullanıldı:

- `scripts/fr-premium/qa-vertical.js`;
- yazı yerleşimi: her 0,25 s'de bir güvenli alan, çakışma ve en küçük punto;
- durağan kare süresi;
- iki ayrı tarayıcıda byte düzeyinde determinizm.

| | GLL 3D | Gemini 3D |
|---|---|---|
| Sert kontroller | **PASS** | **PASS** |
| Uyarılar | süre 33 s; bir altyazı 22,3 karakter/s; döngü geçişi | süre 24,9 s; bir altyazı 24,6 karakter/s; döngü geçişi |
| Determinizm | 4 karede aynı | 4 karede aynı |

QA bu turda gerçek hatalar yakaladı ve hepsi düzeltildi:

- başlık ile etiketin çakışması;
- etiketlerin bir önceki karenin kamerasıyla konumlanması (`updateMatrixWorld` eksikti);
- ilk karenin yedek fontla çizilmesi;
- ses-görüntü süre farkı (0,133 s);
- kart ve kaleci sahnelerindeki 1,7–2 s durağan anlar;
- ilk Gemini karesinin karanlık olması;
- Gemini'de döngü geçişindeki sıçrama.

## 3. GLL: bu turdaki düzeltmeler

| İstenen | Yapılan |
|---|---|
| Çim düzlemi | 105×68 m saha, şeritli çim, saha dışı zemin, dört tribün (anonim, prosedürel seyirci), projektör direkleri. Spiral sahnesi artık 10 m ızgaralı ayrı bir "model zemini" üzerinde; gerçek saha kenarı görünmüyor. |
| Kamera kompozisyonu | Takip kamerası portre kadrajda topu tutuyor. Vuruş sonrası kamera topun arkasına geçip ağır çekimde izliyor. Kaleci sahnesi yavaşça yaklaşıyor. Yazılar için üst ve alt koyu geçiş katmanı eklendi. |
| Spin görünürlüğü | Topun çevresinde dönüş yönünü gösteren halka ve ok var. Model 10 tur/s; 30 fps'de bu hız kare başına 1/3 tur ettiği için titremeye dönüşüyordu. Bu yüzden hem halka hem top dokusu 40 kat yavaş gösteriliyor ve ekranda "SHOWN 40× SLOWER" yazıyor. Dönüş yönü fizik modeliyle (ω = +y) eşleştirildi; ilk turda ters yöndeydi. |
| Kaba oyuncular | Eklemli figürler: kalça, diz, ayak bileği, omuz, dirsek; lathe gövde; şort, çorap, krampon. Yüzsüz ve nötr renkli (gerçek forma yok). Duvar kollar önde, kaleci hazır duruşta. |
| Temas anı | Sol kramponun dış yüzü topun sağ-arka tarafına değiyor (ölçüldü: ayak bileği x = 4,625 m, top kenarı 4,61 m). Bu temas fizik modelindeki ω = +y spinini üretiyor: r × F = (+x) × (−z) = +y. |

Bilinen eksikler:

- **Mankenler:** hâlâ basit geometri; kas ve kumaş yok.
- **Vuruş hareketi:** temsili. Gerçek koşu ve ayak açısı bilinmiyor; ekranda "ILLUSTRATION" yazıyor.
- **Top deseni:** gerçek 32 panelli kesim değil.

## 4. FR Gemini 8: ikinci 3D pilot

### Bilimsel ve teknik doğruluk

| | Mevcut motor | Three.js pilotu |
|---|---|---|
| Araç geometrisi | Çizgi çizim; oranlar yaklaşık | Yayımlanmış ölçülerden sadeleştirilmiş: adaptör tabanı 3,05 m, adaptör 2,29 m, yeniden giriş modülü ~3,35 m, toplam ~5,7–5,8 m; Agena 1,52 m çap, adaptörüyle ~7,9 m |
| Dönme ekseni | 2D'de ekran düzleminde döndürme: araç boyuna eksenine dik bir eksende takla atıyor gibi | Uzun eksen etrafında roll (No. 8 bir roll iticisiydi, NASA). Adaptör takviyeleri dönüşü okunur kılıyor |
| Neden kenetlenme çözülünce hızlandı? | Metinle anlatılıyor | Model: aynı tork, daha küçük eylemsizlik momenti. Kenetliyken I ≈ 4.000 kg·m², Gemini yalnızken ≈ 3.090 kg·m² (%23 daha az). Bunlar kaba katı cisim tahminleri ve ekranda MODEL etiketli. Yalnızca ~296°/s tepe değeri raporlanmış veri. |
| Kurtarma | "RE-ENTRY THRUSTERS USED" kutusu | Burun RCS halkalarında teğet itici püskürmeleri, roll hızı 296°/s'den 0'a düşüyor, "≈%75 RCS yakıtı kullanıldı (NASA)" |
| Etiketler | RECONSTRUCTION · CASE FILE | ILLUSTRATION / MODEL; itici konumu "POSITION REPRESENTATIVE" |

Kaynaklar:

- NASA Gemini VIII sayfası (nasa.gov/mission/gemini-viii): No. 8 roll iticisinin kısa devresi, 16 RCS iticisi, %75 RCS yakıtı, erken iniş.
- Boyutlar: spacefacts.de (Gemini 8/9), space.skyrocket.de (Gemini) ve Wikipedia (Agena target vehicle).
- Kaynaklar arasında fark var. Toplam uzunluk 5,736 m ile 5,791 m arasında veriliyor; ekranda "≈5,8 m" yazıyor.

### Görsel değerlendirme (kontak sayfaları: `fr-gemini8-3d/review/`)

Three.js pilotunda daha iyi olanlar:

- Dünya ufku ve güneş ışığı.
- Kenetli çiftin çapraz kompozisyonla tek karede görünmesi.
- Doğru renk düzeni: beyaz adaptör, siyah kabin.
- Okunur roll dönüşü ve roll hızı göstergesi.

Zayıf noktalar:

- "A thruster stuck on" planında No. 8 püskürmesi küçük kalıyor.
- "Mission ended early" ve "The fix" planları sade.
- Kart iki planda tekrarlanıyor.
- Dünya dokusu temsili; gerçek harita değil.

## 5. Sonuç ve öneri

- **Görsel kalite:** her iki konuda belirgin artış var: derinlik, ışık, gerçek oranlar, sahneye göre kamera. Pilotlar
  artık "hareket eden noktalar" seviyesinde değil.
- **Bilimsel doğruluk:** iki konuda da 3D pilot daha doğru.
  - GLL: SI birimleriyle Magnus ve sürüklenme modeli, spinsiz karşılaştırma, doğru spin yönü.
  - FR: doğru dönme ekseni ve eylemsizlik açıklaması.
- **Maliyet:** uzay sahnesinde eşit. Tam ekran çim ve stadyumda 2,6 kat. Gemini için 106 s, GLL için 313 s kare render
  süresi, günlük 180 dakikalık iş süresi bütçesinin çok altında kalıyor.
- **Production entegrasyonu henüz önerilmiyor.** Öncesinde şunlar gerekiyor:
  1. GitHub Actions üzerinde aynı ölçümün yapılması (bu sayılar bu container'a ait);
  2. sahne kodunun konuya özel olmaktan çıkıp şablonlaşması (PR #378, otomatik görsel plan);
  3. bir IB veya HLT konusunda üçüncü bir doğrulama.

  Karar senin.

## Yeniden üretme

```
cd pilots/gll-magnus-3d && npm install && cd ../fr-gemini8-3d && npm install && cd ../..
node pilots/gll-magnus-3d/render.js --audio-from <GLL-P01 out> --workers 2
node pilots/gll-magnus-3d/qa.js --audio-from <GLL-P01 out>
BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --channel failure-reconstructed --topic gemini-8-1966 --quality final --workers 2 --shadow --shadow-dir <dir>
node pilots/fr-gemini8-3d/render.js --audio-from <dir>/out --workers 2
node pilots/fr-gemini8-3d/qa.js --audio-from <dir>/out
```
