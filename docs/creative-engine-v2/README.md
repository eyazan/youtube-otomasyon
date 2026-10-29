# Premium Creative Engine V2 — Denetim ve Plan (2026-10-29)

Durum: **denetim + plan**. Bu belge hiçbir production davranışını değiştirmez. IB-PHY-065'in 29 Ekim yayın hattına,
PR #377'ye (IB puanlama, onay bekliyor) ve GLL/HLT yayın onay sınırlarına dokunulmadı.

Kanıt kaynakları:
- **Kod:** `scripts/bto-studio/`
  - `page/components/*.js`: 39 bileşen, 1.625 satır
  - `auto/*.js`: dört otomatik storyboard üreteci, 981 satır
  - `render.js`
- **Gerçek MP4 kareleri:** `review/render-<run>` dalları. Bu belgede atıf yapılanlar:
  - FR: 40705565685
  - GLL: 40722337464
  - IB: 40723940467, 40729949144, 40735593168, 40782026744, 40824721338
- **Rakip verileri:** vidIQ (29 Ekim 2026). Sayılar API'nin döndürdüğü güncel değerlerdir; doğrulanamayanlar ayrıca
  işaretli.

---

## A. Mevcut sistemin teknik ve yaratıcı denetimi

### Ortak mimari (dört kanal aynı motoru kullanıyor)
`studio.js` akışı:
1. Araştırma kaydı → anlatım (8 satır).
2. Otomatik storyboard: her satıra bir sahne.
3. Chromium sayfası içinde SVG bileşenleri, saf `draw(t)` fonksiyonları.
4. Playwright ekran görüntüsü → PNG akışı → FFmpeg.
5. Edge TTS, altyazı, ses miksajı.
6. Nesnel QA + danışma niteliğinde yaratıcı kontroller.

Bu zincirin **güvenilir** kısmı korunmaya değer: belirlenimci kareler, ses ve altyazı senkronu, QA, yayın kapısı,
duplicate ve kanal korumaları. Ancak bunlar artık darboğaz değil.

### Kök nedenler (kanıtlı)

