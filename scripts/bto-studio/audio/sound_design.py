#!/usr/bin/env python3
"""BTO Premium Studio sound design: synthesises every effect and the music bed from code (no samples, no
third-party audio, so there is nothing to license), placed at the cue times the page reported for its own
animation (BTO.audio). Deterministic: the same cues give the same file.

    python3 -I sound_design.py <cues.json> <out.wav>
    cues.json: {"duration": s, "cues": [{"t", "kind", "gain", "pan", "dur"?, "note"?}], "music": {"key": "A", "level": 0.11, "resolveAt": s}}

Writes 48 kHz stereo 24-bit WAV (effects + bed). mix-audio.js ducks it under the narration and masters to -14 LUFS.
"""
import json, sys
import numpy as np
import soundfile as sf

SR = 48000
spec = json.load(open(sys.argv[1]))
D = float(spec["duration"])
N = int(D * SR) + SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(20261019)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def bandpass_noise(n, lo, hi):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.max(np.abs(y)) + 1e-9)


def sweep_noise(n, f0, f1, width=0.5):
    # noise through a moving band: built from short overlapping windows (deterministic)
    out = np.zeros(n); hop = 1024; win = np.hanning(hop * 2)
    for s in range(0, n, hop):
        k = s / max(1, n); fc = f0 * (f1 / f0) ** k
        seg = bandpass_noise(hop * 2, fc * (1 - width / 2), fc * (1 + width / 2)) * win
        e = min(n, s + hop * 2); out[s:e] += seg[:e - s]
    return out / (np.max(np.abs(out)) + 1e-9)


def tone(n, f, partials=((1, 1.0),), tau=0.3, f_end=None):
    t = np.arange(n) / SR
    fr = f if f_end is None else f * (f_end / f) ** (t / (n / SR))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    y = sum(a * np.sin(ph * m) * np.exp(-t / (tau / m ** 0.5)) for m, a in partials)
    att = np.minimum(1, t / 0.003)
    return y * att


def place(y, t, gain, pan):
    s = int(t * SR)
    if s >= N or s + len(y) <= 0:
        return
    if s < 0:
        y = y[-s:]; s = 0
    e = min(N, s + len(y)); y = y[:e - s]
    gl = np.cos((pan + 1) * np.pi / 4) * 1.41421; gr = np.sin((pan + 1) * np.pi / 4) * 1.41421
    L[s:e] += y * gain * gl; R[s:e] += y * gain * gr


def fx(c):
    k, d = c["kind"], float(c.get("dur", 0) or 0)
    if k == "tick":
        n = int(0.03 * SR); return bandpass_noise(n, 2500, 6000) * env_exp(n, 0.006) * 0.35
    if k == "pop":
        n = int(0.12 * SR); return tone(n, 620, ((1, 1), (2, 0.25)), 0.05, f_end=900) * 0.4
    if k == "lock":
        n = int(0.09 * SR); a = bandpass_noise(n, 3000, 9000) * env_exp(n, 0.004) * 0.5
        b = tone(n, 1760, ((1, 1), (2.76, 0.4)), 0.035) * 0.35; c2 = tone(n, 110, ((1, 1),), 0.04) * 0.5
        return a + b + c2
    if k in ("sweep", "read"):
        n = int(max(0.2, d) * SR); e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
        y = sweep_noise(n, 700, 4200 if k == "read" else 2600, 0.6) * e * 0.32
        if k == "read":  # a fast shimmer of ticks while the data is read
            for i in range(14):
                s = int(i / 14 * n); m = int(0.012 * SR)
                if s + m < n: y[s:s + m] += bandpass_noise(m, 4000, 9000) * env_exp(m, 0.003) * 0.25
        return y
    if k == "roll":
        n = int(max(0.3, d) * SR); y = np.zeros(n); m = int(0.02 * SR)
        for i in range(16):
            u = i / 15; s = int(n * (1 - (1 - u) ** 2) * 0.97)
            if s + m < n: y[s:s + m] += bandpass_noise(m, 1800, 5000) * env_exp(m, 0.004) * (0.25 + 0.15 * (1 - u))
        return y
    if k == "paper":
        n = int(0.22 * SR); e = np.minimum(1, np.arange(n) / (0.03 * SR)) * env_exp(n, 0.07)
        return bandpass_noise(n, 400, 3500) * e * 0.28 + tone(n, 95, ((1, 1),), 0.06) * 0.35
    if k == "whoosh" or k.startswith("transition"):
        long = k.startswith("transition"); n = int((0.55 if long else 0.32) * SR)
        e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
        return sweep_noise(n, 260, 1400 if long else 2200, 0.8) * e * (0.34 if long else 0.18)
    if k == "pluck":
        f = 392.0 * 2 ** (float(c.get("note", 0)) / 12); n = int(0.6 * SR)
        return tone(n, f, ((1, 1), (2, 0.35), (3, 0.12)), 0.32) * 0.32
    if k == "reject":
        n = int(0.12 * SR); return tone(n, 150, ((1, 1), (2, 0.2)), 0.04, f_end=110) * 0.45 + bandpass_noise(n, 300, 1200) * env_exp(n, 0.015) * 0.12
    if k == "match":
        n = int(0.8 * SR); y = tone(n, 659.3, ((1, 1), (2, 0.3)), 0.35) * 0.25
        y[int(0.09 * SR):] += tone(n - int(0.09 * SR), 987.8, ((1, 1), (2, 0.3)), 0.4) * 0.25; return y
    if k == "chime":
        n = int(2.2 * SR); y = np.zeros(n)
        for i, f in enumerate((440.0, 554.4, 659.3, 987.8)):
            s = int(i * 0.035 * SR); y[s:] += tone(n - s, f, ((1, 1), (2.0, 0.2), (3.0, 0.06)), 0.9) * 0.16
        return y
    if k == "lift":
        n = int(0.4 * SR); return tone(n, 220, ((1, 1), (2, 0.2)), 0.25, f_end=440) * 0.22 + sweep_noise(n, 300, 1500, 0.8) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.12
    if k == "drop":
        n = int(0.3 * SR); return tone(n, 330, ((1, 1),), 0.12, f_end=140) * 0.25 + tone(n, 80, ((1, 1),), 0.06) * 0.35
    if k == "type":
        n = int(0.5 * SR); y = np.zeros(n); m = int(0.015 * SR)
        for i in range(6):
            s = int(i * 0.07 * SR)
            if s + m < n: y[s:s + m] += bandpass_noise(m, 2000, 6000) * env_exp(m, 0.004) * 0.25
        return y
    return None


