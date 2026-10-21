import type { FireKind } from "./dragons";

type ThroatFn = (
  type: OscillatorType,
  f0: number,
  f1: number,
  dur: number,
  vol: number,
  attack?: number,
  delay?: number
) => void;

interface InhaleProfile {
  dur: number;
  vol: number;
  f0: number;
  f1: number;
  filter: BiquadFilterType;
  tone0: number;
  tone1: number;
}

interface BlastProfile {
  dur: number;
  vol: number;
  f0: number;
  f1: number;
  filter: BiquadFilterType;
  q: number;
  osc: OscillatorType;
  tone0: number;
  tone1: number;
  extra?: (throat: ThroatFn) => void;
}

/** Air being pulled in. */
const INHALE: Record<FireKind, InhaleProfile> = {
  inferno: { dur: 0.26, vol: 0.05, f0: 380, f1: 1180, filter: "bandpass", tone0: 68, tone1: 132 },
  frost: { dur: 0.4, vol: 0.045, f0: 900, f1: 2600, filter: "bandpass", tone0: 220, tone1: 620 },
  lightning: { dur: 0.16, vol: 0.04, f0: 1200, f1: 3000, filter: "highpass", tone0: 340, tone1: 900 },
  venom: { dur: 0.32, vol: 0.05, f0: 260, f1: 700, filter: "bandpass", tone0: 52, tone1: 96 },
  arcane: { dur: 0.46, vol: 0.042, f0: 200, f1: 760, filter: "bandpass", tone0: 96, tone1: 260 },
  solar: { dur: 0.22, vol: 0.05, f0: 800, f1: 2200, filter: "bandpass", tone0: 300, tone1: 780 },
  quake: { dur: 0.52, vol: 0.055, f0: 180, f1: 520, filter: "lowpass", tone0: 44, tone1: 78 },
  sanguine: { dur: 0.2, vol: 0.05, f0: 300, f1: 940, filter: "bandpass", tone0: 82, tone1: 168 },
};

/** The exhalation. Every element reads differently. */
const BLAST: Record<FireKind, BlastProfile> = {
  inferno: {
    dur: 0.5,
    vol: 0.13,
    f0: 980,
    f1: 240,
    filter: "lowpass",
    q: 0.6,
    osc: "sawtooth",
    tone0: 96,
    tone1: 42,
    // Crackle of breaking resin.
    extra: (throat) => {
      for (let i = 0; i < 5; i++) {
        throat("square", 1400 - i * 120, 400, 0.05, 0.022, 0.004, 0.07 + i * 0.06);
      }
    },
  },
  frost: {
    dur: 0.36,
    vol: 0.11,
    f0: 2400,
    f1: 900,
    filter: "bandpass",
    q: 1.5,
    osc: "triangle",
    tone0: 1400,
    tone1: 520,
    // Shattering crystal.
    extra: (throat) => {
      for (let i = 0; i < 4; i++) {
        throat("sine", 2600 + i * 340, 1500, 0.09, 0.03, 0.003, 0.08 + i * 0.05);
      }
    },
  },
  lightning: {
    dur: 0.3,
    vol: 0.1,
    f0: 3000,
    f1: 1400,
    filter: "highpass",
    q: 0.8,
    osc: "square",
    tone0: 880,
    tone1: 190,
    // Arcing discharge.
    extra: (throat) => {
      for (let i = 0; i < 6; i++) {
        throat("square", 2200 - i * 180, 700, 0.03, 0.02, 0.002, 0.03 + i * 0.035);
      }
    },
  },
  venom: {
    dur: 0.72,
    vol: 0.115,
    f0: 620,
    f1: 200,
    filter: "bandpass",
    q: 0.7,
    osc: "sine",
    tone0: 128,
    tone1: 54,
    // Wet bubbling.
    extra: (throat) => {
      for (let i = 0; i < 6; i++) {
        throat("sine", 220 + i * 40, 90, 0.1, 0.026, 0.02, 0.1 + i * 0.09);
      }
    },
  },
  arcane: {
    dur: 0.44,
    vol: 0.105,
    f0: 560,
    f1: 180,
    filter: "bandpass",
    q: 2.2,
    osc: "sine",
    tone0: 210,
    tone1: 66,
    // Detuned pair beats like a tearing rift.
    extra: (throat) => {
      throat("sine", 214, 68, 0.44, 0.05, 0.04, 0.02);
      throat("triangle", 318, 96, 0.4, 0.028, 0.05, 0.06);
    },
  },
  solar: {
    dur: 0.26,
    vol: 0.115,
    f0: 1900,
    f1: 700,
    filter: "bandpass",
    q: 1.2,
    osc: "triangle",
    tone0: 720,
    tone1: 240,
    extra: (throat) => {
      throat("sine", 1480, 620, 0.14, 0.038, 0.004, 0.04);
    },
  },
  quake: {
    dur: 0.58,
    vol: 0.14,
    f0: 340,
    f1: 90,
    filter: "lowpass",
    q: 0.9,
    osc: "sawtooth",
    tone0: 62,
    tone1: 26,
    // Rolling debris.
    extra: (throat) => {
      for (let i = 0; i < 4; i++) {
        throat("square", 150 - i * 14, 60, 0.12, 0.024, 0.03, 0.14 + i * 0.11);
      }
    },
  },
  sanguine: {
    dur: 0.64,
    vol: 0.12,
    f0: 820,
    f1: 210,
    filter: "lowpass",
    q: 1.1,
    osc: "sawtooth",
    tone0: 108,
    tone1: 44,
    extra: (throat) => {
      throat("sine", 112, 46, 0.6, 0.04, 0.05, 0.03);
    },
  },
};

