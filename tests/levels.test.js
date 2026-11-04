import { describe, it, expect } from 'vitest';
import { levelConfig } from '../src/levels.js';
import { COLORS, SHAPES } from '../src/shapes.js';

describe('levelConfig', () => {
  it('maps level 1 to the first shape and colour, loop 0', () => {
    expect(levelConfig(1)).toEqual({ shapeIndex: 0, color: COLORS[0], loop: 0 });
  });
  it('cycles shapes and increments loop past the last shape', () => {
    const n = SHAPES.length;
    expect(levelConfig(n).shapeIndex).toBe(n - 1);
    expect(levelConfig(n).loop).toBe(0);
    expect(levelConfig(n + 1)).toMatchObject({ shapeIndex: 0, loop: 1 });
    expect(levelConfig(2 * n + 1).loop).toBe(2);
  });
  it('keeps one colour per lap and changes it on the next lap', () => {
    const n = SHAPES.length;
    for (let l = 1; l <= n; l++) expect(levelConfig(l).color).toBe(COLORS[0]);
    expect(levelConfig(n + 1).color).toBe(COLORS[1]);
    expect(levelConfig(n * COLORS.length + 1).color).toBe(COLORS[0]);
  });
  it('clamps invalid levels to level 1', () => {
    expect(levelConfig(0)).toEqual(levelConfig(1));
    expect(levelConfig(-3)).toEqual(levelConfig(1));
  });
});