unknown = set()
for c in spec["cues"]:
    if c["t"] < 0 or c["t"] > D:
        continue
    y = fx(c)
    if y is None:
        unknown.add(c["kind"]); continue
    place(y, c["t"], float(c.get("gain", 1)), float(np.clip(c.get("pan", 0), -1, 1)))

# music bed: a warm, slow pad (A - F#m - D - E, resolving to A at the payoff), low-passed detuned saws + soft sub
m = spec.get("music", {}); level = float(m.get("level", 0.11)); resolve = float(m.get("resolveAt", D - 1.5))
t = np.arange(N) / SR
chords = [(220.0, 277.2, 329.6), (185.0, 220.0, 277.2), (146.8, 220.0, 293.7), (164.8, 207.7, 246.9)]
bar = max(2.0, resolve / 8)  # eight chord changes before the resolve
pad = np.zeros(N)
idx = np.minimum((t / bar).astype(int) % 4, 3)
idx[t >= resolve] = -1
for ci, ch in enumerate(chords + [(220.0, 277.2, 329.6, 440.0)]):
    mask = (idx == ci) if ci < 4 else (idx == -1)
    if not mask.any():
        continue
    seg = np.zeros(N)
    for f in ch:
        for det in (-0.12, 0.12):
            ph = 2 * np.pi * (f * (1 + det / 100)) * t
            seg += sum(np.sin(ph * h) / h for h in range(1, 6)) * 0.12
    pad += seg * mask
# smooth chord edges (60 ms) and a gentle 1-pole low-pass
k = int(0.06 * SR); kernel = np.hanning(k); kernel /= kernel.sum(); pad = np.convolve(pad, kernel, mode="same")
a = np.exp(-2 * np.pi * 1400 / SR); y = np.zeros(N); acc = 0.0
for i in range(0, N):
    acc = (1 - a) * pad[i] + a * acc; y[i] = acc
sub = np.sin(2 * np.pi * 55 * t) * 0.18 * (t < resolve) + np.sin(2 * np.pi * 55 * t) * 0.22 * (t >= resolve)
bed = (y + sub * 0.5)
bed *= np.minimum(1, t / 0.25) * np.clip((D + 0.2 - t) / 0.8, 0, 1)
bed /= (np.max(np.abs(bed)) + 1e-9)
L += bed * level; R += bed * level * 0.97

out = np.stack([L, R], axis=1)[: int((D + 0.05) * SR)]
peak = float(np.max(np.abs(out)))
if peak > 0.89:
    out *= 0.89 / peak
sf.write(sys.argv[2], out, SR, subtype="PCM_24")
print(json.dumps({"file": sys.argv[2], "duration": round(len(out) / SR, 3), "cues": len(spec["cues"]), "unknownKinds": sorted(unknown), "peakBeforeTrim": round(peak, 3)}))