/** Spent air drifting out after the blast. */
const RECOVER: Record<FireKind, { dur: number; vol: number; f0: number; f1: number }> = {
  inferno: { dur: 0.34, vol: 0.045, f0: 520, f1: 160 },
  frost: { dur: 0.4, vol: 0.035, f0: 1400, f1: 520 },
  lightning: { dur: 0.18, vol: 0.03, f0: 1800, f1: 900 },
  venom: { dur: 0.5, vol: 0.04, f0: 400, f1: 140 },
  arcane: { dur: 0.44, vol: 0.035, f0: 360, f1: 130 },
  solar: { dur: 0.26, vol: 0.036, f0: 900, f1: 340 },
  quake: { dur: 0.62, vol: 0.05, f0: 260, f1: 90 },
  sanguine: { dur: 0.3, vol: 0.04, f0: 460, f1: 170 },
};

/** Tiny WebAudio synth for all game SFX — no assets, all procedural. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private active: { src: AudioBufferSourceNode | OscillatorNode; gain: GainNode }[] = [];
  muted = false;

  /** Keep the node pool bounded so long sessions never leak audio graph nodes. */
  private trim() {
    while (this.active.length > 48) {
      const node = this.active.shift();
      if (!node) break;
      try {
        node.src.stop();
      } catch {
        // Already ended.
      }
    }
  }

  /** Must be called from a user gesture at least once. */
  ensure() {
    if (!this.ctx) {
      try {
        const AC: typeof AudioContext | undefined =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        const len = Math.floor(this.ctx.sampleRate * 1);
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(1, f0), t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  private noise(dur: number, vol: number, freq: number, type: BiquadFilterType = "bandpass", delay = 0) {
    if (!this.ctx || !this.master || !this.noiseBuf || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(Math.max(40, freq), t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.35), t0 + dur);
    f.Q.value = 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  /** Enveloped noise burst — the body of every exhalation. */
  private gust(
    dur: number,
    vol: number,
    f0: number,
    f1: number,
    type: BiquadFilterType,
    q: number,
    attack = 0.03,
    delay = 0
  ) {
    if (!this.ctx || !this.master || !this.noiseBuf || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(40, f0), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.04);
    this.active.push({ src, gain });
    this.trim();
  }

  /** Enveloped pitched layer — throat resonance under the gust. */
  private throat(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    attack = 0.02,
    delay = 0
  ) {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, f0), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.04);
    this.active.push({ src: osc, gain });
    this.trim();
  }

  /** 1. INHALE — the dragon pulls air in. Rising, slightly nasal. */
  breathInhale(kind: FireKind) {
    const p = INHALE[kind];
    this.gust(p.dur, p.vol, p.f0, p.f1, p.filter, 0.9, p.dur * 0.7);
    this.throat("triangle", p.tone0, p.tone1, p.dur, p.vol * 0.32, p.dur * 0.6);
  }

  /** 2. BLAST — the exhalation itself. Sharp attack, rolling decay. */
  breathBlast(kind: FireKind) {
    const p = BLAST[kind];
    // Attack transient: the moment the throat opens.
    this.gust(p.dur * 0.28, p.vol * 1.25, p.f0 * 1.5, p.f0, p.filter, 0.7, 0.008);
    // Sustained body of the blast.
    this.gust(p.dur, p.vol * 0.8, p.f0, p.f1, p.filter, p.q, p.dur * 0.14, p.dur * 0.1);
    // Chest rumble underneath.
    this.throat(p.osc, p.tone0, p.tone1, p.dur * 1.05, p.vol * 0.42, p.dur * 0.08);
    // Elemental character layer.
    if (p.extra) p.extra((...args) => this.throat(...args));
  }

  /** 3. RECOVERY — spent air trailing out as smoke or steam. */
  breathRecover(kind: FireKind) {
    const p = RECOVER[kind];
    this.gust(p.dur, p.vol, p.f0, p.f1, "lowpass", 0.6, p.dur * 0.35);
  }

  /** 4. WINDED — lungs empty, the dragon is panting and must wait. */
  breathWinded() {
    for (let i = 0; i < 3; i++) {
      this.gust(0.17, 0.05, 420 - i * 40, 240 - i * 30, "bandpass", 1.1, 0.05, i * 0.26);
      this.throat("sawtooth", 96 - i * 6, 62 - i * 4, 0.2, 0.05, 0.05, i * 0.26);
    }
  }

  /** Silence anything still ringing, used when pausing or leaving combat. */
  stopBreath() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const node of this.active) {
      try {
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.setTargetAtTime(0.0001, now, 0.02);
        node.src.stop(now + 0.08);
      } catch {
        // Already stopped.
      }
    }
    this.active = [];
  }
  enemyHit() {
    this.tone("square", 280, 90, 0.06, 0.07);
  }
  explode(big = false) {
    this.noise(big ? 0.75 : 0.32, big ? 0.5 : 0.26, big ? 260 : 520);
    this.tone("sine", big ? 110 : 150, 28, big ? 0.6 : 0.28, big ? 0.5 : 0.24);
  }
  hurt() {
    this.tone("sine", 210, 38, 0.35, 0.4);
    this.noise(0.28, 0.3, 320);
  }
  powerup() {
    this.tone("sine", 523, 523, 0.08, 0.16);
    this.tone("sine", 659, 659, 0.08, 0.16, 0.08);
    this.tone("sine", 880, 880, 0.16, 0.16, 0.16);
  }
  shieldBreak() {
    this.tone("triangle", 900, 140, 0.28, 0.3);
    this.noise(0.22, 0.2, 2200, "highpass");
  }
  wave() {
    this.tone("sawtooth", 150, 230, 0.18, 0.14);
    this.tone("sawtooth", 230, 340, 0.26, 0.14, 0.16);
  }
  roar() {
    this.tone("sawtooth", 55, 130, 0.5, 0.28);
    this.tone("sawtooth", 130, 42, 0.75, 0.28, 0.38);
    this.noise(0.9, 0.14, 320, "lowpass");
  }
  over() {
    this.tone("sawtooth", 220, 50, 1.1, 0.28);
    this.tone("square", 110, 26, 1.3, 0.18, 0.18);
  }
  click() {
    this.tone("square", 520, 340, 0.06, 0.09);
  }
}
