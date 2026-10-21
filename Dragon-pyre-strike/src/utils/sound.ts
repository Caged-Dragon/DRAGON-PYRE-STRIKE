// Tiny WebAudio SFX synthesizer — no external audio assets, so nothing to
// license and nothing to download. Respects the user's sound preference
// (Section 17 sound toggle) by reading the same "dracopyre:sound" key the
// useSoundPreference hook writes to.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

function isSoundEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem('dracopyre:sound')
    return raw === null ? true : JSON.parse(raw) === true
  } catch {
    return true
  }
}

export function playTone(frequency: number, durationMs = 120, type: OscillatorType = 'square', volume = 0.05) {
  if (!isSoundEnabled()) return
  const audioCtx = getCtx()
  if (!audioCtx) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    const now = audioCtx.currentTime
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(now)
    osc.stop(now + durationMs / 1000)
  } catch {
    /* audio unavailable — silently skip */
  }
}

export const sfx = {
  blip: () => playTone(440, 60, 'square', 0.04),
  eat: () => playTone(660, 90, 'square', 0.05),
  score: () => playTone(880, 100, 'triangle', 0.05),
  hit: () => playTone(160, 180, 'sawtooth', 0.06),
  flip: () => playTone(320, 50, 'sine', 0.04),
  select: () => playTone(500, 50, 'sine', 0.03),
  gameOver: () => {
    playTone(220, 160, 'sawtooth', 0.06)
    setTimeout(() => playTone(140, 240, 'sawtooth', 0.06), 140)
  },
  win: () => {
    playTone(523, 90, 'triangle', 0.05)
    setTimeout(() => playTone(659, 90, 'triangle', 0.05), 100)
    setTimeout(() => playTone(784, 160, 'triangle', 0.05), 200)
  },
}
