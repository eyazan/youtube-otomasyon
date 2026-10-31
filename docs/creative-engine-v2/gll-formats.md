# GoalLore Lab: üç format için profesyonel görsel yaklaşım (29 Ekim 2026)

GLL yayını kapalı. Bu belge yalnızca görsel yaklaşımı ve lisans durumunu somutlaştırır; yeni mimari başlatmaz. Tüm
formatlar, Roberto Carlos pilotunda (`pilots/gll-magnus-3d`, izole Three.js) denenen aynı yapı taşlarını kullanır:
- saha, kale, tribün;
- yüzsüz ve nötr renkli eklemli oyuncular;
- top, iz ve kuvvet okları;
- sahneye göre kamera;
- `REPORTED` / `MODEL` / `ILLUSTRATION` etiketleri.

## Ortak kurallar

- **Görüntü yok:** maç yayını, kulüp ya da federasyon görüntüsü, fotoğraf ve logo kullanılmaz. Hepsi telif ve Content
  ID riski taşır. Her şey özgün animasyondur.
- **Benzerlik yok:** oyuncular yüzsüz figürlerdir. Gerçek forma renkleri ve sponsorlar kullanılmaz. İsim yalnızca
  anlatımda geçer.
- **Konum uydurulmaz:** gerçek koordinat yoksa sahne "ILLUSTRATION · POSITIONS REPRESENTATIVE" etiketini taşır.
  Konumdan çıkarılan bir iddia (ör. "ofsayttaydı") yalnızca kaynaklı karar ya da veriyle yapılır.
- **Sayılar etiketlenir:** her sayı ya kaynaklıdır (REPORTED) ya model çıktısıdır (MODEL).

## 1. Match Decision Explained

**Soru:** "Hakem neden bu kararı verdi?" Örnek konular: ofsayt, el, penaltı, ikinci sarı, VAR müdahalesi.

| Sahne | Görsel | Dayanak |
|---|---|---|
| Kanca | Kararın verildiği an; düdük, donmuş kare, tek soru | Maç raporu (tarih, dakika, karar) |
| Kural | Kuralın ilgili maddesi ekranda kendi sözlerimizle özetlenir ve madde numarası verilir (ör. "Law 11"). Kitapçıktan birebir uzun alıntı yapılmaz. | IFAB Laws of the Game. Kitapçık izinsiz çoğaltma ve çeviriyi yasaklıyor; kısa özet ve madde atfı yeterli |
| Yeniden kurgu | Kuşbakışı saha, oyuncu figürleri, ofsayt çizgisi ve son savunmacı vurgusu | Gerçek koordinat varsa açık veri; yoksa ILLUSTRATION |
| Karar | Kuralın bu duruma uygulanışı, alternatif kararla karşılaştırma | Hakem açıklaması ya da resmi açıklama (kaynaklı) |

Görsel dil:
- ortografik kuşbakışı;
- karar anında yavaşlama;
- tek renk vurgu: ihlal kırmızı, kural mavi;
- ölçek çizgileri (ör. "ofsayt çizgisinden 0,3 m"), ama yalnızca veri ya da resmi açıklama varsa.

## 2. The Moment That Changed The Match

**Soru:** "Maç hangi anda döndü?" Örnek konular: bir gol, bir kırmızı kart, bir taktik değişiklik.

| Sahne | Görsel | Dayanak |
|---|---|---|
| Kanca | Skor tabelası animasyonu: önce ve sonra | Resmi maç sonucu |
| Bağlam | Zaman çizelgesi: dakika ve olaylar | Maç raporu |
| An | 3D yeniden kurgu: kamera yayın açısı yerine taktik açıda (yüksek, çapraz) | Açık event verisi varsa olay sırası; yoksa ILLUSTRATION |
| Etki | Önce/sonra karşılaştırması: şut sayısı, topa sahip olma ya da formasyon | Yalnızca kaynaklı istatistik |

Görsel dil:
- zaman çizelgesi bir motif olarak her sahnede görünür;
- olay anında kamera sahaya iner;
- iki sütunlu önce/sonra bilgi panosu.

## 3. Football Physics & Genius

**Soru:** "Bu nasıl mümkün oldu?" Örnek konular: Roberto Carlos frikiği, knuckleball, kafa vuruşu açısı, kalecinin
reaksiyon süresi.

Pilot zaten var: `pilots/gll-magnus-3d`.
- **Fizik:** SI birimleriyle RK4, sürüklenme ve Magnus.
- **Kavramlar:** spinsiz yörüngeyle karşılaştırma, kuvvet okları, spiral.
- **Açılış:** ilk karede topun yakın planı ve görünür spin.
- **Bilimsel dayanak:** hakemli makale (ör. Dupeux ve ark., 2010).
- **Ayrım:** tarihî ve raporlanmış bilgiler ile örnek simülasyon parametreleri ayrı tablolarda tutulur
  (`pilots/gll-magnus-3d/MODEL.md`).

Görsel dil:
- topun yakınında takip kamerası;
- kuvvet okları ve sayısal okumalar;
- "modelde" sahnelerde ızgaralı ayrı bir zemin, gerçek sahneyle karıştırılmaz.

## Veri ve görüntü lisansları (durum: 29 Ekim)

Kaynak metinleri bu ortamdan doğrudan açılamadı; bilgiler aramayla doğrulandı. **Hiçbir veri kümesi, lisans metni
birebir okunmadan kullanılmayacak.**

| Kaynak | İçerik | Bulunan | Ticari YouTube kullanımı |
|---|---|---|---|
| StatsBomb Open Data (github.com/statsbomb/open-data) | Event verisi, bazı maçlarda freeze-frame | Depo: "araştırma ve futbol analitiğine ilgi için halka açık"; kullanıcı sözleşmesi ve StatsBomb atfı (logo) gerekli. Bir ikincil kaynak "ticari olmayan" diyor | **Belirsiz.** Sözleşme okunmadan kullanılmaz. Gerekirse StatsBomb'a yazılı soru |
| Metrica Sports sample data | 3 anonim maç, tracking + event | İsimler anonim; lisans arama sonuçlarında görünmedi | **Belirsiz.** Anonim veri gerçek maç anlatımına zaten uymaz; ancak ölçek ve taktik örneği olarak kullanılabilir |
| SkillCorner open data | Yayın görüntüsünden tracking, 9 maç | Lisans görülmedi | **Belirsiz** |
| Pappalardo ve ark. Wyscout veri kümesi (figshare) | 7 lig, bir sezon event | Atıf isteniyor; lisans figshare sayfasında doğrulanmalı (CC BY 4.0 olduğu biliniyor ama burada teyit edilmedi) | Teyit edilirse en uygun aday (CC BY: atıfla ticari kullanım serbest) |
| IFAB Laws of the Game | Kurallar | Kitapçık izinsiz çoğaltma ve çeviriyi yasaklıyor | Uzun alıntı yok; kendi sözlerimizle özet ve madde atfı |
| Maç yayın görüntüsü, fotoğraf, kulüp logosu | — | Telif hakkı yayıncı ve hak sahiplerinde | **Kullanılmaz** |

**Sonraki adım (onay gerektirmez):** bir CI adımında dört deponun LICENSE dosyasını ve README'sini (StatsBomb, Metrica,
SkillCorner, figshare) indirip birebir kaydetmek. Sonuç lisans tablosuna işlenir. O zamana kadar GLL sahneleri
ILLUSTRATION etiketli temsili konumlarla kalır.
