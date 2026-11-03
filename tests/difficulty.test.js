import { describe, it, expect } from 'vitest';
import { spawnPlan, pickType } from '../src/difficulty.js';

describe('spawnPlan', () => {
  it('level 1 matches legacy values and is flipper-only', () => {
    const p = spawnPlan(1);
    expect(p.count).toBe(9);
    expect(p.interval).toBeCloseTo(1.32);
    expect(p.maxAlive).toBe(5);
    expect(p.speed).toBeCloseTo(0.175);
    expect(p.mix).toEqual({ flipper: 1, tanker: 0, spiker: 0, pulsar: 0 });
  });
  it('scales monotonically', () => {
    for (let n = 1; n < 60; n++) {
      const a = spawnPlan(n),
        b = spawnPlan(n + 1);
      expect(b.count).toBeGreaterThanOrEqual(a.count);
      expect(b.interval).toBeLessThanOrEqual(a.interval);
      expect(b.maxAlive).toBeGreaterThanOrEqual(a.maxAlive);
      expect(b.speed).toBeGreaterThanOrEqual(a.speed);
    }
  });
  it('respects caps', () => {
    const p = spawnPlan(500);
    expect(p.count).toBe(30);
    expect(p.interval).toBe(0.5);
    expect(p.speed).toBe(0.55);
  });
  it('mix sums to 1 and unlocks by level', () => {
    for (let n = 1; n < 40; n++) {
      const sum = Object.values(spawnPlan(n).mix).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1);
    }
    expect(spawnPlan(2).mix.tanker).toBe(0);
    expect(spawnPlan(3).mix.tanker).toBeGreaterThan(0);
    expect(spawnPlan(4).mix.spiker).toBe(0);
    expect(spawnPlan(5).mix.spiker).toBeGreaterThan(0);
    expect(spawnPlan(6).mix.pulsar).toBe(0);
    expect(spawnPlan(7).mix.pulsar).toBeGreaterThan(0);
  });
});

describe('pickType', () => {
  it('only returns types with weight', () => {
    expect(pickType({ flipper: 1, tanker: 0 }, () => 0.99)).toBe('flipper');
  });
  it('selects by rng', () => {
    const mix = { flipper: 0.5, tanker: 0.5 };
    expect(pickType(mix, () => 0.1)).toBe('flipper');
    expect(pickType(mix, () => 0.9)).toBe('tanker');
  });
});
