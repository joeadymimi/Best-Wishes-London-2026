export type RitualSfx = "incense" | "mokugyo" | "beads";

type SfxState = {
  ctx: AudioContext | null;
  master: GainNode | null;
  noise: AudioBuffer | null;
  lastBeadsTickAt: number;
};

const state: SfxState = {
  ctx: null,
  master: null,
  noise: null,
  lastBeadsTickAt: 0
};

function isBrowser() {
  return typeof window !== "undefined";
}

function getAudioContext(): AudioContext | null {
  if (!isBrowser()) return null;
  if (state.ctx) return state.ctx;

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(ctx.destination);

  state.ctx = ctx;
  state.master = master;
  state.noise = createNoiseBuffer(ctx);
  return ctx;
}

function createNoiseBuffer(ctx: AudioContext) {
  const length = Math.floor(ctx.sampleRate * 1.2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

async function resumeIfNeeded(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // Some browsers may reject; we keep it best-effort.
    }
  }
}

/**
 * Call this on any user gesture (pointerdown/click/touchstart) to unlock audio on mobile.
 */
export async function primeSfx() {
  const ctx = getAudioContext();
  if (!ctx) return;
  await resumeIfNeeded(ctx);
}

function now(ctx: AudioContext) {
  return ctx.currentTime;
}

function safeConnect(node: AudioNode) {
  if (state.master) node.connect(state.master);
}

function createPan(ctx: AudioContext, pan: number) {
  // Safari iOS older versions may not support StereoPannerNode.
  const panner = "createStereoPanner" in ctx ? (ctx as AudioContext & { createStereoPanner(): StereoPannerNode }).createStereoPanner() : null;
  if (!panner) return null;
  panner.pan.value = pan;
  return panner;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function playTransientNoise(ctx: AudioContext, opts: { durationMs: number; hp?: number; lp?: number; gain: number }) {
  const noise = state.noise;
  if (!noise) return;

  const src = ctx.createBufferSource();
  src.buffer = noise;

  let node: AudioNode = src;

  if (opts.hp) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = opts.hp;
    node.connect(hp);
    node = hp;
  }

  if (opts.lp) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = opts.lp;
    node.connect(lp);
    node = lp;
  }

  const g = ctx.createGain();
  g.gain.value = 0;
  node.connect(g);
  safeConnect(g);

  const t0 = now(ctx);
  const dur = opts.durationMs / 1000;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(opts.gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.start(t0);
  src.stop(t0 + dur);
}

function playWoodBody(ctx: AudioContext, opts: { baseHz: number; durationMs: number; gain: number }) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = opts.baseHz;

  const g = ctx.createGain();
  g.gain.value = 0;
  osc.connect(g);
  safeConnect(g);

  const t0 = now(ctx);
  const dur = opts.durationMs / 1000;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(opts.gain, t0 + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  // Slight pitch drop feels more "wood".
  osc.frequency.setValueAtTime(opts.baseHz * 1.03, t0);
  osc.frequency.exponentialRampToValueAtTime(opts.baseHz * 0.92, t0 + dur);

  osc.start(t0);
  osc.stop(t0 + dur);
}

function exciteResonator(
  ctx: AudioContext,
  opts: { freqHz: number; q: number; durationMs: number; gain: number; pan?: number }
) {
  const noise = state.noise;
  if (!noise) return;

  const src = ctx.createBufferSource();
  src.buffer = noise;

  const env = ctx.createGain();
  env.gain.value = 0;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = opts.freqHz;
  bp.Q.value = opts.q;

  // Tiny soft saturation via waveshaper helps "wood" bite without sounding digital.
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(44100);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i * 2) / (curve.length - 1) - 1;
    curve[i] = Math.tanh(2.2 * x);
  }
  shaper.curve = curve;
  shaper.oversample = "2x";

  src.connect(env);
  env.connect(bp);
  bp.connect(shaper);

  const panNode = typeof opts.pan === "number" ? createPan(ctx, opts.pan) : null;
  if (panNode) {
    shaper.connect(panNode);
    safeConnect(panNode);
  } else {
    safeConnect(shaper);
  }

  const t0 = now(ctx);
  const dur = opts.durationMs / 1000;

  // Very short excitation "tap".
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(opts.gain, t0 + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.02);

  // Let resonance ring out a bit by holding the source (buffer) slightly longer.
  src.start(t0);
  src.stop(t0 + dur);
}

