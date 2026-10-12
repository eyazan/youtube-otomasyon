"use strict";

// One provider boundary for long-form writing. Providers return the same JSON
// contract; fallback is used only when LONGFORM_LLM_FALLBACK_PROVIDER explicitly
// names it. Events contain provider/model/status metadata and never credentials
// or raw response bodies.

const fs = require("fs");
const path = require("path");
const { ROOT } = require("../channel-context");

class LongformProviderError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = "LongformProviderError";
    this.code = code;
    this.provider = options.provider || null;
    this.status = options.status || null;
    this.retryable = !!options.retryable;
    this.defer = !!options.defer;
    this.retryAfterMs = options.retryAfterMs || null;
    this.stage = options.stage || null;
  }
}

function envValue(name) {
  if (Object.prototype.hasOwnProperty.call(process.env, name) && String(process.env[name]).trim()) return String(process.env[name]).trim();
  if (process.env.NODE_TEST_CONTEXT) return "";
  try {
    for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && match[1] === name) return match[2].trim();
    }
  } catch (error) { /* optional .env */ }
  return "";
}

function providerSpec(name) {
  if (name === "groq") return {
    name,
    model: envValue("GROQ_MODEL") || "openai/gpt-oss-120b",
    keyName: "GROQ_API_KEY",
    configured: !!envValue("GROQ_API_KEY"),
  };
  if (name === "anthropic") return {
    name,
    model: envValue("LONGFORM_MODEL") || envValue("ANTHROPIC_MODEL") || "claude-opus-5",
    keyName: "ANTHROPIC_API_KEY",
    configured: !!envValue("ANTHROPIC_API_KEY"),
  };
  return { name, model: null, keyName: null, configured: false };
}

function configuration() {
  let primaryName = envValue("LONGFORM_LLM_PROVIDER").toLowerCase();
  // Backward compatibility for the existing lane: it keeps working only when
  // explicitly enabled. A new installation selects Groq with the provider env.
  if (!primaryName && envValue("LONGFORM_LLM") === "1" && envValue("ANTHROPIC_API_KEY")) primaryName = "anthropic";
  const fallbackName = envValue("LONGFORM_LLM_FALLBACK_PROVIDER").toLowerCase();
  return {
    enabled: envValue("LONGFORM_LLM") !== "0" && !!primaryName,
    primary: providerSpec(primaryName),
    fallback: fallbackName && fallbackName !== primaryName ? providerSpec(fallbackName) : null,
  };
}

function available() {
  const config = configuration();
  return config.enabled && ["groq", "anthropic"].includes(config.primary.name) && config.primary.configured;
}

function retryAfterMs(headers) {
  if (!headers || typeof headers.get !== "function") return null;
  const raw = headers.get("retry-after");
  if (!raw) return null;
  if (/^\d+(?:\.\d+)?$/.test(raw)) return Math.ceil(Number(raw) * 1000);
  const at = Date.parse(raw);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
}

function classifyHttp(provider, status, headers, stage) {
  if (status === 429) return new LongformProviderError("RATE_LIMIT", `${provider} rate limit reached; long-form generation deferred`, { provider, status, stage, retryable: true, defer: true, retryAfterMs: retryAfterMs(headers) });
  if (status === 401 || status === 403) return new LongformProviderError("AUTH", `${provider} authentication failed`, { provider, status, stage });
  if (status === 408 || status === 409 || status === 425 || status >= 500) return new LongformProviderError("TRANSIENT", `${provider} temporarily unavailable (HTTP ${status})`, { provider, status, stage, retryable: true, defer: true, retryAfterMs: retryAfterMs(headers) });
  return new LongformProviderError("REQUEST", `${provider} request failed (HTTP ${status})`, { provider, status, stage });
}

