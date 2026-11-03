import { describe, it, expect } from 'vitest';
import { bestScore, tableLines } from '../src/hud.js';

describe('bestScore', () => {
  it('uses table top when higher than current score', () => {
    expect(bestScore([{ initials: 'AAA', score: 500 }], 100)).toBe(500);
  });
  it('uses current score when it beats the table', () => {
    expect(bestScore([{ initials: 'AAA', score: 500 }], 900)).toBe(900);
  });
  it('handles an empty table', () => {
    expect(bestScore([], 0)).toBe(0);
    expect(bestScore([], 42)).toBe(42);
  });
});

describe('tableLines', () => {
  it('formats ranked rows', () => {
    const lines = tableLines([
      { initials: 'ABC', score: 1200 },
      { initials: 'XYZ', score: 30 },
    ]);
    expect(lines).toEqual([' 1. ABC    1200', ' 2. XYZ      30']);
  });
  it('caps rows', () => {
    const t = Array.from({ length: 12 }, () => ({ initials: 'AAA', score: 1 }));
    expect(tableLines(t, 5)).toHaveLength(5);
  });
});
