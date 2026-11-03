import { describe, it, expect } from 'vitest';
import {
  insertScore,
  qualifies,
  sanitizeInitials,
  load,
  save,
  STORAGE_KEY,
} from '../src/highscores.js';

const mem = (init) => {
  const d = { ...init };
  return {
    getItem: (k) => (k in d ? d[k] : null),
    setItem: (k, v) => {
      d[k] = String(v);
    },
  };
};
const throwing = {
  getItem() {
    throw new Error('denied');
  },
  setItem() {
    throw new Error('denied');
  },
};

describe('sanitizeInitials', () => {
  it('uppercases, strips, trims to 3, pads', () => {
    expect(sanitizeInitials('ab')).toBe('ABA');
    expect(sanitizeInitials('x!y-zq')).toBe('XYZ');
    expect(sanitizeInitials(null)).toBe('AAA');
  });
});

describe('insertScore', () => {
  it('sorts descending and does not mutate', () => {
    const t = [{ initials: 'AAA', score: 100 }];
    const r = insertScore(t, { initials: 'BBB', score: 200 });
    expect(r.map((x) => x.score)).toEqual([200, 100]);
    expect(t).toHaveLength(1);
  });
  it('is stable for ties (older first)', () => {
    const t = [{ initials: 'OLD', score: 100 }];
    const r = insertScore(t, { initials: 'NEW', score: 100 });
    expect(r.map((x) => x.initials)).toEqual(['OLD', 'NEW']);
  });
  it('trims to max', () => {
    let t = [];
    for (let i = 1; i <= 12; i++) t = insertScore(t, { initials: 'AAA', score: i * 10 });
    expect(t).toHaveLength(10);
    expect(t[0].score).toBe(120);
    expect(t[9].score).toBe(30);
  });
});

describe('qualifies', () => {
  it('rejects zero, accepts when table not full', () => {
    expect(qualifies([], 0)).toBe(false);
    expect(qualifies([], 10)).toBe(true);
  });
  it('requires beating the lowest when full', () => {
    const t = Array.from({ length: 10 }, (_, i) => ({ initials: 'AAA', score: 100 - i }));
    expect(qualifies(t, 92)).toBe(true);
    expect(qualifies(t, 91)).toBe(false);
  });
});

describe('load/save', () => {
  it('round-trips', () => {
    const s = mem();
    expect(save([{ initials: 'ABC', score: 5 }], s)).toBe(true);
    expect(load(s)).toEqual([{ initials: 'ABC', score: 5 }]);
  });
  it('survives corrupt JSON and wrong shapes', () => {
    expect(load(mem({ [STORAGE_KEY]: '{nope' }))).toEqual([]);
    expect(load(mem({ [STORAGE_KEY]: '{"a":1}' }))).toEqual([]);
  });
  it('drops invalid rows and sorts', () => {
    const raw = JSON.stringify([
      null,
      { score: 'x' },
      { initials: 'a', score: 5 },
      { initials: 'b', score: 9 },
    ]);
    expect(load(mem({ [STORAGE_KEY]: raw })).map((r) => r.score)).toEqual([9, 5]);
  });
  it('never throws with a failing or missing storage', () => {
    expect(load(throwing)).toEqual([]);
    expect(save([], throwing)).toBe(false);
    expect(load(null)).toEqual([]);
    expect(save([], null)).toBe(false);
  });
});
