import type { Bitmap } from './mapping';
export type BrailleGridConnectionState = 'unsupported' | 'disconnected' | 'connecting' | 'connected';
export interface UseBrailleGridResult {
    state: BrailleGridConnectionState;
    error: string | null;
    /** Call from a button's onClick -- must run inside a user gesture. */
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    drawShape: (bitmap: Bitmap) => Promise<void>;
    clear: () => Promise<void>;
}
export declare function useBrailleGrid(): UseBrailleGridResult;
