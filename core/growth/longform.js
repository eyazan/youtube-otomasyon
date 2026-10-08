"use strict";

// LONG-FORM CONTENT ENGINE (PHASE 32–32T). An extension of the existing
// pipeline, not a second generator: it reuses the normalized topic model,
// source tiers, hook engine, title engine, first-seconds planner, funnel and
// readiness gate, and hands rendering to the existing long-video chain
// (seslendir.js → gorsel-bul.js → video-yap.js) and upload to youtube-yukle.js.
//
//   ResearchPackage → outline → cold opens → script (+claim/source map) →
//   scene plan → asset plan → thumbnails → titles → derived Shorts →
//   related-video mapping → next video / end screen → cost → quality gate
//
// Quality over cadence: the gate never relaxes because seven days passed.

const crypto = require("crypto");
const M = require("../../lib/metin");
const Config = require("./config");
const Store = require("./store");
const Model = require("./topic-model");
const Sources = require("./sources");
const Hooks = require("./hooks");
const Titles = require("./titles");
const FirstSeconds = require("./first-seconds");
const Funnel = require("./funnel");
const Readiness = require("./readiness");
const Research = require("./research");
const Provider = require("../llm/longform-provider");

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const words = (text) => String(text || "").split(/\s+/).filter(Boolean).length;
const finish = (text) => { const value = Model.clean(text); return !value ? "" : /[.!?]$/.test(value) ? value : value + "."; };

// ---------------------------------------------------------------------------
// RESEARCH PACKAGE (PHASE 32S) — reused by long-form, derived Shorts,
// metadata and fact checks; every claim keeps its source.
function topicHash(topic) {
  return crypto.createHash("sha1").update(JSON.stringify(topic.raw || topic)).digest("hex").slice(0, 12);
}

