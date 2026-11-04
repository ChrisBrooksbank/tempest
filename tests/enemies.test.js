import { describe, it, expect } from 'vitest';
import { build } from '../src/web.js';
import { SHAPES } from '../src/shapes.js';
import { bulletHits } from '../src/collision.js';
import { spawnPlan } from '../src/difficulty.js';
import {
  newSpikes,
  growSpike,
  shootSpike,
  spikeHit,
  isPulsing,
  pulseHit,
  PULSE_PERIOD,
  PULSE_ON,
  SPIKE_SHOT,
  ENEMY_TYPES,
  createEnemy,
  enemyType,
  visualLane,
  splitLanes,
  fuseballPoints,
} from '../src/enemies.js';

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

describe('spiker and spikes', () => {
  it('climbs to its target laying a spike, then retreats and is removed', () => {
    const spikes = newSpikes(web);
    const e = createEnemy('spiker', { web, plan, rng: () => 0.5 });
    expect(e.type).toBe('spiker');
    for (let i = 0; i < 200 && !e.retreat; i++) ENEMY_TYPES.spiker.update(e, 0.1, { web, spikes });
    expect(e.retreat).toBe(true);
    expect(e.z).toBeCloseTo(e.target);
    expect(spikes[e.lane]).toBeCloseTo(e.target);
    for (let i = 0; i < 200 && !e.gone; i++) ENEMY_TYPES.spiker.update(e, 0.1, { web, spikes });
    expect(e.gone).toBe(true);
    expect(spikes[e.lane]).toBeCloseTo(e.target); // spike stays
  });
  it('growSpike only lengthens', () => {
    const s = newSpikes(web);
    growSpike(s, 2, 0.6);
    growSpike(s, 2, 0.3);
    expect(s[2]).toBe(0.6);
  });
  it('shots shorten spikes, absorb only when reaching the tip, and clear short ones', () => {
    const s = newSpikes(web);
    s[1] = 0.5;
    expect(shootSpike(s, 1, 0.7)).toBe(false);
    expect(s[1]).toBe(0.5);
    expect(shootSpike(s, 1, 0.4)).toBe(true);
    expect(s[1]).toBeCloseTo(0.5 - SPIKE_SHOT);
    s[1] = 0.1;
    expect(shootSpike(s, 1, 0.05)).toBe(true);
    expect(s[1]).toBe(0);
    expect(shootSpike(s, 1, 0.05)).toBe(false);
  });
  it('long spikes hurt a player on that lane only', () => {
    const s = newSpikes(web);
    s[3] = 0.9;
    s[4] = 0.5;
    expect(spikeHit(s, 3)).toBe(true);
    expect(spikeHit(s, 4)).toBe(false);
    expect(spikeHit(s, 5)).toBe(false);
  });
  it('scores 50 at level 1', () => {
    expect(ENEMY_TYPES.spiker.score(1)).toBe(50);
  });
});

describe('pulsar', () => {
  const web = build(SHAPES[0]);
  const plan = { speed: 0.3 };
  it('creates a pulsar and electrifies only during the pulse window', () => {
    const e = createEnemy('pulsar', { web, plan, rng: () => 0.5 });
    expect(e.type).toBe('pulsar');
    e.pt = 0;
    expect(isPulsing(e)).toBe(false);
    e.pt = PULSE_PERIOD - PULSE_ON + 0.01;
    expect(isPulsing(e)).toBe(true);
  });
  it('shocks the player on its lane at any depth unless mid-flip', () => {
    const e = createEnemy('pulsar', { web, plan, rng: () => 0.5 });
    e.pt = PULSE_PERIOD - 0.1;
    e.z = 0.2;
    expect(pulseHit(e, e.lane)).toBe(true);
    expect(pulseHit(e, e.lane + 1)).toBe(false);
    e.flip = { d: 1, t: 0.1 };
    expect(pulseHit(e, e.lane)).toBe(false);
  });
  it('pulse timer wraps and flipper never pulses', () => {
    const e = createEnemy('pulsar', { web, plan, rng: () => 0.5 });
    for (let i = 0; i < 100; i++) ENEMY_TYPES.pulsar.update(e, 0.1, { web, playerLane: 0 });
    expect(e.pt).toBeLessThan(PULSE_PERIOD);
    expect(isPulsing({ type: 'flipper', pt: 99 })).toBe(false);
  });
});

describe('fuseball', () => {
  const upd = (e, dt, ctx = {}) =>
    ENEMY_TYPES.fuseball.update(e, dt, { web, playerLane: 0, ...ctx });
  it('is created on a lane at depth 0 and shootable', () => {
    const e = createEnemy('fuseball', { web, plan, rng: () => 0.5 });
    expect(e.type).toBe('fuseball');
    expect(e.z).toBe(0);
    expect(e.onLane).toBe(true);
    expect(bulletHits(web, e, { lane: e.lane, z: 0 })).toBe(true);
  });
  it('alternates between lane and edge while climbing, and is unshootable on an edge', () => {
    const e = createEnemy('fuseball', { web, plan, rng: () => 0.5 });
    e.ht = 0;
    upd(e, 0.01, { rng: () => 0.5 });
    expect(e.onLane).toBe(false);
    expect(bulletHits(web, e, { lane: e.lane, z: e.z })).toBe(false);
    e.ht = 0;
    upd(e, 0.01, { rng: () => 0.9 });
    expect(e.onLane).toBe(true);
  });
  it('moves toward the player along the rim', () => {
    const e = createEnemy('fuseball', { web, plan, rng: () => 0.5 });
    e.z = 1;
    e.lane = 5;
    e.onLane = false;
    e.ht = 0;
    upd(e, 0.01, { playerLane: 2 });
    expect(e.onLane).toBe(true);
    expect(e.lane).toBe(4);
  });
  it('scores 250/500/750 by depth', () => {
    expect(fuseballPoints(0.1)).toBe(250);
    expect(fuseballPoints(0.5)).toBe(500);
    expect(fuseballPoints(0.9)).toBe(750);
    expect(ENEMY_TYPES.fuseball.score(1, { z: 1 })).toBe(750);
  });
  it('unlocks at level 9 in the mix', () => {
    expect(spawnPlan(8).mix.fuseball).toBe(0);
    expect(spawnPlan(9).mix.fuseball).toBeGreaterThan(0);
  });
});