/**
 * Wooden fish knock: short "wood + air" transient.
 * If you want a real recording later, replace this with an <audio> element or fetch+decodeAudioData.
 */
export function playMokugyoKnock(intensity = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const k = 0.65 + clamp01(intensity) * 0.65;
  void resumeIfNeeded(ctx);

  // A realistic wooden fish knock feels like:
  // 1) a short mallet "tick"
  // 2) a hollow wood body resonance (two close modes)
  // 3) a soft low thump
  const detune = 1 + (Math.random() * 2 - 1) * 0.015;

  playTransientNoise(ctx, { durationMs: 70, hp: 1200, lp: 9000, gain: 0.04 * k });
  exciteResonator(ctx, { freqHz: 520 * detune, q: 10.5, durationMs: 240, gain: 0.12 * k, pan: -0.08 });
  exciteResonator(ctx, { freqHz: 860 * detune, q: 9.0, durationMs: 220, gain: 0.08 * k, pan: 0.06 });
  playWoodBody(ctx, { baseHz: 180 * detune, durationMs: 180, gain: 0.10 * k });
}

/**
 * Incense: a gentle "ignite + airy" sound.
 */
export function playIncenseIgnite() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void resumeIfNeeded(ctx);

  playTransientNoise(ctx, { durationMs: 220, hp: 900, lp: 7000, gain: 0.045 });
  // Soft sparkle tail
  playTransientNoise(ctx, { durationMs: 420, hp: 2000, lp: 12000, gain: 0.018 });
}

/**
 * Beads: tiny ticks while dragging. Throttled to keep rapid movement smooth.
 */
export function playBeadsTick(strength = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;
  void resumeIfNeeded(ctx);

  const nowMs = Date.now();
  if (nowMs - state.lastBeadsTickAt < 38) return;
  state.lastBeadsTickAt = nowMs;

  // Beads rolling are many tiny collisions; we simulate with a crisp tick + a small resonant "clack".
  const k = 0.45 + clamp01(strength) * 0.95;
  const detune = 1 + (Math.random() * 2 - 1) * 0.03;
  const pan = (Math.random() * 2 - 1) * 0.22;

  playTransientNoise(ctx, { durationMs: 38, hp: 1600, lp: 12000, gain: 0.028 * k });
  exciteResonator(ctx, { freqHz: 2400 * detune, q: 14, durationMs: 120, gain: 0.06 * k, pan });
  exciteResonator(ctx, { freqHz: 3600 * detune, q: 10, durationMs: 90, gain: 0.03 * k, pan: -pan * 0.6 });
}

export function playBeadsRelease() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void resumeIfNeeded(ctx);

  // Release/settle: a short cluster of softer clacks.
  playTransientNoise(ctx, { durationMs: 90, hp: 900, lp: 9000, gain: 0.02 });
  for (let i = 0; i < 3; i += 1) {
    const delay = i * 0.018;
    const detune = 1 + (Math.random() * 2 - 1) * 0.035;
    const pan = (Math.random() * 2 - 1) * 0.18;
    const t = now(ctx) + delay;

    const noise = state.noise;
    if (!noise) continue;
    const src = ctx.createBufferSource();
    src.buffer = noise;

    const g = ctx.createGain();
    g.gain.value = 0;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200 * detune;
    bp.Q.value = 12;

    src.connect(g);
    g.connect(bp);

    const panNode = createPan(ctx, pan);
    if (panNode) {
      bp.connect(panNode);
      safeConnect(panNode);
    } else {
      safeConnect(bp);
    }

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04 * (1 - i * 0.2), t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    src.start(t);
    src.stop(t + 0.12);
  }

  playWoodBody(ctx, { baseHz: 210, durationMs: 140, gain: 0.045 });
}
