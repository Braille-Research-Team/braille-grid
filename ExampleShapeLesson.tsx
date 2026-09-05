// ExampleShapeLesson.tsx

'use client';

import { useBrailleGrid } from './useBrailleGrid';
import type { Bitmap } from './mapping';

function exampleCircleOutline(): Bitmap {
  const grid: boolean[][] = Array.from({ length: 8 }, () => Array(8).fill(false));
  const center = 3.5;
  const radius = 3.5;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const dist = Math.sqrt((col - center) ** 2 + (row - center) ** 2);
      if (Math.abs(dist - radius) <= 0.9) grid[row][col] = true;
    }
  }
  return grid;
}

export function ExampleShapeLesson() {
  const { state, error, connect, drawShape, clear } = useBrailleGrid();

  if (state === 'unsupported') {
    return (
      <p role="alert">
        This activity needs a browser with Web Serial support (Chrome, Edge, or
        Firefox 151+). Safari doesn&apos;t support connecting to hardware like
        this yet.
      </p>
    );
  }

  return (
    <div>
      {state !== 'connected' ? (
        <button onClick={connect} disabled={state === 'connecting'}>
          {state === 'connecting' ? 'Connecting…' : 'Connect grid device'}
        </button>
      ) : (
        <>
          <button onClick={() => drawShape(exampleCircleOutline())}>Show example shape</button>
          <button onClick={() => clear()}>Clear</button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}