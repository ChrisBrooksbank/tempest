import { COLORS, SHAPES } from './shapes.js';

// Pure level -> web/colour mapping. Shapes and colours cycle independently;
// `loop` is how many full passes through the shapes have been completed
// (0 on the first pass) and feeds difficulty scaling.
export function levelConfig(level) {
  const n = Math.max(1, Math.floor(level)) - 1;
  return {
    shapeIndex: n % SHAPES.length,
    color: COLORS[n % COLORS.length],
    loop: Math.floor(n / SHAPES.length),
  };
}