function researchPackage(channel, topic, options = {}) {
  const file = `research/${topic.slug}.json`;
  const existing = options.fresh ? null : Store.readState(channel, "longform", file, null);
  const deep = options.deep && Array.isArray(options.deep.claims) ? options.deep : null;
  const hash = topicHash(topic) + (deep ? `+deep${deep.claims.length}` : "");
  if (existing && existing.topicHash === hash && existing.channel === channel.slug) {
    existing.reuseCount = (existing.reuseCount || 0) + 1;
    if (options.write !== false) Store.writeState(channel, "longform", file, existing);
    return existing;
  }
  const sourceQuality = Sources.sourceQuality(topic.sources);
  const claims = [];
  const seen = new Set();
  const add = (text, layer, source, role, extra = {}) => {
    const value = finish(Hooks.sentenceCase ? Hooks.sentenceCase(text) : text);
    const key = value.toLowerCase();
    if (!value || seen.has(key) || words(value) < 3) return;
    seen.add(key);
    claims.push({ id: `C${claims.length + 1}`, text: Model.capital(value), class: Sources.classifyClaim(layer), layer, source: source || (topic.sources[0] && topic.sources[0].name) || "topic record", role, ...extra });
  };
  const primary = topic.sources[0] ? topic.sources[0].name : "topic record";
  if (topic.consequence) add(topic.consequence, "CONFIRMED FACT", primary, "consequence");
  if (topic.trigger) add(topic.kind === "case" ? `The trigger: ${topic.trigger}` : `Assume ${Model.lower(topic.trigger)}`, topic.kind === "case" ? "CONFIRMED FACT" : "SPECULATIVE SCENARIO", primary, "trigger");
  if (topic.mechanism) add(topic.kind === "case" ? `The mechanism: ${topic.mechanism}` : topic.channel === "critical-thread" ? topic.mechanism : `The governing physics: ${topic.mechanism}`, topic.channel === "critical-thread" ? "VERIFIED FACT" : "CONFIRMED FACT", primary, "mechanism");
  if (topic.number) add(`The key figure: ${topic.number}`, "CONFIRMED FACT", primary, "number");
  for (const sentence of M.cumleler(topic.misconception || "")) add(sentence, "CONFIRMED FACT", primary, "misconception");
  for (const [index, step] of (topic.chain || []).entries()) add(`Step ${index + 1} of the failure chain: ${Model.lower(Hooks.sentenceCase(step))}`, "CONFIRMED FACT", primary, "chain");
  for (const item of topic.timeline || []) add(`${item.t}: ${item.event}`, "CONFIRMED FACT", primary, "timeline");
  for (const line of topic.narration || []) add(line, "CONFIRMED FACT", "editorial narration (case file)", "narration");
  for (const item of topic.evidence || []) if (item.source !== "editorial narration" && item.source !== "case file") add(item.claim, item.layer || item.confidence, item.source, item.role || "evidence", { url: item.url || null });
  if (topic.dependency) add(topic.dependency, "VERIFIED FACT", primary, "dependency");
  if (topic.bottleneck) add(topic.bottleneck, "MODEL", primary, "bottleneck");
  if (topic.channel === "critical-thread" && topic.consequence) add(topic.raw.failureConsequence, "MODEL", "CriticalThread bounded dependency model", "failure-scenario");
  if (topic.resilience) add(topic.resilience, "VERIFIED FACT", primary, "resilience");
  if (topic.lesson && topic.kind === "case") add(`What changed: ${topic.lesson}`, "INTERPRETATION", primary, "lesson");
  if (topic.debate) add(topic.debate, "INTERPRETATION", primary, "debate");
  if (topic.channel === "impossible-brief") add("The exact timeline depends on how the impossible change happens; the order of effects is what established physics constrains.", "SPECULATIVE SCENARIO", "ImpossibleBrief claim framework", "limits");
  // Deep research (encyclopedia sentences): facts for the LLM writer only —
  // verbatim:false keeps them out of the deterministic narration (CC BY-SA).
  for (const claim of deep ? deep.claims : []) add(claim.text, "CONFIRMED FACT", claim.source, claim.role, { verbatim: false, url: claim.url, section: claim.section, licence: claim.licence });
  const deepSources = deep && deep.article && !(topic.sources || []).some((source) => Research.wikiTitleFromUrl(source.url) === deep.article)
    ? [{ name: `Wikipedia — ${deep.article}`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(deep.article.replace(/ /g, "_"))}`, type: "encyclopedia" }] : [];
  const value = {
    schema: "research-package/1",
    id: `${channel.slug}:${topic.slug}`,
    channel: channel.slug,
    topicId: topic.id,
    slug: topic.slug,
    subject: topic.subject,
    cluster: topic.cluster,
    topicHash: hash,
    createdAt: (options.now || new Date()).toISOString(),
    reuseCount: 0,
    reusableFor: ["long-form", "derived-shorts", "metadata", "fact-check", "visual-sourcing", "follow-up-episodes"],
    sources: deepSources.length ? Sources.sourceQuality([...(topic.sources || []), ...deepSources]).tiers : sourceQuality.tiers,
    deepResearch: deep ? { article: deep.article, via: deep.via, claims: deep.claims.length, status: deep.status, licence: deep.licence } : null,
    sourceQuality: sourceQuality.score,
    primarySources: sourceQuality.primaryCount,
    claims,
    visualLeads: [
      ...(topic.visualScenes || []).map((scene) => ({ text: scene.text, source: scene.source || null, start: scene.start, origin: "case-file" })),
      ...((deep && deep.images) || []).map((file) => ({ text: file.replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " "), source: `Commons: ${file}`, origin: "article-image (licence check pending)" })),
    ],
    footage: topic.footageSources || [],
    gaps: [
      ...(sourceQuality.primaryCount === 0 ? ["no primary/authoritative source — add an official investigation, agency or academic source"] : []),
      ...((topic.sources || []).length < 3 ? [`${(topic.sources || []).length} source(s); long-form needs ≥ 3`] : []),
      ...(claims.filter((claim) => claim.class === "CONFIRMED_FACT").length < 12 ? ["fewer than 12 confirmed claims — not enough evidence for 8–12 minutes without padding"] : []),
      ...(!deep || !deep.claims.length ? ["no deep research — long-form depth limited to the Shorts case file"] : []),
    ],
  };
  if (options.write !== false) Store.writeState(channel, "longform", file, value);
  return value;
}

// ---------------------------------------------------------------------------
// OUTLINE (PHASE 32A): channel structure, sections open only if evidence exists.
const SECTION_ROLES = {
  COLD_OPEN: ["consequence", "narration"], CONSEQUENCE: ["consequence", "number"], WHAT_HAPPENED: ["timeline", "narration", "event"], SYSTEM: ["mechanism", "dependency", "background"],
  HIDDEN_WEAKNESS: ["trigger", "misconception"], EARLY_WARNING: ["misconception"], FAILURE_CHAIN: ["chain"], CRITICAL_MOMENT: ["narration", "timeline"],
  ENGINEERING_EXPLANATION: ["mechanism", "number", "evidence", "cause"], AFTERMATH: ["narration", "aftermath"], WHAT_CHANGED: ["lesson"], FINAL_TAKEAWAY: ["debate", "lesson"],
  IMPOSSIBLE_QUESTION: ["consequence"], INITIAL_CONDITIONS: ["trigger", "background"], FIRST_EFFECT: ["evidence", "narration", "event"], SECOND_ORDER_EFFECT: ["consequence", "aftermath"],
  SYSTEM_WIDE_CONSEQUENCE: ["consequence", "evidence"], SCIENCE_EXPLANATION: ["mechanism", "evidence", "cause"], LIMITS_UNCERTAINTIES: ["limits"], FINAL_SCIENTIFIC_PAYOFF: ["limits", "consequence"],
  INVISIBLE_SYSTEM: ["dependency", "evidence", "background"], WHERE_IT_EXISTS: ["evidence", "event"], HOW_IT_WORKS: ["mechanism", "evidence", "cause"], WHAT_DEPENDS_ON_IT: ["dependency"],
  BOTTLENECK: ["bottleneck", "evidence"], WHY_THE_BOTTLENECK_EXISTS: ["bottleneck"], FAILURE_SCENARIO: ["failure-scenario"], CASCADING_CONSEQUENCES: ["failure-scenario", "consequence", "aftermath"],
  REDUNDANCY_ALTERNATIVES: ["resilience"], FINAL_SYSTEM_INSIGHT: ["resilience"],
  THE_QUESTION: ["question", "narration"], ORIGIN_CONTEXT: ["origin", "context"], THE_PROBLEM: ["problem"], THE_EXPLANATION: ["explanation", "mechanism", "evidence"],
  SURPRISING_DETAIL: ["surprising-detail", "misconception"], REAL_WORLD_CONSEQUENCE: ["consequence"], FINAL_PAYOFF: ["payoff", "lesson"], NEXT_CURIOSITY_BRIDGE: ["payoff"],
};

const SECTION_QUESTION = {
  COLD_OPEN: "What is the unresolved consequence the viewer sees first?", CONSEQUENCE: "What was lost?", WHAT_HAPPENED: "In what order did it happen?",
  SYSTEM: "How was the machine/structure supposed to work?", HIDDEN_WEAKNESS: "Where was the weakness hiding?", FAILURE_CHAIN: "Which step led to which?",
  CRITICAL_MOMENT: "What was the point of no return?", ENGINEERING_EXPLANATION: "What is the physical mechanism?", AFTERMATH: "What happened next?",
  WHAT_CHANGED: "What do engineers do differently now?", FINAL_TAKEAWAY: "What should the viewer remember?",
  IMPOSSIBLE_QUESTION: "What exactly is being asked?", INITIAL_CONDITIONS: "What do we assume?", FIRST_EFFECT: "What changes first?",
  SECOND_ORDER_EFFECT: "What does that trigger?", SYSTEM_WIDE_CONSEQUENCE: "How far does it spread?", SCIENCE_EXPLANATION: "What physics governs it?",
  LIMITS_UNCERTAINTIES: "What can science not predict here?", FINAL_SCIENTIFIC_PAYOFF: "What is the answer?",
  INVISIBLE_SYSTEM: "What is it?", WHERE_IT_EXISTS: "Where is it?", HOW_IT_WORKS: "How does it work?", WHAT_DEPENDS_ON_IT: "What depends on it?",
  BOTTLENECK: "Where is the chokepoint?", WHY_THE_BOTTLENECK_EXISTS: "Why can't it be replaced quickly?", FAILURE_SCENARIO: "What if it fails?",
  CASCADING_CONSEQUENCES: "What fails next?", REDUNDANCY_ALTERNATIVES: "What protects the system?", FINAL_SYSTEM_INSIGHT: "What does this reveal about the modern world?",
  THE_QUESTION: "What familiar detail are we actually explaining?", ORIGIN_CONTEXT: "Where did this design come from?", THE_PROBLEM: "What practical problem shaped it?",
  THE_EXPLANATION: "What does the documented evidence show?", SURPRISING_DETAIL: "Which detail changes the obvious explanation?", REAL_WORLD_CONSEQUENCE: "How did the design persist or change?",
  FINAL_PAYOFF: "What is the precise answer to the opening question?", NEXT_CURIOSITY_BRIDGE: "Which related ordinary detail follows naturally?",
};

// Deep (encyclopedia) claims are placed by the article heading they came from
// — "O-ring concerns" belongs to the hidden weakness, "Decision to launch" to
// the critical moment — not by a coarse role, which had put 105 claims in one
// section and none in others. Each section receives at most
// MAX_DEEP_CLAIMS_PER_SECTION of them (in article order), which also keeps
// every section request small enough for the provider's per-minute budget.
const MAX_DEEP_CLAIMS_PER_SECTION = 14;
const DEEP_HEADING_SECTIONS = {
  "failure-reconstructed": [
    // Order matters: "Cause and time of death" is about the crew, not the
    // engineering cause; memorials are aftermath, not the takeaway.
    [/time of death|death|casualt|victim|funeral|memorial|tribute|recovery|search|salvage|rescue|dialogue|response|media|litigation/i, "AFTERMATH"],
    [/case study|lesson|significance|ethic/i, "FINAL_TAKEAWAY"],
    [/escape|abort/i, "SYSTEM"],
    [/concern|warning|erosion|defect|flaw|problem|issue|prior|previous|earlier|known|deficien|maintenance|inspection/i, "HIDDEN_WEAKNESS"],
    [/decision|pre-?launch|preparation|countdown|weather|teleconference|meeting|approval|go\/no|launch (?:delay|schedule)/i, "CRITICAL_MOMENT"],
    [/breakup|plume|sequence|chain|propagat|progression|structural failure/i, "FAILURE_CHAIN"],
    [/cause|investigat|commission|inquiry|report|analysis|finding|technical|probable|mechanism/i, "ENGINEERING_EXPLANATION"],
    [/aftermath|legacy|crew/i, "AFTERMATH"],
    [/change|reform|recommendation|safety|regulation|return to flight|redesign|modification|impact on|influence/i, "WHAT_CHANGED"],
    [/background|design|vehicle|construction|history|development|description|overview|operation|technology|structure|specification|mission|shuttle|system|ship|aircraft|bridge|dam|plant|reactor/i, "SYSTEM"],
    [/liftoff|ascent|launch|flight|disaster|accident|collapse|sinking|crash|explosion|fire|event|timeline|incident|eruption|flood|impact/i, "WHAT_HAPPENED"],
  ],
  "impossible-brief": [
    [/far future|significance|implications|summary|fate/i, "FINAL_SCIENTIFIC_PAYOFF"],
    [/uncertain|debate|hypothes|controvers|unknown|speculat|limit|open question|future/i, "LIMITS_UNCERTAINTIES"],
    [/physic|mechanism|dynamics|theory|model|science|chemistry|thermodynamic|gravity|orbit|energy/i, "SCIENCE_EXPLANATION"],
    [/formation|origin|properties|physical characteristics|structure|composition|overview|description|background|history|size|mass/i, "INITIAL_CONDITIONS"],
    [/life|biolog|ecolog|human|society|culture|civiliz|agricultur|economy|habitab/i, "SYSTEM_WIDE_CONSEQUENCE"],
    [/climate|atmosphere|weather|ocean|tide|surface|temperature|season|day|rotation/i, "SECOND_ORDER_EFFECT"],
    [/effect|influence|impact|consequence|interaction|observation/i, "FIRST_EFFECT"],
  ],
};

function deepSectionFor(channelSlug, claim, structure) {
  if (claim.verbatim !== false || !claim.section) return null;
  if (claim.section === "Lead") return structure.includes("CONSEQUENCE") ? "CONSEQUENCE" : structure.includes("IMPOSSIBLE_QUESTION") ? "IMPOSSIBLE_QUESTION" : null;
  for (const [pattern, section] of DEEP_HEADING_SECTIONS[channelSlug] || []) if (pattern.test(claim.section) && structure.includes(section)) return section;
  return null;
}

function outline(channel, topic, pkg, config) {
  const structure = (config.story && config.story.longform) || [];
  const used = new Set();
  const deepBySection = new Map();
  for (const claim of pkg.claims) {
    const section = deepSectionFor(channel.slug, claim, structure);
    if (!section) continue;
    const list = deepBySection.get(section) || [];
    if (list.length < MAX_DEEP_CLAIMS_PER_SECTION) { list.push(claim); used.add(claim.id); }
    deepBySection.set(section, list);
  }
  const sections = structure.map((name, index) => {
    const roles = SECTION_ROLES[name] || [];
    const deep = deepBySection.get(name) || [];
    const byRole = pkg.claims.filter((claim) => roles.includes(claim.role) && (!used.has(claim.id) || name === "COLD_OPEN")
      && !(claim.verbatim === false && (deepSectionFor(channel.slug, claim, structure) || deep.length >= MAX_DEEP_CLAIMS_PER_SECTION)));
    const roleDeep = byRole.filter((claim) => claim.verbatim === false).slice(0, Math.max(0, MAX_DEEP_CLAIMS_PER_SECTION - deep.length));
    const claims = [...byRole.filter((claim) => claim.verbatim !== false), ...deep, ...roleDeep];
    if (name !== "COLD_OPEN") claims.forEach((claim) => used.add(claim.id));
    return { order: index + 1, section: name, question: SECTION_QUESTION[name] || null, claimIds: claims.map((claim) => claim.id), evidence: claims.length ? "available" : "MISSING" };
  });
  const missing = sections.filter((section) => section.evidence === "MISSING" && section.section !== "COLD_OPEN");
  return { structure, sections, missingSections: missing.map((section) => section.section), coverage: Math.round((sections.length - missing.length) / Math.max(1, sections.length) * 100) };
}

// COLD OPENS: ≥ 5 candidates, longer than a Shorts hook (≤ 20 s).
function coldOpens(topic, config, templatedFields = []) {
  const longConfig = { ...config, hooks: { ...config.hooks, maxSpokenWords: 22, minimumCandidates: config.longform.coldOpenCandidates } };
  const bundle = Hooks.generate(topic, longConfig, { templatedFields });
  const families = new Set();
  const picked = [];
  for (const hook of bundle.candidates) {
    if (hook.blocked || families.has(hook.family)) continue;
    families.add(hook.family);
    picked.push({ type: hook.family, text: hook.spoken, score: hook.adjustedTotal, estimatedSeconds: hook.estimatedSeconds });
  }
  for (const hook of bundle.candidates) if (picked.length < config.longform.coldOpenCandidates && !hook.blocked && !picked.some((item) => item.text === hook.spoken)) picked.push({ type: hook.family, text: hook.spoken, score: hook.adjustedTotal, estimatedSeconds: hook.estimatedSeconds });
  return { candidates: picked, selected: picked[0] || null, meetsMinimum: picked.length >= config.longform.coldOpenCandidates, bundle };
}

// ---------------------------------------------------------------------------
// SCRIPT (PHASE 32K). Deterministic evidence script by default: one paragraph
// per section, every sentence traced to a claim id. It never pads; the gate
// compares its real length with the target and blocks honestly.
const BRIDGES = {
  "failure-reconstructed": ["But that was only the visible part.", "To see why, look at the structure itself.", "And the warning signs were already there.", "Then the chain began.", "This is the moment it could no longer be stopped.", "So what actually failed?", "The consequences didn't end there.", "Engineers did not forget it.", "Which leaves one question."],
  "impossible-brief": ["Start with the assumption.", "That is the first effect — but not the biggest.", "The second-order effect is stranger.", "Now zoom out.", "Here is the physics underneath it.", "And here is where science stops being certain.", "So what is the answer?"],
  "critical-thread": ["Most people never see it.", "Here is where it sits.", "Here is how it works.", "And here is what depends on it.", "That is the bottleneck.", "Why can't it be replaced quickly?", "Now imagine it fails.", "The failure would not stay contained.", "So what protects the system?", "Which says something bigger about the modern world."],
  "behind-the-ordinary": ["Start with the detail itself.", "Its history begins with a practical problem.", "That problem shaped the design.", "The documentation makes the purpose clearer.", "But one detail complicates the familiar story.", "The design did not stop changing there.", "Now the opening question has a precise answer.", "And it points to another ordinary mystery."],
};

function deterministicScript(channel, topic, pkg, plan, cold, config) {
  const byId = new Map(pkg.claims.map((claim) => [claim.id, claim]));
  const bridges = BRIDGES[channel.slug] || [];
  const sections = plan.sections.map((section, index) => {
    const paragraphs = [];
    if (section.section === "COLD_OPEN" && cold.selected) {
      paragraphs.push({ text: finish(cold.selected.text), claims: [], role: "cold-open" });
    } else {
      const lead = index > 0 && bridges[(index - 1) % bridges.length];
      const sentences = section.claimIds.map((id) => byId.get(id)).filter((claim) => claim && claim.verbatim !== false);
      if (sentences.length) paragraphs.push({ text: [lead, ...sentences.map((claim) => claim.text)].filter(Boolean).join(" "), claims: sentences.map((claim) => claim.id), role: "evidence" });
    }
    return { section: section.section, paragraphs };
  });
  return { generator: "deterministic-evidence", sections };
}

// ---------------------------------------------------------------------------
// STRUCTURED CLOUD WRITER. The provider boundary supports Groq and the existing
// Anthropic provider. The pipeline checkpoints the fact pack, angle, section
// plan and every completed section so a quota pause never discards prior work.
function llmAvailable() { return Provider.available(); }

function providerEvent(channel, event, options = {}) {
  if (options.write === false) return;
  const rows = Store.readState(channel, "longform", "provider-events.json", []);
  rows.push({ at: (options.now || new Date()).toISOString(), channel: channel.slug, ...event });
  Store.writeState(channel, "longform", "provider-events.json", rows.slice(-500));
}

function generationFile(topic) { return `generation/${topic.slug}.json`; }

function writeGeneration(channel, topic, value, options = {}) {
  if (options.write !== false) Store.writeState(channel, "longform", generationFile(topic), value);
  return value;
}

function factPack(topic, pkg) {
  return {
    topic: topic.title,
    central_question: topic.question || topic.coreQuestion || topic.title,
    audience_promise: `Answer one precise question about ${topic.subject} using only documented evidence.`,
    verified_facts: pkg.claims.filter((claim) => claim.class === "CONFIRMED_FACT").map((claim) => ({ id: claim.id, text: claim.text, source: claim.source, rewrite: claim.verbatim === false })),
    bounded_interpretations: pkg.claims.filter((claim) => claim.class !== "CONFIRMED_FACT").map((claim) => ({ id: claim.id, text: claim.text, class: claim.class, source: claim.source })),
    uncertain_claims: [],
    visual_leads: pkg.visualLeads.slice(0, 20),
  };
}

function validateBlueprint(json, plan, cold, topic) {
  const hooks = Array.isArray(json.hook_candidates) ? json.hook_candidates.map(finish).filter(Boolean).slice(0, 8) : [];
  const beats = Array.isArray(json.retention_beats) ? json.retention_beats.map(finish).filter(Boolean).slice(0, 20) : [];
  return {
    central_question: finish(json.central_question || topic.question || topic.title),
    audience_promise: finish(json.audience_promise || `Answer the central question about ${topic.subject}.`),
    narrative_angle: finish(json.narrative_angle || "Move from the visible mystery to the documented design reason and a precise payoff."),
    hook_candidates: hooks.length ? hooks : [cold.selected && cold.selected.text].filter(Boolean),
    retention_beats: beats,
    uncertain_claims: Array.isArray(json.uncertain_claims) ? json.uncertain_claims.map(String).slice(0, 20) : [],
    section_plan: plan.sections.map((section) => ({ section: section.section, question: section.question, claimIds: section.claimIds })),
  };
}

// ---------------------------------------------------------------------------
// SUPPORT CHECK. A cited claim id is not proof: every paragraph must also be
// carried by the text of the claims it cites — every number it states appears
// in them, and a meaningful share of its content words does. A paragraph that
// fails is rejected, never kept "with a warning".
const SUPPORT_STOP = new Set(("this that with from were was have has had they them their there which what when where while would could should about into than then also because these those every only just more most some such very been being over under after before other its it's your you are the and for but not can could did does just even still again during through without within across between against among later early first finally however although though however").split(/\s+/));
const digitNumbers = (text) => (String(text || "").match(/\d[\d,]*(?:\.\d+)?/g) || []).map((value) => value.replace(/,/g, ""));
// Spelled-out numbers count as numbers ("seventy-three" is 73, "eighteen" is
// 18): a model must not slip an unsupported figure past the check in words.
const NUMBER_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALE_WORDS = { hundred: 100, thousand: 1000, million: 1000000, billion: 1000000000 };
function spelledNumbers(text) {
  const out = [];
  const tokens = String(text || "").toLowerCase().replace(/[\u2010-\u2015-]/g, " ").split(/[^a-z0-9.]+/).filter(Boolean);
  let current = null;
  let total = 0;
  const flush = () => { if (current != null || total) out.push(String(total + (current || 0))); current = null; total = 0; };
  for (const token of tokens) {
    if (NUMBER_WORDS[token] != null) {
      const value = NUMBER_WORDS[token];
      // "seventy three" combines; "eleven thirty-eight" is two numbers (11, 38).
      const combines = current != null && value < 10 && current >= 20 && current < 100 && current % 10 === 0;
      if (current != null && !combines) flush();
      current = (current || 0) + value;
    }
    else if (SCALE_WORDS[token] && (current != null || /^\d+(?:\.\d+)?$/.test(String(current)))) { current = (current || 1) * SCALE_WORDS[token]; if (SCALE_WORDS[token] >= 1000) { total += current; current = null; } }
    else if (token === "and" && current != null) continue;
    else flush();
  }
  flush();
  return out;
}
const numbersIn = (text) => [...new Set([...digitNumbers(text), ...spelledNumbers(text)])];
// Vague quantities and fractions are only allowed when a cited claim uses them.
const VAGUE_QUANTITY = /\b(?:low|mid|high|upper|lower)?-?(?:teens|twenties|thirties|forties|fifties|sixties|seventies|eighties|nineties)\b|\bdozens?\b|\bscores of\b|\b(?:a|one|two)[ -](?:third|quarter|fifth|tenth)s?\b|\bthree[ -]quarters\b|\bhalf an?\b|\bdouble\b|\btriple\b|\bfold\b/gi;
const stems = (text) => (String(text || "").toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []).filter((word) => !SUPPORT_STOP.has(word)).map((word) => word.slice(0, 6));

function paragraphSupport(text, claims, minimumOverlap) {
  const evidence = claims.map((claim) => claim.text).join(" ");
  const evidenceNumbers = new Set(numbersIn(evidence));
  const unsupportedNumbers = numbersIn(text).filter((value) => !evidenceNumbers.has(value));
  const evidenceVague = new Set((evidence.match(VAGUE_QUANTITY) || []).map((value) => value.toLowerCase()));
  const vague = [...new Set((String(text).match(VAGUE_QUANTITY) || []).map((value) => value.toLowerCase()))].filter((value) => !evidenceVague.has(value));
  const own = [...new Set(stems(text))];
  const available = new Set(stems(evidence));
  const overlap = own.length ? own.filter((stem) => available.has(stem)).length / own.length : 0;
  const copied = Research.copyRisk(text, claims);
  const reasons = [];
  if (unsupportedNumbers.length) reasons.push(`numbers not in cited claims: ${unsupportedNumbers.join(", ")}`);
  if (vague.length) reasons.push(`approximate quantity not in cited claims: ${vague.join(", ")}`);
  if (overlap < minimumOverlap) reasons.push(`only ${Math.round(overlap * 100)}% of content words are in the cited claims`);
  if (copied) reasons.push(`copies source wording ("${copied.overlap}")`);
  return { supported: !reasons.length, overlap: Math.round(overlap * 100) / 100, reasons };
}

function validateGeneratedSection(json, section, claimsById = new Map(), options = {}) {
  const allowed = new Set(section.claimIds || []);
  const minimumOverlap = options.minimumOverlap != null ? options.minimumOverlap : 0.3;
  const body = json && json.section && typeof json.section === "object" ? json.section : json;
  const accepted = [];
  const rejected = [];
  for (const paragraph of body && Array.isArray(body.paragraphs) ? body.paragraphs : []) {
    const text = finish(paragraph && paragraph.text);
    const ids = [...new Set((paragraph && Array.isArray(paragraph.claims) ? paragraph.claims : []).filter((id) => allowed.has(id)))];
    if (!text) continue;
    if (!ids.length) { rejected.push({ text: text.slice(0, 120), reasons: ["no valid claim ids"] }); continue; }
    const cited = ids.map((id) => claimsById.get(id)).filter(Boolean);
    const support = claimsById.size ? paragraphSupport(text, cited, minimumOverlap) : { supported: true, overlap: null, reasons: [] };
    if (!support.supported) { rejected.push({ text: text.slice(0, 120), reasons: support.reasons }); continue; }
    accepted.push({ text, claims: ids, role: "evidence", support: support.overlap });
  }
  if (section.claimIds.length && !accepted.length) {
    throw Object.assign(new Provider.LongformProviderError("INVALID_SECTION", `no supported, claim-mapped paragraphs for ${section.section}`, { stage: `section:${section.section}` }), { rejected });
  }
  return { section: section.section, paragraphs: accepted, rejected };
}

function continuityAndRetention(sections, plan, config) {
  const seenText = new Set();
  const duplicateSections = [];
  const repeatedPhrases = [];
  const cleaned = [];
  const sectionNames = new Set();
  for (const section of sections) {
    if (sectionNames.has(section.section)) { duplicateSections.push(section.section); continue; }
    sectionNames.add(section.section);
    const paragraphs = [];
    for (const paragraph of section.paragraphs || []) {
      const key = paragraph.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || seenText.has(key)) { if (key) repeatedPhrases.push(paragraph.text.slice(0, 80)); continue; }
      seenText.add(key);
      paragraphs.push(paragraph);
    }
    cleaned.push({ section: section.section, paragraphs });
  }
  const text = cleaned.flatMap((section) => section.paragraphs.map((paragraph) => paragraph.text)).join(" ");
  const first = cleaned.flatMap((section) => section.paragraphs).find(Boolean);
  const wordsTotal = words(text);
  const introWords = cleaned.slice(0, 2).flatMap((section) => section.paragraphs).reduce((sum, paragraph) => sum + words(paragraph.text), 0);
  const filler = (text.match(/\b(in today'?s video|as you can see|needless to say|it is important to note|in conclusion|let'?s dive in)\b/gi) || []);
  const payoff = cleaned.filter((section) => /PAYOFF|TAKEAWAY|INSIGHT|ANSWER/.test(section.section)).some((section) => section.paragraphs.length);
  const weakHook = !first || Hooks.FORBIDDEN.test(first.text) || words(first.text) > 55;
  const missingPlanSections = plan.sections.filter((section) => section.claimIds.length && !cleaned.some((item) => item.section === section.section && item.paragraphs.length)).map((section) => section.section);
  const hardFails = [];
  if (duplicateSections.length) hardFails.push(`duplicate sections: ${duplicateSections.join(", ")}`);
  if (weakHook) hardFails.push("weak or excessive cold open");
  if (!payoff) hardFails.push("missing final payoff");
  if (/\b(impossible scenario|global infrastructure collapse|disaster reconstruction)\b/i.test(text) && config.channel === "behind-the-ordinary") hardFails.push("incorrect channel identity");
  if (missingPlanSections.length) hardFails.push(`missing evidence sections: ${missingPlanSections.join(", ")}`);
  const notes = [];
  if (wordsTotal && introWords / wordsTotal > 0.25) notes.push("introduction exceeds 25% of the script");
  if (filler.length) notes.push(`generic filler: ${[...new Set(filler)].join(", ")}`);
  if (repeatedPhrases.length) notes.push(`${repeatedPhrases.length} repeated paragraph(s) removed`);
  return { sections: cleaned, quality: { duplicateSections, repeatedPhrases, weakHook, payoff, filler, introShare: wordsTotal ? Math.round(introWords / wordsTotal * 100) / 100 : 0, missingPlanSections, hardFails, notes } };
}

// Checkpoint compatibility: a checkpoint is resumed only for the same channel,
// topic, research evidence, section plan, model, prompt version and schema.
// Anything else starts fresh (the old file is kept as <slug>.stale.json).
const GENERATION_SCHEMA = "longform-generation/3";
const PROMPT_VERSION = "lf-prompts-2026-10-09.3";
const sha = (value) => crypto.createHash("sha1").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex").slice(0, 16);

function generationKey(channel, topic, pkg, plan, model) {
  return {
    schema: GENERATION_SCHEMA,
    promptVersion: PROMPT_VERSION,
    channel: channel.slug,
    slug: topic.slug,
    researchHash: sha(pkg.claims.map((claim) => [claim.id, claim.text, claim.source])),
    outlineHash: sha(plan.sections.map((section) => [section.section, section.claimIds])),
    model,
  };
}

const BLUEPRINT_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["central_question", "audience_promise", "narrative_angle", "hook_candidates", "retention_beats", "uncertain_claims"],
  properties: {
    central_question: { type: "string" }, audience_promise: { type: "string" }, narrative_angle: { type: "string" },
    hook_candidates: { type: "array", items: { type: "string" } }, retention_beats: { type: "array", items: { type: "string" } },
    uncertain_claims: { type: "array", items: { type: "string" } },
  },
};

function sectionSchema(ids) {
  return {
    type: "object", additionalProperties: false, required: ["paragraphs", "depth_note"],
    properties: {
      paragraphs: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "claims"],
        properties: { text: { type: "string" }, claims: { type: "array", items: { type: "string", enum: ids } } } } },
      depth_note: { type: "string" },
    },
  };
}

const COLD_OPEN_SCHEMA = {
  type: "object", additionalProperties: false, required: ["lines"],
  properties: { lines: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "claims"],
    properties: { text: { type: "string" }, claims: { type: "array", items: { type: "string" } } } } } },
};

// Spoken-documentary voice shared by every section request.
const VOICE_RULES = [
  "Write for the ear: a narrator talking to one viewer. Vary sentence length; no lists, headings or bullet-like sentences.",
  "Open with a sentence that follows from the previous section's last line, using only the cited facts. Do not restate facts the previous section already narrated.",
  "Every paragraph must answer the section question. Leave out claims that do not serve it rather than forcing them in.",
].join("\n");

const CHANNEL_WRITING = {
  "failure-reconstructed": "Forensic engineering documentary. Explain the verified mechanism, the order of events, the root causes and what changed. Precise, sober, no dramatisation beyond the evidence.",
  "impossible-brief": "Cinematic scientific what-if. Physically consistent assumptions, explicit uncertainty, quantities only when a claim states them. Label modelled or speculative steps as such.",
};

async function llmScript(channel, topic, pkg, plan, cold, config, options = {}) {
  const configured = Provider.configuration();
  const now = () => (options.now || new Date()).toISOString();
  const key = generationKey(channel, topic, pkg, plan, configured.primary.model);
  const existing = Store.readState(channel, "longform", generationFile(topic), null);
  const compatible = existing && existing.key && JSON.stringify(existing.key) === JSON.stringify(key);
  if (existing && !compatible && options.write !== false) Store.writeState(channel, "longform", `generation/${topic.slug}.stale.json`, existing);
  const state = compatible ? existing : {
    schema: GENERATION_SCHEMA,
    key,
    channel: channel.slug,
    slug: topic.slug,
    status: "RUNNING",
    createdAt: now(),
    updatedAt: now(),
    provider: { primary: configured.primary.name, fallback: configured.fallback && configured.fallback.name || null },
    factPack: factPack(topic, pkg),
    stages: { research: { status: "COMPLETE", at: now(), claims: pkg.claims.length, researchHash: key.researchHash } },
    blueprint: null,
    sections: [],
    sectionAttempts: {},
    usage: { input_tokens: 0, output_tokens: 0, requests: 0 },
  };
  state.runs = (state.runs || 0) + 1;
  state.resumedFrom = compatible ? (existing.status || null) : null;
  state.status = "RUNNING";
  delete state.error;
  const save = (stage) => { if (stage) state.lastCompletedStage = stage; state.updatedAt = now(); writeGeneration(channel, topic, state, options); };
  const onEvent = (event) => providerEvent(channel, event, options);
  const claimsById = new Map(pkg.claims.map((claim) => [claim.id, claim]));
  const minimumOverlap = config.longform.minimumSupportOverlap != null ? config.longform.minimumSupportOverlap : 0.3;
  const call = async (input) => {
    const response = await Provider.generateJson(input, { config: configured, onEvent, dependencies: options.providerDependencies || {} });
    state.providerUsed = response.provider;
    state.model = response.model;
    state.usage.input_tokens += response.usage && response.usage.input_tokens || 0;
    state.usage.output_tokens += response.usage && response.usage.output_tokens || 0;
    state.usage.requests += 1;
    return response.json;
  };
  try {
    // 1) Narrative blueprint (one small request).
    if (!state.blueprint) {
      const json = await call({
        stage: "narrative-angle",
        schema: BLUEPRINT_SCHEMA,
        schemaName: "narrative_blueprint",
        maxTokens: 900,
        system: [
          `You plan evidence-led narration for ${channel.name}, a ${config.identity}.`,
          CHANNEL_WRITING[channel.slug] || "",
          "Use only the supplied claims; do not add outside knowledge. List anything the claims do not support in uncertain_claims.",
          "Return central_question, audience_promise, narrative_angle (2 sentences), up to 5 hook_candidates, up to 8 retention_beats.",
        ].filter(Boolean).join("\n"),
        user: JSON.stringify({
          question: state.factPack.central_question,
          facts: state.factPack.verified_facts.slice(0, 30).map((fact) => ({ id: fact.id, text: String(fact.text).slice(0, 170) })),
          interpretations: state.factPack.bounded_interpretations.slice(0, 6).map((fact) => ({ id: fact.id, text: String(fact.text).slice(0, 150) })),
          sections: plan.sections.map((section) => section.section),
        }),
      });
      state.blueprint = validateBlueprint(json, plan, cold, topic);
      state.stages.blueprint = { status: "COMPLETE", at: now() };
      save("blueprint");
    }
    // 2) Cold open: 2-4 sourced sentences that open on the unresolved
    // consequence and the tension before it. Falls back to the selected
    // claim-derived hook when the model's lines are not supported.
    if (!state.sections.some((item) => item.section === "COLD_OPEN") && plan.sections.some((section) => section.section === "COLD_OPEN")) {
      const openSection = plan.sections.find((section) => section.section === "COLD_OPEN");
      const tension = plan.sections.find((section) => /CRITICAL_MOMENT|HIDDEN_WEAKNESS|IMPOSSIBLE_QUESTION|INITIAL_CONDITIONS/.test(section.section) && section.claimIds.length);
      const ids = [...new Set([...(openSection.claimIds || []), ...((tension && tension.claimIds) || []).slice(0, 4)])].filter((id) => claimsById.has(id)).slice(0, 12);
      let paragraphs = cold.selected ? [{ text: finish(cold.selected.text), claims: [], role: "cold-open" }] : [];
      let source = "selected-hook";
      if (ids.length) {
        const json = await call({
          stage: "cold-open",
          schema: { ...COLD_OPEN_SCHEMA, properties: { lines: { ...COLD_OPEN_SCHEMA.properties.lines, items: { ...COLD_OPEN_SCHEMA.properties.lines.items, properties: { text: { type: "string" }, claims: { type: "array", items: { type: "string", enum: ids } } } } } } },
          schemaName: "cold_open",
          maxTokens: 700,
          system: [
            `Write the cold open of a ${channel.name} long-form documentary (${config.identity}).`,
            CHANNEL_WRITING[channel.slug] || "",
            "2-4 short spoken sentences, at most 55 words in total. Open on the outcome or the strangest verified detail, then the tension that leads into the story. Do not reveal the full explanation.",
            "Use ONLY the cited claims; every line lists the claim ids it states. No question to the audience, no 'in this video', no invented detail.",
          ].filter(Boolean).join("\n"),
          user: JSON.stringify({ topic: topic.title, question: state.blueprint.central_question, claims: ids.map((id) => ({ id, text: String(claimsById.get(id).text).slice(0, 260) })) }),
        });
        const lines = (json && Array.isArray(json.lines) ? json.lines : []).map((line) => ({ text: finish(line && line.text), claims: [...new Set((line && line.claims || []).filter((id) => ids.includes(id)))] }))
          .filter((line) => line.text && line.claims.length && paragraphSupport(line.text, line.claims.map((id) => claimsById.get(id)), minimumOverlap).supported);
        const text = lines.map((line) => line.text).join(" ");
        if (lines.length >= 2 && words(text) <= 55) {
          paragraphs = [{ text, claims: [...new Set(lines.flatMap((line) => line.claims))], role: "cold-open" }];
          source = "llm";
        }
      }
      state.sections.push({ section: "COLD_OPEN", paragraphs });
      state.stages.coldOpen = { status: "COMPLETE", at: now(), source, words: paragraphs.length ? words(paragraphs[0].text) : 0 };
      save("cold-open");
    }
    // 3) Sections, one request each; a completed section is never regenerated.
    state.stages.sections = state.stages.sections || {};
    const evidenceSections = plan.sections.filter((item) => item.claimIds.length && item.section !== "COLD_OPEN").length || 1;
    for (const section of plan.sections) {
      if (section.section === "COLD_OPEN") continue;
      const done = state.sections.find((item) => item.section === section.section);
      if (done) continue;
      if (!section.claimIds.length) {
        state.sections.push({ section: section.section, paragraphs: [] });
        state.stages.sections[section.section] = { status: "NO_EVIDENCE", at: now() };
        save(`section:${section.section}`);
        continue;
      }
      // A section the model could not support twice (two runs, each with one
      // repair) is not retried again; the review blocks the script. Rate
      // limits and network errors never count as attempts.
      const unsupportedRuns = state.sectionAttempts[section.section] || 0;
      if (unsupportedRuns >= 2) continue;
      const all = section.claimIds.map((id) => claimsById.get(id)).filter(Boolean);
      const evidenceWords = all.reduce((sum, claim) => sum + words(claim.text), 0);
      const fairShare = Math.round(config.longform.targetMinutes[1] * config.longform.wordsPerMinute / evidenceSections);
      const targetWords = Math.max(60, Math.min(fairShare, Math.round(evidenceWords * 0.6)));
      const maxTokens = Math.min(2000, Math.round(targetWords * 1.6) + 500);
      let claims = all.map((claim) => ({ id: claim.id, text: String(claim.text).slice(0, 300), class: claim.class, rewrite: claim.verbatim === false }));
      const system = [
        `Write the ${section.section} section of a ${channel.name} long-form documentary (${config.identity}).`,
        CHANNEL_WRITING[channel.slug] || "",
        "Use ONLY the claims provided. Every paragraph lists the ids of the claims it states. Never add a fact, number, date, name, quote, cause or purpose that is not in those claims.",
        "Claims marked rewrite:true must be paraphrased (never copy 8+ consecutive words). Keep MODEL/SPECULATION/INTERPRETATION claims labelled as such.",
        "Numbers: state every number, date, time and unit exactly as the claim writes it. Never convert units, round, estimate, or describe a figure loosely (no 'a third', 'low teens', 'dozens').",
        VOICE_RULES,
        `Section question: ${section.question || section.section}`,
        `Spoken narration, 2-4 paragraphs, about ${targetWords} words — fewer if the claims are thin. No filler, recap, call to action or invented transition fact.`,
        "depth_note: one short sentence on what evidence was missing, or an empty string.",
      ].filter(Boolean).join("\n");
      const user = () => JSON.stringify({ topic: topic.title, angle: state.blueprint.narrative_angle, section: { section: section.section, question: section.question },
        claims, previous: (() => { const last = state.sections[state.sections.length - 1]; const paragraph = last && last.paragraphs[last.paragraphs.length - 1]; return paragraph ? paragraph.text.slice(0, 300) : null; })() });
      // Keep the request inside the per-request budget by dropping the last
      // (lowest-priority) claims, never by truncating the instructions.
      const budget = Provider.requestBudget();
      while (claims.length > 4 && Provider.estimateTokens(system) + Provider.estimateTokens(user()) + Provider.estimateTokens(JSON.stringify(sectionSchema(claims.map((claim) => claim.id)))) + maxTokens > budget) claims = claims.slice(0, -1);
      const ids = claims.map((claim) => claim.id);
      const scoped = { ...section, claimIds: ids };
      const json = await call({ stage: `section:${section.section}`, schema: sectionSchema(ids), schemaName: "documentary_section", maxTokens, system, user: user() });
      let validated;
      try {
        validated = validateGeneratedSection(json, scoped, claimsById, { minimumOverlap });
        // Mostly rejected output gets the one repair attempt as well.
        const kept = validated.paragraphs.reduce((sum, item) => sum + words(item.text), 0);
        const lost = validated.rejected.length;
        if (lost && kept < targetWords * 0.5) throw Object.assign(new Provider.LongformProviderError("INVALID_SECTION", `most of ${section.section} was unsupported`, { stage: `section:${section.section}` }), { rejected: validated.rejected });
      } catch (error) {
        if (error.code !== "INVALID_SECTION") throw error;
        const repaired = await call({
          stage: `section:${section.section}:repair`,
          schema: sectionSchema(ids),
          schemaName: "documentary_section",
          maxTokens,
          system: [system, "Your previous paragraphs were rejected for the reasons listed. Rewrite them so that every statement, name and number comes from the cited claims."].join("\n"),
          user: JSON.stringify({ section: section.section, claims, rejected: (error.rejected || []).slice(0, 6) }),
        });
        try { validated = validateGeneratedSection(repaired, scoped, claimsById, { minimumOverlap }); }
        catch (repairError) {
          if (repairError.code !== "INVALID_SECTION") throw repairError;
          state.sectionAttempts[section.section] = unsupportedRuns + 1;
          state.stages.sections[section.section] = { status: "UNSUPPORTED", at: now(), unsupportedRuns: state.sectionAttempts[section.section], rejected: (repairError.rejected || []).slice(0, 6) };
          save();
          continue;
        }
      }
      state.sections.push({ section: section.section, paragraphs: validated.paragraphs });
      state.stages.sections[section.section] = { status: "COMPLETE", at: now(), paragraphs: validated.paragraphs.length, rejected: validated.rejected.length, words: validated.paragraphs.reduce((sum, item) => sum + words(item.text), 0) };
      if (json.depth_note) state.depthNote = [state.depthNote, String(json.depth_note)].filter(Boolean).join(" ");
      save(`section:${section.section}`);
    }
    // Sections are stored in completion order; present them in plan order.
    const order = new Map(plan.sections.map((section, index) => [section.section, index]));
    state.sections.sort((a, b) => order.get(a.section) - order.get(b.section));
    // 4) Citation validation (deterministic).
    const citations = claimSourceMap({ sections: state.sections }, pkg, topic);
    state.stages.citations = { status: citations.unsupportedParagraphs || citations.unsupportedNumbers.length || citations.copyRisks.length ? "FAILED" : "COMPLETE", at: now(),
      unsupportedParagraphs: citations.unsupportedParagraphs, unsupportedNumbers: citations.unsupportedNumbers, copyRisks: citations.copyRisks.length };
    save("citations");
    // 5) Quality review (deterministic): continuity, repetition, payoff, depth.
    const checked = continuityAndRetention(state.sections, plan, config);
    const text = checked.sections.flatMap((section) => section.paragraphs.map((paragraph) => paragraph.text)).join(" ");
    const minutes = Math.round(words(text) / config.longform.wordsPerMinute * 10) / 10;
    const unsupportedSections = Object.entries(state.stages.sections).filter(([, value]) => value.status === "UNSUPPORTED").map(([name]) => name);
    if (unsupportedSections.length) checked.quality.hardFails.push(`unsupported sections after repair: ${unsupportedSections.join(", ")}`);
    if (state.stages.citations.status === "FAILED") checked.quality.hardFails.push("citation validation failed");
    state.sections = checked.sections;
    state.quality = { ...checked.quality, minutes, words: words(text) };
    state.stages.review = { status: checked.quality.hardFails.length ? "BLOCKED" : "COMPLETE", at: now(), minutes, hardFails: checked.quality.hardFails };
    save("review");
    // 6) Final script.
    state.status = checked.quality.hardFails.length ? "QUALITY_REVIEW" : "COMPLETE";
    state.stages.final = { status: state.status, at: now(), words: words(text), minutes };
    save("final");
    return {
      generator: `llm:${state.providerUsed || configured.primary.name}:${state.model || configured.primary.model}`,
      provider: state.providerUsed || configured.primary.name,
      model: state.model || configured.primary.model,
      status: state.status,
      pipeline: ["RESEARCH_PACKAGE", "NARRATIVE_BLUEPRINT", "COLD_OPEN", "SECTIONS", "CITATION_VALIDATION", "QUALITY_REVIEW", "FINAL_SCRIPT"],
      stages: state.stages,
      factPack: state.factPack,
      blueprint: state.blueprint,
      sections: state.sections,
      quality: state.quality,
      depthNote: state.depthNote || null,
      usage: state.usage,
      checkpoint: generationFile(topic),
      resumedFrom: state.resumedFrom,
    };
  } catch (error) {
    state.status = error.defer ? "DEFERRED" : "FAILED";
    state.error = { code: error.code || "UNKNOWN", provider: error.provider || configured.primary.name, stage: error.stage || null, retryable: !!error.retryable, retryAfterMs: error.retryAfterMs || null, message: error.message ? Provider.sanitizeReason(error.message) : null };
    save();
    throw error;
  }
}

function claimSourceMap(script, pkg, topic) {
  const byId = new Map(pkg.claims.map((claim) => [claim.id, claim]));
  const rows = [];
  let unsupportedParagraphs = 0;
  let unsupportedNumbers = [];
  const copyRisks = [];
  const evidenceTopic = { ...topic, evidence: pkg.claims.map((claim) => ({ claim: claim.text, layer: claim.layer })) };
  for (const section of script.sections) {
    for (const paragraph of section.paragraphs || []) {
      const claims = (paragraph.claims || []).map((id) => byId.get(id)).filter(Boolean);
      const numeric = Sources.numericSupport(paragraph.text, evidenceTopic);
      if (!claims.length && paragraph.role !== "cold-open") unsupportedParagraphs += 1;
      if (!numeric.supported) unsupportedNumbers = unsupportedNumbers.concat(numeric.unsupported);
      const copied = Research.copyRisk(paragraph.text, pkg.claims);
      if (copied) copyRisks.push({ section: section.section, overlap: copied.overlap });
      rows.push({ section: section.section, excerpt: paragraph.text.slice(0, 90), claims: claims.map((claim) => ({ id: claim.id, class: claim.class, source: claim.source })) });
    }
  }
  return { rows, unsupportedParagraphs, unsupportedNumbers, copyRisks };
}

function scriptStats(script, config) {
  const text = script.sections.flatMap((section) => (section.paragraphs || []).map((paragraph) => paragraph.text)).join(" ");
  const count = words(text);
  const minutes = Math.round(count / config.longform.wordsPerMinute * 10) / 10;
  const paragraphs = script.sections.reduce((sum, section) => sum + (section.paragraphs || []).length, 0);
  const secondsPerParagraph = paragraphs ? count / config.longform.wordsPerMinute * 60 / paragraphs : 0;
  return { words: count, estimatedMinutes: minutes, paragraphs, secondsPerNewBeat: Math.round(secondsPerParagraph), text };
}

// ---------------------------------------------------------------------------
// SCENE + ASSET PLAN (PHASE 32L).
function visualTypeFor(section, channelSlug) {
  if (channelSlug === "behind-the-ordinary") {
    if (/EXPLANATION|PROBLEM/.test(section)) return "TECHNICAL_ILLUSTRATION";
    if (/ORIGIN|CONTEXT/.test(section)) return "MUSEUM_ARCHIVE";
    if (/SURPRISING_DETAIL|QUESTION|COLD_OPEN/.test(section)) return "REAL_OBJECT";
    return "MACRO_DETAIL";
  }
  if (/CHAIN|MECHANISM|EXPLANATION|HOW_IT_WORKS|SCIENCE/.test(section)) return channelSlug === "critical-thread" ? "PROCESS_DIAGRAM" : "DIAGRAM";
  if (/WHERE|DEPENDS|CASCADING/.test(section)) return "MAP";
  if (/CONSEQUENCE|WHAT_HAPPENED|CRITICAL|AFTERMATH|COLD_OPEN/.test(section)) return channelSlug === "failure-reconstructed" ? "REAL_ARCHIVAL" : channelSlug === "critical-thread" ? "REAL_INFRASTRUCTURE" : "SIMULATION";
  if (/CHANGED|REDUNDANCY|BOTTLENECK/.test(section)) return channelSlug === "impossible-brief" ? "DIAGRAM" : "TECHNICAL_ILLUSTRATION";
  return channelSlug === "impossible-brief" ? "ILLUSTRATION" : "TECHNICAL_ILLUSTRATION";
}

function scenePlan(channel, topic, script, pkg, config) {
  const scenes = [];
  let cursor = 0;
  const leads = pkg.visualLeads.length ? pkg.visualLeads : [{ text: topic.subject }];
  let leadIndex = 0;
  for (const section of script.sections) {
    for (const paragraph of section.paragraphs || []) {
      const seconds = words(paragraph.text) / config.longform.wordsPerMinute * 60;
      const parts = Math.max(1, Math.ceil(seconds / config.pacing.longform.maxSceneSeconds));
      for (let part = 0; part < parts; part += 1) {
        const type = visualTypeFor(section.section, channel.slug);
        // Explanatory scenes are labelled diagrams of the claim they carry;
        // only evidence scenes consume archival / infrastructure leads.
        const explanatory = /DIAGRAM|MAP|PROCESS|TECHNICAL_ILLUSTRATION/.test(type);
        const claimId = (paragraph.claims || [])[part % Math.max(1, (paragraph.claims || []).length)] || null;
        const claim = claimId ? pkg.claims.find((item) => item.id === claimId) : null;
        const lead = explanatory ? null : leads[leadIndex++ % leads.length];
        const subject = explanatory ? (claim ? claim.text.split(/\s+/).slice(0, 14).join(" ") : section.section) : lead.text;
        const asset = explanatory ? `diagram:${section.section}:${claimId || scenes.length}` : (lead.source || lead.text);
        scenes.push({
          scene: scenes.length + 1,
          narrationSpan: [Math.round(cursor), Math.round(cursor + seconds / parts)],
          section: section.section,
          visualPurpose: /DIAGRAM|MAP|PROCESS/.test(type) ? "explain mechanism" : /ARCHIVAL|INFRASTRUCTURE/.test(type) ? "show evidence" : "visualise scenario",
          visualType: type,
          subject,
          asset,
          sourceRequirement: type === "REAL_ARCHIVAL" ? "public-domain / licensed archival with attribution" : type === "REAL_INFRASTRUCTURE" ? "government/manufacturer media or licensed industrial footage" : "procedural render, labelled on screen",
          durationEstimateSeconds: Math.round(seconds / parts * 10) / 10,
          motion: part % 3 === 0 ? "slow push-in to detail" : part % 3 === 1 ? "lateral reframe / crop to evidence" : "hold, animated highlight on the claimed element",
          claimSupported: claimId,
          fallbackAssetStrategy: type === "REAL_ARCHIVAL" ? "labelled reconstruction diagram (never presented as archive)" : "labelled procedural diagram",
          disclosure: /RECONSTRUCTION|ILLUSTRATION|SIMULATION|AI_GENERATED|TECHNICAL_ILLUSTRATION/.test(type) ? "on-screen label required" : null,
        });
        cursor += seconds / parts;
      }
    }
  }
  const reuse = {};
  for (const scene of scenes) reuse[scene.asset] = (reuse[scene.asset] || 0) + 1;
  const overused = Object.entries(reuse).filter(([, count]) => count > config.pacing.longform.maxAssetReuse).map(([asset, count]) => ({ asset, count }));
  const assetPlan = {
    byType: scenes.reduce((out, scene) => { out[scene.visualType] = (out[scene.visualType] || 0) + 1; return out; }, {}),
    distinctSubjects: Object.keys(reuse).length,
    archivalLeads: leads.length,
    articleImageCandidates: leads.filter((lead) => lead.origin && lead.origin.startsWith("article-image")).length,
    overused,
    licensing: "record source, licence and URL per asset in GORSEL-KAYNAKLARI.txt (existing ledger)",
  };
  return { scenes, assetPlan };
}

// ---------------------------------------------------------------------------
// THUMBNAILS (PHASE 32I): ≥ 5 concepts, scored; reuses CriticalThread's
// existing concept set (core/visuals) and Failure Reconstructed's editorial
// thumbnail texts instead of a parallel system.
function thumbnails(channel, topic, config) {
  const texts = [...(topic.thumbnailTexts || [])];
  const shortSubject = (topic.subject || "").split(/\s+/).slice(0, 3).join(" ").toUpperCase();
  const number = Model.numbersIn([topic.number, ...(topic.evidence || []).map((item) => item.claim)].join(" ")).find((value) => /[a-z%]/i.test(value) || /\d{3,}/.test(value));
  const base = [];
  if (channel.slug === "critical-thread") {
    const Visuals = require("../visuals");
    const concepts = (Visuals.thumbnail(topic.raw).concepts || []);
    for (const concept of concepts) base.push({ id: concept.id, primarySubject: topic.subject, background: concept.consequence, visualHierarchy: concept.composition, emotion: "quiet tension / dependency", text: texts[0] || "ONE MACHINE" });
  } else if (channel.slug === "behind-the-ordinary") {
    base.push({ id: "single-object-detail", primarySubject: topic.subject, background: "warm charcoal field", visualHierarchy: `one object, one amber marker on ${topic.designDetail || "the detail"}`, emotion: "curiosity", text: texts[0] || "HIDDEN PURPOSE" });
    base.push({ id: "macro-detail", primarySubject: topic.designDetail || topic.subject, background: "softly blurred object", visualHierarchy: "macro detail fills 70% of frame", emotion: "discovery", text: texts[1] || "LOOK CLOSER" });
    base.push({ id: "then-now", primarySubject: topic.subject, background: "restrained historical-modern split", visualHierarchy: "same detail aligned across both halves", emotion: "continuity", text: texts[2] || "STILL HERE" });
    base.push({ id: "purpose-callout", primarySubject: topic.subject, background: "clean cutaway", visualHierarchy: "one teal arrow to the functional element", emotion: "explanation", text: "WHY THIS?" });
    base.push({ id: "misconception", primarySubject: topic.subject, background: "warm neutral surface", visualHierarchy: "assumed use dimmed; documented purpose highlighted", emotion: "reversal", text: "NOT WHAT YOU THINK" });
  } else if (channel.slug === "failure-reconstructed") {
    base.push({ id: "evidence-frame", primarySubject: topic.object || topic.subject, background: "real archival frame of the failure", visualHierarchy: "subject 60% of frame, text top-left", emotion: "consequence", text: texts[0] || shortSubject });
    base.push({ id: "mechanism-callout", primarySubject: topic.object || topic.subject, background: "desaturated archival still", visualHierarchy: "one amber arrow to the failed component", emotion: "hidden cause", text: texts[1] || "THE FLAW" });
    base.push({ id: "number-contrast", primarySubject: number || topic.number || shortSubject, background: "dark field, subject silhouette", visualHierarchy: "large number left, subject right", emotion: "contradiction", text: number || topic.number || shortSubject });
    base.push({ id: "before-after", primarySubject: topic.subject, background: "split frame intact vs failed (both real)", visualHierarchy: "50/50 split, thin divider", emotion: "loss", text: texts[2] || "BEFORE / AFTER" });
    base.push({ id: "chain-diagram", primarySubject: "failure chain", background: "technical drawing overlay on archival still", visualHierarchy: "3 linked nodes, last one red", emotion: "inevitability", text: "THE CHAIN" });
  } else {
    base.push({ id: "impossible-visual", primarySubject: topic.subject, background: "dark cosmic field", visualHierarchy: "single impossible change centred", emotion: "awe", text: (topic.thumbnailTexts[0] || shortSubject) });
    base.push({ id: "scale", primarySubject: topic.subject, background: "Earth for scale", visualHierarchy: "tiny Earth, huge subject", emotion: "scale", text: "" });
    base.push({ id: "before-after", primarySubject: topic.subject, background: "split normal vs changed (labelled illustration)", visualHierarchy: "50/50 split", emotion: "unease", text: "WHAT CHANGES?" });
    base.push({ id: "first-effect", primarySubject: "first measurable effect", background: "labelled diagram", visualHierarchy: "arrow from cause to effect", emotion: "curiosity", text: "FIRST EFFECT" });
    base.push({ id: "countdown", primarySubject: topic.subject, background: "dark field with timer", visualHierarchy: "timer top-right", emotion: "urgency", text: number || "T+1s" });
  }
  const concepts = base.map((concept) => {
    const textWords = words(concept.text);
    const supported = !concept.text || Sources.numericSupport(concept.text, topic).supported;
    const misleading = channel.slug === "failure-reconstructed" && /REAL|archival/i.test(concept.background) && !topic.archival;
    const scores = {
      Clarity: clamp(95 - Math.max(0, textWords - 3) * 12),
      Curiosity: clamp(60 + (/\?|THE FLAW|CHAIN|WHAT|ONE|FIRST/.test(concept.text) ? 20 : 5) + (concept.emotion.includes("contradiction") || concept.emotion.includes("hidden") ? 10 : 0)),
      VisualImpact: clamp(70 + (/split|number|arrow|silhouette|timer/.test(concept.visualHierarchy) ? 15 : 5)),
      TopicRecognition: clamp(55 + (M.icerikKelimeleri(concept.primarySubject).some((word) => M.icerikKelimeleri(topic.subject).includes(word)) ? 35 : 10)),
      MobileReadability: clamp(100 - Math.max(0, textWords - 3) * 20 - Math.max(0, concept.text.length - 14) * 3),
      Truthfulness: clamp(100 - (supported ? 0 : 60) - (misleading ? 60 : 0)),
      ChannelFit: clamp(80 + (channel.slug === "failure-reconstructed" && /archival|technical/.test(concept.background) ? 12 : channel.slug === "behind-the-ordinary" && /object|macro|neutral|charcoal|cutaway/.test(concept.background + " " + concept.visualHierarchy) ? 12 : 6)),
    };
    const total = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);
    return { ...concept, textLength: concept.text.length, textWords, contrast: "light subject on dark field; single accent colour", truthfulness: scores.Truthfulness >= 80 ? "evidence-consistent" : "REJECT — misleading", mobileReadability: scores.MobileReadability, scores, total };
  }).sort((a, b) => b.total - a.total);
  return { concepts, selected: concepts.find((concept) => concept.scores.Truthfulness >= 80) || null, meetsMinimum: concepts.length >= config.longform.thumbnailConceptsMinimum };
}

// ---------------------------------------------------------------------------
// DERIVED SHORTS (PHASE 32C): each with its own hook, first 3 s, mini
// narrative and payoff — not clips of the long video.
function derivedShorts(channel, topic, pkg, plan, config) {
  const out = [];
  const byId = new Map(pkg.claims.map((claim) => [claim.id, claim]));
  for (const section of plan.sections) {
    if (section.section === "COLD_OPEN" || section.claimIds.length < 2) continue;
    const claims = section.claimIds.map((id) => byId.get(id)).filter(Boolean);
    const sub = { ...topic, id: `${topic.id}#${section.section}`, narration: claims.map((claim) => claim.text), evidence: claims.map((claim) => ({ claim: claim.text, layer: claim.layer, source: claim.source })), openingLine: claims[0].text };
    const hooks = Hooks.generate(sub, config, {});
    if (!hooks.selected) continue;
    const first = FirstSeconds.plan(sub, hooks, config, {});
    out.push({
      angle: section.section.toLowerCase().replace(/_/g, "-"),
      hook: hooks.selected.spoken,
      hookFamily: hooks.selected.family,
      hookScore: hooks.selectedScore,
      first3SecondPlan: first.First3SecondPlan,
      miniNarrative: claims.slice(0, 4).map((claim) => claim.text),
      payoff: claims[claims.length - 1].text,
      captionPlan: "semantic 2–3 word chunks, ≤ 2 lines, raised above Shorts UI (config.captions)",
      visualRhythm: "cut ≤ 1.4 s in the first 3 s, 1.6–2.4 s to 10 s, then 2.6–3.5 s",
      standalone: true,
      longformBridge: config.longform.shortCta || null,
      claimIds: section.claimIds,
    });
  }
  out.sort((a, b) => b.hookScore - a.hookScore);
  const [low, high] = config.longform.derivedShorts;
  return { shorts: out.slice(0, high), count: Math.min(out.length, high), meetsMinimum: out.length >= low };
}

