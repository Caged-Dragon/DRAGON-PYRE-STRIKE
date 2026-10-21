import type { DragonRealmId, Player, ThemeId } from "../types/game";

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

let masterGain: GainNode | null = null;
let masterVolume = 1;

/** Shared output node so one volume setting controls every sound effect. */
function output(ctx: AudioContext): AudioNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    const destination = ctx.destination;
    masterGain.connect(destination);
  }
  return masterGain;
}

/** Sets the master volume for all sound effects (0 = silent). */
export function setMasterVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1.5, volume));
  if (masterGain) masterGain.gain.value = masterVolume;
}

const REALM_BASE_FREQ: Record<DragonRealmId, [number, number]> = {
  inferno: [165, 220],
  jade: [196, 261.63],
  frost: [246.94, 329.63],
  void: [146.83, 207.65],
};

export function playMoveSound(
  player: Player,
  theme: ThemeId,
  enabled: boolean,
  realm: DragonRealmId = "inferno"
): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (theme === "classic") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(player === "X" ? 540 : 420, now);
    osc.frequency.exponentialRampToValueAtTime(
      player === "X" ? 720 : 340,
      now + 0.08
    );

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(output(ctx));
    osc.start(now);
    osc.stop(now + 0.1);
  } else {
    const [xFreq, oFreq] = REALM_BASE_FREQ[realm];
    const baseFreq = player === "X" ? xFreq : oFreq;

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "triangle";
    sub.frequency.setValueAtTime(baseFreq, now);
    sub.frequency.exponentialRampToValueAtTime(baseFreq * 0.56, now + 0.18);

    subGain.gain.setValueAtTime(0.15, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    sub.connect(subGain);
    subGain.connect(output(ctx));
    sub.start(now);
    sub.stop(now + 0.2);

    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = realm === "frost" ? "sine" : "triangle";
    shimmer.frequency.setValueAtTime(baseFreq * 2.5, now);
    shimmer.frequency.exponentialRampToValueAtTime(baseFreq * 3.2, now + 0.14);

    shimmerGain.gain.setValueAtTime(0.06, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(output(ctx));
    shimmer.start(now);
    shimmer.stop(now + 0.16);
  }
}

export function playHintSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [587.33, 880].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const start = now + idx * 0.055;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.075, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    osc.connect(gain);
    gain.connect(output(ctx));
    osc.start(start);
    osc.stop(start + 0.18);
  });
}

export function playUndoSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(460, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.09);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(output(ctx));
  osc.start(now);
  osc.stop(now + 0.11);
}

export function playOutcomeSound(
  outcome: "win" | "draw",
  theme: ThemeId,
  enabled: boolean
): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (outcome === "draw") {
    const notes = [330, 293.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const start = now + idx * 0.11;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain);
      gain.connect(output(ctx));
      osc.start(start);
      osc.stop(start + 0.2);
    });
    return;
  }

  const notes =
    theme === "classic"
      ? [523.25, 659.25, 783.99]
      : [220, 277.18, 329.63, 440, 554.37];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = theme === "classic" ? "sine" : "triangle";
    const start = now + idx * 0.075;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.11, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);
    osc.connect(gain);
    gain.connect(output(ctx));
    osc.start(start);
    osc.stop(start + 0.36);
  });
}

export function playUnlockFanfare(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    const start = now + idx * 0.07;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.connect(gain);
    gain.connect(output(ctx));
    osc.start(start);
    osc.stop(start + 0.46);
  });
}
