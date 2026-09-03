"use strict";
// mapping.ts
//
// Translates a position in a logical 8x8 pixel grid (row 0-7 top-to-bottom,
// col 0-7 left-to-right, like image/array coordinates) into the device
// firmware's own (cell, dot) numbering. Pure functions, no dependencies --
// safe to use in both browser and Node code.
//
// Confirmed physical layout:
//
//   Cells (2 rows x 4 columns):        Dots within each cell (standard
//                                       8-dot braille numbering):
//     [1] [2] [3] [4]                     1  4
//     [5] [6] [7] [8]                     2  5
//                                         3  6
//                                         7  8
//
// Cell 1 = top-left, cells increase left-to-right, then wrap to the next
// row of cells.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRID_COLS = exports.GRID_ROWS = void 0;
exports.pixelToCellDot = pixelToCellDot;
exports.cellDotToPixel = cellDotToPixel;
exports.GRID_ROWS = 8;
exports.GRID_COLS = 8;
const CELL_COLS = 4;
// dotTable[rowInCell][colInCell] -> dot number (1-8)
const DOT_TABLE = [
    [1, 4],
    [2, 5],
    [3, 6],
    [7, 8],
];
/**
 * Convert a pixel position in the logical 8x8 grid to the device's
 * (cell, dot) numbering.
 */
function pixelToCellDot(row, col) {
    if (!Number.isInteger(row) || row < 0 || row >= exports.GRID_ROWS) {
        throw new RangeError(`row must be an integer 0-${exports.GRID_ROWS - 1}, got ${row}`);
    }
    if (!Number.isInteger(col) || col < 0 || col >= exports.GRID_COLS) {
        throw new RangeError(`col must be an integer 0-${exports.GRID_COLS - 1}, got ${col}`);
    }
    const cellRow = Math.floor(row / 4); // 0 or 1
    const rowInCell = row % 4; // 0-3
    const cellCol = Math.floor(col / 2); // 0-3
    const colInCell = col % 2; // 0 or 1
    const cell = cellRow * CELL_COLS + cellCol + 1; // 1-8
    const dot = DOT_TABLE[rowInCell][colInCell]; // 1-8
    return { cell, dot };
}
/**
 * Inverse of pixelToCellDot: given a device (cell, dot), return the
 * logical pixel position. Useful for tests/debugging.
 */
function cellDotToPixel(cell, dot) {
    if (!Number.isInteger(cell) || cell < 1 || cell > 8) {
        throw new RangeError(`cell must be an integer 1-8, got ${cell}`);
    }
    if (!Number.isInteger(dot) || dot < 1 || dot > 8) {
        throw new RangeError(`dot must be an integer 1-8, got ${dot}`);
    }
    const cellIndex = cell - 1; // 0-7
    const cellRow = Math.floor(cellIndex / CELL_COLS);
    const cellCol = cellIndex % CELL_COLS;
    let rowInCell = -1;
    let colInCell = -1;
    for (let r = 0; r < DOT_TABLE.length && rowInCell === -1; r++) {
        for (let c = 0; c < DOT_TABLE[r].length; c++) {
            if (DOT_TABLE[r][c] === dot) {
                rowInCell = r;
                colInCell = c;
                break;
            }
        }
    }
    return {
        row: cellRow * 4 + rowInCell,
        col: cellCol * 2 + colInCell,
    };
}
