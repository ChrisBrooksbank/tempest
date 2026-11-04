import { describe, it, expect } from 'vitest';
import {
  startOptions,
  startBonus,
  cycleStart,
  loadHighest,
  saveHighest,
  BONUS_PER_LEVEL,
  MAX_START,
} from '../src/skill.js';

const store = (init) => {
  const m = new Map(Object.entries(init ?? {}));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};

describe('skill select', () => {
  it('always offers level 1; odd levels unlock as highest grows', () => {
    expect(startOptions(1)).toEqual([1]);
    expect(startOptions(2)).toEqual([1]);
    expect(startOptions(3)).toEqual([1, 3]);
    expect(startOptions(8)).toEqual([1, 3, 5, 7]);
  });
  it('handles junk and caps options', () => {
    expect(startOptions(NaN)).toEqual([1]);
    expect(startOptions(-4)).toEqual([1]);
    expect(Math.max(...startOptions(500))).toBeLessThanOrEqual(MAX_START);
  });
  it('start bonus is 0 at level 1 and grows with level', () => {
    expect(startBonus(1)).toBe(0);
    expect(startBonus(3)).toBe(2 * BONUS_PER_LEVEL);
    expect(startBonus(7)).toBeGreaterThan(startBonus(5));
    expect(startBonus(undefined)).toBe(0);
  });
  it('cycleStart clamps at both ends', () => {
    const o = [1, 3, 5];
    expect(cycleStart(o, 1, -1)).toBe(1);
    expect(cycleStart(o, 1, 1)).toBe(3);
    expect(cycleStart(o, 5, 1)).toBe(5);
    expect(cycleStart(o, 99, 1)).toBe(3);
  });
  it('persists highest level only when it increases', () => {
    const s = store();
    expect(loadHighest(s)).toBe(1);
    expect(saveHighest(5, s)).toBe(5);
    expect(saveHighest(3, s)).toBe(5);
    expect(loadHighest(s)).toBe(5);
  });
  it('survives corrupt or throwing storage', () => {
    expect(loadHighest(store({ 'tempest.highestLevel': 'abc' }))).toBe(1);
    const bad = {
      getItem() {
        throw new Error('x');
      },
      setItem() {
        throw new Error('x');
      },
    };
    expect(loadHighest(bad)).toBe(1);
    expect(saveHighest(4, bad)).toBe(1);
    expect(loadHighest(null)).toBe(1);
  });
});
