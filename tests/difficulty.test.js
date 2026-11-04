import { describe, it, expect } from 'vitest';
import { spawnPlan, pickType } from '../src/difficulty.js';
import { LEVEL_TABLE, levelRow, unlockLevel } from '../src/leveltable.js';

describe('spawnPlan', () => {
  it('level 1 matches legacy values and is flipper-only', () => {
    const p = spawnPlan(1);
    expect(p.count).toBe(9);
    expect(p.interval).toBeCloseTo(1.32);
    expect(p.maxAlive).toBe(5);
    expect(p.speed).toBeCloseTo(0.175);
    expect(p.mix).toEqual({ flipper: 1, tanker: 0, spiker: 0, pulsar: 0 });
    expect(p.enemyFire).toBe(0);
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
    expect(p).toEqual(spawnPlan(LEVEL_TABLE.length));
  });
  it('levels 1-2 are flipper-only with no enemy fire', () => {
    for (const n of [1, 2]) {
      const p = spawnPlan(n);
      expect(p.mix.flipper).toBe(1);
      expect(p.enemyFire).toBe(0);
    }
  });
  it('handles junk levels', () => {
    expect(spawnPlan(0)).toEqual(spawnPlan(1));
    expect(spawnPlan(NaN)).toEqual(spawnPlan(1));
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

describe('leveltable', () => {
  it('looks up rows and holds the last row past the end', () => {
    expect(levelRow(1)).toBe(LEVEL_TABLE[0]);
    expect(levelRow(999)).toBe(LEVEL_TABLE[LEVEL_TABLE.length - 1]);
  });
  it('rows never get easier', () => {
    for (let i = 1; i < LEVEL_TABLE.length; i++) {
      const a = LEVEL_TABLE[i - 1],
        b = LEVEL_TABLE[i];
      expect(b.count).toBeGreaterThanOrEqual(a.count);
      expect(b.speed).toBeGreaterThanOrEqual(a.speed);
      expect(b.interval).toBeLessThanOrEqual(a.interval);
      expect(b.maxAlive).toBeGreaterThanOrEqual(a.maxAlive);
      expect(b.enemyFire).toBeGreaterThanOrEqual(a.enemyFire);
      expect(b.unlocks.length).toBeGreaterThanOrEqual(a.unlocks.length);
    }
  });
  it('reports unlock levels', () => {
    expect(unlockLevel('flipper')).toBe(1);
    expect(unlockLevel('tanker')).toBe(3);
    expect(unlockLevel('bogus')).toBe(Infinity);
  });
});
