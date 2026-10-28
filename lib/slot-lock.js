"use strict";
// Bounded concurrency across processes on one machine: at most `max` holders of a lock directory at a time, one
// lock file per slot (slot-<i>.lock with the holder's pid and start time). A slot whose holder no longer runs, or that
// is older than staleMs, is reclaimed, so a crashed or killed process never blocks the next run. Used by the premium
// studio's Edge narration client and by the premium shadow and publishing adapter (core/pipeline/).
const fs = require("fs");
const path = require("path");

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

function tryAcquire(lockDir, max, staleMs = 10 * 60000) {
  fs.mkdirSync(lockDir, { recursive: true });
  for (let i = 0; i < max; i += 1) {
    const f = path.join(lockDir, `slot-${i}.lock`);
    // second pass on the same slot only after a stale lock (dead holder or older than staleMs) was removed
    for (let pass = 0; pass < 2; pass += 1) {
      try { fs.writeFileSync(f, JSON.stringify({ pid: process.pid, at: Date.now() }), { flag: "wx" }); return f; } catch (e) {
        if (e.code !== "EEXIST") throw e;
        let stale = false;
        try { const held = JSON.parse(fs.readFileSync(f, "utf8")); stale = !alive(held.pid) || Date.now() - held.at > staleMs; } catch (x) { stale = true; }
        if (!stale) break;
        fs.rmSync(f, { force: true });
      }
    }
  }
  return null;
}

const release = (slot) => { if (slot) fs.rmSync(slot, { force: true }); };

// async: waits (polling) up to waitMs for a slot, runs fn, always releases
async function withSlot(lockDir, max, fn, { staleMs = 10 * 60000, pollMs = 500, waitMs = 15 * 60000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), onTimeout } = {}) {
  const start = Date.now(); let slot = null;
  while (!(slot = tryAcquire(lockDir, max, staleMs))) {
    if (Date.now() - start > waitMs) throw (onTimeout ? onTimeout() : new Error(`no slot free in ${lockDir} after ${Math.round(waitMs / 1000)} s (${max} allowed at a time)`));
    await sleep(pollMs);
  }
  try { return await fn(); } finally { release(slot); }
}

// sync: for callers that block on a child process anyway (spawnSync); returns the slot file or null after waitMs
function acquireSync(lockDir, max, { staleMs = 60 * 60000, pollMs = 1000, waitMs = 0 } = {}) {
  const start = Date.now(); const pause = new Int32Array(new SharedArrayBuffer(4));
  for (;;) {
    const slot = tryAcquire(lockDir, max, staleMs); if (slot) return slot;
    if (Date.now() - start >= waitMs) return null;
    Atomics.wait(pause, 0, 0, pollMs);
  }
}

module.exports = { tryAcquire, withSlot, acquireSync, release };
