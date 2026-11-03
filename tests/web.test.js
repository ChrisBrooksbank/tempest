import { describe, it, expect } from 'vitest';
import { build, step, wdiff, dirTo, startLane } from '../src/web.js';

const circle = build({
  closed: true,
  sub: 1,
  corners: Array.from({ length: 16 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI * 2) / 16;
    return [Math.cos(a), Math.sin(a)];
  }),
});
const square = build({
  closed: true,
  sub: 4,
  corners: [
    [-1, 1],
    [-1, -1],
    [1, -1],
    [1, 1],
  ],
});
const flat = build({
  closed: false,
  sub: 14,
  corners: [
    [-1, 0.85],
    [1, 0.85],
  ],
});
const vee = build({
  closed: false,
  sub: 7,
  corners: [
    [-1, -0.55],
    [0, 0.85],
    [1, -0.55],
  ],
});

describe('build', () => {
  it('counts lanes per shape', () => {
    expect(circle.lanes).toBe(16);
    expect(square.lanes).toBe(16);
    expect(flat.lanes).toBe(14);
    expect(vee.lanes).toBe(14);
  });
  it('has one more point than lanes when open, equal when closed', () => {
    expect(flat.pts.length).toBe(flat.lanes + 1);
    expect(circle.pts.length).toBe(circle.lanes);
  });
  it('normalises coordinates to |c| <= 1', () => {
    for (const w of [circle, square, flat, vee])
      expect(Math.max(...w.pts.flat().map(Math.abs))).toBeCloseTo(1);
  });
});

describe('step', () => {
  it('wraps on closed webs', () => {
    expect(step(circle, 15, 1)).toBe(0);
    expect(step(circle, 0, -1)).toBe(15);
    expect(step(circle, 3, -40)).toBe(3 - 40 + 48);
  });
  it('clamps on open webs at both edges', () => {
    expect(step(flat, 13, 1)).toBe(13);
    expect(step(flat, 0, -1)).toBe(0);
    expect(step(flat, 5, 1)).toBe(6);
  });
});

describe('wdiff / dirTo', () => {
  it('takes the shortest path on closed webs', () => {
    expect(wdiff(circle, 0, 15)).toBe(-1);
    expect(wdiff(circle, 15, 0)).toBe(1);
    expect(wdiff(circle, 2, 6)).toBe(4);
    expect(wdiff(circle, 0, 8)).toBe(8);
  });
  it('is direct on open webs', () => {
    expect(wdiff(flat, 0, 13)).toBe(13);
    expect(wdiff(flat, 13, 0)).toBe(-13);
  });
  it('dirTo gives the sign, 0 when equal', () => {
    expect(dirTo(circle, 0, 15)).toBe(-1);
    expect(dirTo(flat, 2, 9)).toBe(1);
    expect(dirTo(flat, 4, 4)).toBe(0);
  });
});

describe('startLane', () => {
  it('is the centre lane on open webs', () => {
    expect(startLane(flat)).toBe(7);
  });
  it('is a top-most lane on closed webs', () => {
    const l = startLane(square);
    const y = (square.pts[l][1] + square.pts[(l + 1) % square.lanes][1]) / 2;
    expect(y).toBeCloseTo(1);
    const c = startLane(circle);
    const cy = (circle.pts[c][1] + circle.pts[(c + 1) % 16][1]) / 2;
    for (let i = 0; i < 16; i++)
      expect((circle.pts[i][1] + circle.pts[(i + 1) % 16][1]) / 2).toBeLessThanOrEqual(cy + 1e-6);
  });
});
