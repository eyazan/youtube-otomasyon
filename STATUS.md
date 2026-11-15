# STATUS — 2026-11-15

Kaynaklar:
- Yayın kayıtları: `origin/main` `5e1381e7` içindeki `icerik/yayinlananlar.json` ve `channels/*/state/published.json`.
- İzlenme sayıları: kanalların herkese açık listesi (vidIQ, 15 Kasım).
- Bu not yazılırken hiçbir şey çalıştırılmadı.

## Biten
- **Pipeline Remotion değil.** Kendi stüdyomuz: Chromium'da SVG sahneler, ffmpeg ve Edge TTS (`scripts/bto-studio`). Yanında eski stok-görüntü hattı da var (`shorts-yap.js`). İkisi de cron ile render alıp YouTube'a yüklüyor.
- **Uçtan uca çalışıyor.** Son yüklemeler FR'de 10 Kasım, IB'de 13 Kasım. Animasyonlu (premium) hat FR'ye 13 video yükledi (`channels/failure-reconstructed/premium/approvals/*.json`).
- **Toplam 82 Short yüklendi:**

  | Kanal | Short | Not |
  |---|---|---|
  | Failure Reconstructed (FR) | 45 | 28 Ekim'den beri animasyonlu |
  | ImpossibleBrief (IB) | 24 | 29 Ekim'den beri animasyonlu |
  | Hidden Logic (BTO) | 5 | Herkese açık görünen 1 |
  | CriticalThread → GoalLore Lab | 8 | Kanal şimdi 0 video gösteriyor |

  Uzun video yok, hepsi Short.

## Yarım
- **PR #411 ve #416** açık, birleştirilmedi. CI yeşil, ana dala çakışma yok. Main hâlâ eski çizim kodunu kullanıyor.
- **Sahip onayları bekliyor:** IB-EAR-001, FR Costa Concordia, BTO-156, GLL-021. Paketler `docs/review/final-2026-11-04/` içinde.
- **Studio düzeltmeleri yapılmadı:** El Faro açıklaması, FR ve GLL kanal açıklamaları, dil ve anahtar kelimeler (`docs/premium-studio/youtube-settings-2026-11-04.md`).
- **Neden durdu, bilinmiyor:** FR 10 Kasım'dan, IB 13 Kasım'dan beri yükleme yok. Günlük rapor "not-due" diyor.

## Sıradaki TEK adım
İzlenme düşüşünün ana şüphelisini (animasyonlu formata geçiş) tek kanalda 3 videoluk testle doğrulamak. Plan oturum yanıtında. Önce sahip kararı: IB için hangi hat kullanılacak?

## Bloklar
- **BTO OAuth `INVALID_CLIENT`:** BTO yükleyemiyor ve analitik okunamıyor.
- **İzlenim ve CTR verisi yok.** API vermiyor; Studio'dan `analytics/<id>/studio-manual.json` olarak elle girilmesi gerekiyor.
- **Her onay ve birleştirme sahipte.** Kod onay kaydı yazmaz.

## Sayılar (herkese açık, 15 Kasım)
| Kanal / dönem | Video | Medyan izlenme | Toplam |
|---|---|---|---|
| FR stok görüntü (22 Eyl–23 Eki) | 30 | 465 | 19.936 |
| FR animasyon (28 Eki–10 Kas) | 13 | 66 | 4.164 |
| IB stok görüntü (2–19 Eki) | 17 | 922 | 14.545 |
| IB animasyon (29 Eki–13 Kas) | 5 | 82 | 519 |
| BTO | 1 açık | 20 | — |
| GoalLore Lab | 0 | — | — |

Abone sayıları: FR 31, IB 13. YouTube Studio verileri henüz eklenmedi; izlenim ve CTR **bilinmiyor**.
