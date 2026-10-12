// gridDevice.ts -- what the React hook needs from any grid backend.
import type { Bitmap } from './mapping';

export interface GridDevice {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  drawShape(bitmap: Bitmap): Promise<void>;
  allDown(): Promise<void>;
  allUp(): Promise<void>;
  /** Live dot-state mirroring (used by the overlay bridge). */
  onChange(cb: (state: boolean[][]) => void): void;
  offChange(cb: (state: boolean[][]) => void): void;
  getState(): boolean[][];
}