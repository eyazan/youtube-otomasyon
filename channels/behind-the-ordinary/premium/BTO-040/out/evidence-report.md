# BTO-040 evidence report: "The Shopping Cart Started as a Folding Chair"

Status: **RESEARCH PENDING. Not publishable.** The topic universe marks it `NEEDS_PRIMARY_SOURCE` (demoted 2026-10-07). Fewer than two facts are quote-verified on a non-Wikipedia authoritative source, and the channel rule requires two. This render exists to test whether the engine can be reused on a different story. Every frame carries "RESEARCH PENDING · NOT FOR PUBLICATION", and the publish gate blocks it at TOPIC_READY.

The narration is the channel's existing script, unchanged (sourceHash in `review-package.json`). Facts F1 to F9 come from the topic universe; no quote was written or edited in this session.

| Line | Narration | Cited facts | Support | Gap |
|---|---|---|---|---|
| L1 | The first shopping cart barely looked like a cart. | F2 | F2 quote (Wikipedia): "He found a wooden folding chair and put a basket on the seat and wheels on the legs" | Wikipedia only |
| L2 | And shoppers first refused to push it. | F5, F6 | Implied by F5 and F6 (the offended woman; models were hired) | **No captured quote says shoppers refused.** Needs a primary or secondary source with the refusal stated. |
| L3 | In 1936, grocer Sylvan Goldman wondered how customers could move more groceries. | F1 | F1 quote (Wikipedia): "in 1936, Goldman sat in his office wondering how customers might move more groceries" | Wikipedia only. Search summaries also give 1937 for the idea, so the date needs a primary source. |
| L4 | He put a basket on a folding chair's seat and wheels on its legs. | F2, F3 | F2 and F3 quotes (Wikipedia) | Wikipedia only |
| L5 | His Humpty Dumpty stores introduced these folding basket carriers in 1937. | F3, F4 | F4 quote (Wikipedia): "One of the first shopping carts was introduced on June 4, 1937, the invention of Sylvan Goldman"; F3 quote shown verbatim on screen | Wikipedia only |
| L6 | One offended woman told him she had pushed her last baby. | F5 | F5 quote (Wikipedia): "an offended woman informed Goldman" | **The captured quote stops before "pushed her last baby".** The full sentence needs capturing. |
| L7 | So Goldman hired models to push the carts around his store. | F6 | F6 quote (Wikipedia): "Goldman hired several male and female models to push his new invention around his store" | Wikipedia only |
| L8 | After that, the folding chair on wheels became extremely popular. | F6 | F6 claim | "Extremely popular" is in the claim but not in the captured quote |

The only non-Wikipedia quote is F9 (Oklahoma Historical Society, okhistory.org): "He established the Folding Basket Carrier Company to manufacture his invention". The script does not use it.

What would make this topic production-ready:
1. Capture verbatim quotes for L2, L3, L6 and L8 from a non-Wikipedia authoritative source (Oklahoma Historical Society encyclopedia entry GO004, Smithsonian or Lemelson materials, or Goldman's patent filings).
2. Settle the 1936 vs 1937 date for the idea.
3. Re-run research, set `researchStatus: VERIFIED` and `productionReady: true` through the channel's research pipeline (not by hand), then re-render without `--research-pending`.

On-screen material:
- **Visuals:** all original code drawings: aisle, silhouettes, chair-cart rig, plan, pram outline. There are no photographs, logos or brand marks. "Humpty Dumpty" is only spoken, never shown.
- **Quote card:** "Goldman called his carts "folding basket carriers"" is verbatim from F3.
- **Interpretations, marked conceptual:** the pram comparison (S6) and the store plan (S7).
