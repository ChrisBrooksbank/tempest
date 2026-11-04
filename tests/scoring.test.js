import { describe, it, expect } from 'vitest';
import { pointsFor, extraLivesEarned } from '../src/scoring.js';

describe('pointsFor', () => {
  it('level 1 flipper keeps the original 150', () => {
    expect(pointsFor('flipper', 1)).toBe(150);
  });
  it('defaults and unknown types fall back to flipper', () => {
    expect(pointsFor()).toBe(150);
    expect(pointsFor('bogus', 1)).toBe(150);
  });
  it('does not scale with level', () => {
    expect(pointsFor('flipper', 9)).toBe(pointsFor('flipper', 1));
  });
  it('differs per type', () => {
    expect(pointsFor('tanker')).not.toBe(pointsFor('flipper'));
  });
});

describe('extraLivesEarned', () => {
  it('awards none below threshold', () => {
    expect(extraLivesEarned(0, 19999)).toBe(0);
  });
  it('awards one on crossing', () => {
    expect(extraLivesEarned(19900, 20050)).toBe(1);
  });
  it('awards multiple on a big jump', () => {
    expect(extraLivesEarned(0, 40000)).toBe(2);
  });
  it('never negative', () => {
    expect(extraLivesEarned(30000, 10000)).toBe(0);
  });
});
