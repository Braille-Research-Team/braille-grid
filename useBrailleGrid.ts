// useBrailleGrid.ts
//
// React hook for using the 8x8 braille grid device inside a Next.js/React
// component. Handles the Web Serial connection lifecycle and exposes
// drawShape() so a lesson component can be as simple as:
//
//   const { state, connect, drawShape } = useBrailleGrid();
//   <button onClick={connect}>Connect grid device</button>
//   <button onClick={() => drawShape(circleOutline)}>Show circle</button>

import { useCallback, useRef, useState } from 'react';
import { BrailleGrid } from './brailleGrid';
import { WebSerialTransport } from './webSerialTransport';
import type { Bitmap } from './mapping';

export type BrailleGridConnectionState =
  | 'unsupported' // browser doesn't support Web Serial at all (e.g. Safari)
  | 'disconnected'
  | 'connecting'
  | 'connected';

export interface UseBrailleGridResult {
  state: BrailleGridConnectionState;
  error: string | null;
  /** Call from a button's onClick -- must run inside a user gesture. */
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  drawShape: (bitmap: Bitmap) => Promise<void>;
  clear: () => Promise<void>;
  /**
   * Subscribe to live dot-state changes (full 8x8 snapshot each time).
   * Returns an unsubscribe function. No-op (returns a no-op unsubscribe)
   * if called before connect() succeeds.
   */
  subscribe: (cb: (state: boolean[][]) => void) => () => void;
  /** Snapshot of current dot state. Empty/all-false if not connected. */
  getState: () => boolean[][];
}

export function useBrailleGrid(): UseBrailleGridResult {
  const gridRef = useRef<BrailleGrid | null>(null);
  const [state, setState] = useState<BrailleGridConnectionState>(() =>
    WebSerialTransport.isSupported() ? 'disconnected' : 'unsupported'
  );
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!WebSerialTransport.isSupported()) {
      setState('unsupported');
      return;
    }
    setState('connecting');
    setError(null);
    try {
      const transport = new WebSerialTransport();
      await transport.requestPort(); // shows the browser's device picker
      const grid = new BrailleGrid(transport);
      await grid.connect();
      await grid.safeState();
      await grid.allDown(); // start every lesson from a known, blank grid
      gridRef.current = grid;
      setState('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('disconnected');
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (gridRef.current) {
      await gridRef.current.disconnect();
      gridRef.current = null;
    }
    setState((prev) => (prev === 'unsupported' ? prev : 'disconnected'));
  }, []);

  const drawShape = useCallback(async (bitmap: Bitmap) => {
    if (!gridRef.current) {
      throw new Error('Braille grid is not connected yet.');
    }
    await gridRef.current.drawShape(bitmap);
  }, []);

  const clear = useCallback(async () => {
    if (!gridRef.current) {
      throw new Error('Braille grid is not connected yet.');
    }
    await gridRef.current.allDown();
  }, []);

  const subscribe = useCallback((cb: (state: boolean[][]) => void) => {
    const grid = gridRef.current;
    if (!grid) return () => {};
    grid.onChange(cb);
    return () => grid.offChange(cb);
  }, []);

  const getState = useCallback(() => {
    return gridRef.current?.getState() ?? [];
  }, []);

  return { state, error, connect, disconnect, drawShape, clear, subscribe, getState };
}