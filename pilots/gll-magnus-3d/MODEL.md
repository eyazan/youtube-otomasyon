# GLL-P01 fizik modeli: ne raporlandı, ne simülasyon

1997 vuruşu hiçbir zaman ölçülmedi: hız, spin, açı ya da yörünge için kayıt yok. Bu yüzden ekrandaki her sayı ya
"REPORTED" ya da "MODEL" etiketi taşır.

## A. Tarihî ve raporlanmış bilgiler (kaynaklı, ölçüm değil)

| Bilgi | Kaynak düzeyi | Ekranda |
|---|---|---|
| 3 Haziran 1997, Stade de Gerland (Lyon), Brezilya–Fransa, Tournoi de France açılış maçı, 1–1 | Wikipedia (1997 Tournoi de France), Sky Sports; arama ile doğrulandı, birebir alıntı yok | "LYON · 3 JUNE 1997", "BRAZIL v FRANCE · TOURNOI DE FRANCE" |
| Sol ayağın dış tarafıyla vuruş | Maç raporları ve arşiv yazıları (topic.json, F2); yayın öncesi birebir alıntı gerekir | "OUTSIDE OF THE LEFT FOOT", vuruş anı "ILLUSTRATION" |
| Mesafe | Kaynaklar 33 m ile 40 yard arasında değişiyor; tek bir değer raporlanmış değil | "≈35 m TO GOAL · REPORTED 33 m – 40 yd · MODEL USES 35 m" |
| Top duvarın sağından geçti, dışarı gidiyordu, sonra içeri döndü | Maç raporları (F3) | Anlatım; yörünge çizgisi MODEL |
| Kaleci hareket etmedi | Maç raporları (F4); `researchNote` yayın öncesi yeniden kontrol istiyor | "KEEPER · DID NOT MOVE (REPORTED)" |
| Spiral açıklaması | Dupeux, Le Goff, Quéré & Clanet, "The spinning ball spiral", New J. Phys. 12, 093004 (2010) | Makale kartı |

Kullanılmayanlar:

- Medyada geçen hız değerleri (ör. "137 km/h") kullanılmıyor; doğrulanmış bir ölçüm değiller.
- Topun gerçek çıkış açısı, dönüş hızı ve kaleye girdiği nokta bilinmiyor.
- Oyuncuların gerçek konumları ve koşu yolu bilinmiyor. Duvar ve kaleci temsilidir.

## B. Simülasyon parametreleri (örnek, ölçüm değil)

| Parametre | Değer | Neden bu değer |
|---|---|---|
| Top kütlesi ve yarıçapı | 0,43 kg; 0,11 m | FIFA 5 numara top aralığı (410–450 g, 68–70 cm çevre) |
| Hava yoğunluğu | 1,2 kg/m³ | Deniz seviyesi |
| Sürüklenme katsayısı Cd | 0,25 | Sürüklenme krizi sonrası tipik değer (Dupeux ve ark. aralığı) |
| Magnus kuvveti | F = ½ρA r (ω × v) | Kaldırma spin oranıyla orantılı varsayılıyor (makaledeki model) |
| Çıkış hızı | 38 m/s | ÖRNEK: raporlanan şekli (duvarın sağı, dışarı, geç dönüş) üretecek değer |
| Spin | 10 tur/s, dikey eksen (ω = +y) | ÖRNEK; yön, sol ayağın dış yüzüyle topun sağ-arka tarafına vuruşun verdiği yön |
| Yaw ve pitch | 9,31° ve 11,94° | Çıktı: hedef noktaya (sağ direğin içi, 1,35 m) ulaşmak için Newton yöntemiyle çözüldü |
| Hedef nokta | x = 3,0 m, y = 1,35 m | ÖRNEK; gerçek giriş noktası bilinmiyor |
| Spiral sahnesi | Yerçekimi kapalı, spin sabit, 12 s | Makaledeki düşünce deneyi: "top yere düşmeseydi" |

Ekranda MODEL etiketiyle gösterilen çıktılar:

- hız 38 → 23,7 m/s;
- Magnus ≈5,1 N, sürüklenme ≈6,0 N;
- spinsiz yörüngenin direği 6,6 m dışarıda bırakması;
- dönme yarıçapının 104 m'den 15 m'ye inmesi.

Spin görsel olarak 40 kat yavaş gösteriliyor: gerçek hız 30 fps'de kare başına 1/3 tur ediyor ve titremeye dönüşüyor.
Ekranda bu da yazıyor.
