'use client';

import { useCallback, useRef } from 'react';
import { useProgress } from '@/store/StoreProvider';

/**
 * Zvuk a vibrace.
 *
 * Tóny se generují ve Web Audio – žádné zvukové soubory. Drží to pravidlo
 * o nulových externích požadavcích a nezvětšuje to offline cache.
 */
type Cue = 'correct' | 'wrong' | 'combo' | 'record' | 'tick';

const TONES: Record<Cue, { freq: number[]; duration: number; type: OscillatorType }> = {
  correct: { freq: [660, 880], duration: 0.12, type: 'sine' },
  wrong: { freq: [180, 140], duration: 0.2, type: 'triangle' },
  combo: { freq: [660, 880, 1180], duration: 0.1, type: 'sine' },
  record: { freq: [523, 659, 784, 1047], duration: 0.14, type: 'sine' },
  tick: { freq: [440], duration: 0.05, type: 'square' },
};

const VIBRATION: Record<Cue, number | number[]> = {
  correct: 12,
  wrong: [40, 30, 40],
  combo: [10, 20, 10],
  record: [20, 40, 20, 40, 60],
  tick: 6,
};

export function useGameFeedback() {
  const { progress } = useProgress();
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (cue: Cue) => {
      if (progress.meta.soundOn) {
        try {
          // Kontext se vyrábí až při prvním doteku – prohlížeče jinak zvuk blokují.
          ctxRef.current ??= new AudioContext();
          const ctx = ctxRef.current;
          if (ctx.state === 'suspended') void ctx.resume();

          const tone = TONES[cue];
          tone.freq.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = tone.type;
            osc.frequency.value = freq;
            const start = ctx.currentTime + i * tone.duration * 0.8;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.14, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + tone.duration);
          });
        } catch {
          // Bez zvuku se dá hrát dál.
        }
      }

      if (progress.meta.hapticsOn && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(VIBRATION[cue]);
        } catch {
          // Vibrace nejsou všude.
        }
      }
    },
    [progress.meta.soundOn, progress.meta.hapticsOn],
  );

  return play;
}
