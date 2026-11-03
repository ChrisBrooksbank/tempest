import { describe, it, expect } from 'vitest';
import { bulletHits, clawHit, effectiveLane } from '../src/collision.js';

const closed = { closed: true, lanes: 8 };
const open = { closed: false, lanes: 8 };

describe('bulletHits', () => {
  it('hits same lane within depth tolerance', () => {
    expect(bulletHits(closed, { lane: 2, z: 0.5 }, { lane: 2, z: 0.55 })).toBe(true);
  });
  it('misses outside tolerance or other lane', () => {
    expect(bulletHits(closed, { lane: 2, z: 0.5 }, { lane: 2, z: 0.6 })).toBe(false);
    expect(bulletHits(closed, { lane: 2, z: 0.5 }, { lane: 3, z: 0.5 })).toBe(false);
  });
  it('flip past halfway counts as target lane', () => {
    const e = { lane: 2, z: 0.5, flip: { d: 1, t: 0.6 } };
    expect(bulletHits(closed, e, { lane: 3, z: 0.5 })).toBe(true);
    expect(bulletHits(closed, e, { lane: 2, z: 0.5 })).toBe(false);
    expect(effectiveLane(closed, { ...e, flip: { d: 1, t: 0.4 } })).toBe(2);
  });
  it('wraps on closed webs and clamps on open', () => {
    expect(effectiveLane(closed, { lane: 7, flip: { d: 1, t: 0.9 } })).toBe(0);
    expect(effectiveLane(open, { lane: 7, flip: { d: 1, t: 0.9 } })).toBe(7);
  });
});

describe('clawHit', () => {
  it('hits at rim on player lane when not flipping', () => {
    expect(clawHit({ lane: 1, z: 1 }, 1)).toBe(true);
  });
  it('does not hit when flipping, off rim, or other lane', () => {
    expect(clawHit({ lane: 1, z: 1, flip: { d: 1, t: 0.1 } }, 1)).toBe(false);
    expect(clawHit({ lane: 1, z: 0.9 }, 1)).toBe(false);
    expect(clawHit({ lane: 2, z: 1 }, 1)).toBe(false);
  });
});
