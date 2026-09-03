import { Bitmap } from './mapping';
import type { Transport } from './webSerialTransport';
export declare class BrailleGrid {
    private transport;
    private queue;
    private state;
    constructor(transport: Transport);
    private static blankGrid;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Send a raw Python statement to the REPL and wait for it to finish
     * (i.e. for the `>>> ` prompt to reappear). Commands are queued so
     * only one is ever in flight at a time -- sending the next pulse
     * command before the current one's electromagnet pulse sequence
     * finishes could interfere with it, since dots share row/column lines.
     */
    private send;
    /** Set a single dot up or down. */
    setDot(row: number, col: number, up: boolean): Promise<void>;
    /**
     * Draw a full shape from an 8x8 array. Only dots whose state actually
     * changes since the last draw are pulsed -- faster, and gentler on the
     * electromagnets, than re-driving every dot every time.
     */
    drawShape(bitmap: Bitmap): Promise<void>;
    /** Raise every dot. */
    allUp(): Promise<void>;
    /** Lower every dot. */
    allDown(): Promise<void>;
    /**
     * Electrically safe idle state (disables the driver, zeroes the row
     * lines). Does NOT lower any dots -- see the note at the top of this
     * file. Tracked state is left unchanged since no dots actually move.
     */
    safeState(): Promise<void>;
}
