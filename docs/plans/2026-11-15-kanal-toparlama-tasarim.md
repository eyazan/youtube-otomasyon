# Kanal toparlama: gerçek görüntüye dönüş ve güvenilirlik katmanı (tasarım)

Tarih: 2026-11-15 · Durum: onay bekliyor · Kapsam: ImpossibleBrief (IB), ardından FR

Tasarım sahibin yazışmasından aynen alındı. Sonuna, repoyla karşılaştırınca çıkan inceleme notları eklendi.

## 1. Niyet ve neden
Kanallar gelir getirmek için açıldı. Animasyonlu formata geçildiğinden beri izlenme belirgin düştü (medyan: FR 465 → 66, IB 922 → 82). Örneklem küçük (FR 13, IB 5 animasyonlu video) ve yeni videolar daha az süre biriktirdi; yine de format en güçlü şüpheli. Sahibinin istediği "premium", kanalın **ciddi ve güvenilir görünmesi**. Süslü çizim değil.

## 2. Hedefler
- IB'de stok/gerçek görüntülü formatın izlenmeyi geri getirip getirmediğini tek değişkenli bir testle ölçmek.
- Test olumluysa güvenilirlik katmanlarını (kaynak etiketi, harita/grafik, daha doğal ses, doğal başlıklar) tek tek, ölçerek eklemek.
- Her işi tek oturumda bitecek kadar küçük tutmak; her oturum sonunda STATUS.md güncellenir.

## 3. Hedef olmayanlar
- Animasyon stüdyosuna yeni geliştirme yapmak. Hat korunur, kapatılmaz.
- PR #411 ve #416'yı birleştirmek (ayrı karar).
- BTO ve GoalLore Lab kanallarını düzeltmek (BTO girişi bozuk; ayrı iş).
- Uzun video, yeni kanal veya yeni niş açmak.

## 4. Anti-hedefler (başarısızlık sayılır)
- Test sırasında birden fazla şeyi aynı anda değiştirip sonucu yorumlanamaz hale getirmek.
- Sahibinin onayı olmadan yayın ayarı değiştirmek veya video yüklemek.
- Güvenilir görünmek için uydurma kaynak/veri göstermek. Her kaynak etiketi gerçek olmalı.

