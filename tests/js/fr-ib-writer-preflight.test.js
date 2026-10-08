"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {inspect}=require("../../scripts/fr-ib-writer-preflight");
test("writer preflight fails closed without provider or key",()=>{
  assert.equal(inspect({}).configured,false);
  assert.equal(inspect({LONGFORM_LLM_PROVIDER:"groq"}).configured,false);
  assert.equal(inspect({LONGFORM_LLM_PROVIDER:"unknown",GROQ_API_KEY:"x"}).configured,false);
});
test("explicit provider and secret are required; disable switch wins",()=>{
  assert.equal(inspect({LONGFORM_LLM_PROVIDER:"groq",GROQ_API_KEY:"local-test"}).configured,true);
  assert.equal(inspect({LONGFORM_LLM_PROVIDER:"groq",GROQ_API_KEY:"local-test",LONGFORM_LLM:"0"}).configured,false);
  assert.equal(inspect({LONGFORM_LLM_PROVIDER:"anthropic",ANTHROPIC_API_KEY:"local-test"}).configured,true);
});
