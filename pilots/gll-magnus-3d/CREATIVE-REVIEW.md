# Creative Director incelemesi: GLL-P01 Three.js pilotu (29 Ekim 2026, son render)

Bu değerlendirme gerçek MP4 karelerine dayanır: saniyede bir kare ve ilk 2 saniyede altı kare. Teknik QA'nın PASS
vermesi yaratıcı onay sayılmaz. Yayın kapalıdır.

| Konu | Değerlendirme | Durum |
|---|---|---|
| İlk 2 saniye | 0,0 s'de top yakın planda: halka ve okla spin yönü görünüyor, duvar arkada. 0,7–1,9 s arasında kamera bırakıyor ve 1,9 s'de kavisin tamamı açılıyor. İlk turdaki "uzakta küçük nokta" açılışından çok daha güçlü. | İyi |
| Oyuncu anatomisi | Eklem küreleri sayesinde diz ve dirsek boşlukları kapandı. Oranlar doğru. Ancak kas, kumaş ve el detayı yok; figürler "eklemli manken" düzeyinde. Yüzsüz olmaları kasıtlı (benzerlik yok). | Orta |
| Hareket | Vuruş salınımı tek eklem eğrisi: geri çekiş, temas, takip. Koşu yok, gövde dönüşü sınırlı. Duvar ve kaleci statik (kalecinin statik olması raporla uyumlu). | Orta |
| Top–ayak teması | Sol kramponun dış yüzü topun sağ-arka tarafına değiyor (ölçüldü). Temastan sonra top 20 kat ağır çekimde ayrılıyor. Spin yönü temasla ve modelle tutarlı. | İyi |
| Kamera kompozisyonu | Plan çeşitliliği iyi: yakın takip, yüksek kuruluş, ön-yan vuruş, takip, kale arkası, kuşbakışı model zemini. Zayıf noktalar: kuruluş planı (3–6,5 s) dört karede neredeyse aynı; makale kartı planı sade. | İyi / orta |
| Stadyum | Dört tribün, projektörler, saha dışı zemin; ışık gece maçı hissi veriyor. Seyirci dokusu prosedürel ve yakın planda desen olarak okunuyor. | Orta–iyi |
| Görünür spin | Halka, ok ve top dokusu dönüyor; ekranda "SHOWN 40× SLOWER" yazıyor. Kuvvet planında da spin halkası var. | İyi |
| Yörünge | RK4 modelinin çıktısı birebir çiziliyor: duvarın sağından geçiyor, dışarı yöneliyor, sağ direğin içinden giriyor. Kırmızı spinsiz iz karşılaştırma sağlıyor. Tüm sayılar MODEL etiketli. | İyi |
| Yazı ve okunurluk | Başlık ve altyazı koyu geçiş katmanları üzerinde. Sert yerleşim kontrolleri PASS. Okuma notu: kuvvet etiketlerinin küçük satırı (20 px) telefonda sınırda. | İyi |
| Bilimsel dürüstlük | Raporlanan ve model değerleri ayrı (MODEL.md); mesafe aralık olarak veriliyor; kaleci "REPORTED". | İyi |

## Karar

Görsel kalite mevcut 2D motora göre belirgin biçimde yüksek. Yayın kalitesi için kalan işler:

1. Kuruluş planına hareket: kamera kaydırma ve ağır çekimde koşu başlangıcı.
2. Makale kartı planında 3D arka plan (örneğin spiralin ön izlemesi).
3. Oyuncuda kumaş ve kas gölgesi için basit normal map.

GLL yayını ve ses onayı ayrı karar konularıdır. Bu inceleme yalnızca görseli kapsar.