// ---------------------------------------------------------------------------
function costEstimate(stats, scenes, options, config) {
  const c = config.cost;
  const tokens = options.llmUsage ? (options.llmUsage.input_tokens || 0) + (options.llmUsage.output_tokens || 0) : 0;
  const minutes = stats.estimatedMinutes;
  return {
    estimated_production_cost: Math.round((tokens / 1000 * c.llmPer1kTokens + minutes * c.ttsPerMinute + minutes * c.renderPerMinuteCpu * 3 + 0.5 * c.storagePerGbMonth) * 100) / 100,
    currency: "USD",
    breakdown: { llmTokens: tokens, ttsMinutes: minutes, renderMinutesCpu: Math.round(minutes * 3 * 10) / 10, assets: scenes.length, youtubeQuotaUnits: c.youtubeQuotaUnitsUpload + 50 },
    note: "approximate; update config/growth-engine.json cost units from invoices",
  };
}

function gate(inputs, config) {
  const { potential, pkg, plan, cold, script, stats, map, scenes, thumbs, titles, endScreen, derived, integrity } = inputs;
  const target = config.longform.targetMinutes;
  const hardFails = [];
  const notes = [];
  if (potential.bucket === "D") hardFails.push("LongFormPotential bucket D: " + potential.reasons.join("; "));
  // Source policy: < minimumSourcesHard independent sources or no primary /
  // authoritative source is a hard block; below the preferred minimumSources
  // lowers SourceCoverage and asks for a third source, but does not block.
  const sourceCount = (pkg.sources || []).length;
  const hardMinimum = config.longform.minimumSourcesHard || config.longform.minimumSources;
  if (sourceCount < hardMinimum) hardFails.push(`insufficient source coverage: ${sourceCount} < ${hardMinimum}`);
  if ((pkg.primarySources || 0) < (config.longform.minimumPrimarySources || 0)) hardFails.push("insufficient source coverage: no primary/authoritative source (official investigation, agency, standards body or peer-reviewed work)");
  if (sourceCount >= hardMinimum && sourceCount < config.longform.minimumSources) notes.push(`${sourceCount} sources (preferred ${config.longform.minimumSources}): add an independent source before the next revision`);
  if (map.copyRisks && map.copyRisks.length) hardFails.push(`COPY_RISK: ${map.copyRisks.length} paragraph(s) reproduce encyclopedia wording (e.g. "${map.copyRisks[0].overlap}")`);
  if (map.unsupportedNumbers.length) hardFails.push("unsupported central claim/number: " + [...new Set(map.unsupportedNumbers)].join(", "));
  if (stats.estimatedMinutes < target[0] * 0.85) hardFails.push(`INSUFFICIENT_DEPTH: evidence supports ~${stats.estimatedMinutes} min; target ${target[0]}–${target[1]} min — not padded`);
  if (inputs.duplicate) hardFails.push("duplicate episode: " + inputs.duplicate);
  if (!thumbs.selected) hardFails.push("no truthful thumbnail concept");
  if (integrity && integrity.hardFails.length) hardFails.push(...integrity.hardFails);
  if (inputs.render && inputs.render.failed) hardFails.push("render failure: " + inputs.render.reason);
  const claimsPerMinute = stats.estimatedMinutes ? pkg.claims.length / stats.estimatedMinutes : 0;
  const d = {
    TopicDepth: potential.factors.DepthPotential.value,
    NarrativeQuality: clamp(plan.coverage * 0.8 + (cold.meetsMinimum ? 20 : 5)),
    Hook: cold.selected ? cold.selected.score : 0,
    ResearchQuality: clamp(pkg.sourceQuality * 0.7 + Math.min(30, pkg.claims.length)),
    SourceCoverage: clamp(Math.min(100, (pkg.sources || []).length / config.longform.minimumSources * 70 + pkg.primarySources * 10)),
    FactualAccuracy: clamp(100 - map.unsupportedParagraphs * 10 - map.unsupportedNumbers.length * 30),
    ScriptRetention: clamp(100 - Math.max(0, stats.secondsPerNewBeat - 60) * 1.2 - (stats.estimatedMinutes < target[0] ? (target[0] - stats.estimatedMinutes) * 8 : 0) - (claimsPerMinute < config.longform.minimumClaimsPerMinute ? 15 : 0)),
    VisualCoverage: clamp(60 + Math.min(30, scenes.assetPlan.distinctSubjects * 5) - scenes.assetPlan.overused.length * 10),
    AudioQuality: inputs.render && inputs.render.completed ? 85 : null,
    Editing: inputs.render && inputs.render.completed ? 80 : null,
    Thumbnail: thumbs.selected ? thumbs.selected.total : 0,
    Title: titles.selectedScore,
    CopyrightSafety: 90,
    Disclosure: scenes.scenes.every((scene) => !scene.disclosure || scene.disclosure === "on-screen label required") ? 95 : 40,
    EndScreenPlan: endScreen.primary_next_video ? 90 : 55,
    ShortFunnelPotential: clamp(40 + derived.count * 10),
  };
  const rewriteOnly = pkg.claims.filter((claim) => claim.verbatim === false).length;
  if (rewriteOnly && script.generator === "deterministic-evidence") notes.push(`${rewriteOnly} deep-research claims need the LLM writer via a configured long-form provider (LONGFORM_LLM_PROVIDER + provider key); the deterministic writer never narrates encyclopedia text verbatim`);
  if (script.llmStatus === "DEFERRED") {
    hardFails.push(`LLM generation deferred safely (${script.llmErrorCode || "TRANSIENT"}); do not render or publish until the checkpoint resumes`);
    notes.push(`LLM generation safely deferred at ${script.llmErrorStage || "an intermediate stage"}; resume from ${script.checkpoint || "the channel checkpoint"}`);
  }
  if (script.llmStatus === "FAILED") hardFails.push(`LLM generation failed safely (${script.llmErrorCode || "UNKNOWN"}); deterministic evidence draft retained`);
  if (script.quality && Array.isArray(script.quality.hardFails) && script.quality.hardFails.length) hardFails.push(...script.quality.hardFails.map((item) => `script review: ${item}`));
  if (!endScreen.primary_next_video) notes.push("no same-channel next episode yet; end screen points to playlist + subscribe");
  return Readiness.longform({ dimensions: d, hardFails, notes }, config);
}

