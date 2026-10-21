type NoiseKind = "white" | "brown";

export class DrakeAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  ambientNodes: AudioNode[] = [];
  ambientOn = false;

  constructor() {
    const saved = localStorage.getItem("drakebreaker-mute");
    this.muted = saved === "1";
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.28;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (!this.ambientOn) this.startAmbient();
  }

  setMuted(m: boolean) {
    this.muted = m;
    localStorage.setItem("drakebreaker-mute", m ? "1" : "0");
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.28, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private envGain(duration: number, peak: number, attack = 0.008) {
    if (!this.ctx || !this.master) return null;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    g.connect(this.master);
    return g;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    peak = 0.12,
    slide?: number
  ) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.envGain(duration, peak);
    if (!g) return;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, freq * slide),
        this.ctx.currentTime + duration
      );
    }
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.02);
  }

  private noise(duration: number, peak: number, kind: NoiseKind = "white", hp = 400) {
    if (!this.ctx || !this.master) return;
    const n = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "brown") {
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      } else data[i] = w;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = this.envGain(duration, peak, 0.004);
    if (!g) return;
    src.connect(filter);
    filter.connect(g);
    src.start();
  }

  brick(kind: string) {
    const map: Record<string, number> = {
      ember: 420,
      scale: 340,
      crystal: 620,
      gold: 780,
      magma: 220,
      rune: 510,
      obsidian: 160,
      bone: 360,
      frost: 720,
      venom: 290,
    };
    const f = map[kind] ?? 400;
    this.tone(f, 0.07, "triangle", 0.09);
    this.tone(f * 0.5, 0.1, "sine", 0.05);
    this.noise(0.04, 0.04, "white", 800);
  }

  paddle() {
    this.tone(180, 0.08, "square", 0.07);
    this.tone(90, 0.12, "sine", 0.06);
  }

  wall() {
    this.tone(240, 0.05, "sine", 0.05);
  }

  explode() {
    this.noise(0.28, 0.18, "brown", 120);
    this.tone(140, 0.25, "sawtooth", 0.08, 0.3);
  }

  power() {
    this.tone(520, 0.12, "sine", 0.1, 1.6);
    this.tone(780, 0.18, "triangle", 0.07, 1.4);
  }

  lifeLost() {
    this.tone(300, 0.35, "sawtooth", 0.1, 0.4);
    this.tone(160, 0.4, "sine", 0.08, 0.5);
  }

  roar() {
    this.noise(0.55, 0.22, "brown", 80);
    this.tone(110, 0.6, "sawtooth", 0.12, 0.45);
    this.tone(70, 0.7, "sine", 0.1, 0.6);
  }

  level() {
    const notes = [392, 494, 587, 784];
    notes.forEach((n, i) => {
      setTimeout(() => this.tone(n, 0.16, "triangle", 0.09), i * 110);
    });
  }

  victory() {
    const notes = [392, 494, 587, 659, 784, 988];
    notes.forEach((n, i) => {
      setTimeout(() => {
        this.tone(n, 0.22, "triangle", 0.1);
        this.tone(n * 1.5, 0.22, "sine", 0.04);
      }, i * 140);
    });
  }

  gameOver() {
    [330, 262, 196, 130].forEach((n, i) => {
      setTimeout(() => this.tone(n, 0.32, "sawtooth", 0.08, 0.85), i * 220);
    });
  }

  laser() {
    this.tone(880, 0.06, "sawtooth", 0.05, 1.4);
    this.noise(0.05, 0.05, "white", 1200);
  }

  launch() {
    this.tone(240, 0.1, "sine", 0.08, 2);
    this.noise(0.12, 0.06, "brown", 300);
  }

  curse() {
    this.tone(320, 0.3, "sawtooth", 0.07, 0.5);
    this.tone(210, 0.35, "square", 0.04, 0.6);
  }

  boost(on: boolean) {
    if (on) this.tone(180, 0.18, "sawtooth", 0.05, 2.4);
    else this.tone(420, 0.12, "sine", 0.03, 0.5);
  }

  aimTick() {
    this.tone(900, 0.03, "sine", 0.02);
  }

  private startAmbient() {
    if (!this.ctx || !this.master || this.ambientOn) return;
    this.ambientOn = true;
    const t = this.ctx.currentTime;

    const drone = this.ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const drone2 = this.ctx.createOscillator();
    drone2.type = "triangle";
    drone2.frequency.value = 82.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 2);
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.02;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = 8;
    lfo.connect(lfoG);
    lfoG.connect(drone.frequency);
    drone.connect(g);
    drone2.connect(g2);
    g.connect(this.master);
    g2.connect(this.master);
    drone.start();
    drone2.start();
    lfo.start();
    this.ambientNodes = [drone, drone2, lfo, g, g2];
  }

  destroy() {
    this.ambientNodes.forEach((n) => {
      try {
        if ("stop" in n && typeof (n as OscillatorNode).stop === "function") {
          (n as OscillatorNode).stop();
        }
        n.disconnect();
      } catch {
        /* noop */
      }
    });
    this.ambientNodes = [];
    this.ambientOn = false;
    void this.ctx?.close();
    this.ctx = null;
  }
}
