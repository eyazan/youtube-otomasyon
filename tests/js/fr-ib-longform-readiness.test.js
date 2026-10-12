"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const script = path.resolve(__dirname, "../../scripts/fr-ib-longform-readiness.js");

function fixture(dir, fr, ib) {
  fs.writeFileSync(path.join(dir, "fr-summary.json"), JSON.stringify({results:[{channel:"failure-reconstructed",long:fr}]}));
  fs.writeFileSync(path.join(dir, "ib-summary.json"), JSON.stringify({results:[{channel:"impossible-brief",long:ib}]}));
}
function run(dir) {
  return cp.spawnSync(process.execPath,[script,dir,path.join(dir,"report.md")],{encoding:"utf8"});
}
test("report preserves both channel blockers and HOLD without touching production state", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),"fr-ib-pilot-"));
  try {
    fixture(dir,{topic:"challenger-1986",score:83,decision:"BLOCK",minutes:2.2,deepClaims:12,hardFails:["INSUFFICIENT_DEPTH"]},{topic:"europa",score:84,decision:"BLOCK",minutes:1.8,deepClaims:0,hardFails:["INSUFFICIENT_DEPTH"]});
    const result=run(dir);
    assert.equal(result.status,0,result.stderr);
    const text=fs.readFileSync(path.join(dir,"report.md"),"utf8");
    assert.match(text,/failure-reconstructed/);
    assert.match(text,/impossible-brief/);
    assert.match(text,/HOLD/);
    assert.match(text,/2 of 2/);
    assert.match(text,/INSUFFICIENT_DEPTH/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test("report rejects missing or corrupted summaries",()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"fr-ib-invalid-"));
  try {
    fixture(dir,{topic:"a",score:90,decision:"PUBLISH",minutes:10,deepClaims:10,hardFails:[]},{topic:"b",score:89,decision:"PUBLISH",minutes:9,deepClaims:8,hardFails:[]});
    assert.equal(run(dir).status,0);
    fs.writeFileSync(path.join(dir,"ib-summary.json"),"");
    assert.notEqual(run(dir).status,0);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