function parseJsonText(text, provider, stage) {
  const value = String(text || "");
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first < 0 || last < first) throw new LongformProviderError("INVALID_JSON", `${provider} returned no JSON object`, { provider, stage });
  try { return JSON.parse(value.slice(first, last + 1)); }
  catch (error) { throw new LongformProviderError("INVALID_JSON", `${provider} returned invalid JSON`, { provider, stage }); }
}

// GROQ (OpenAI-compatible). Verified against console.groq.com/docs (2026-10):
//  • openai/gpt-oss-20b|120b support response_format json_schema with
//    strict:true (constrained decoding: the output always matches the schema;
//    every property required, additionalProperties:false). json_object mode
//    only guarantees syntax and fails with HTTP 400 when the model cannot
//    produce valid JSON — the "Failed to generate JSON" errors.
//  • reasoning_format is NOT supported for GPT-OSS; include_reasoning:false is
//    the GPT-OSS way to keep reasoning out of the response. reasoning_effort
//    accepts low|medium|high.
//  • Rate limits are per organisation and model; a single request whose
//    prompt + max_completion_tokens exceeds the tokens-per-minute allowance
//    is rejected (413/429), so every request is sized before it is sent and
//    paced with the x-ratelimit-* headers.
const GPT_OSS = /^openai\/gpt-oss-(?:20b|120b)$/;

function estimateTokens(text) {
  // Conservative: ~3.2 characters per token for English prose + JSON syntax.
  return Math.ceil(String(text || "").length / 3.2);
}

function numberEnv(name, fallback, minimum = 0) {
  const value = Number(envValue(name));
  return Number.isFinite(value) && value >= minimum ? value : fallback;
}

// Largest single request (prompt + completion allowance) the organisation's
// tokens-per-minute limit can admit; 8,000 TPM is Groq's published base limit
// for gpt-oss-120b, so the default leaves headroom below it.
function requestBudget() { return numberEnv("LONGFORM_REQUEST_TOKEN_BUDGET", 7000, 1000); }
function maxWaitMs() { return numberEnv("LONGFORM_LLM_MAX_WAIT_MS", 70000, 1000); }

// "1m2.5s" | "7.66s" | "250ms" → milliseconds.
function durationMs(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Math.ceil(Number(text) * 1000);
  let total = 0;
  let matched = false;
  for (const [, value, unit] of text.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    matched = true;
    total += Number(value) * ({ ms: 1, s: 1000, m: 60000, h: 3600000 }[unit]);
  }
  return matched ? Math.ceil(total) : null;
}

// Last observed token window per provider+model (process-wide, so sequential
// stages pace each other).
const rateWindow = new Map();

function observeRate(key, headers, now = Date.now()) {
  if (!headers || typeof headers.get !== "function") return;
  const num = (name) => { const raw = headers.get(name); return raw == null || String(raw).trim() === "" ? NaN : Number(raw); };
  const remaining = num("x-ratelimit-remaining-tokens");
  const limit = num("x-ratelimit-limit-tokens");
  const reset = durationMs(headers.get("x-ratelimit-reset-tokens"));
  const remainingRequests = num("x-ratelimit-remaining-requests");
  if (!Number.isFinite(remaining) && !Number.isFinite(limit)) return;
  rateWindow.set(key, {
    remainingTokens: Number.isFinite(remaining) ? remaining : null,
    limitTokens: Number.isFinite(limit) ? limit : null,
    resetAt: reset != null ? now + reset : null,
    remainingRequests: Number.isFinite(remainingRequests) ? remainingRequests : null,
  });
}

function sanitizeReason(message) {
  return String(message || "").replace(/[\r\n]+/g, " ").slice(0, 240)
    .replace(/gsk_[A-Za-z0-9_-]+/g, "[REDACTED]").replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
}

