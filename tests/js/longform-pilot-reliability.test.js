"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Provider = require("../../core/llm/longform-provider");
const Longform = require("../../core/growth/longform");
const Store = require("../../core/growth/store");
const Channel = require("../../core/channel-context");
const Context = require("../../core/growth/context");
const Config = require("../../core/growth/config");

const ENV_KEYS = ["LONGFORM_LLM", "LONGFORM_LLM_PROVIDER", "LONGFORM_LLM_FALLBACK_PROVIDER", "LONGFORM_LLM_MAX_ATTEMPTS", "LONGFORM_LLM_MAX_RETRY_MS",
  "LONGFORM_LLM_MAX_WAIT_MS", "LONGFORM_REQUEST_TOKEN_BUDGET", "LONGFORM_TEST_STOP_AFTER_REQUESTS", "GROQ_API_KEY", "GROQ_MODEL", "ANTHROPIC_API_KEY"];
async function withEnv(values, fn) {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
  Provider.rateWindow.clear();
  try { return await fn(); } finally {
    for (const key of ENV_KEYS) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    Provider.rateWindow.clear();
  }
}
const headers = (map = {}) => ({ get: (name) => (map[name.toLowerCase()] != null ? String(map[name.toLowerCase()]) : null) });
const response = (status, body, map) => ({ ok: status >= 200 && status < 300, status, headers: headers(map), json: async () => body });
const groqBody = (json) => ({ model: "openai/gpt-oss-120b", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(json) } }], usage: { prompt_tokens: 100, completion_tokens: 50 } });
const SCHEMA = { type: "object", additionalProperties: false, required: ["a"], properties: { a: { type: "string" } } };

test("gpt-oss requests use strict json_schema and include_reasoning:false, never reasoning_format", async () => {
  await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k" }, async () => {
    let body;
    await Provider.generateJson({ stage: "s", system: "sys", user: "u", schema: SCHEMA, schemaName: "x", maxTokens: 200 }, {
      dependencies: { fetch: async (url, options) => { body = JSON.parse(options.body); return response(200, groqBody({ a: "ok" })); } },
    });
    assert.deepEqual(body.response_format, { type: "json_schema", json_schema: { name: "x", strict: true, schema: SCHEMA } });
    assert.equal(body.include_reasoning, false);
    assert.equal(body.reasoning_effort, "low");
    assert.equal("reasoning_format" in body, false);
  });
});

test("an oversized request is refused before any network call", async () => {
  await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_REQUEST_TOKEN_BUDGET: "1000" }, async () => {
    let calls = 0;
    await assert.rejects(() => Provider.generateJson({ stage: "section:BIG", system: "x".repeat(4000), user: "y", maxTokens: 500 }, {
      dependencies: { fetch: async () => { calls += 1; return response(200, groqBody({})); } },
    }), (error) => error.code === "REQUEST_TOO_LARGE" && !error.retryable);
    assert.equal(calls, 0);
  });
});

test("requests are paced by the x-ratelimit token window instead of colliding with it", async () => {
  await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k" }, async () => {
    const waits = [];
    const events = [];
    let clock = 1000000;
    const fetch = async () => response(200, groqBody({ a: "x" }), { "x-ratelimit-remaining-tokens": "300", "x-ratelimit-limit-tokens": "8000", "x-ratelimit-reset-tokens": "6.5s" });
    const deps = { fetch, sleep: async (ms) => { waits.push(ms); clock += ms; }, now: () => clock };
    await Provider.generateJson({ stage: "one", system: "s", user: "u", maxTokens: 500 }, { dependencies: deps, onEvent: (e) => events.push(e) });
    await Provider.generateJson({ stage: "two", system: "s", user: "u", maxTokens: 500 }, { dependencies: deps, onEvent: (e) => events.push(e) });
    assert.deepEqual(waits, [7000]);
    assert.ok(events.some((e) => e.event === "throttle_wait" && e.stage === "two"));
    assert.ok(events.some((e) => e.event === "success" && e.limitTokens === 8000));
  });
});

