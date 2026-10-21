import { useCallback, useEffect, useRef } from "react";

function playTone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  wave: OscillatorType,
  endFrequency = frequency
) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency !== frequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      endFrequency,
      start + duration * 0.75
    );
  }

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function useGameSounds(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!enabled || typeof window === "undefined" || !window.AudioContext) {
      return null;
    }

    let context = contextRef.current;
    if (!context || context.state === "closed") {
      context = new window.AudioContext();
      contextRef.current = context;
    }

    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }
    return context;
  }, [enabled]);

  const playCorrect = useCallback(() => {
    const context = getContext();
    if (!context) return;

    // A soft ascending three-note chime gives correct entries a clear positive cue.
    const now = context.currentTime;
    playTone(context, 587.33, now, 0.3, 0.045, "sine");
    playTone(context, 783.99, now + 0.075, 0.34, 0.034, "triangle");
    playTone(context, 1174.66, now + 0.15, 0.3, 0.018, "sine");
  }, [getContext]);

  const playWrong = useCallback(() => {
    const context = getContext();
    if (!context) return;

    // A short, muted descending double tone stays distinct without being harsh.
    const now = context.currentTime;
    playTone(context, 220, now, 0.22, 0.045, "triangle", 165);
    playTone(context, 174.61, now + 0.075, 0.24, 0.028, "sine", 130.81);
  }, [getContext]);

  useEffect(
    () => () => {
      const context = contextRef.current;
      if (context && context.state !== "closed") {
        void context.close();
      }
    },
    []
  );

  return { playCorrect, playWrong };
}

export type GameSoundCallbacks = ReturnType<typeof useGameSounds>;