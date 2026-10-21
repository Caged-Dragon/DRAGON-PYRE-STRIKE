type Sound = "tap" | "move" | "merge" | "milestone" | "win" | "lose";

// Oscillator-based effects keep the game self-contained and work after a user gesture.
export class GameAudio {
  private context: AudioContext | null = null;
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  play(kind: Sound) {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume();
      const notes: Record<Sound, [number, number, number, OscillatorType][]> = {
        tap: [[460, 0, 0.07, "sine"]],
        move: [[180, 0, 0.065, "sine"]],
        merge: [[330, 0, 0.12, "triangle"], [495, 0.065, 0.16, "sine"]],
        milestone: [[392, 0, 0.15, "triangle"], [523, 0.1, 0.15, "triangle"], [784, 0.2, 0.32, "sine"]],
        win: [[392, 0, 0.18, "triangle"], [523, 0.13, 0.2, "triangle"], [659, 0.26, 0.2, "triangle"], [1047, 0.4, 0.5, "sine"]],
        lose: [[260, 0, 0.2, "sine"], [196, 0.14, 0.23, "sine"], [130, 0.3, 0.4, "sine"]],
      };
      for (const [frequency, delay, duration, type] of notes[kind]) {
        const now = this.context.currentTime + delay;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(kind === "move" ? 0.035 : 0.065, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
      }
    } catch {
      // Browsers without Web Audio should still be able to play.
    }
  }
}