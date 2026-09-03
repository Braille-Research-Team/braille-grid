export interface CellDot {
    cell: number;
    dot: number;
}
export interface PixelPosition {
    row: number;
    col: number;
}
export declare const GRID_ROWS = 8;
export declare const GRID_COLS = 8;
/**
 * Convert a pixel position in the logical 8x8 grid to the device's
 * (cell, dot) numbering.
 */
export declare function pixelToCellDot(row: number, col: number): CellDot;
/**
 * Inverse of pixelToCellDot: given a device (cell, dot), return the
 * logical pixel position. Useful for tests/debugging.
 */
export declare function cellDotToPixel(cell: number, dot: number): PixelPosition;
/** An 8x8 grid of truthy/falsy values; truthy = dot raised. */
export type Bitmap = ReadonlyArray<ReadonlyArray<boolean | 0 | 1>>;
