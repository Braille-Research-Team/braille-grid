// shapes.ts
//
// A couple of example 8x8 outline generators, just to demonstrate the
// "single command with an 8x8 array" workflow end to end. These are
// deliberately simple starting points, not a finished shape library --
// you'll likely want to hand-tune outlines (especially the circle) once
// you see how they actually feel on the physical grid, rather than trust
// a generic geometric formula.

import type { Bitmap } from './mapping';

function emptyGrid(): boolean[][] {
  return Array.from({ length: 8 }, () => Array(8).fill(false));
}

/** A square outline (just the border of the 8x8 grid). */
export function squareOutline(): Bitmap {
  const grid = emptyGrid();
  for (let i = 0; i < 8; i++) {
    grid[0][i] = true;
    grid[7][i] = true;
    grid[i][0] = true;
    grid[i][7] = true;
  }
  return grid;
}

/**
 * A rough circle outline, using a simple midpoint-distance check against
 * a center point and radius. Treat this as a starting point to refine by
 * eye on the real hardware -- an 8x8 grid is coarse enough that "looks
 * like a circle" is more important than mathematical precision.
 */
export function circleOutline(): Bitmap {
  const grid = emptyGrid();
  const center = 3.5;
  const radius = 3.5;
  const thickness = 0.9; // how close to the radius counts as "on the ring"

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const dx = col - center;
      const dy = row - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(dist - radius) <= thickness) {
        grid[row][col] = true;
      }
    }
  }
  return grid;
}

/** A right triangle outline, corners at top-left, bottom-left, bottom-right. */
export function triangleOutline(): Bitmap {
  const grid = emptyGrid();
  for (let i = 0; i < 8; i++) {
    grid[i][0] = true; // left edge
    grid[7][i] = true; // bottom edge
  }
  for (let row = 0; row < 8; row++) {
    const col = Math.round((row / 7) * 7);
    grid[row][col] = true; // hypotenuse, top-left to bottom-right
  }
  return grid;
}
