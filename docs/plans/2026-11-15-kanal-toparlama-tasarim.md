# Kanal toparlama: gerçek görüntüye dönüş ve güvenilirlik katmanı (tasarım)

Tarih: 2026-11-15 · Durum: onay bekliyor · Kapsam: ImpossibleBrief (IB), ardından FR

Revize sürüm (2. tur). Repodaki kopya esastır. 1. tur inceleme notları metne işlendi; 2. tur notu en sonda.

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
- `IB_PREMIUM_PRIMARY=0` **kullanılmayacak**. Zamanlanmış IB çalışması yüklemeyi zorla açıyor (`portfolio-production.yml:211`) ve stok hat konuyu kendisi seçip yüklüyor (`core/pipeline/impossible-brief.js:184-189`), yani IB her gün onaysız yükler.
- Stok hat belirli bir konu adını kabul ediyor, ama elle başlatma ekranında konu alanı yok.
- Bazı IB konuları "en az 4 lisanslı görsel" şartını karşılamadığı için reddediliyor.

## 6. Yaklaşımlar
| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| A | Önce gerçek/stok görüntüye dön, sonra güvenilirlik | Tek değişken, hızlı, mevcut hat | İlk aşamada "premium" fark az |
| B | Animasyonu ciddileştir | Mevcut yatırımı korur | Düşüşün nedeni format olabilir, riskli |
| C | Gerçek görüntü + güvenilirlik katmanı | En güçlü "ciddi kanal" izlenimi | Tek seferde çok değişken |

**Seçilen: A, ardından C.** Önce formatın etkisini temiz ölçmek, sonra katmanları tek tek eklemek.

## 7. Plan
**Faz 0, hazırlık (tek küçük oturum)**
- Elle başlatılan GitHub Actions çalışmasına konu seçme alanı eklenir.
- Salt-okunur ayar kontrolüyle FR ve IB'nin neden yüklemeyi bıraktığı netleştirilir.
- 2. tur notundaki "onaylanan video = yüklenen video" sorunu çözülür ya da açıkça kabul edilir.

**Faz 1 (A), IB testi**
- Oturum 0: Sahibi Studio'dan IB için izlenim, CTR ve tutma sayılarını girer. Günlük otomatik IB yayını kapalı kalır: `IB_PREMIUM_PRIMARY=1`, `IB_PREMIUM_PUBLISH=0`.
- Oturum 1–3: Her biri bir video, stok hatta elle başlatılır (`engine=legacy`). Önce yüklemesiz render (`dry_run=true`, video `portfolio-preview` artifact'inde). Sahibi izleyip onaylayınca yükleme çalıştırması yapılır. İlk kontrol: konu "en az 4 lisanslı görsel" şartını geçiyor mu.
- Konu adayları: `IB-EAR-006` Yellowstone, `IB-EAR-071` Atlantik akıntısı, `IB-SPA-006` 1859 güneş fırtınası. Reddedilen konunun yerine aynı türden başka konu seçilir.
- Sabitler: aynı başlık kalıbı, aynı ses, her gün 21:00 (GMT+3). Değişken: yalnızca konu.
- Oturum 4: 7. gün ölçümü.

**Karar kuralı (7. gün)**
- 3 videodan en az 2'si 400 izlenmeyi geçerse: stok format IB varsayılanı olur, Faz 2'ye geç.
- 3'ü de 150'nin altında kalırsa: sorun format değil; başlık ve ilk 3 saniye test edilir.
- Arada kalırsa: aynı kalıpla 3 video daha.
- 3 videoluk örneklem yalnızca yön gösterir, kesin kanıt değildir. Eski IB medyanı (922) 4–6 haftalık toplamdı, eşik ise 7. gün; 400 temkinli kalıyor.

**Faz 2 (C), güvenilirlik katmanı** (Faz 1 olumluysa; her katman ayrı video grubu, ayrı ölçüm)
1. Doğal başlıklar ("How X Really Failed", "What Failed First" yerine).
2. Daha doğal ses (tek değişken).
3. Ekranda gerçek kaynak adı (NASA, USGS gibi); yalnızca doğrulanmış bilgi.
4. Gerçek veriye dayalı harita/grafik katmanı.

## 8. Sahibe kalan kararlar
- Yayın ayarları: `IB_PREMIUM_PRIMARY=1`, `IB_PREMIUM_PUBLISH=0`.
- Her videonun deneme render'ı sonrası yükleme onayı.
- Studio verilerinin elle girilmesi.

---

## İnceleme notu (2. tur, 2026-11-15)

**Onaylanan video ile yüklenen video aynı olmayabilir.**
- Yükleme çalıştırması deneme render'ını kullanmaz, videoyu baştan render eder. Üretim klasörü git'e girmiyor (`.gitignore:82` `channels/*/state/production/`), deneme render'ının MP4'ü yalnızca artifact olarak kalıyor.
- Stok klip seçimi iki çalıştırmada farklı olabilir. Böylece sahibin izlediği video ile yayınlanan video ayrışabilir.
- Faz 0'da iki yoldan biri seçilmeli:
  - (a) Yükleme çalıştırması, onaylanan deneme render'ının artifact'ini yükler. Daha güvenli, biraz daha çok iş.
  - (b) Render'ın aynı konu için aynı klipleri seçtiği doğrulanır. Kanıtlanamazsa (a) yapılır.
- Ayrıca kontrol edilecek: açık konu adıyla yapılan yüklemede yayın saati. Bu yolda takvim kontrolü atlanıyor (`impossible-brief.js:184`), `publishAt`'in 21:00 GMT+3'e düştüğü doğrulanmalı.
