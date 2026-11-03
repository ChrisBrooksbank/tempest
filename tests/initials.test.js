import { describe, it, expect } from 'vitest';
import {
  createEntry,
  moveCursor,
  setCursor,
  cycleLetter,
  typeLetter,
  backspace,
  initialsOf,
} from '../src/initials.js';

describe('initials entry', () => {
  it('starts as AAA at slot 0', () => {
    const e = createEntry();
    expect(initialsOf(e)).toBe('AAA');
    expect(e.pos).toBe(0);
  });
  it('cycles letters with wrap in both directions', () => {
    expect(initialsOf(cycleLetter(createEntry(), 1))).toBe('BAA');
    expect(initialsOf(cycleLetter(createEntry(), -1))).toBe('ZAA');
    let e = setCursor(createEntry(), 1);
    e = cycleLetter(cycleLetter(e, -1), 1);
    expect(initialsOf(e)).toBe('AAA');
  });
  it('clamps the cursor', () => {
    expect(moveCursor(createEntry(), -1).pos).toBe(0);
    expect(moveCursor(setCursor(createEntry(), 2), 1).pos).toBe(2);
    expect(setCursor(createEntry(), NaN).pos).toBe(0);
  });
  it('types letters, uppercases, advances, ignores others', () => {
    let e = typeLetter(createEntry(), 'x');
    e = typeLetter(e, 'Y');
    e = typeLetter(e, '5');
    expect(initialsOf(e)).toBe('XYA');
    expect(e.pos).toBe(2);
    e = typeLetter(e, 'z');
    expect(initialsOf(e)).toBe('XYZ');
    expect(e.pos).toBe(2);
  });
  it('backspace moves back without going below 0 and does not mutate', () => {
    const e0 = setCursor(createEntry(), 2);
    expect(backspace(e0).pos).toBe(1);
    expect(backspace(createEntry()).pos).toBe(0);
    expect(e0.pos).toBe(2);
  });
});