| # | Kök neden | Kod kanıtı | MP4 kanıtı |
|---|---|---|---|
| R1 | **Görsel metinden türetiliyor; tersi değil.** Üreteç, her anlatım satırını regex ile bir sahne tipine eşliyor (`impossible-brief.js` `world()`, `keyPhrase()`; `failure-reconstructed.js` `KIND`, `objectKind()`). Görsel yönetmenlik yok, kelime eşleşmesi var. | `WORLD_WORDS`, `KIND` regex tabloları | Laki ve St. Helens: "volcan" kelimesi → kesit/sondaj (yanlış mekanizma). EAR-071: "isn't an ice age" → başlık "ICE AGE". HUM-050: "restoring" → azalan popülasyon. |
| R2 | **Nesne kütüphanesi çok küçük ve şematik.** FR'de 16 nesne sınıfı var, her biri 4–6 SVG yolu; aynı sınıfın bütün vakaları aynı çizimi alıyor. IB'de ~10 dünya çizimi var (gezegen, depth-probe, orbit, figure…). | `engineering.js` `KINDS.aircraft` = 5 path; `space.js` `planet` tek parametrik küre | IB-PHY-065: 8 sahnenin 6'sında aynı küre. IB-HUM-004: 8 sahnede aynı siluet. EXT-047: dönen pulsar yerine yörünge diyagramı. |
| R3 | **Gerçek görsel hiç kullanılmıyor.** `image-plate` bileşeni ve varlık kaydı var, ama otomatik üreteçlerin hiçbiri onu çağırmıyor. | `grep image-plate auto/*.js` → 0 | Bütün IB/FR/GLL kareleri yalnızca vektör. Arşiv fotoğrafı, harita, uydu görüntüsü yok. |
| R4 | **Kamera ve kurgu dili tek tip.** Her sahnede aynı "itme + yana kayma" hareketi; 2–3 geçiş tipi; tek kompozisyon merkezi (540, 820). | `cam()` (IB satır 229); `TRANSITIONS = ["scan-wipe","iris"]` | Kontak sayfalarında her sahne aynı çerçeve. QA'nın "no two scenes look alike" kontrolü geçiyor, ama izleyici açısından tekrar belirgin. |
| R5 | **Senaryo görsel kapasiteye göre kısıtlanıyor.** Konu seçimi bile "motor neyi çizebilir"e göre yapılıyor (PR #377 analizi). Anlatım 8 kısa olgu cümlesi; hikâye yayı (gerilim, dönüş) yok. | `qualified()` + growth bar; anlatım şablonu `role: IMPOSSIBLE_QUESTION…PAYOFF` | IB: 42 araştırılmış konu 70–74'te takılı; seçilebilir doğru-çizilen konu 2. |
| R6 | **Yaratıcı kalite ölçümü zayıf.** `creative-checks.js` 5 ölçülebilir kontrol yapıyor (danışma niteliğinde) ve 4 insan sorusu soruyor. Kare-seviye anlam kontrolü yok. | `creative-checks.js` | 4 IB adayı teknik QA PASS aldı; 3'ü bilimsel olarak yanlış görselleştirildi (review/render-40824721338). |
| R7 | **Futbolda veri yok.** GLL taktik sahneleri el yazımı yuvarlak noktalar; gerçek koordinat yok. Saha ve stadyum tek çizim. | `football.js` 111 satır, `football-atmos.js` | GLL-021/025: olay türü doğru (penaltı, çalım), ama yayın kalitesinde taktik analizden uzak. |

### Kanal bazında

| Kanal | Neden "temel SVG" izlenimi | Tekrar eden öğeler | Gösterilemeyen mekanizmalar | Yeniden kullanılabilir |
|---|---|---|---|---|
| **FR** | Nesne başına 4–6 path; ışık, malzeme, derinlik yok | Aynı uçak/köprü/kapsül çizimi bütün vakalarda | Yorulma çatlağı, rezonans, kontrol yüzeyi arızası, yangın yayılması | failure-chain, kinetic-type, chips, kesit mantığı, ses/altyazı |
| **IB** | Tek parametrik küre + düz renk | Aynı Dünya kesiti 6/8 sahnede | Ölçek değişimi, sıvı/gaz süreçleri, göl, akıntı coğrafyası, spin | starfield, depth-probe (iyi), scale-ladder, event-ticks, magnetosphere (EAR-019'da doğru) |
| **GLL** | Nokta oyuncular, sabit saha, el yazımı yollar | Stadyum + saha her videoda | Gerçek pozisyon, temas, ofsayt çizgisi, top fiziği | dot-board, saha geometrisi, olay türü sınıflandırması (#370) |
| **HLT** | Nesne başına el çizimi; az bileşen | — (son 2 haftada üretim yok) | Gerçek iç yapı (patlatılmış görünüm) | exploded-layers, rig-3d (sahte 3D), floor-plan |

### Yaratıcı kaliteyi bugün neyle ölçüyoruz?
- **Teknik:** `qa.js` (çözünürlük, siyah ve donuk kare, loudness, metin çakışması, determinizm). Güvenilir.
- **Yaratıcı:** `creative-checks.js`. İlk 2 saniyedeki hareket, sahne çeşitliliği, başlık dilbilgisi, başlık devri,
  nesnenin ekranda olması. Hepsi danışma niteliğinde.
- **Eksik:**
  - **Anlam kontrolü:** sahne, satırın söylediğini mi gösteriyor?
  - **Nesne doğruluğu:** doğru araç, doğru yapı mı?
  - **Hikâye kontrolü:** gerilim ve dönüş var mı?

  Bunlar şimdilik yalnızca insan incelemesiyle yakalanıyor. Bu oturumda da öyle yakalandı.

---

## B. Rakip ve format analizi (vidIQ, 29 Ekim 2026)

**Doğrulanmış kanal verileri:**

| Kanal | Abone | Toplam izlenme | Video | Görsel tekniği |
|---|---|---|---|---|
| Zack D. Films (what-if, Shorts) | 29,4 M | 81,6 B | 4.141 | 3D (gerçekçi karakter + ortam), tek sahne, net hook |
| Jared Owen (nasıl çalışır, uzun) | 4,45 M | 542 M | 121 | Blender 3D kesit ve patlatılmış görünüm |
| Plainly Difficult (mühendislik kazaları, uzun) | 1,1 M | 214 M | 399 | 2D diyagram + arşiv fotoğrafı + harita |

Tifo Football için handle doğrulanamadı; verileri **doğrulanmadı**.

**Bugünkü outlier Shorts örnekleri (son 3 ay):**
- **Futbol hakem kararı:**
  - "Goal or No Goal?!" — 3,7 M, TOUZANI TV
  - "Should the Referee Have Allowed This Goal?" — 739 K, 27x
  - Hepsi **gerçek maç görüntüsü** kullanıyor. Lisans riski yüksek; bunu kopyalamayacağız.
- **Futbol taktik:**
  - "This Tzolis Assist… PURE GENIUS" — 156,8 K, 172x
  - "5v6 High Press" — 1,5 M, 11x (antrenman görüntüsü)
- **Mühendislik:**
  - "How to drive a 50 ton steel pile" — 5,3 M, 1026x (3D render)
  - "Why Chernobyl's Reactor Looked So Weird" — 1,1 M, Curiorave
  - "Engineering Behind the WTC Collapse" — 687 K, 388x
- **What-if:**
  - "What if every MOSQUITO disappeared?" — 1,6 M, 107x, World Simulations, 3D simülasyon
  - "What if the immortal snail…" — 2,8 M, 152x
- **Ürün mühendisliği:**
  - "Where Does Gasoline Go After You Put It in Your Car?" — 4,8 M, 1095x
  - "How Brutus toy blaster works" — 2,2 M, 451x (gerçek kesit + 3D)

**Uygulanabilir teknikler (ortak bulgular):**
1. İlk karede **soru ve nesne birlikte**. Konunun kendisi görünür; soyut başlık kartı yok.
2. **Tek bir güçlü görsel fikir**, kamera hareketiyle geliştiriliyor: içeri girme, kesit açılması, ölçek değişimi.
   8 ayrı olgu cümlesi değil.
3. **Gerçeklik hissi:** ışık, malzeme ve derinlik (3D veya fotoğraf tabanlı). Düz vektör, outlier listesinde
   neredeyse yok.
4. Futbolda başarılı olanlar gerçek görüntü kullanıyor. Lisans olmadan bizim yolumuz **veri tabanlı taktik
   rekonstrüksiyon** ve **fizik**. Yorum ve tartışma formatı, görüntü yerine kural ve kanıt ile kurulmalı.

---

## C. Premium Visual Engine V2 önerisi

**Korunacaklar:**
- belirlenimci kare zinciri
- Edge TTS + kelime zamanlaması
- altyazı
- ses tasarımı
- nesnel QA
- yayın kapısı ve politika
- duplicate ve yanlış kanal korumaları
- review render workflow'u

**Darboğaz framework değil, varlık ve yönetmenlik.** Remotion eklemek R1–R3'ü çözmez; aynı SVG'yi başka bir
çerçevede çizer.

| Yöntem | Kalite | Kurulum/bakım | Render (30 s Short, GH Actions) | GPU | Otomasyon | Lisans riski | Ücret | Karar |
|---|---|---|---|---|---|---|---|---|
| Mevcut SVG + Chromium | Düşük–orta (düz) | Yok | ~3–4 dk (ölçüldü) | Hayır | Tam | Yok | Yok | **Taban olarak kalsın** |
| Remotion | Orta (aynı vektör) | Orta | Benzer | Hayır | Tam | Ticari lisans şartı var (kurum büyüklüğüne göre ücret) | Olası | **Hayır**: R1–R3'ü çözmez |
| 2.5D katman (mevcut sayfa) + fotoğraf plakaları | Orta–yüksek | Düşük | ~4–6 dk | Hayır | Tam | Varlık lisansına bağlı | Yok | **Evet**: IB/FR için ilk adım |
| Blender (Cycles CPU / Eevee) | Yüksek (Jared Owen tipi) | Orta–yüksek | Cycles CPU 1080×1920, ~30 s: **saatler**; Eevee headless: GH'de GPU yok, sınırlı | Fiilen evet | Kısmi (model kütüphanesi gerekir) | Model lisansına bağlı | Yok (açık kaynak) | **Pilot ile kanıtlanmalı**: yalnızca HLT/FR nesne yakın planları için |
| Three.js (mevcut Chromium içinde WebGL) | Orta–yüksek (gerçek zamanlı 3D, ışık) | Orta | ~4–8 dk (SwiftShader/CPU) | Hayır (yazılım render) | Tam | Model lisansı | Yok | **Evet, pilot**: mevcut render.js'e en düşük entegrasyon maliyeti |
| Veri tabanlı futbol (açık event/tracking verisi) | Yüksek (gerçek konumlar) | Orta | ~3–5 dk | Hayır | Tam | Veri lisansı **doğrulanmalı** (StatsBomb Open Data, Metrica sample) | Yok | **Evet**: GLL "Moment" ve "Decision" için |
| AI video/görsel üretimi | Değişken; fiziksel doğruluk zayıf | Düşük | Dakikalar | Bulut | Kısmi | Yüksek (eğitim verisi, benzerlik) | **Ücretli** | **Hayır** (onaysız ücretli servis yok; doğruluk riski) |

**Önerilen V2 (pilotla kanıtlanacak):**
1. **Görsel Yönetmen katmanı (R1).**
   - Her konu için önce bir "görsel fikir" (tek güçlü metafor/mekanizma) ve sahne listesi yazılır. Bunu kayıtlı
     araştırma + insan onaylı bir yönetmenlik JSON'u olarak yapacağız; LLM çağrısı yok, maliyet yok.
   - Üreteç bunu uygular; regex yalnızca yedek.
   - Mekanizma gösterilemiyorsa sahne yanlış çizilmez: `CREATIVE_REVIEW_REQUIRED`.
2. **Konuya özgü varlık kütüphanesi (R2, R3).** Lisansı doğrulanmış kaynaklar:
   - NASA ve ABD kamu kurumu görüntüleri (kamu malı)
   - Wikimedia Commons CC-BY/CC0 (mevcut varlık kaydı üzerinden)
   - Doğru geometriye sahip modeller: CC0/CC-BY kaynaklı veya kendi çizimimiz
   - Kayıt dışı varlık kullanılmaz.
3. **Three.js sahne bileşeni (R2, R4).**
   - Mevcut Chromium sayfasında gerçek 3D nesne, ışık, kamera yolu, kesit düzlemi (clipping plane).
   - Determinizm korunur: `draw(t)` ile kamera ve ışık t'nin fonksiyonu.
4. **Kamera ve kurgu dili (R4).** Sahne amacına göre çekim tipi:
   - kuruluş çekimi
   - içeri girme
   - kesit açılması
   - ölçek karşılaştırması
   - detay yakın planı

   Tek tip push yerine bunlar.
5. **Futbol veri katmanı (R7).** Açık veri yükleyici (event + freeze-frame). Lisansı uygun maçlarla taktik sahneler;
   gerçek koordinat yoksa açıkça "temsili" etiketi.
6. **Anlam QA'sı (R6).** Teknik QA'ya ek, ayrı bir Creative Director raporu:
   - 15 soru: otomatik ölçülebilenler ile insan gerektirenler ayrı
   - gerçek MP4 kareleri ve ses üzerinden
   - "teknik PASS ≠ yaratıcı PASS" kuralı yayın kapısında zorunlu alan

---

## D. Dört kanal için pilot planı

| Pilot | Konu | Senaryo yaklaşımı | Görsel yöntem | Araç | Beklenen kazanç | Doğrulama |
|---|---|---|---|---|---|---|
| **A — GLL (Physics)** | Roberto Carlos 1997 frikiği: Magnus etkisi | Tek soru: "Top neden önce dışarı, sonra içeri döndü?" Hikâye: vuruş → sapma → bilim → efsane | Fiziksel olarak hesaplanmış yörünge: sürüklenme + Magnus ODE, mevcut kaynaklı parametre aralığı. Spin görselleştirme, kuvvet vektörleri, kalecinin bakış açısı | Mevcut sayfa + Three.js; fizik Node'da hesaplanır | Basit noktalardan, ölçülebilir fizikle tutarlı 3D yörüngeye | Yörünge parametreleri kaynakla eşleşir (Dupeux ve ark., 2010 New J. Phys.: spin-kick analizi); kareler; Creative Director raporu |
| **A2 — GLL (Moment)** | Açık veri kapsamındaki bir maçta gol öncesi koşu | "Golü görmediğiniz koşu açtı" | StatsBomb Open Data event + freeze-frame | Veri yükleyici + saha bileşeni | Gerçek konumlu taktik anlatım | Lisans metni kontrolü; koordinat kaynağı karede belirtilir |
| **A3 — GLL (Decision)** | IFAB kural metni üzerinden yanlış bilinen bir kural (ör. kalecinin topu 6 saniye tutması → 2025/26 değişikliği; doğrulanacak) | Kural → yanlış bilinen → gerçek metin → örnek | Kural kartı + temsili diyagram (etiketli); gerçek maç görüntüsü yok | Mevcut + kinetic-type | Lisans riski olmadan karar analizi | IFAB Laws of the Game güncel metni |
| **B — FR** | Gemini 8 (1966): takılı kalan itici (OAMS thruster 8) | Normal kenetlenme → dönüş başlar → ayrılınca hızlanır → RCS ile kurtarma → ders | Doğru Gemini kapsülü ve Agena geometrisi (NASA çizimleri, kamu malı), 3D dönüş, itici konumu yakın plan | Three.js + NASA referansları | Genel kapsül/roket çiziminden gerçek araca | Nesne NASA çizimiyle karşılaştırılır; mekanizma NASA kaza raporuyla |
| **C — IB** | IB-EAR-019 (manyetik alan; kaynak PASS, mekanizma render'da doğru) veya yeni: "What if Earth's core stopped spinning?" | What if → ilk sonuç → mekanizma (dinamo) → tırmanma (uydular, şebeke) → çıkarım | 3D Dünya + alan çizgileri + NASA görselleri (aurora, uydu); ölçek değişimi | Three.js + NASA görsel kütüphanesi | 8 aynı küre sahnesinden çok katmanlı anlatıma | Kaynak kontrolü (CI), kareler, Creative Director |
| **D — HLT** | Mekanik saatin eşapmanı (escapement): iç yapısı kamuya açık, iyi belgelenmiş | "Bir yay neden 40 saat aynı hızda çözülür?" | Doğru eşapman geometrisi (açık patent ve teknik kaynaklar), patlatılmış görünüm, zaman içinde hareket | Three.js (dişliler parametrik) | Genel çizimden gerçek mekanizmaya | Patent/teknik kaynak; parça listesi kaynakla birebir |

---

## E. Konu araştırma planı (kanal başına 30 aday → 14 nitelikli)

**Sıra:** Audience Interest → Story Strength → Evidence → Visual Treatment → Production Feasibility → Final
Qualification.

1. **Aday üretimi (kanal başına 30):**
   - vidIQ outlier ve keyword verisi (izleyici ilgisi)
   - kalıcı ilgi listeleri (yıl dönümleri, güncel olaylar)
   - mevcut araştırılmış stok
   - Kaynak: kayıtlı aday dosyası `channels/<ch>/research/candidates-2026-10.json` (aşağıdaki alanlarla).
2. **Alanlar:**
   - konu, format, başlık, ilk 2 saniyelik hook
   - hikâye, neden ilginç, içgörü
   - gerekli görsel varlık, görsel yöntem
   - kaynaklar, güvenilirlik, lisans
   - zorluk, viral skor, premium uygunluk, maliyet, durum
3. **Nitelik:** kaynak doğrulandı (CI claim check / verify.js) + mekanizma doğru + üretim yöntemi mevcut +
   viral ≥75 (eşik aynı).
   - Gerçek MP4 ile yaratıcı onay alanlar **ayrı sütunda** tutulur.
   - Zayıf veya doğrulanmamış konu stok sayılmaz.
4. **Süreklilik:** Günlük stok sayımı. Stok 14'ün altına inince araştırma workflow'u yeni adayları doğrulamaya
   sokar. Konu yoksa o gün güvenli atlanır; aynı video asla tekrar yüklenmez.

**Bugünkü gerçek stok:**

| Kanal | Doğrulanmış konu | Yaratıcı onaylı | Not |
|---|---|---|---|
| FR | 13 | QLSnrXyCJgw yayında; birkaç review MP4 | Hedef 14'e 1 eksik |
| IB | 2 doğru-çizilen (biri bugün yayında) | 1 (IB-PHY-065) | Bkz. PR #377 |
| GLL | 9 | — | Ses ve araştırma onayı bekliyor |
| HLT | 1 | — | OAuth `INVALID_CLIENT` |

---

## F. Tamamlama tablosu

| Kanal | Mevcut kalite | Eksik yetenek | Pilot | Konu stoku | Yayın durumu | Sonraki işlem |
|---|---|---|---|---|---|---|
| FR | Teknik iyi; görsel şematik, nesne genel | Doğru araç geometrisi, 3D/2.5D, arşiv plakası | B: Gemini 8 | 13 | Günlük premium yayında | Pilot B + 14. konu |
| IB | Teknik iyi; tekrar eden küre, metin-tabanlı yanlış mekanizmalar | Görsel yönetmen, ölçek/3D, gerçek uzay görüntüsü | C | 1 (+ PHY-065 bugün) | İlk yayın bugün planlı (21:00 TR) | Yükleme doğrulaması; pilot C; PR #377 kararı |
| GLL | Olay türleri doğru; nokta oyuncular | Veri tabanlı taktik, fizik yörüngesi, kural anlatımı | A, A2, A3 | 9 | Kapalı (onay bekliyor) | Pilot A (fizik) ilk |
| HLT | Az üretim | Gerçek iç yapı modelleri, patlatılmış 3D | D | 1 | Kapalı (OAuth) | OAuth düzeltmesi; pilot D |

**Beş durumun bugünkü değeri:**

| Kanal | RESEARCH READY | ENGINE READY | CREATIVE READY | PUBLISH READY | DAILY READY |
|---|---|---|---|---|---|
| FR | Kısmen (13/14) | Evet (v1) | Hayır (iki onaylı pilot yok) | Evet | Hayır (7 günlük gözlem yok) |
| IB | Hayır | Evet (v1) | Hayır | Bugün doğrulanacak | Hayır |
| GLL | Kısmen | Kısmen | Hayır | Hayır | Hayır |
| HLT | Hayır | Kısmen | Hayır | Hayır (OAuth) | Hayır |

---

## G. Uygulama planı

| Öncelik | İş | Bağımlılık | Kabul kriteri | Kanıt |
|---|---|---|---|---|
| P0 | IB-PHY-065 yükleme doğrulaması (bugün) | Zamanlanmış çalıştırma | Video ID, kanal ID, private, publishAt = 18:00Z | events.jsonl + YouTube API |
| P0 | Metin-tabanlı yanlış mekanizma koruması: gösterilemeyen mekanizma → `CREATIVE_REVIEW_REQUIRED` | — | Laki, St. Helens, EAR-071, HUM-050, EAR-066 tipi vakalar otomatik yayına giremez | Test + review render |
| P0 | Yaratıcı rapor yayın kapısında zorunlu alan (teknik PASS ≠ yaratıcı PASS) | Creative Director şeması | Yaratıcı rapor olmadan PUBLISH_APPROVED yok (policy kapsamında) | Kapı testi |
| P1 | Pilot A (GLL fizik, Three.js + Magnus) | Three.js bileşeni | Gerçek MP4; fizik parametreleri kaynakta; Creative Director raporu | review dalı + artifact |
| P1 | Pilot B (FR Gemini 8, doğru araç) | NASA referansları, Three.js | Nesne karşılaştırması NASA çizimiyle | Önce/sonra kontak sayfası |
| P1 | Pilot C (IB) ve D (HLT) | Pilot A/B'den kalan bileşenler | Aynı | Aynı |
| P2 | Kanal başına 30 aday → 14 nitelikli | CI claim check, vidIQ | Doğrulanmış 14 konu | candidates JSON + CI run |
| P2 | Otomatik stok yenileme | Araştırma workflow'u | Stok <14 → aday doğrulama | Workflow kaydı |
| P3 | Retention analizi | YouTube Analytics erişimi | Yeterli örneklem | Analytics raporu |

**Karar noktaları (onayın gerekir):**
- Three.js'in render hattına eklenmesi: pilot A sonrası.
- Blender/GPU: yalnızca pilot gerekirse; GitHub Actions'ta GPU yok, maliyet doğurur.
- Ücretli servisler: önerilmiyor.
- GLL/HLT yayınının açılması.
- PR #377'nin production'a alınması.

**Tamamlanan ve planlanan ayrımı:**
- **Bu belgede tamamlanan:** denetim, rakip verileri, plan.
- **Henüz yapılmadı:** pilotlar, aday dosyaları, V2 bileşenleri.
