import { describe, it, expect } from 'vitest';
import { build } from '../src/web.js';
import { SHAPES } from '../src/shapes.js';
import { ENEMY_TYPES, createEnemy, enemyType, visualLane, splitLanes } from '../src/enemies.js';

const web = build(SHAPES[0]);
const plan = { speed: 0.2 };

describe('flipper', () => {
  it('is created typed, at the far end', () => {
    const e = createEnemy('flipper', { web, plan, rng: () => 0.5 });
    expect(e.type).toBe('flipper');
    expect(e.z).toBe(0);
    expect(e.lane).toBe(Math.floor(0.5 * web.lanes));
    expect(enemyType(e)).toBe(ENEMY_TYPES.flipper);
  });
  it('climbs and caps at the rim', () => {
    const e = createEnemy('flipper', { web, plan, rng: () => 0.5 });
    e.ft = 99;
    ENEMY_TYPES.flipper.update(e, 100, { web, playerLane: 0 });
    expect(e.z).toBe(1);
  });
  it('flips toward the player at the rim', () => {
    const e = createEnemy('flipper', { web, plan, rng: () => 0 });
    e.z = 1;
    e.lane = 0;
    ENEMY_TYPES.flipper.update(e, 0.2, { web, playerLane: 3 });
    expect(e.flip).not.toBeNull();
    expect(e.flip.d).toBe(1);
    ENEMY_TYPES.flipper.update(e, 0.4, { web, playerLane: 3 });
    expect(e.lane).toBe(1);
  });
  it('visualLane includes flip progress; onKill spawns nothing; scores', () => {
    expect(visualLane({ lane: 2, flip: { d: 1, t: 1 } })).toBe(3);
    expect(visualLane({ lane: 2, flip: null })).toBe(2);
    expect(ENEMY_TYPES.flipper.onKill({}, { web })).toEqual([]);
    expect(ENEMY_TYPES.flipper.score(1)).toBe(150);
  });
});

describe('tanker', () => {
  const open = build(SHAPES.find((s) => !build(s).closed));
  it('is slower than a flipper at the same plan', () => {
    const t = createEnemy('tanker', { web, plan, rng: () => 0.5 });
    const f = createEnemy('flipper', { web, plan, rng: () => 0.5 });
    expect(t.type).toBe('tanker');
    expect(t.v).toBeLessThan(f.v);
  });
  it('splits into two flippers on adjacent lanes (closed wrap)', () => {
    expect(splitLanes(web, 0).sort((a, b) => a - b)).toEqual([1, web.lanes - 1]);
    const t = createEnemy('tanker', { web, plan, rng: () => 0.5 });
    t.lane = 0;
    t.z = 0.4;
    const kids = ENEMY_TYPES.tanker.onKill(t, { web });
    expect(kids).toHaveLength(2);
    expect(kids.every((k) => k.type === 'flipper' && k.z === 0.4 && !k.flip)).toBe(true);
  });
  it('clamps at open-web edges', () => {
    expect(splitLanes(open, 0).sort()).toEqual([0, 1]);
    const last = open.lanes - 1;
    expect(splitLanes(open, last).sort((a, b) => a - b)).toEqual([last - 1, last]);
  });
});
