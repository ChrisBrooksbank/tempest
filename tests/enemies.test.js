import { describe, it, expect } from 'vitest';
import { build } from '../src/web.js';
import { SHAPES } from '../src/shapes.js';
import { ENEMY_TYPES, createEnemy, enemyType, visualLane } from '../src/enemies.js';

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
