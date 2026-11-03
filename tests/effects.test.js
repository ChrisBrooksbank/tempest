import { describe, it, expect } from 'vitest';
import {
  MAX_PARTICLES,
  SHAKE_DURATION,
  SHAKE_MAX,
  burstSpec,
  capParticles,
  shakeAmplitude,
  flashPeak,
} from '../src/effects.js';

describe('effects', () => {
  it('tunes bursts per event; death is biggest', () => {
    expect(burstSpec('death').n).toBeGreaterThan(burstSpec('kill').n);
    expect(burstSpec('unknown')).toEqual(burstSpec('kill'));
  });
  it('halves bursts under reduced motion', () => {
    expect(burstSpec('death', true).n).toBe(20);
    expect(burstSpec('spike', true).n).toBe(3);
  });
  it('caps particles, dropping the oldest', () => {
    const list = Array.from({ length: MAX_PARTICLES }, (_, i) => i);
    const out = capParticles(list, [-1, -2]);
    expect(out).toHaveLength(MAX_PARTICLES);
    expect(out.slice(-2)).toEqual([-1, -2]);
    expect(out[0]).toBe(2);
  });
  it('does not alter lists under the cap', () => {
    expect(capParticles([1], [2, 3], 5)).toEqual([1, 2, 3]);
  });
  it('shake decays to zero and is off when reduced', () => {
    expect(shakeAmplitude(0)).toBe(SHAKE_MAX);
    expect(shakeAmplitude(SHAKE_DURATION / 2)).toBeCloseTo(SHAKE_MAX / 2);
    expect(shakeAmplitude(SHAKE_DURATION)).toBe(0);
    expect(shakeAmplitude(-1)).toBe(0);
    expect(shakeAmplitude(0, true)).toBe(0);
  });
  it('dims flash under reduced motion', () => {
    expect(flashPeak(true)).toBeLessThan(flashPeak(false));
  });
});
