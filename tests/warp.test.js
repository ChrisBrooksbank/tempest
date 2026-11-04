import { describe, it, expect } from 'vitest';
import { stepWarp, warpHit, warpDone, diveBonus, WARP_TIME, DIVE_BONUS } from '../src/warp.js';

describe('warp dive', () => {
  it('descends from the rim to the centre and clamps', () => {
    expect(stepWarp(1, WARP_TIME / 2)).toBeCloseTo(0.5);
    expect(stepWarp(0.1, 100)).toBe(0);
    expect(stepWarp(1, -5)).toBe(1);
    expect(warpDone(stepWarp(1, WARP_TIME))).toBe(true);
    expect(warpDone(0.5)).toBe(false);
  });
  it('a spike on the claw lane kills once the claw reaches its tip', () => {
    const spikes = [0, 0.6, 0];
    expect(warpHit(spikes, 1, 1)).toBe(false);
    expect(warpHit(spikes, 1, 0.61)).toBe(false);
    expect(warpHit(spikes, 1, 0.6)).toBe(true);
    expect(warpHit(spikes, 1, 0.1)).toBe(true);
  });
  it('clean lanes and out-of-range lanes are safe', () => {
    const spikes = [0, 0.9];
    expect(warpHit(spikes, 0, 0)).toBe(false);
    expect(warpHit(spikes, 7, 0)).toBe(false);
  });
  it('dive bonus is flat', () => {
    expect(diveBonus(1)).toBe(DIVE_BONUS);
    expect(diveBonus(30)).toBe(DIVE_BONUS);
  });
});
