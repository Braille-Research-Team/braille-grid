// index.ts
//
// Public entry point for this package. Consumers import from here --
// e.g. `import { useBrailleGrid, circleOutline } from 'braille-grid'` --
// rather than reaching into individual files directly. This file is the
// contract: anything exported here is the supported public API; anything
// not re-exported here is considered internal and free to change.

export { BrailleGrid } from './brailleGrid';
export { WebSerialTransport } from './webSerialTransport';
export type { Transport } from './webSerialTransport';
export { WebHidGrid } from './webHidGrid';
export type { GridDevice } from './gridDevice';
export { useBrailleGrid } from './useBrailleGrid';
export type { BrailleGridConnectionState, UseBrailleGridResult } from './useBrailleGrid';
export { pixelToCellDot, cellDotToPixel, bitmapToCellBytes, GRID_ROWS, GRID_COLS } from './mapping';
export type { CellDot, PixelPosition, Bitmap } from './mapping';
export { squareOutline, circleOutline, triangleOutline } from './shapes';