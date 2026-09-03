"use strict";
// index.ts
//
// Public entry point for this package. Consumers import from here --
// e.g. `import { useBrailleGrid, circleOutline } from 'braille-grid'` --
// rather than reaching into individual files directly. This file is the
// contract: anything exported here is the supported public API; anything
// not re-exported here is considered internal and free to change.
Object.defineProperty(exports, "__esModule", { value: true });
exports.triangleOutline = exports.circleOutline = exports.squareOutline = exports.GRID_COLS = exports.GRID_ROWS = exports.cellDotToPixel = exports.pixelToCellDot = exports.useBrailleGrid = exports.WebSerialTransport = exports.BrailleGrid = void 0;
var brailleGrid_1 = require("./brailleGrid");
Object.defineProperty(exports, "BrailleGrid", { enumerable: true, get: function () { return brailleGrid_1.BrailleGrid; } });
var webSerialTransport_1 = require("./webSerialTransport");
Object.defineProperty(exports, "WebSerialTransport", { enumerable: true, get: function () { return webSerialTransport_1.WebSerialTransport; } });
var useBrailleGrid_1 = require("./useBrailleGrid");
Object.defineProperty(exports, "useBrailleGrid", { enumerable: true, get: function () { return useBrailleGrid_1.useBrailleGrid; } });
var mapping_1 = require("./mapping");
Object.defineProperty(exports, "pixelToCellDot", { enumerable: true, get: function () { return mapping_1.pixelToCellDot; } });
Object.defineProperty(exports, "cellDotToPixel", { enumerable: true, get: function () { return mapping_1.cellDotToPixel; } });
Object.defineProperty(exports, "GRID_ROWS", { enumerable: true, get: function () { return mapping_1.GRID_ROWS; } });
Object.defineProperty(exports, "GRID_COLS", { enumerable: true, get: function () { return mapping_1.GRID_COLS; } });
var shapes_1 = require("./shapes");
Object.defineProperty(exports, "squareOutline", { enumerable: true, get: function () { return shapes_1.squareOutline; } });
Object.defineProperty(exports, "circleOutline", { enumerable: true, get: function () { return shapes_1.circleOutline; } });
Object.defineProperty(exports, "triangleOutline", { enumerable: true, get: function () { return shapes_1.triangleOutline; } });
