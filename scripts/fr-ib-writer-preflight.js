#!/usr/bin/env node
"use strict";
// Read-only preflight. Never prints credentials, sends network requests, or changes publication flags.
const fs = require("node:fs");
const path = require("node:path");
const Provider = require("../core/llm/longform-provider");
function inspect(env = process.env) {
  const name = (env.LONGFORM_LLM_PROVIDER || "").trim().toLowerCase();
  const disabled = String(env.LONGFORM_LLM || "") === "0";
  const secret = name === "groq" ? "GROQ_API_KEY" : name === "anthropic" ? "ANTHROPIC_API_KEY" : null;
  const configured = !!(secret && env[secret] && String(env[secret]).trim());
  const reason = disabled ? "writer explicitly disabled" : !name ? "LONGFORM_LLM_PROVIDER is not set" : !secret ? "unsupported provider" : !configured ? "provider secret unavailable in this job" : "writer configured; live generation and factual correctness NOT verified";
  return { provider: name || "none", configured: !disabled && configured, reason };
}
if (require.main === module) {
  const status = inspect();
  const out = process.argv[2] || "reports/dry-runs/WRITER-PREFLIGHT.md";
  fs.mkdirSync(path.dirname(out), {recursive:true});
  fs.writeFileSync(out, [
    "# Long-form writer preflight", "",
    `- Provider: **${status.provider}**`,
    `- Configured in this job: **${status.configured ? "YES" : "NO"}**`,
    `- Reason: ${status.reason}`, "",
    "No API request made, no publishing action performed, no secret printed.",
    "The deterministic dry run does not represent full documentary generation.",
    "Only enable a dedicated, explicitly approved provider smoke test after secrets are configured; keep all publish flags off.", ""
  ].join("\n"));
  console.log(`Writer preflight: ${status.configured ? "CONFIGURED_NOT_TESTED" : "UNCONFIGURED"}; report saved`);
}
module.exports = { inspect };
