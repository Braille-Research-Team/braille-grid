// brailleGrid.ts
//
// Transport-agnostic controller for the 8x8 electromagnetic braille pin
// grid. Talks to the device's MicroPython REPL (whatever Transport hands
// it text in and out) and exposes a simple draw-a-shape-into-an-8x8-array
// interface.
//
// The device firmware (electromagnets.py, imported as `em` in main.py)
// exposes a function for every individual dot: em.cell{N}_dot{M}_up() /
// _down(), plus em.all_up() / em.all_down() / em.safe_state(). This class
// translates logical (row, col) grid positions into those calls -- see
// mapping.ts for the coordinate translation, and README.md for how the
// physical layout was determined.
//
// IMPORTANT: these are *latching* electromagnets. safeState() only
// disables the driver electrically -- it does NOT lower any dots. Once a
// dot is raised it mechanically stays that way until explicitly told to
// go down.

import { pixelToCellDot, GRID_ROWS, GRID_COLS, Bitmap } from './mapping';
import type { Transport } from './webSerialTransport';

const COMMAND_TIMEOUT_MS = 5000;

export class BrailleGrid {
  private queue: Promise<unknown> = Promise.resolve();
  private state: boolean[][];
  private changeListeners = new Set<(state: boolean[][]) => void>();

  constructor(private transport: Transport) {
    this.state = BrailleGrid.blankGrid();
  }

  private static blankGrid(): boolean[][] {
    return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
  }

  /** Notifies subscribers with a snapshot of the current state. */
  private emitChange(): void {
    if (this.changeListeners.size === 0) return;
    const snapshot = this.state.map((row) => [...row]);
    for (const cb of this.changeListeners) cb(snapshot);
  }

  /**
   * Subscribe to live dot-state changes. Fires with a full 8x8 snapshot
   * (not a diff) every time any dot changes, so consumers never need to
   * track state themselves -- useful for things like an external monitor
   * or overlay that just wants to mirror what's currently displayed.
   */
  onChange(cb: (state: boolean[][]) => void): void {
    this.changeListeners.add(cb);
  }

  /** Unsubscribe a callback previously passed to onChange. */
  offChange(cb: (state: boolean[][]) => void): void {
    this.changeListeners.delete(cb);
  }

  /** Returns a snapshot of the current dot state (8x8, true = raised). */
  getState(): boolean[][] {
    return this.state.map((row) => [...row]);
  }

  async connect(): Promise<void> {
    await this.transport.open();
  }

  async disconnect(): Promise<void> {
    await this.transport.close();
  }

  /**
   * Send a raw Python statement to the REPL and wait for it to finish
   * (i.e. for the `>>> ` prompt to reappear). Commands are queued so
   * only one is ever in flight at a time -- sending the next pulse
   * command before the current one's electromagnet pulse sequence
   * finishes could interfere with it, since dots share row/column lines.
   */
  private send(statement: string): Promise<string> {
    const run = (): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        let buffer = '';
        const timeout = setTimeout(() => {
          this.transport.offData(onData);
          reject(new Error(`BrailleGrid: timed out waiting for response to: ${statement}`));
        }, COMMAND_TIMEOUT_MS);

        const onData = (chunk: string) => {
          buffer += chunk;
          if (buffer.trimEnd().endsWith('>>>')) {
            clearTimeout(timeout);
            this.transport.offData(onData);
            let output = buffer;
            const echoIdx = output.indexOf(statement);
            if (echoIdx !== -1) {
              output = output.slice(echoIdx + statement.length);
            }
            resolve(output.trim());
          }
        };

        this.transport.onData(onData);
        this.transport.write(statement + '\r\n').catch(reject);
      });

    // Chain onto the queue so calls never overlap. Using .then(fn, fn)
    // means a prior failure doesn't permanently wedge later calls.
    const result = this.queue.then(run, run) as Promise<string>;
    this.queue = result.catch(() => undefined);
    return result;
  }

  /** Set a single dot up or down. */
  async setDot(row: number, col: number, up: boolean): Promise<void> {
    const { cell, dot } = pixelToCellDot(row, col);
    await this.send(`em.cell${cell}_dot${dot}_${up ? 'up' : 'down'}()`);
    this.state[row][col] = up;
    this.emitChange();
  }

  /**
   * Draw a full shape from an 8x8 array. Only dots whose state actually
   * changes since the last draw are pulsed -- faster, and gentler on the
   * electromagnets, than re-driving every dot every time.
   */
  async drawShape(bitmap: Bitmap): Promise<void> {
    if (bitmap.length !== GRID_ROWS) {
      throw new Error(`drawShape expects an ${GRID_ROWS}x${GRID_COLS} array`);
    }
    for (let row = 0; row < GRID_ROWS; row++) {
      if (bitmap[row].length !== GRID_COLS) {
        throw new Error(`drawShape expects an ${GRID_ROWS}x${GRID_COLS} array`);
      }
      for (let col = 0; col < GRID_COLS; col++) {
        const want = !!bitmap[row][col];
        if (want !== this.state[row][col]) {
          await this.setDot(row, col, want);
        }
      }
    }
  }

  /** Raise every dot. */
  async allUp(): Promise<void> {
    await this.send('em.all_up()');
    this.state = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(true));
    this.emitChange();
  }

  /** Lower every dot. */
  async allDown(): Promise<void> {
    await this.send('em.all_down()');
    this.state = BrailleGrid.blankGrid();
    this.emitChange();
  }

  /**
   * Electrically safe idle state (disables the driver, zeroes the row
   * lines). Does NOT lower any dots -- see the note at the top of this
   * file. Tracked state is left unchanged since no dots actually move.
   */
  async safeState(): Promise<void> {
    await this.send('em.safe_state()');
  }
}