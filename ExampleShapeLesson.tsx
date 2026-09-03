// ExampleShapeLesson.tsx
//
// Minimal example of wiring this into a DotQuest lesson component.
// Not meant to be a finished component -- just shows the shape of the
// integration: connect once, then drawShape() per problem.

'use client';

import { useBrailleGrid } from './useBrailleGrid';
import { circleOutline, squareOutline, triangleOutline } from './shapes';

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
          <button onClick={() => drawShape(circleOutline())}>Show circle</button>
          <button onClick={() => drawShape(squareOutline())}>Show square</button>
          <button onClick={() => drawShape(triangleOutline())}>Show triangle</button>
          <button onClick={() => clear()}>Clear</button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
