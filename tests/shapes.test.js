import { describe, expect, it } from 'vitest';
import { SHAPES } from '../src/shapes.js';
import { build } from '../src/web.js';

describe('shapes', () => {
  it('has at least 8 shapes', () => {
    expect(SHAPES.length).toBeGreaterThanOrEqual(8);
  });

  SHAPES.forEach((shape, i) => {
    describe(`shape ${i}`, () => {
      const web = build(shape);
      it('has no NaN points and at least 8 lanes', () => {
        expect(web.lanes).toBeGreaterThanOrEqual(8);
        for (const p of web.pts) for (const v of p) expect(Number.isFinite(v)).toBe(true);
      });
      it('is normalised to |coord| <= 1', () => {
        const m = Math.max(...web.pts.flat().map(Math.abs));
        expect(m).toBeLessThanOrEqual(1 + 1e-9);
        expect(m).toBeGreaterThan(0.99);
      });
      it('has no duplicate adjacent points', () => {
        const n = web.pts.length;
        const count = web.closed ? n : n - 1;
        for (let k = 0; k < count; k++) {
          const a = web.pts[k],
            b = web.pts[(k + 1) % n];
          expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(1e-6);
        }
      });
    });
  });
});
