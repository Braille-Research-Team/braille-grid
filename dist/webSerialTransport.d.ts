export interface Transport {
    open(): Promise<void>;
    close(): Promise<void>;
    write(data: string): Promise<void>;
    onData(cb: (chunk: string) => void): void;
    offData(cb: (chunk: string) => void): void;
}
export declare class WebSerialTransport implements Transport {
    private baudRate;
    private port;
    private reader;
    private writer;
    private listeners;
    private readLoopPromise;
    private decoder;
    private encoder;
    constructor(baudRate?: number);
    /** True if this browser supports the Web Serial API at all. */
    static isSupported(): boolean;
    /**
     * Opens the browser's device picker so the user can select the grid
     * device. MUST be called from within a user gesture handler (e.g. a
     * button's onClick) -- browsers block this API from firing on page
     * load or from inside a promise chain with no gesture in its stack.
     */
    requestPort(): Promise<void>;
    open(): Promise<void>;
    private runReadLoop;
    onData(cb: (chunk: string) => void): void;
    offData(cb: (chunk: string) => void): void;
    write(data: string): Promise<void>;
    close(): Promise<void>;
}
