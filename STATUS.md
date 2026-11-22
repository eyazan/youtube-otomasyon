# STATUS — 2026-11-22 (son şans testi yayında)

Kaynaklar: `origin/main` durum dosyaları (`channels/*/state/ops/production-stages.json`, `premium/approvals/`), üretim çalışması günlükleri (14–15 Kasım), herkese açık izlenmeler (vidIQ, 15 Kasım).

## Biten
- **82 Short yüklendi** (FR 45, IB 24, BTO 5, CT→GLL 8). Son yükleme: FR 10 Kasım, IB 13 Kasım.
- **Faz 0 Task 1:** Elle başlatmada `topic` girişi (`08c93851`). Yalnızca `channel=impossible-brief` ve `engine=legacy` ile çalışır. Bilinmeyen konu açık hata verir. Lisanslı görseli 4'ten az olan konu nedeniyle reddedilir, yerine başka konu seçilmez. Testler 1064/1064, actionlint temiz.
- **Faz 0 Task 2:** Yüklemelerin neden durduğu bulundu (aşağıda). Hiçbir ayar değişmedi.

## Yükleme durma nedeni (salt-okunur bulgu)
- **IB:** 14 Kasım'dan beri her zamanlanmış çalışma aynı konuyu, `IB-FUT-042`'yi, premium yayın yolunda yeniden render ediyor. Render sert QA'dan geçemiyor (`package verdict BLOCKED`), video yüklenmiyor. Günde yaklaşık 10 deneme oluyor.
  - Kod "konu reddedildi, bir daha seçilmez" diyor, ama IB'nin `premium/` klasörü git'e girmiyor (`channels/impossible-brief/premium/.gitignore` `/*/`). Ret kaydı çalışmayla birlikte kayboluyor ve konu sonsuza kadar tekrar seçiliyor.
  - Bu, IB'de premium yayın yolunun **açık** olduğunu gösteriyor (`IB_PREMIUM_PUBLISH` etkin). Tasarım `IB_PREMIUM_PUBLISH=0` varsayıyor.
- **FR:** Her çalışma "publication policy signed, but no qualified topic" diyor. Premium hat için uygun konu kalmamış. Son otomatik rezervasyon 10 Kasım (`FR-amtrak-188-2015`). Hangi filtrenin konuları elediği **bilinmiyor**.
- **Önerilen düzeltme (sahibin kararı, uygulanmadı):** `IB_PREMIUM_PUBLISH=0` yapılırsa döngü durur ve tasarımla uyumlu olur. FR için Faz 1 sonucu beklenir.

## Faz 0 deneme render'ları (dry_run, yükleme yok)
- `IB-EAR-006` Yellowstone (run 43747336956): görsel ön kontrolünü geçti, render alındı, ama kalite doğrulamasında **reddedildi**: `timing` (açılış cümleleri süre sınırını aşıyor) ve `growthReadiness` (hazırlık BLOCK: viral puanı 71 < 75). Yayınlanabilir değil; yerine aynı türden konu gerekir. Video `portfolio-preview` artifact'inde (7 gün).
- `IB-EAR-071` Atlantik akıntısı (run 43747776340): **tüm doğrulamalardan geçti**, render alındı, yükleme yapılmadı. Video `portfolio-preview` artifact'inde (7 gün). Sahip izleyebilir.
- `IB-SPA-006` 1859 güneş fırtınası (run 43748129393): **tüm doğrulamalardan geçti**, render alındı, yükleme yapılmadı. Video `portfolio-preview` artifact'inde (7 gün).
- Faz 1 için 3. konu gerekiyor (IB-EAR-006 yerine, aynı türden). Seçim sahibin.

## Yarım
- **Oturum 0b (Task 3–4) yapılmadı.** Engel: IB'de `premiumOnlyUploads: true` (`channels/impossible-brief/config.json`, 28 Ekim). Stok hat `PUBLISH=1` ile çalışmıyor, yükleyici de premium hattın hazırlamadığı her MP4'ü reddediyor (`LEGACY_UPLOAD_REFUSED`). Faz 1'in yükleme adımı bu ayar değişmeden imkânsız. Bu bir yayın güvenlik ayarı, karar sahibin.
- PR #411 ve #416 açık. Dört videonun sahip onayı bekliyor (`docs/review/final-2026-11-04/`). Studio düzeltmeleri yapılmadı.

## Sıradaki TEK adım
**Son şans testi başladı (22 Kasım).** PR #491 birleşti, `IB_PREMIUM_PUBLISH=0`. 3 stok IB videosu yüklendi, otomatik yayın 21:00 TR:

| Yayın | Konu | Video |
|---|---|---|
| 23 Kasım | IB-EAR-071 Atlantik akıntısı | https://youtu.be/h3v8MvQS-ZU |
| 24 Kasım | IB-EAR-029 Antarktika buz örtüsü | https://youtu.be/in0IM-aEs3A |
| 25 Kasım | IB-EAR-049 Hiç yağmur yağmasa | https://youtu.be/UQmcPc4keRo |

IB-SPA-006 ve IB-EAR-086 yayından önce hazırlık eşiğine takıldı (viral puanı 74 < 75), yerlerine yukarıdakiler girdi.
**2 Aralık:** her videonun 7. gün izlenmesi okunur. En az 2'si 400+ → devam. Üçü de 150 altı → dur. Arada → bir tur daha. O güne kadar yeni geliştirme yok.

## Bloklar
- `tests/js/ib-premium.test.js` "IB readiness" testi ana dalda da başarısız (IB-OTH-020 artık hazır değil; durum verisi kayması). Bu değişiklikle ilgisi yok.
- BTO OAuth `INVALID_CLIENT`.
- İzlenim ve CTR verisi yok; sahip Studio'dan girmeli.
- Her onay ve birleştirme sahipte. Kod onay kaydı yazmaz.

## Sayılar (herkese açık, 15 Kasım)
| Kanal / dönem | Video | Medyan izlenme |
|---|---|---|
| FR stok (22 Eyl–23 Eki) | 30 | 465 |
| FR animasyon (28 Eki–10 Kas) | 13 | 66 |
| IB stok (2–19 Eki) | 17 | 922 |
| IB animasyon (29 Eki–13 Kas) | 5 | 82 |

Abone: FR 31, IB 13. İzlenim ve CTR **bilinmiyor**.
