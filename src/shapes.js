// Web shape definitions and per-level colour palette.
export const COLORS = ['#3b6bff', '#18d6e0', '#3dff7a', '#b266ff', '#ff9a2e', '#8aff3d'];

const ring = (n, f) => Array.from({ length: n }, (_, i) => f((i * Math.PI * 2) / n));

export const SHAPES = [
  {
    closed: true,
    sub: 1,
    corners: Array.from({ length: 16 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI * 2) / 16;
      return [Math.cos(a), Math.sin(a)];
    }),
  },
  {
    closed: true,
    sub: 4,
    corners: [
      [-1, 1],
      [-1, -1],
      [1, -1],
      [1, 1],
    ],
  },
  {
    closed: true,
    sub: 1,
    corners: [
      [-0.5, 1.5],
      [-0.5, 0.5],
      [-1.5, 0.5],
      [-1.5, -0.5],
      [-0.5, -0.5],
      [-0.5, -1.5],
      [0.5, -1.5],
      [0.5, -0.5],
      [1.5, -0.5],
      [1.5, 0.5],
      [0.5, 0.5],
      [0.5, 1.5],
    ],
  },
  {
    closed: false,
    sub: 14,
    corners: [
      [-1, 0.85],
      [1, 0.85],
    ],
  },
  {
    closed: false,
    sub: 7,
    corners: [
      [-1, -0.55],
      [0, 0.85],
      [1, -0.55],
    ],
  },
  {
    // 5-point star: alternating outer/inner radii.
    closed: true,
    sub: 2,
    corners: Array.from({ length: 10 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 0.45 : 1;
      return [r * Math.cos(a), r * Math.sin(a)];
    }),
  },
  {
    // Heart: classic parametric curve, centred vertically.
    closed: true,
    sub: 1,
    corners: ring(24, (t) => [
      16 * Math.sin(t) ** 3,
      13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 6,
    ]),
  },
  {
    // Figure-eight: two lobes pinched at a waist (never self-touching).
    closed: true,
    sub: 1,
    corners: ring(24, (t) => [Math.cos(t), 0.6 * Math.sin(t) * (0.35 + 0.65 * Math.cos(t) ** 2)]),
  },
  {
    // Steps: open staircase rising left to right.
    closed: false,
    sub: 2,
    corners: [
      [-1, -0.6],
      [-0.5, -0.6],
      [-0.5, -0.2],
      [0, -0.2],
      [0, 0.2],
      [0.5, 0.2],
      [0.5, 0.6],
      [1, 0.6],
    ],
  },
];