## 5. Kısıtlar
- Her oturum tek başına bitmeli.
- Studio'daki izlenim ve CTR API'den gelmiyor, sahibi elle girecek.
- Test ayarı: `IB_PREMIUM_PRIMARY=0` (IB'yi stok-görüntü hattına alır). Sahibin kararı. **Bkz. inceleme notu 1.**

## 6. Yaklaşımlar
| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| A | Önce gerçek/stok görüntüye dön, sonra güvenilirlik | Tek değişken, hızlı, mevcut hat | İlk aşamada "premium" fark az |
| B | Animasyonu ciddileştir | Mevcut yatırımı korur | Düşüşün nedeni format olabilir, riskli |
| C | Gerçek görüntü + güvenilirlik katmanı | En güçlü "ciddi kanal" izlenimi | Tek seferde çok değişken |

**Seçilen: A, ardından C.** Önce formatın etkisini temiz ölçmek, sonra katmanları tek tek eklemek.

## 7. Plan
**Faz 1 (A), IB testi**
- Oturum 0: Sahibi Studio'dan IB için izlenim, CTR ve tutma sayılarını girer; `IB_PREMIUM_PRIMARY=0` yapılır.
- Oturum 1–3: Her biri bir video: konu seçimi, render, kontrol, sahibin onayı. Konular: süpervolkan bu gece patlasaydı; okyanus akıntıları dursaydı; bir haftalık güneş fırtınası.
- Sabitler: aynı başlık kalıbı, aynı ses, her gün 21:00 (GMT+3). Değişken: yalnızca konu.
- Oturum 4: 7. gün ölçümü.

**Karar kuralı (7. gün)**
- 3 videodan en az 2'si 400 izlenmeyi geçerse: stok format IB varsayılanı olur, Faz 2'ye geç.
- 3'ü de 150'nin altında kalırsa: sorun format değil; başlık ve ilk 3 saniye test edilir.
- Arada kalırsa: aynı kalıpla 3 video daha.
- 3 videoluk örneklem yalnızca yön gösterir, kesin kanıt değildir.

**Faz 2 (C), güvenilirlik katmanı** (Faz 1 olumluysa; her katman ayrı video grubu, ayrı ölçüm)
1. Doğal başlıklar ("How X Really Failed", "What Failed First" yerine).
2. Daha doğal ses (tek değişken).
3. Ekranda gerçek kaynak adı (NASA, USGS gibi); yalnızca doğrulanmış bilgi.
4. Gerçek veriye dayalı harita/grafik katmanı.

## 8. Sahibe kalan kararlar
- `IB_PREMIUM_PRIMARY=0` (yayın ayarı).
- Her videonun yayın onayı.
- Studio verilerinin elle girilmesi.

---

## İnceleme notları (repoyla karşılaştırma, 2026-11-15)

**1. `IB_PREMIUM_PRIMARY=0` tek başına testi bozar.**
- Zamanlanmış IB çalışmasında yayın her zaman açık: `portfolio-production.yml:211` zamanlanmış çalışmada `PUBLISH=1` veriyor.
- Stok hat konuyu kendisi seçip kendisi yüklüyor (`core/pipeline/impossible-brief.js:184-189`).
- Sonuç: bu ayar yapılırsa IB her gün kendi seçtiği bir konuyu, video başı onay olmadan yükler. Bu, "değişken yalnızca konu" ve "her videonun yayın onayı" kurallarıyla çelişir.

Öneri:
- Zamanlanmış IB yayınını kapalı tut: `IB_PREMIUM_PRIMARY=1`, `IB_PREMIUM_PUBLISH=0`. Premium hat bu ayarla yalnızca deneme render'ı yapar.
- 3 test videosunu elle tetiklenen çalışmayla, seçilmiş konu ve `engine=legacy` ile üret.
- Elle çalıştırmada yayın `IB_PUBLISH` değişkenine bağlı; o yüzden ilk çalıştırma `dry_run=true` olsun. Sahip videoyu izledikten sonra aynı konuyla yükleme çalıştırması yapılır.
- Hat açık konu adını zaten kabul ediyor (`impossible-brief.js:168`), ama iş akışında konu girişi yok. Bunun için tek oturumluk küçük bir değişiklik gerekiyor: `portfolio-production.yml`'e `topic` girişi eklenir ve `shorts-sira.js`'e geçirilir. Faz 1'den önceki ilk iş budur.

**2. Konular repoda var:**
- IB-EAR-006 `what-if-yellowstone-erupted-again`
- IB-EAR-071 `what-if-the-atlantic-ocean-current-shut-down`
- IB-SPA-006 `what-if-the-1859-solar-superstorm-hit-today`

Üçünün de stok hatta render alıp almadığı denenmedi: lisanslı görsel sayısı ≥4 olmalı, bazı IB konuları bu yüzden reddediliyor. Bu her video oturumunun ilk kontrolüdür.

**3. Ölçüm karşılaştırılabilirliği.**
- Eski IB stok videolarının 922 medyanı toplam (4–6 haftalık) izlenme. Testin eşiği ise 7. gün.
- IB için repoda 7. gün verisi yok; FR için var (`analytics/<id>/7d.json`).
- Eşik 400 muhafazakâr kalıyor; kural olduğu gibi kullanılabilir. Ancak "olumlu" sonucu yorumlarken bu fark akılda tutulmalı.

**4. Saat:** 21:00 GMT+3 = 18:00 UTC. Mevcut yayın saatiyle aynı, ek iş yok.

**5. Açık soru:** FR 10 Kasım'dan, IB 13 Kasım'dan beri yükleme yapmıyor; nedeni bilinmiyor. Oturum 0'da salt-okunur değişken kontrolüyle (`variables-check.yml`) netleşmeli. Bilinçli bir duraklatma değilse test başlamadan anlaşılmalı.
