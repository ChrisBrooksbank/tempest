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
    expect(superzap([], 1)).toEqual({ points: 0, killed: 0 });
  });
});
