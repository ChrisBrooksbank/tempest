import { describe, it, expect } from 'vitest';
import {
  fireChance,
  canFire,
  fireShots,
  stepShots,
  shotHitsClaw,
  bulletHitsShot,
} from '../src/shots.js';
import { spawnPlan } from '../src/difficulty.js';

const flipper = (o = {}) => ({ type: 'flipper', lane: 3, z: 0.5, flip: null, ...o });

describe('fireChance', () => {
  it('is 0 for no rate and rises with rate and dt', () => {
    expect(fireChance(0, 0.016)).toBe(0);
    expect(fireChance(0.1, 0)).toBe(0);
    expect(fireChance(0.2, 0.016)).toBeGreaterThan(fireChance(0.1, 0.016));
    expect(fireChance(0.1, 1)).toBeLessThan(1);
  });
});

describe('canFire', () => {
  it('allows climbing flippers and tankers only', () => {
    expect(canFire(flipper())).toBe(true);
    expect(canFire(flipper({ type: 'tanker' }))).toBe(true);
    expect(canFire(flipper({ type: 'spiker' }))).toBe(false);
    expect(canFire(flipper({ flip: { d: 1, t: 0.2 } }))).toBe(false);
    expect(canFire(flipper({ z: 1 }))).toBe(false);
    expect(canFire(flipper({ z: 0.02 }))).toBe(false);
  });
});

describe('fireShots', () => {
  it('fires from eligible enemies when rng is low', () => {
    const shots = fireShots([flipper({ lane: 2, z: 0.4 }), flipper({ z: 1 })], 1, 0.1, () => 0);
    expect(shots).toEqual([{ lane: 2, z: 0.4 }]);
  });
  it('fires nothing when rng is high or rate is 0', () => {
    expect(fireShots([flipper()], 0.1, 0.016, () => 0.99)).toEqual([]);
    expect(fireShots([flipper()], 0, 0.1, () => 0)).toEqual([]);
  });
  it('levels 1-2 have no enemy fire; later levels do', () => {
    expect(spawnPlan(1).enemyFire).toBe(0);
    expect(spawnPlan(2).enemyFire).toBe(0);
    expect(spawnPlan(5).enemyFire).toBeGreaterThan(0);
  });
});

describe('stepShots', () => {
  it('advances shots and reports arrivals at the rim', () => {
    const { shots, arrived } = stepShots(
      [
        { lane: 1, z: 0.2 },
        { lane: 4, z: 0.99 },
      ],
      0.1,
      1,
    );
    expect(shots).toEqual([{ lane: 1, z: 0.30000000000000004 }]);
    expect(arrived).toEqual([{ lane: 4, z: 1 }]);
  });
});

describe('collisions', () => {
  it('shotHitsClaw needs rim arrival on the same lane', () => {
    expect(shotHitsClaw({ lane: 2, z: 1 }, 2)).toBe(true);
    expect(shotHitsClaw({ lane: 2, z: 1 }, 3)).toBe(false);
    expect(shotHitsClaw({ lane: 2, z: 0.8 }, 2)).toBe(false);
  });
  it('bulletHitsShot needs same lane and proximity', () => {
    expect(bulletHitsShot({ lane: 2, z: 0.5 }, { lane: 2, z: 0.52 })).toBe(true);
    expect(bulletHitsShot({ lane: 2, z: 0.5 }, { lane: 3, z: 0.5 })).toBe(false);
    expect(bulletHitsShot({ lane: 2, z: 0.5 }, { lane: 2, z: 0.7 })).toBe(false);
  });
});
