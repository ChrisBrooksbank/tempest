// Web shape definitions and per-level colour palette.
export const COLORS = ['#3b6bff', '#18d6e0', '#3dff7a', '#b266ff', '#ff9a2e', '#8aff3d'];

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
];
