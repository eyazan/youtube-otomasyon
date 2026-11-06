"use strict";
// Prints the sentences of a Wikipedia article that match keywords, with the pinned revision, so a researcher can copy
// verbatim quotes into a seed (scripts/ib-ct-library/build.js verifies them again). Read-only; network: en.wikipedia.org.
//   node scripts/ib-research/excerpt.js <excerpts.json>    excerpts.json: [{ "article": "Tardigrade", "keywords": ["space", "radiation"] }]
const path = require("path");
const V = require(path.join(__dirname, "..", "gll-research", "verify"));

(async () => {
  const list = require(path.resolve(process.argv[2]));
  for (const { article, keywords } of list) {
    try {
      const src = await V.article(article);
      const re = new RegExp((keywords || []).join("|"), "i");
      const hits = V.sentences(src.text).filter((s) => re.test(s));
      console.log(`## ${src.title} (rev ${src.revid})`);
      for (const s of hits.slice(0, 25)) console.log(`- ${s}`);
    } catch (e) { console.log(`## ${article}: ERROR ${e.message}`); }
  }
})();
