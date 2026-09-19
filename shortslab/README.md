# ShortsLab v0.1

Bu klasor, video motorunun ustune eklenecek arastirma ve deney katmaninin ilk
dikey dilimidir. Ilk arac, niche adaylarini ayni karar modeliyle siralar.

## Niche scoring

Her sinyal `0-100` araligindadir. Varsayilan agirliklar:

| Sinyal | Agirlik |
|---|---:|
| Trend velocity | 25% |
| Low competition | 20% |
| Global audience | 15% |
| Shorts suitability | 15% |
| Monetization potential | 10% |
| Content supply | 10% |
| Production efficiency | 5% |

`competition` ve `production_cost` girdileri ters cevrilir. `confidence`, ham
firsat puanini degistirmez; eksik veya zayif veriyi adjusted score uzerinden
cezalandirir. Boylece tahmin ile canli veriyi birbirine karistirmayiz.

Demo:

```bash
python3 -m shortslab rank \
  --input shortslab/data/demo-niches.json \
  --output shortslab/output/niche-ranking.json \
  --markdown shortslab/output/niche-ranking.md \
  --top 3
```

Test:

```bash
python3 -m unittest discover -s tests -v
```

`demo-niches.json` icindeki degerler sadece calisan ornektir; canli pazar
arastirmasi degildir ve kanal seciminde nihai veri olarak kullanilmamalidir.

## Sonraki adim

`trend-ara.js` ve `viral-analiz.js` ciktisini ortak JSON olay semasina almak;
ardindan sinyalleri son 30/90 gunluk gercek veriden hesaplayip bu scorer'a
beslemek.
