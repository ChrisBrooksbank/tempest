import { describe, it, expect } from 'vitest';
import { canZap, superzap } from '../src/superzapper.js';
import { pointsFor } from '../src/scoring.js';

describe('superzapper', () => {
  it('requires a charge and enemies on screen', () => {
    expect(canZap(1, [{ type: 'flipper' }])).toBe(true);
    expect(canZap(0, [{ type: 'flipper' }])).toBe(false);
    expect(canZap(1, [])).toBe(false);
  });
  it('scores every enemy via scoring.js and counts kills', () => {
    const ents = [{ type: 'flipper' }, { type: 'tanker' }, { type: 'spiker' }];
    const r = superzap(ents, 4);
    expect(r.killed).toBe(3);
    expect(r.points).toBe(
      pointsFor('flipper', 4) + pointsFor('tanker', 4) + pointsFor('spiker', 4),
    );
  });
  it('returns zero for no enemies', () => {
    expect(superzap([], 1)).toMatchObject({ points: 0, killed: 0 });
  });
});

describe('superzapper second use', () => {
  const ents = [{ type: 'flipper' }, { type: 'tanker' }, { type: 'spiker' }];
  it('first use (2 charges) clears everything', () => {
    const r = superzap(ents, 1, 2);
    expect(r.killed).toBe(3);
    expect(r.survivors).toEqual([]);
  });
  it('second use (1 charge) kills exactly one chosen by rng', () => {
    const r = superzap(ents, 1, 1, () => 0.5);
    expect(r.killed).toBe(1);
    expect(r.victims).toEqual([ents[1]]);
    expect(r.survivors).toEqual([ents[0], ents[2]]);
    expect(r.points).toBe(pointsFor('tanker', 1));
  });
  it('rng near 1 stays in range', () => {
    expect(superzap(ents, 1, 1, () => 0.999).victims).toEqual([ents[2]]);
  });
  it('is spent at zero charges', () => {
    expect(canZap(0, ents)).toBe(false);
  });
});