test("a Retry-After beyond the wait limit defers at once without a wasted retry", async () => {
  await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_LLM_MAX_ATTEMPTS: "3", LONGFORM_LLM_MAX_WAIT_MS: "60000" }, async () => {
    let calls = 0;
    await assert.rejects(() => Provider.generateJson({ stage: "section:X", system: "s", user: "u", maxTokens: 100 }, {
      dependencies: { fetch: async () => { calls += 1; return response(429, {}, { "retry-after": "3600" }); }, sleep: async () => {} },
    }), (error) => error.code === "RATE_LIMIT" && error.defer === true);
    assert.equal(calls, 1);
  });
});

test("JSON validation failures are classified and retried once; diagnostics stay sanitized", async () => {
  await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "gsk_secretvalue", LONGFORM_LLM_MAX_ATTEMPTS: "2" }, async () => {
    let calls = 0;
    const events = [];
    await assert.rejects(() => Provider.generateJson({ stage: "narrative-angle", system: "s", user: "u", maxTokens: 100 }, {
      onEvent: (e) => events.push(e),
      dependencies: {
        fetch: async () => { calls += 1; return response(400, { error: { code: "json_validate_failed", message: "Failed to generate JSON.\nrequest Bearer gsk_secretvalue" } }); },
        sleep: async () => {},
      },
    }), (error) => error.code === "INVALID_GENERATION" && /Failed to generate JSON/.test(error.message) && /request/.test(error.message));
    assert.equal(calls, 2);
    assert.doesNotMatch(JSON.stringify(events), /gsk_secretvalue/);
    assert.equal(Provider.sanitizeReason("error\nreturned Bearer abc.def"), "error returned Bearer [REDACTED]");
  });
});

test("paragraph support: unsupported numbers, thin overlap and copied wording are rejected", () => {
  const claims = [{ id: "C1", text: "The O-ring seals lost resilience at 36 degrees before the launch.", verbatim: false },
    { id: "C2", text: "Engineers at Morton Thiokol recommended delaying the launch until temperatures rose.", verbatim: true }];
  const byId = new Map(claims.map((claim) => [claim.id, claim]));
  const section = { section: "CRITICAL_MOMENT", claimIds: ["C1", "C2"] };
  const out = Longform.validateGeneratedSection({ paragraphs: [
    { text: "Engineers at Morton Thiokol urged a delay until the temperatures rose, because cold seals had lost resilience.", claims: ["C1", "C2"] },
    { text: "The seals failed at 18 degrees and 7 people warned the press.", claims: ["C1"] },
    { text: "Meanwhile the weather in Florida delighted tourists across beaches.", claims: ["C2"] },
  ] }, section, byId);
  assert.equal(out.paragraphs.length, 1);
  assert.equal(out.rejected.length, 2);
  assert.ok(out.rejected.some((row) => row.reasons.some((reason) => /numbers not in cited claims: 18, 7/.test(reason))));
  assert.throws(() => Longform.validateGeneratedSection({ paragraphs: [{ text: "Unrelated invented story about pilots.", claims: ["C2"] }] }, section, byId), (e) => e.code === "INVALID_SECTION");
});

