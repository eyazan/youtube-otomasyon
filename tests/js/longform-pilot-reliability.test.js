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
  "LONGFORM_LLM_MAX_WAIT_MS", "LONGFORM_REQUEST_TOKEN_BUDGET", "GROQ_API_KEY", "GROQ_MODEL", "ANTHROPIC_API_KEY"];
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
    stages.push(name === "narrative_blueprint" ? "blueprint" : `section:${input.section && input.section.section || input.section}`);
    if (options.failAt && calls === options.failAt) return response(429, {}, { "retry-after": "3600" });
    if (name === "narrative_blueprint") return response(200, groqBody({ central_question: "Why?", audience_promise: "Answer.", narrative_angle: "Follow the evidence.", hook_candidates: [], retention_beats: [], uncertain_claims: [] }));
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
        stages.push(n==="narrative_blueprint"?"blueprint":"section");
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