// ---------------------------------------------------------------------------
async function buildPackage(channel, topicOrId, options = {}) {
  const Context = require("./context");
  const ctx = options.context || Context.build(channel);
  const config = ctx.config;
  const topic = typeof topicOrId === "string" ? ctx.inventory.find((item) => item.id === topicOrId || item.slug === topicOrId) : topicOrId;
  if (!topic) throw new Error("long-form topic not found: " + topicOrId);
  if (topic.channel !== channel.slug) throw new Error(`CROSS_CHANNEL_LONGFORM_BLOCKED: ${topic.id} belongs to ${topic.channel}`);
  const boilerplate = Model.boilerplate(topic, ctx.index);
  const potential = options.potential || Context.evaluateLong(topic, ctx, options);
  const deep = options.research === false ? null : await Research.deepen(channel, topic, { offline: options.offline, write: options.write, now: options.now });
  const pkg = researchPackage(channel, topic, { write: options.write, now: options.now, deep });
  const plan = outline(channel, topic, pkg, config);
  const cold = coldOpens(topic, config, boilerplate.templatedFields);
  let script = deterministicScript(channel, topic, pkg, plan, cold, config);
  let llmUsage = null;
  if (options.llm) {
    // options.llm may be a writer function (tests, alternative writers) with
    // the same contract as llmScript: { generator, sections:[{section, paragraphs:[{text, claims}]}] }.
    try {
      script = typeof options.llm === "function"
        ? await options.llm({ channel, topic, pkg, plan, cold, config })
        : await llmScript(channel, topic, pkg, plan, cold, config, {
          write: options.write,
          now: options.now,
          providerDependencies: options.providerDependencies,
        });
      llmUsage = script.usage || null;
    } catch (error) {
      // Keep the deterministic, claim-mapped script as a safe preview. The
      // checkpoint records every completed cloud stage and is resumed later.
      script.llmError = error.message;
      script.llmStatus = error.defer ? "DEFERRED" : "FAILED";
      script.llmErrorCode = error.code || "UNKNOWN";
      script.llmErrorStage = error.stage || null;
      script.provider = error.provider || null;
      script.checkpoint = generationFile(topic);
    }
  }
  const stats = scriptStats(script, config);
  const map = claimSourceMap(script, pkg, topic);
  const scenes = scenePlan(channel, topic, script, pkg, config);
  const thumbs = thumbnails(channel, topic, config);
  const titles = Titles.generate(topic, config, "long", { extra: topic.editorialTitles || [], publishedTitles: ctx.history.publishedTitles });
  const episodes = Store.readState(channel, "longform", "episodes.json", []);
  const library = [
    ...episodes.map((item) => ({ ...item, channel: channel.slug })),
    ...ctx.inventory.filter((item) => item.id !== topic.id).map((item) => ({ slug: item.slug, title: item.title, subject: item.subject, cluster: item.cluster, mechanism: item.mechanism, channel: channel.slug, planned: true })),
  ];
  const next = Funnel.nextVideos(channel, { ...topic }, library);
  const endScreen = Funnel.endScreenPlan(channel, topic, next, { durationSeconds: Math.round(stats.estimatedMinutes * 60), playlist: topic.cluster });
  const derived = derivedShorts(channel, topic, pkg, plan, config);
  const publishedShorts = ctx.history.published.filter((row) => (row.format || "short") === "short");
  const relatedShorts = publishedShorts.map((row) => {
    const shortTopic = ctx.inventory.find((item) => item.slug === row.slug || item.id === row.topicId) || { slug: row.slug, title: row.baslik || row.title || "", subject: row.baslik || "", cluster: null, channel: channel.slug };
    const rel = Funnel.relate({ ...shortTopic, channel: channel.slug }, { ...topic, derivedShortSlugs: [] });
    return rel && rel.score >= config.funnel.minimumRelationshipScore ? { short_video_id: row.videoId || null, short_slug: row.slug, relationship_type: rel.type, relationship_reason: rel.reason, score: rel.score } : null;
  }).filter(Boolean);
  const integrity = require("./integrity").visual({ ...topic, visualScenes: scenes.scenes.map((scene) => ({ text: scene.subject, synthetic: !!scene.disclosure })) }, config, {});
  const duplicate = episodes.some((item) => item.slug === topic.slug && item.status === "PUBLISHED") ? `episode ${topic.slug} already published` : null;
  const readiness = gate({ potential, pkg, plan, cold, script, stats, map, scenes, thumbs, titles, endScreen, derived, integrity, duplicate, render: options.render || null }, config);
  const cost = costEstimate(stats, scenes.scenes, { llmUsage }, config);
  const result = {
    schema: "growth-longform-package/1",
    channel: channel.slug,
    channelName: channel.name,
    contentType: "long",
    createdAt: (options.now || new Date()).toISOString(),
    topic: { id: topic.id, slug: topic.slug, title: topic.title, subject: topic.subject, cluster: topic.cluster },
    LongFormPotential: potential,
    researchPackage: { id: pkg.id, sources: pkg.sources, claims: pkg.claims.length, deepResearch: pkg.deepResearch || null, gaps: pkg.gaps, reuseCount: pkg.reuseCount },
    outline: plan,
    coldOpens: { candidates: cold.candidates, selected: cold.selected },
    script: {
      generator: script.generator,
      provider: script.provider || null,
      model: script.model || null,
      status: script.status || script.llmStatus || "DETERMINISTIC_PREVIEW",
      pipeline: script.pipeline || null,
      blueprint: script.blueprint || null,
      quality: script.quality || null,
      checkpoint: script.checkpoint || null,
      llmError: script.llmError || null,
      llmErrorCode: script.llmErrorCode || null,
      llmErrorStage: script.llmErrorStage || null,
      depthNote: script.depthNote || null,
      sections: script.sections,
      ...stats,
      text: undefined,
    },
    claimSourceMap: map,
    scenePlan: scenes.scenes,
    assetPlan: scenes.assetPlan,
    thumbnails: thumbs,
    titles: { selected: titles.selected, selectedScore: titles.selectedScore, count: titles.count, candidates: titles.candidates },
    derivedShorts: derived,
    relatedShorts,
    nextVideos: next,
    endScreenPlan: endScreen,
    cost,
    readiness,
    targetMinutes: config.longform.targetMinutes,
  };
  result.summary = summary(result);
  if (options.write !== false) Store.writeState(channel, "longform", `packages/${topic.slug}.json`, result);
  return result;
}