test("deep claims are placed by article heading and capped per section", async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-outline-"));
  const saved = process.env.GROWTH_STATE_ROOT;
  process.env.GROWTH_STATE_ROOT = sandbox;
  try {
    const channel = Channel.getChannel("failure-reconstructed");
    const ctx = Context.build(channel);
    const topic = ctx.inventory.find((item) => item.slug === "challenger-1986");
    const deep = { article: "Space Shuttle Challenger disaster", claims: [
      ...Array.from({ length: 30 }, (_, i) => ({ text: `Engineers raised O-ring concern number ${i} before launch day.`, role: "evidence", section: "O-ring concerns", source: "Wikipedia — X", verbatim: false })),
      { text: "Managers held a teleconference on the night before the launch.", role: "event", section: "Decision to launch", source: "Wikipedia — X", verbatim: false },
      { text: "The commission recommended a redesign of the field joints.", role: "aftermath", section: "SRB redesign", source: "Wikipedia — X", verbatim: false },
    ] };
    const pkg = Longform.researchPackage(channel, topic, { write: false, deep });
    const plan = Longform.outline(channel, topic, pkg, Config.forChannel(channel));
    const deepIn = (name) => plan.sections.find((s) => s.section === name).claimIds.filter((id) => pkg.claims.find((c) => c.id === id).verbatim === false);
    assert.equal(deepIn("HIDDEN_WEAKNESS").length, Longform.MAX_DEEP_CLAIMS_PER_SECTION);
    assert.equal(deepIn("CRITICAL_MOMENT").length, 1);
    assert.equal(deepIn("WHAT_CHANGED").length, 1);
  } finally {
    if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

// Fake Groq: answers each stage from the request itself, so every paragraph is
// built from the claims it cites (support check passes).
function fakeGroq(options = {}) {
  let calls = 0;
  const stages = [];
  const fetch = async (url, request) => {
    calls += 1;
    const body = JSON.parse(request.body);
    const input = JSON.parse(body.messages[1].content);
    const name = body.response_format.json_schema && body.response_format.json_schema.name;
    stages.push(name === "narrative_blueprint" ? "blueprint" : name === "cold_open" ? "cold-open" : name === "fact_check" ? "factcheck" : `section:${input.section && input.section.section || input.section}`);
    if (options.failAt && calls === options.failAt) return response(429, {}, { "retry-after": "3600" });
    if (name === "fact_check") return response(200, groqBody({ issues: [] }));
    if (name === "narrative_blueprint") return response(200, groqBody({ central_question: "Why?", audience_promise: "Answer.", narrative_angle: "Follow the evidence.", hook_candidates: [], retention_beats: [], uncertain_claims: [] }));
    if (name === "cold_open") return response(200, groqBody({ lines: (input.claims || []).slice(0, 2).map((claim) => ({ text: claim.text.split(" ").slice(0, 12).join(" "), claims: [claim.id] })) }));
    const claims = input.claims || [];
    const paragraphs = claims.slice(0, 3).map((claim) => ({ text: claim.text, claims: [claim.id] }));
    return response(200, groqBody({ paragraphs, depth_note: "" }));
  };
  return { fetch, stages, get calls() { return calls; } };
}

async function setup(sandbox) {
  process.env.GROWTH_STATE_ROOT = sandbox;
  const channel = Channel.getChannel("behind-the-ordinary");
  const ctx = Context.build(channel);
  const topic = ctx.inventory.find((item) => item.slug === "why-jeans-have-a-tiny-pocket");
  const config = Config.forChannel(channel);
  const pkg = Longform.researchPackage(channel, topic, { write: true });
  const plan = Longform.outline(channel, topic, pkg, config);
  const cold = Longform.coldOpens(topic, config, []);
  return { channel, topic, config, pkg, plan, cold };
}

test("checkpoint: 429 keeps completed stages; a resumed run asks only for unfinished sections", async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-ckpt-"));
  const saved = process.env.GROWTH_STATE_ROOT;
  try {
    await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_LLM_MAX_ATTEMPTS: "1" }, async () => {
      const { channel, topic, config, pkg, plan, cold } = await setup(sandbox);
      const first = fakeGroq({ failAt: 3 });
      await assert.rejects(() => Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: first.fetch, sleep: async () => {} } }),
        (error) => error.code === "RATE_LIMIT");
      const checkpoint = Store.readState(channel, "longform", `generation/${topic.slug}.json`, null);
      assert.equal(checkpoint.status, "DEFERRED");
      assert.equal(checkpoint.error.stage, first.stages[2]);
      assert.equal(checkpoint.key.promptVersion, Longform.PROMPT_VERSION);
      const doneBefore = checkpoint.sections.map((section) => section.section);
      const second = fakeGroq();
      const result = await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: second.fetch, sleep: async () => {} } });
      assert.ok(["COMPLETE", "QUALITY_REVIEW"].includes(result.status));
      assert.equal(second.stages.includes("blueprint"), false, "blueprint is not regenerated");
      for (const name of doneBefore) assert.equal(second.stages.includes(`section:${name}`), false, `${name} is not regenerated`);
      assert.ok(result.stages.citations && result.stages.review && result.stages.final);
    });
  } finally {
    if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

test("checkpoint: a different model or prompt version is never resumed", async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-stale-"));
  const saved = process.env.GROWTH_STATE_ROOT;
  try {
    await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_LLM_MAX_ATTEMPTS: "1" }, async () => {
      const { channel, topic, config, pkg, plan, cold } = await setup(sandbox);
      const first = fakeGroq({ failAt: 3 });
      await assert.rejects(() => Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: first.fetch, sleep: async () => {} } }));
      const file = `generation/${topic.slug}.json`;
      const checkpoint = Store.readState(channel, "longform", file, null);
      checkpoint.key.model = "some-other-model";
      Store.writeState(channel, "longform", file, checkpoint);
      const second = fakeGroq();
      await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: second.fetch, sleep: async () => {} } });
      assert.equal(second.stages[0], "blueprint", "a stale checkpoint restarts from the first stage");
      assert.ok(Store.readState(channel, "longform", `generation/${topic.slug}.stale.json`, null));
    });
  } finally {
    if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

test("checkpoint survives a separate process (like a later GitHub Actions run)", async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-xproc-"));
  const saved = process.env.GROWTH_STATE_ROOT;
  try {
    await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_LLM_MAX_ATTEMPTS: "1" }, async () => {
      const { channel, topic, config, pkg, plan, cold } = await setup(sandbox);
      const first = fakeGroq({ failAt: 2 });
      await assert.rejects(() => Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: first.fetch, sleep: async () => {} } }));
    });
    const script = `
      const L=require(${JSON.stringify(path.join(__dirname, "../../core/growth/longform"))}),C=require(${JSON.stringify(path.join(__dirname, "../../core/channel-context"))}),
        X=require(${JSON.stringify(path.join(__dirname, "../../core/growth/context"))}),G=require(${JSON.stringify(path.join(__dirname, "../../core/growth/config"))});
      (async()=>{const ch=C.getChannel("behind-the-ordinary");const ctx=X.build(ch);const t=ctx.inventory.find(i=>i.slug==="why-jeans-have-a-tiny-pocket");const cfg=G.forChannel(ch);
      const pkg=L.researchPackage(ch,t,{write:true});const plan=L.outline(ch,t,pkg,cfg);const cold=L.coldOpens(t,cfg,[]);const stages=[];
      const fetch=async(u,r)=>{const b=JSON.parse(r.body);const i=JSON.parse(b.messages[1].content);const n=b.response_format.json_schema&&b.response_format.json_schema.name;
        stages.push(n==="narrative_blueprint"?"blueprint":n==="fact_check"?"factcheck":"section");
        if(n==="fact_check")return{ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:JSON.stringify({issues:[]})}}]})};
        if(n==="cold_open")return{ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:JSON.stringify({lines:[]})}}]})};
        if(n==="narrative_blueprint")return{ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:JSON.stringify({central_question:"q",audience_promise:"p",narrative_angle:"a",hook_candidates:[],retention_beats:[],uncertain_claims:[]})}}]})};
        const ps=(i.claims||[]).slice(0,2).map(c=>({text:c.text,claims:[c.id]}));
        return{ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:JSON.stringify({paragraphs:ps,depth_note:""})}}]})};};
      const r=await L.llmScript(ch,t,pkg,plan,cold,cfg,{write:true,providerDependencies:{fetch,sleep:async()=>{}}});
      console.log(JSON.stringify({status:r.status,resumedFrom:r.resumedFrom,blueprintCalls:stages.filter(s=>s==="blueprint").length}));})().catch(e=>{console.error(e.message);process.exit(1)});`;
    const out = cp.execFileSync(process.execPath, ["-e", script], { env: { ...process.env, GROWTH_STATE_ROOT: sandbox, LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", NODE_TEST_CONTEXT: "" }, encoding: "utf8" });
    const row = JSON.parse(out.trim().split("\n").pop());
    assert.equal(row.resumedFrom, "DEFERRED");
    assert.equal(row.blueprintCalls, 0);
    assert.ok(["COMPLETE", "QUALITY_REVIEW"].includes(row.status));
  } finally {
    if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

test("spelled-out and approximate quantities need the same support as digits", () => {
  const claims = [{ id: "C1", text: "Challenger broke apart 73 seconds after launch at 11:38 a.m., and the cabin peaked at 65,000 feet.", verbatim: true },
    { id: "C2", text: "A 1977 test showed up to 0.052 inches of joint rotation.", verbatim: true }];
  const reasons = (text) => Longform.paragraphSupport(text, claims, 0.3).reasons.join(" ");
  assert.equal(reasons("Seventy-three seconds after its eleven thirty-eight launch, Challenger broke apart and the cabin peaked at sixty-five thousand feet."), "");
  assert.match(reasons("Challenger broke apart ninety seconds after launch."), /numbers not in cited claims: 90/);
  assert.match(reasons("A 1977 test showed nearly a third of a millimetre of joint rotation."), /approximate quantity.*a third/);
});

test("verification stop simulates a deferred rate limit after N requests, before sending", async () => {
  await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_TEST_STOP_AFTER_REQUESTS: "1" }, async () => {
    Provider.resetRequestCount();
    let calls = 0;
    const fetch = async () => { calls += 1; return response(200, groqBody({ a: "x" })); };
    await Provider.generateJson({ stage: "one", system: "s", user: "u", maxTokens: 50 }, { dependencies: { fetch } });
    await assert.rejects(() => Provider.generateJson({ stage: "two", system: "s", user: "u", maxTokens: 50 }, { dependencies: { fetch } }), (e) => e.code === "RATE_LIMIT" && e.defer);
    assert.equal(calls, 1);
    Provider.resetRequestCount();
  });
});

test("copy risk ignores exact figures, units and official names but catches copied prose", () => {
  const Research = require("../../core/growth/research");
  const source = (text) => [{ id: "X", text, verbatim: false }];
  assert.equal(Research.copyRisk("Temperatures ranged from 40 to 90 °F (4 to 32 °C) and the seals held.", source("Previous launches occurred at 40 to 90 °F (4 to 32 °C) and no seal failed.")), null);
  assert.equal(Research.copyRisk("Two weeks later the Presidential Commission on the Space Shuttle Challenger Accident began hearings.", source("President Reagan created the Presidential Commission on the Space Shuttle Challenger Accident on February 3.")), null);
  assert.ok(Research.copyRisk("Engineers said investigators found the chord members were undersized for the actual dead load.", source("Investigators found the chord members were undersized for the actual dead load of the bridge.")));
});

test("names in a paragraph must come from the cited claims", () => {
  const claims = [{ id: "C1", text: "NASA SRB project manager Lawrence Mulloy rejected the Thiokol engineers' analysis during the teleconference.", verbatim: false }];
  const reasons = (text) => Longform.paragraphSupport(text, claims, 0.2).reasons.join(" ");
  assert.equal(reasons("During the teleconference, Lawrence Mulloy, who ran NASA's SRB project, dismissed the analysis from Thiokol engineers."), "");
  assert.match(reasons("During the teleconference, Richard Feynman dismissed the analysis from Thiokol engineers."), /names not in cited claims: Richard, Feynman/);
});

test("the topic's own name is allowed even when the cited claim omits it", () => {
  const claims = [{ id: "C1", text: "The moon's ice shell is estimated to be 15 to 25 kilometres thick over a salty ocean.", verbatim: false }];
  const text = "Beneath the surface of Europa lies a salty ocean under an ice shell estimated at 15 to 25 kilometres thick.";
  assert.match(Longform.paragraphSupport(text, claims, 0.2).reasons.join(" "), /names not in cited claims: Europa/);
  assert.equal(Longform.paragraphSupport(text, claims, 0.2, "What If We Swam in Europa's Ocean?").reasons.join(" "), "");
  // Other names still need the cited claims.
  assert.match(Longform.paragraphSupport(`${text} Data from Juno confirmed it.`, claims, 0.2, "What If We Swam in Europa's Ocean?").reasons.join(" "), /names not in cited claims: Juno/);
});

test("retry_unsupported re-asks only the sections that ended UNSUPPORTED", async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-retry-"));
  const saved = process.env.GROWTH_STATE_ROOT;
  try {
    await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_LLM_MAX_ATTEMPTS: "1" }, async () => {
      const { channel, topic, config, pkg, plan, cold } = await setup(sandbox);
      const target = plan.sections.find((section) => section.section !== "COLD_OPEN" && section.claimIds.length).section;
      const make = (bad) => {
        const stages = [];
        const fetch = async (url, request) => {
          const body = JSON.parse(request.body);
          const input = JSON.parse(body.messages[1].content);
          const name = body.response_format.json_schema && body.response_format.json_schema.name;
          const sec = input.section && (input.section.section || input.section);
          stages.push(name === "narrative_blueprint" ? "blueprint" : name === "cold_open" ? "cold-open" : name === "fact_check" ? "factcheck" : `section:${sec}`);
          if (name === "fact_check") return response(200, groqBody({ issues: [] }));
          if (name === "narrative_blueprint") return response(200, groqBody({ central_question: "Why?", audience_promise: "A.", narrative_angle: "B.", hook_candidates: [], retention_beats: [], uncertain_claims: [] }));
          if (name === "cold_open") return response(200, groqBody({ lines: [] }));
          const claims = input.claims || [];
          const paragraphs = bad && sec === target ? [{ text: "Martian pirates invented this in 3021.", claims: [claims[0].id] }] : claims.slice(0, 2).map((claim) => ({ text: claim.text, claims: [claim.id] }));
          return response(200, groqBody({ paragraphs, depth_note: "" }));
        };
        return { fetch, stages };
      };
      for (let i = 0; i < 2; i += 1) await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: make(true).fetch, sleep: async () => {} } });
      const skipped = make(false);
      await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: skipped.fetch, sleep: async () => {} } });
      assert.deepEqual(skipped.stages, [], "two unsupported runs: the section is not asked again by default");
      process.env.LONGFORM_RETRY_UNSUPPORTED = "1";
      const retried = make(false);
      const result = await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: retried.fetch, sleep: async () => {} } });
      delete process.env.LONGFORM_RETRY_UNSUPPORTED;
      assert.deepEqual(retried.stages, [`section:${target}`, "factcheck"], "only the retried section is generated and fact-checked");
      assert.ok(result.sections.some((section) => section.section === target && section.paragraphs.length));
    });
  } finally {
    delete process.env.LONGFORM_RETRY_UNSUPPORTED;
    if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

test("ImpossibleBrief outline follows the scenario: journey routing, skipped asides, scenario questions", () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-ib-outline-"));
  const saved = process.env.GROWTH_STATE_ROOT;
  process.env.GROWTH_STATE_ROOT = sandbox;
  try {
    const channel = Channel.getChannel("impossible-brief");
    const ctx = Context.build(channel);
    const topic = ctx.inventory.find((item) => item.slug === "what-if-we-swam-in-europas-ocean");
    assert.ok(topic, "Europa topic exists");
    const claim = (section, text) => ({ text, role: "evidence", section, source: "Wikipedia — Europa (moon)", verbatim: false });
    const deep = { article: "Europa (moon)", claims: [
      claim("Discovery and naming", "Galileo Galilei discovered the moon in January 1610."),
      claim("Far future", "When the Sun becomes a red giant the moon's crust may melt."),
      claim("Ice shell and surface", "The outer ice shell may be as thin as 200 metres in places."),
      claim("Subsurface ocean", "A salty liquid ocean is thought to lie beneath the ice shell."),
      claim("Habitability", "The hidden ocean is considered one of the best places to look for life."),
      claim("Tidal flexing", "Tidal flexing by Jupiter keeps the ocean liquid."),
      claim("Future missions", "Europa Clipper will study whether the ocean could host life."),
    ] };
    const pkg = Longform.researchPackage(channel, topic, { write: false, deep });
    const plan = Longform.outline(channel, topic, pkg, Config.forChannel(channel));
    const sectionOf = (text) => (plan.sections.find((s) => s.section !== "FINAL_SCIENTIFIC_PAYOFF" && s.claimIds.some((id) => pkg.claims.find((c) => c.id === id).text === text)) || {}).section;
    assert.equal(sectionOf("The outer ice shell may be as thin as 200 metres in places."), "FIRST_EFFECT");
    assert.equal(sectionOf("A salty liquid ocean is thought to lie beneath the ice shell."), "SECOND_ORDER_EFFECT");
    assert.equal(sectionOf("The hidden ocean is considered one of the best places to look for life."), "SYSTEM_WIDE_CONSEQUENCE");
    assert.equal(sectionOf("Tidal flexing by Jupiter keeps the ocean liquid."), "SCIENCE_EXPLANATION");
    assert.equal(sectionOf("Europa Clipper will study whether the ocean could host life."), "LIMITS_UNCERTAINTIES");
    const everywhere = plan.sections.flatMap((s) => s.claimIds).map((id) => pkg.claims.find((c) => c.id === id).text);
    assert.equal(everywhere.some((text) => /Galilei|red giant/.test(text)), false, "naming and far-future asides are not narrated");
    const question = (name) => plan.sections.find((s) => s.section === name).question;
    assert.match(question("FIRST_EFFECT"), /explorers reached Europa's buried ocean/);
    assert.match(question("FINAL_SCIENTIFIC_PAYOFF"), /what would we find under the ice/);
  } finally {
    if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

// Fake Groq with a fact-checker: flags the first paragraph of `target`, and
// answers the repair with `repairText` (null = repeat the flagged paragraph).
function fakeChecker(target, { repairText, recheckFlags }) {
  const base = fakeGroq();
  const stages = [];
  const fetch = async (url, request) => {
    const body = JSON.parse(request.body);
    const input = JSON.parse(body.messages[1].content);
    const name = body.response_format.json_schema && body.response_format.json_schema.name;
    const system = body.messages[0].content;
    if (name === "fact_check") {
      const recheck = !input.paragraphs.some((paragraph) => paragraph.issues) && stages.includes(`repair:${target}`) && !stages.includes(`recheck:${target}`) && input.paragraphs.every((p) => p.text === repairText);
      if (recheck) { stages.push(`recheck:${target}`); return response(200, groqBody({ issues: recheckFlags ? [{ paragraph: 0, kind: "NOT_STATED", statement: "still wrong", reason: "x" }] : [] })); }
      const isTarget = input.paragraphs.some((paragraph) => paragraph.text.includes("[target]"));
      stages.push(isTarget ? `check:${target}` : "check");
      return response(200, groqBody({ issues: isTarget ? [{ paragraph: 0, kind: "CONTRADICTED", statement: "the wrong connection", reason: "the claim says otherwise" }] : [] }));
    }
    if (name === "documentary_section" && /Correct paragraphs/.test(system)) {
      stages.push(`repair:${target}`);
      const claim = input.paragraphs[0].claims[0];
      return response(200, groqBody({ paragraphs: [{ text: repairText || claim.text, claims: [claim.id] }], depth_note: "" }));
    }
    const result = await base.fetch(url, request);
    if (name === "documentary_section" && input.section && input.section.section === target) {
      const json = JSON.parse((await result.json()).choices[0].message.content);
      json.paragraphs[0].text = `${json.paragraphs[0].text} [target]`;
      return response(200, groqBody(json));
    }
    return result;
  };
  return { fetch, stages };
}

for (const [label, recheckFlags, expected] of [["repairs", false, "REPAIRED"], ["drops", true, "DROPPED"]]) {
  test(`fact-check ${label} a paragraph that contradicts its cited claims`, async () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-factcheck-"));
    const saved = process.env.GROWTH_STATE_ROOT;
    try {
      await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_LLM_MAX_ATTEMPTS: "1" }, async () => {
        const { channel, topic, config, pkg, plan, cold } = await setup(sandbox);
        const target = plan.sections.find((section) => section.section !== "COLD_OPEN" && section.claimIds.length > 1).section;
        const firstClaim = pkg.claims.find((claim) => claim.id === plan.sections.find((s) => s.section === target).claimIds[0]);
        const fake = fakeChecker(target, { repairText: firstClaim.text, recheckFlags });
        const result = await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: fake.fetch, sleep: async () => {} } });
        const record = result.stages.factcheck[target];
        assert.equal(record.status, expected);
        assert.equal(record.flagged, 1);
        assert.equal(record.issues[0].kind, "CONTRADICTED");
        const text = result.sections.find((section) => section.section === target).paragraphs.map((p) => p.text).join(" ");
        assert.doesNotMatch(text, /\[target\]/, "the flagged paragraph never survives");
        if (expected === "REPAIRED") assert.match(text, new RegExp(firstClaim.text.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        assert.ok(result.quality.notes.some((note) => /fact-check corrected/.test(note)));
        assert.ok(result.pipeline.includes("FACT_CHECK"));
      });
    } finally {
      if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });
}

test("a completed checkpoint without fact-check is checked on resume without regenerating sections; a failed check blocks", async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lf-factcheck-resume-"));
  const saved = process.env.GROWTH_STATE_ROOT;
  try {
    await withEnv({ LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "k", LONGFORM_LLM_MAX_ATTEMPTS: "1" }, async () => {
      const { channel, topic, config, pkg, plan, cold } = await setup(sandbox);
      await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: fakeGroq().fetch, sleep: async () => {} } });
      const file = `generation/${topic.slug}.json`;
      const checkpoint = Store.readState(channel, "longform", file, null);
      delete checkpoint.stages.factcheck;
      Store.writeState(channel, "longform", file, checkpoint);
      // The checker answers without an issues list: the check is incomplete.
      const broken = { stages: [], fetch: async (url, request) => { broken.stages.push(JSON.parse(request.body).response_format.json_schema.name); return response(200, groqBody({ verdict: "ok" })); } };
      const blocked = await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: broken.fetch, sleep: async () => {} } });
      assert.ok(broken.stages.length > 0 && broken.stages.every((name) => name === "fact_check"), "only the fact-check runs on resume");
      assert.equal(blocked.status, "QUALITY_REVIEW");
      assert.ok(blocked.quality.hardFails.some((fail) => /fact-check incomplete/.test(fail)));
      const fixed = fakeGroq();
      const result = await Longform.llmScript(channel, topic, pkg, plan, cold, config, { write: true, providerDependencies: { fetch: fixed.fetch, sleep: async () => {} } });
      assert.ok(fixed.stages.every((stage) => stage === "factcheck"));
      assert.equal(result.quality.hardFails.some((fail) => /fact-check/.test(fail)), false);
    });
  } finally {
    if (saved === undefined) delete process.env.GROWTH_STATE_ROOT; else process.env.GROWTH_STATE_ROOT = saved;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});