async function groq(input, dependencies = {}) {
  const fetchImpl = dependencies.fetch || globalThis.fetch;
  const sleep = dependencies.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = dependencies.now || (() => Date.now());
  const onEvent = dependencies.onEvent || (() => {});
  if (typeof fetchImpl !== "function") throw new LongformProviderError("RUNTIME", "fetch is unavailable for Groq", { provider: "groq", stage: input.stage });
  const gptOss = GPT_OSS.test(input.model || "");
  const responseFormat = input.schema && gptOss
    ? { type: "json_schema", json_schema: { name: input.schemaName || "longform_stage", strict: true, schema: input.schema } }
    : { type: "json_object" };
  const maxTokens = input.maxTokens || 4096;
  const body = {
    model: input.model,
    messages: [{ role: "system", content: input.system }, { role: "user", content: input.user }],
    response_format: responseFormat,
    temperature: input.temperature != null ? input.temperature : 0.3,
    max_completion_tokens: maxTokens,
    ...(gptOss ? { reasoning_effort: input.reasoningEffort || "low", include_reasoning: false } : {}),
  };
  // Size check before spending a request: a request larger than one minute's
  // allowance can never succeed, waiting will not help.
  const needed = estimateTokens(input.system) + estimateTokens(input.user) + (input.schema ? estimateTokens(JSON.stringify(input.schema)) : 0) + maxTokens;
  const budget = requestBudget();
  if (needed > budget) {
    throw new LongformProviderError("REQUEST_TOO_LARGE", `groq request for ${input.stage} needs ~${needed} tokens > budget ${budget}; shrink the stage input`, { provider: "groq", stage: input.stage });
  }
  // Pace with the last observed token window instead of colliding with it.
  const key = `groq:${input.model}`;
  const window = rateWindow.get(key);
  if (window && window.remainingRequests === 0 && window.resetAt == null) {
    throw new LongformProviderError("RATE_LIMIT", "groq daily request allowance exhausted; long-form generation deferred", { provider: "groq", stage: input.stage, retryable: false, defer: true });
  }
  if (window && window.remainingTokens != null && window.remainingTokens < needed && window.resetAt != null) {
    const wait = Math.max(0, window.resetAt - now()) + 500;
    if (wait > maxWaitMs()) throw new LongformProviderError("RATE_LIMIT", `groq token window resets in ${Math.round(wait / 1000)}s (> wait limit); long-form generation deferred`, { provider: "groq", stage: input.stage, retryable: false, defer: true, retryAfterMs: wait });
    onEvent({ event: "throttle_wait", provider: "groq", model: input.model, stage: input.stage, delayMs: wait, neededTokens: needed, remainingTokens: window.remainingTokens });
    await sleep(wait);
    rateWindow.delete(key);
  }
  let response;
  try {
    response = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${envValue("GROQ_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new LongformProviderError("NETWORK", "groq network request failed; long-form generation deferred", { provider: "groq", stage: input.stage, retryable: true, defer: true });
  }
  observeRate(key, response.headers, now());
  if (!response.ok) {
    const failure = classifyHttp("groq", response.status, response.headers, input.stage);
    if (response.status === 400 || response.status === 413 || response.status === 422) {
      let reason = "";
      let code = "";
      try {
        const parsed = await response.json();
        const error = parsed && parsed.error;
        if (error && typeof error.message === "string") reason = sanitizeReason(error.message);
        if (error && typeof error.code === "string") code = error.code;
      } catch (_) { /* diagnostic body is optional */ }
      if (response.status === 413) {
        failure.code = "REQUEST_TOO_LARGE";
      } else if (code === "json_validate_failed" || /failed to generate json|does not match the expected schema/i.test(reason)) {
        // The model's output failed JSON validation: one retry of the same
        // request is reasonable; the raw failed_generation is never kept.
        failure.code = "INVALID_GENERATION";
        failure.retryable = true;
      }
      failure.message = `groq request rejected (HTTP ${response.status}${code ? `, ${code}` : ""}) at ${input.stage}; ${reason || "check model parameters and token limits"}`;
    }
    throw failure;
  }
  let parsed;
  try { parsed = await response.json(); }
  catch (error) { throw new LongformProviderError("INVALID_RESPONSE", "groq returned an unreadable response", { provider: "groq", stage: input.stage }); }
  const choice = parsed && parsed.choices && parsed.choices[0];
  if (choice && choice.finish_reason === "length") throw new LongformProviderError("TRUNCATED", `groq output for ${input.stage} hit max_completion_tokens`, { provider: "groq", stage: input.stage, retryable: false });
  const message = choice && choice.message;
  const json = parseJsonText(message && message.content, "groq", input.stage);
  return {
    json,
    provider: "groq",
    model: parsed.model || input.model,
    usage: { input_tokens: parsed.usage && parsed.usage.prompt_tokens || 0, output_tokens: parsed.usage && parsed.usage.completion_tokens || 0 },
    rate: rateWindow.get(key) || null,
  };
}

async function anthropic(input, dependencies = {}) {
  const client = dependencies.anthropicClient || (() => {
    const Anthropic = dependencies.Anthropic || require("@anthropic-ai/sdk");
    return new Anthropic({ apiKey: envValue("ANTHROPIC_API_KEY") });
  })();
  let response;
  try {
    response = await client.messages.create({
      model: input.model,
      max_tokens: input.maxTokens || 4096,
      system: input.system,
      messages: [{ role: "user", content: input.user }],
    });
  } catch (error) {
    const status = error && (error.status || error.statusCode);
    if (status) throw classifyHttp("anthropic", status, error.headers, input.stage);
    throw new LongformProviderError("NETWORK", "anthropic request failed; long-form generation deferred", { provider: "anthropic", stage: input.stage, retryable: true, defer: true });
  }
  if (response.stop_reason === "refusal") throw new LongformProviderError("REFUSAL", "anthropic refused the long-form request", { provider: "anthropic", stage: input.stage });
  if (response.stop_reason === "max_tokens") throw new LongformProviderError("TRUNCATED", "anthropic response reached its token limit", { provider: "anthropic", stage: input.stage, retryable: true, defer: true });
  const text = (response.content || []).filter((block) => block.type === "text").map((block) => block.text).join("");
  return { json: parseJsonText(text, "anthropic", input.stage), provider: "anthropic", model: response.model || input.model, usage: response.usage || { input_tokens: 0, output_tokens: 0 } };
}

async function once(spec, input, dependencies) {
  if (!spec || !["groq", "anthropic"].includes(spec.name)) throw new LongformProviderError("UNSUPPORTED_PROVIDER", `unsupported long-form provider: ${spec && spec.name || "none"}`, { provider: spec && spec.name, stage: input.stage });
  if (!spec.configured) throw new LongformProviderError("MISSING_SECRET", `missing ${spec.keyName} for long-form provider ${spec.name}`, { provider: spec.name, stage: input.stage });
  const request = { ...input, model: spec.model };
  return spec.name === "groq" ? groq(request, { ...dependencies, onEvent: dependencies.onEvent }) : anthropic(request, dependencies);
}

function delayFor(error, attempt) {
  const configuredMax = Number(envValue("LONGFORM_LLM_MAX_RETRY_MS"));
  const maximum = Number.isFinite(configuredMax) && configuredMax >= 1000 ? configuredMax : 30000;
  const exponential = Math.min(maximum, 1000 * 2 ** attempt);
  // The provider's Retry-After is honoured in full (up to the wait limit,
  // checked by the caller); retrying earlier only spends the attempt.
  return Math.max(exponential, Math.min(error.retryAfterMs || 0, maxWaitMs()));
}

// Verification only: LONGFORM_TEST_STOP_AFTER_REQUESTS=N makes the (N+1)th
// request in this process fail as a deferred rate limit before anything is
// sent, so cross-run checkpoint resume can be proven on demand. Unset = off.
let requestsThisProcess = 0;
function testStop(spec, input) {
  const limit = Number(envValue("LONGFORM_TEST_STOP_AFTER_REQUESTS"));
  if (!(Number.isFinite(limit) && limit > 0) || requestsThisProcess < limit) return null;
  return new LongformProviderError("RATE_LIMIT", `verification stop after ${limit} requests (simulated rate limit)`, { provider: spec.name, stage: input.stage, retryable: false, defer: true });
}

async function withRetry(spec, input, dependencies = {}, onEvent = () => {}) {
  const attempts = Math.max(1, Math.min(4, Number(envValue("LONGFORM_LLM_MAX_ATTEMPTS")) || 2));
  const sleep = dependencies.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const stop = testStop(spec, input);
    if (stop) { onEvent({ event: "deferred", provider: spec.name, model: spec.model, stage: input.stage, attempt: attempt + 1, code: stop.code, message: stop.message }); throw stop; }
    onEvent({ event: "request", provider: spec.name, model: spec.model, stage: input.stage, attempt: attempt + 1 });
    requestsThisProcess += 1;
    try {
      const result = await once(spec, input, { ...dependencies, onEvent });
      onEvent({ event: "success", provider: result.provider, model: result.model, stage: input.stage, attempt: attempt + 1, usage: result.usage,
        remainingTokens: result.rate ? result.rate.remainingTokens : null, limitTokens: result.rate ? result.rate.limitTokens : null, remainingRequests: result.rate ? result.rate.remainingRequests : null });
      return result;
    } catch (error) {
      const safe = error instanceof LongformProviderError ? error : new LongformProviderError("UNKNOWN", `${spec.name} long-form request failed`, { provider: spec.name, stage: input.stage });
      onEvent({ event: safe.defer ? "deferred" : "failed", provider: spec.name, model: spec.model, stage: input.stage, attempt: attempt + 1, code: safe.code, status: safe.status, retryable: safe.retryable, retryAfterMs: safe.retryAfterMs, message: safe.message ? sanitizeReason(safe.message) : null });
      if (!safe.retryable || attempt + 1 >= attempts) throw safe;
      // A Retry-After longer than the wait limit (daily allowance) cannot be
      // bridged inside this run: stop now and keep the checkpoint.
      if (safe.retryAfterMs && safe.retryAfterMs > maxWaitMs()) throw safe;
      const delay = delayFor(safe, attempt);
      onEvent({ event: "retry_scheduled", provider: spec.name, model: spec.model, stage: input.stage, attempt: attempt + 2, delayMs: delay, code: safe.code });
      await sleep(delay);
    }
  }
  throw new LongformProviderError("UNKNOWN", "long-form provider exhausted attempts", { provider: spec.name, stage: input.stage, defer: true });
}

async function generateJson(input, options = {}) {
  const config = options.config || configuration();
  const onEvent = options.onEvent || (() => {});
  try {
    return await withRetry(config.primary, input, options.dependencies || {}, onEvent);
  } catch (primaryError) {
    if (!config.fallback) throw primaryError;
    if (!config.fallback.configured) {
      onEvent({ event: "fallback_unavailable", provider: config.fallback.name, model: config.fallback.model, stage: input.stage, code: "MISSING_SECRET" });
      throw primaryError;
    }
    onEvent({ event: "fallback_started", provider: config.fallback.name, model: config.fallback.model, stage: input.stage, primaryProvider: config.primary.name, primaryCode: primaryError.code || "UNKNOWN" });
    return withRetry(config.fallback, input, options.dependencies || {}, onEvent);
  }
}

module.exports = {
  LongformProviderError, envValue, providerSpec, configuration, available, retryAfterMs, classifyHttp,
  parseJsonText, groq, anthropic, delayFor, withRetry, generateJson,
  estimateTokens, requestBudget, maxWaitMs, durationMs, observeRate, rateWindow, sanitizeReason,
  resetRequestCount: () => { requestsThisProcess = 0; },
};
