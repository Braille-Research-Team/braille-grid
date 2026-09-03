"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrailleGrid = void 0;
const mapping_1 = require("./mapping");
const COMMAND_TIMEOUT_MS = 5000;
class BrailleGrid {
    constructor(transport) {
        this.transport = transport;
        this.queue = Promise.resolve();
        this.state = BrailleGrid.blankGrid();
    }
    static blankGrid() {
        return Array.from({ length: mapping_1.GRID_ROWS }, () => Array(mapping_1.GRID_COLS).fill(false));
    }
    async connect() {
        await this.transport.open();
    }
    async disconnect() {
        await this.transport.close();
    }
    /**
     * Send a raw Python statement to the REPL and wait for it to finish
     * (i.e. for the `>>> ` prompt to reappear). Commands are queued so
     * only one is ever in flight at a time -- sending the next pulse
     * command before the current one's electromagnet pulse sequence
     * finishes could interfere with it, since dots share row/column lines.
     */
    send(statement) {
        const run = () => new Promise((resolve, reject) => {
            let buffer = '';
            const timeout = setTimeout(() => {
                this.transport.offData(onData);
                reject(new Error(`BrailleGrid: timed out waiting for response to: ${statement}`));
            }, COMMAND_TIMEOUT_MS);
            const onData = (chunk) => {
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
        const result = this.queue.then(run, run);
        this.queue = result.catch(() => undefined);
        return result;
    }
    /** Set a single dot up or down. */
    async setDot(row, col, up) {
        const { cell, dot } = (0, mapping_1.pixelToCellDot)(row, col);
        await this.send(`em.cell${cell}_dot${dot}_${up ? 'up' : 'down'}()`);
        this.state[row][col] = up;
    }
    /**
     * Draw a full shape from an 8x8 array. Only dots whose state actually
     * changes since the last draw are pulsed -- faster, and gentler on the
     * electromagnets, than re-driving every dot every time.
     */
    async drawShape(bitmap) {
        if (bitmap.length !== mapping_1.GRID_ROWS) {
            throw new Error(`drawShape expects an ${mapping_1.GRID_ROWS}x${mapping_1.GRID_COLS} array`);
        }
        for (let row = 0; row < mapping_1.GRID_ROWS; row++) {
            if (bitmap[row].length !== mapping_1.GRID_COLS) {
                throw new Error(`drawShape expects an ${mapping_1.GRID_ROWS}x${mapping_1.GRID_COLS} array`);
            }
            for (let col = 0; col < mapping_1.GRID_COLS; col++) {
                const want = !!bitmap[row][col];
                if (want !== this.state[row][col]) {
                    await this.setDot(row, col, want);
                }
            }
        }
    }
    /** Raise every dot. */
    async allUp() {
        await this.send('em.all_up()');
        this.state = Array.from({ length: mapping_1.GRID_ROWS }, () => Array(mapping_1.GRID_COLS).fill(true));
    }
    /** Lower every dot. */
    async allDown() {
        await this.send('em.all_down()');
        this.state = BrailleGrid.blankGrid();
    }
    /**
     * Electrically safe idle state (disables the driver, zeroes the row
     * lines). Does NOT lower any dots -- see the note at the top of this
     * file. Tracked state is left unchanged since no dots actually move.
     */
    async safeState() {
        await this.send('em.safe_state()');
    }
}
exports.BrailleGrid = BrailleGrid;