function summary(pkg) {
  return {
    Channel: pkg.channelName,
    "Content Type": "LONG_FORM",
    Topic: pkg.topic.title,
    LongFormPotentialScore: pkg.LongFormPotential.LongFormPotentialScore,
    "Topic Bucket": pkg.LongFormPotential.bucket,
    "Cold Open": pkg.coldOpens.selected ? pkg.coldOpens.selected.text : null,
    "Target Duration": `${pkg.targetMinutes[0]}–${pkg.targetMinutes[1]} min`,
    "Actual Duration": `~${pkg.script.estimatedMinutes} min (script estimate, ${pkg.script.generator})`,
    Scenes: pkg.scenePlan.length,
    "Thumbnail Score": pkg.thumbnails.selected ? pkg.thumbnails.selected.total : 0,
    "Title Score": pkg.titles.selectedScore,
    LongFormProductionReadinessScore: `${pkg.readiness.LongFormProductionReadinessScore} → ${pkg.readiness.decision}`,
    "Related Shorts": pkg.relatedShorts.length ? pkg.relatedShorts.map((row) => row.short_slug).join(", ") : "none published yet",
    "Primary Next Video": pkg.nextVideos.primary_next_video ? pkg.nextVideos.primary_next_video.title : "none",
  };
}

module.exports = {
  researchPackage, outline, coldOpens, deterministicScript, llmScript, claimSourceMap, scriptStats, scenePlan,
  thumbnails, derivedShorts, costEstimate, gate, buildPackage, summary, topicHash, SECTION_ROLES, llmAvailable,
  validateGeneratedSection, paragraphSupport, generationKey, GENERATION_SCHEMA, PROMPT_VERSION, MAX_DEEP_CLAIMS_PER_SECTION,
};
