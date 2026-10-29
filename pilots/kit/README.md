# Plan tabanlı 3D kit (v2): yeniden kullanılabilir bileşenler ve kanıta dayalı görsel planlama

Yalnızca inceleme içindir. Hiçbir çıktı yüklenmez. Production render hattına, kök `package.json` dosyasına ve yayın
workflow'larına bağlı değildir. `three@0.170.0` bu klasörün kendi `package.json` dosyasında sabitlenmiştir.

## Akış

```
konu (anlatım satırları + kanıtlar)
  -> pilots/lib/planner.js   mekanizma şablonu seçer, sahne kurulumunu kanıttan okur, sayıları kanıtla karşılaştırır
  -> plan.json               PLANNED ya da CREATIVE_REVIEW_REQUIRED (gerekçeleriyle)
  -> kit/runtime.html        planı oynatır: dünya modülü + çekim kütüphanesi, konuya özel kod yok
  -> lib/three-render.js     paralel kare render, ses birleştirme
  -> lib/qa.js               teknik QA (yaratıcı karar ayrı)
```

Tek komut, her konu için aynı:

```
node pilots/kit/render-plan.js --topic <konu.json> --audio-from <mevcut motorun out klasörü> --name <ad>
```

## Bileşenler

| Dosya | İçerik | Konuya özel mi |
|---|---|---|
| `core.js` | sahne, kamera, etiket sözlüğü (başlık, okuma etiketi, kart, gösterge, altyazı), çekim zamanlaması | hayır |
| `football.js` | stadyum (tribün, ışık direkleri, pus, flaşlar), kale, oyuncu figürü, hareketler (koşu, vuruş: düz/dış/aşırtma, baraj, kaleci hazır/plonjon), top | hayır |
| `football-shots.js` | 13 çekim türü: top yakın plan, kuruluş, vuruş, takip, kale arkası, kart, kuvvetler, model tahtası, skor, alternatif vuruş, penaltı koşusu, yol karşılaştırma, döngü | hayır |
| `space.js` | yıldızlar, Dünya, gökyüzü, araç (ölçülü parça listesinden), itici püskürmesi, RCS, yeniden giriş parıltısı, parçalanma, ateş topu, duman izi | hayır |
| `space-shots.js` | 11 çekim türü: dönen araç, hız artışı, kenetli çift, itici yakın plan, ayrılma, RCS ile kurtarma, yeniden giriş, arıza devresi (izole / ortak neden), fırlatma, sapma-parçalanma, veri taşması | hayır |
| `../lib/models/` | top uçuşu (RK4, sürükleme + Magnus, nişan noktasına çözülen açı), sabit tork altında yuvarlanma hızı | hayır |
| `../templates/*.json` | dört mekanizma sınıfı: falsolu serbest vuruş, aşırtma penaltı, tutum torku arızası, rehberlik verisi arızası | sınıf düzeyinde |
| `../research/` | araç ölçüleri (Gemini, Agena, Ariane 5) ve FR kanıt dosyaları | konu verisi |

## Planlayıcının kuralları (fail-closed)

- Şablon, anlatım ve kanıt metnindeki sözcüklerle seçilir. Eşleşme yoksa ya da birden fazlaysa plan reddedilir.
- Kurulum kanıttan okunur: vuruş ayağı, vuruş yüzeyi (dış/aşırtma), kalecinin davranışı (kıpırdamadı / sola-sağa
  plonjon), mesafe aralığı, makale künyesi, skor, araç ve itici.
- Kanıtın karar vermediği ayrıntı uydurulmaz. Ya plan reddedilir (ör. serbest vuruş mesafesi yoksa) ya da varsayım
  `plan.assumptions` içine yazılır ve ekranda `MOTION REPRESENTATIVE` etiketi gösterilir (ör. Panenka'nın vuruş ayağı).
- Ekrandaki her sayı, atıf yapılan kanıtta ya da anlatımda geçmelidir. Model değeri taşıyan etiket `MODEL` yazmak
  zorundadır. Kaynağı olmayan etiket reddedilir.
- Her anlatım satırının bir çekimi olmalıdır. Çekim başlangıcı, altyazı sözcükleri anlatım satırlarıyla sırayla
  eşlenerek bulunur.
- Ölçülmemiş hareketler (koşu, vuruş, plonjon zamanlaması, parçalanma sırası) ekranda temsilî olarak etiketlenir.

## QA (teknik)

`lib/qa.js`: mevcut motorun teknik kontrolleri (çözünürlük, siyah kare, ses yüksekliği, A/V, döngü, altyazı senkronu),
güvenli alan ve çakışma (0,25 s'de bir), mobil küçük yazı tabanı **24 px**, **okuma süresi** (her yazı en az
0,6 s + sözcük başına 0,25 s ekranda; altyazılar ses ile gittiği için hariç; döngü kuyruğu açılıştaki aynı yazıyla
birleştirilir), iki ayrı tarayıcıda byte düzeyinde aynı kareler, en uzun durağan an.

## Kapsam ve DAILY READY kararı

Kapsam `node pilots/kit/coverage.js` ile ölçülür (yalnızca planlama, render yok; CI her koşuda `coverage.md` üretir).

| Kanal | Konu | Sonuç |
|---|---|---|
| GLL | GLL-P01 Roberto Carlos (pilot) | PLANNED, magnus-free-kick |
| GLL | GLL-025 Panenka | PLANNED, penalty-chip (+1 varsayım: vuruş ayağı) |
| GLL | GLL-026 Roberto Carlos (ikinci araştırma) | RED: ayak ve vuruş yüzeyi kanıtta yok; gerçek bir vuruşun falso yönü uydurulmuş olurdu |
| GLL | GLL-043 Jabulani | PLANNED, knuckle-ball (yan kuvvet ILLUSTRATIVE; top desensiz çizilir) |
| GLL | GLL-052 Penaltı neden 12 yarda | PLANNED, law-distance |
| GLL | GLL-061 Geri pas kuralı | PLANNED, back-pass-rule |
| GLL | GLL-021 (çalım), 031 (takım golü) | RED: oyuncu konumları kanıtta yok |
| GLL | GLL-028 (kafa golü), 037 (Banks kurtarışı) | RED: orta / kurtarış yönü kanıtta yok |
| FR | Gemini 8, Ariane 5 | PLANNED (`pilots/research/FR-<konu>.json` kanıt dosyası olan konular) |
| FR | diğer 386 vaka dosyası | RED: yapılandırılmış kanıt dosyası yok |

Güvenlik kuralları: şablon başlığı satır onu söylemiyorsa kullanılmaz (`headIf`), olay hakkında üçten fazla kanıtsız
ayrıntı gerekiyorsa plan reddedilir, anlatım tekrarı yerine olgu kartı satırın adlarını/yılını ve kaynağını gösterir,
kural ve top anlatımlarında (explainer) ayak/kaleci gibi sahneleme ayrıntıları `plan.staging` içine yazılır.

**Karar: DAILY READY değil.** GLL'de 9 araştırılmış konunun 4'ü elle animasyon yazılmadan plan alıyor (önce 1/9; GLL-P01
pilotu bu sayıya dahil değil). Kalan 5 konu bilinçli olarak reddediliyor; bunlar için ya konum/yön içeren kanıt ya da insan kararı gerekir. FR'de 3D kit,
her konu için yapılandırılmış kanıt dosyası olmadan çalışmaz; FR ve IB günlük üretimi mevcut motorla sürüyor.
