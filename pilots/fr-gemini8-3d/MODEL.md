# FR Gemini 8 modeli: NASA kaynakları ve temsili parametreler

Gerçek telemetri kullanılmadı. Kullanılan tek raporlanmış hız değeri, yaklaşık 296°/s ("about one rotation per
second") roll tepe değeridir.

## A. Raporlanan (kaynaklı)

| Bilgi | Kaynak | Ekranda |
|---|---|---|
| 16 Mart 1966, Agena hedef aracıyla (GATV-8) iki aracın ilk kenetlenmesi | NASA, "55 Years Ago: Gemini VIII, the First Docking in Space"; NASA Gemini VIII görev sayfası | "DOCKED · 16 MARCH 1966 · FIRST DOCKING OF TWO SPACECRAFT" |
| OAMS roll iticisi No. 8 kısa devre yaptı ve sürekli ateşledi | NASA Gemini VIII sayfası ("roll thruster no. 8 on the OAMS had short-circuited… stuck open") | "OAMS ROLL THRUSTER No. 8 · SHORTED, KEPT FIRING (NASA)" |
| Ayrılmadan sonra Gemini daha hızlı döndü; roll, pitch ve yaw; roll yaklaşık 1 tur/s | NASA history ("roll, pitch and yaw even more rapidly"; "a roll rate of one rotation per second"); 296°/s değeri ikincil kaynaklarda | "≈296°/s ROLL · REPORTED PEAK · ALSO PITCH AND YAW" |
| Armstrong OAMS'ı kapattı, burundaki Re-entry Control System ile dönüşü durdurdu; 16 RCS iticisi; yakıtın ≈%75'i kullanıldı; kurallar gereği erken iniş | NASA Gemini VIII sayfası | "RE-ENTRY CONTROL SYSTEM · OAMS SHUT DOWN", "≈75% OF RCS FUEL USED (NASA)", "RULES REQUIRED A LANDING ONCE THE RCS WAS USED" |
| Ders: tek bir arızanın izole edilebilmesi için itici devreleri değiştirildi | Vaka dosyası (`icerik/konular/gemini-8-1966.json`, ders); NASA: ekip OAMS'ı devre kesicilerle izole etti | "THE FIX" kartı |

Kaynak çelişkisi: bir NASA belgesi ayrılma sonrası artışı "a failed Gemini RCS thruster" ifadesiyle anlatıyor. NASA
görev sayfası ise OAMS No. 8'i gösteriyor. Ekranda NASA görev sayfasının anlatımı kullanılıyor.

## B. Geometri (yayımlanmış ölçülerden sadeleştirilmiş, temsili)

| Parça | Değer | Kaynak |
|---|---|---|
| Gemini toplam uzunluk | ≈5,7–5,8 m (kaynaklar 5,736 m ile 5,791 m) | spacefacts.de; thisdayinaviation (NASA raporlarına dayanarak) |
| Adaptör | taban çapı 3,05 m, yükseklik 2,29 m, beyaz | space.skyrocket.de |
| Yeniden giriş modülü | ≈3,35 m, ısı kalkanı ≈2,3 m, siyah | spacefacts.de |
| OAMS attitude iticileri | 8 adet, 25 lbf (≈111 N), adaptörün arka çevresinde | Wikipedia (OAMS); NASA artefakt kaydı |
| RCS | 16 itici, burnun tabanında, iki halka | NASA; Wikipedia |
| Agena | 1,52 m çap; kenetlenme adaptörüyle ≈7,9 m | Wikipedia (Agena target vehicle) |

Temsili olanlar:

- kabin pencereleri ve itici konumlarının açısı ("POSITION REPRESENTATIVE");
- adaptör takviye çizgileri;
- Dünya dokusu (harita değil).

## C. Model (MODEL etiketli, telemetri değil)

| Büyüklük | Değer | Nasıl |
|---|---|---|
| Tork | ≈170 N·m | 111 N × 1,525 m. Varsayım: teğet itici, kaldıraç kolu adaptör yarıçapı |
| Gemini roll eylemsizliği | ≈3.090 kg·m² | 0,35 × 3.790 kg × (1,525 m)² (kaba kabuk tahmini) |
| Agena roll eylemsizliği | ≈920 kg·m² | 0,5 × 3.175 kg × (0,76 m)² (Agena kütlesi astronautix'ten) |
| Kenetli toplam | ≈4.000 kg·m² | Eş eksenli toplam |
| "%23 daha az" | 1 − 3.090/4.000 | Aynı torkla daha hızlı dönüş açıklaması |
| Faz süreleri | 53 s + 53 s | Tepe 296°/s'ye ulaşacak şekilde çözüldü. Gerçek zaman çizelgesi değil; ekranda süre yok |
| Pitch/yaw salınımı | genlik ve hız temsili | Raporlanan "rolled, pitched and yawed" hareketini göstermek için |
| Roll hızı göstergesi | 0'dan 296°/s'ye | Model profili; yalnızca beyaz çizgi (296°/s) raporlanmış değer |
