import { describe, it, expect } from 'vitest';
import {
  repeatInterval,
  glideInterval,
  canPause,
  togglePause,
  autoPause,
  attractMove,
  padState,
  risen,
  REPEAT_START,
  REPEAT_MIN,
} from '../src/control.js';

const web = { lanes: 8, closed: true, pts: [] };
// minimal web stub for wdiff: closed ring of 8 lanes
describe('repeatInterval', () => {
  it('accelerates then clamps', () => {
    expect(repeatInterval(0)).toBe(REPEAT_START);
    expect(repeatInterval(0.3)).toBeLessThan(REPEAT_START);
    expect(repeatInterval(0.3)).toBeGreaterThan(REPEAT_MIN);
    expect(repeatInterval(10)).toBeCloseTo(REPEAT_MIN);
    expect(repeatInterval(-1)).toBe(REPEAT_START);
  });
});

describe('glideInterval', () => {
  it('is faster for far targets and never below the floor', () => {
    expect(glideInterval(8)).toBeLessThan(glideInterval(2));
    expect(glideInterval(100)).toBeGreaterThanOrEqual(0.015);
    expect(glideInterval(-3)).toBe(glideInterval(3));
  });
});

describe('pause', () => {
  it('toggles only during play', () => {
    expect(canPause('play')).toBe(true);
    expect(togglePause(false, 'play')).toBe(true);
    expect(togglePause(true, 'play')).toBe(false);
    expect(togglePause(true, 'title')).toBe(false);
  });
  it('auto-pauses only during play', () => {
    expect(autoPause(false, 'play')).toBe(true);
    expect(autoPause(false, 'title')).toBe(false);
    expect(autoPause(true, 'over')).toBe(true);
  });
});

describe('attractMove', () => {
  it('targets the most advanced enemy and fires when aligned', () => {
    const ents = [
      { lane: 2, z: 0.3 },
      { lane: 5, z: 0.8 },
    ];
    const m = attractMove(web, 5, ents, []);
    expect(m).toEqual({ target: 5, fire: true });
    expect(attractMove(web, 1, ents, []).fire).toBe(false);
  });
  it('idles with no enemies', () => {
    expect(attractMove(web, 3, [], [])).toEqual({ target: 3, fire: false });
  });
  it('dodges spikes while warping', () => {
    const spikes = [0, 0, 0, 0.5, 0, 0, 0, 0];
    expect(attractMove(web, 3, [], spikes, true).target).not.toBe(3);
    expect(attractMove(web, 1, [], spikes, true)).toEqual({ target: 1, fire: false });
  });
});

describe('padState', () => {
  const btn = (...idx) => {
    const b = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
    for (const i of idx) b[i] = { pressed: true, value: 1 };
    return b;
  };
  it('handles missing pad', () => {
    expect(padState(null)).toEqual({ l: false, r: false, fire: false, zap: false, pause: false });
  });
  it('maps stick with deadzone', () => {
    expect(padState({ axes: [-0.9], buttons: btn() }).l).toBe(true);
    expect(padState({ axes: [0.9], buttons: btn() }).r).toBe(true);
    const s = padState({ axes: [0.2], buttons: btn() });
    expect(s.l || s.r).toBe(false);
  });
  it('maps d-pad, fire, zap, pause', () => {
    expect(padState({ axes: [0], buttons: btn(14) }).l).toBe(true);
    expect(padState({ axes: [0], buttons: btn(15) }).r).toBe(true);
    expect(padState({ axes: [0], buttons: btn(14, 15) }).l).toBe(false);
    expect(padState({ axes: [0], buttons: btn(0) }).fire).toBe(true);
    expect(padState({ axes: [0], buttons: btn(3) }).zap).toBe(true);
    expect(padState({ axes: [0], buttons: btn(9) }).pause).toBe(true);
  });
  it('detects rising edges', () => {
    expect(risen(false, true)).toBe(true);
    expect(risen(true, true)).toBe(false);
  });
});
