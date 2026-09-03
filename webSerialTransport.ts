// webSerialTransport.ts
//
// A Transport is anything BrailleGrid can send text commands to and
// receive text back from. This keeps BrailleGrid itself agnostic to
// *how* it talks to the device -- WebSerialTransport (this file) is for
// use in the browser; a Node-based transport (see the separate
// node-serialport version of this library) is for local dev/testing
// tools outside the browser.

/// <reference path="./webSerial.d.ts" />

export interface Transport {
  open(): Promise<void>;
  close(): Promise<void>;
  write(data: string): Promise<void>;
  onData(cb: (chunk: string) => void): void;
  offData(cb: (chunk: string) => void): void;
}

export class WebSerialTransport implements Transport {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private listeners = new Set<(chunk: string) => void>();
  private readLoopPromise: Promise<void> | null = null;
  private decoder = new TextDecoder('latin1');
  private encoder = new TextEncoder();

  constructor(private baudRate = 9600) {}

  /** True if this browser supports the Web Serial API at all. */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Opens the browser's device picker so the user can select the grid
   * device. MUST be called from within a user gesture handler (e.g. a
   * button's onClick) -- browsers block this API from firing on page
   * load or from inside a promise chain with no gesture in its stack.
   */
  async requestPort(): Promise<void> {
    if (!WebSerialTransport.isSupported()) {
      throw new Error(
        'Web Serial API is not supported in this browser. Please use Chrome, Edge, or Firefox 151+.'
      );
    }
    this.port = await navigator.serial.requestPort();
  }

  async open(): Promise<void> {
    if (!this.port) {
      throw new Error(
        'No port selected. Call requestPort() first, from a user gesture like a button click.'
      );
    }
    await this.port.open({ baudRate: this.baudRate });
    if (!this.port.writable || !this.port.readable) {
      throw new Error('Serial port opened but readable/writable streams are unavailable.');
    }
    this.writer = this.port.writable.getWriter();
    this.reader = this.port.readable.getReader();
    this.readLoopPromise = this.runReadLoop();
  }

  private async runReadLoop(): Promise<void> {
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await this.reader!.read();
        if (done) break;
        if (value) {
          const text = this.decoder.decode(value);
          for (const cb of this.listeners) cb(text);
        }
      }
    } catch {
      // Reader was cancelled (close()) or the device disconnected.
      // Nothing further to do here; callers relying on write()/onData()
      // will see failures/timeouts naturally.
    }
  }

  onData(cb: (chunk: string) => void): void {
    this.listeners.add(cb);
  }

  offData(cb: (chunk: string) => void): void {
    this.listeners.delete(cb);
  }

  async write(data: string): Promise<void> {
    if (!this.writer) {
      throw new Error('BrailleGrid: port not open. Call connect() first.');
    }
    await this.writer.write(this.encoder.encode(data));
  }

  async close(): Promise<void> {
    this.listeners.clear();
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
      }
    } catch {
      // best-effort cleanup
    }
    try {
      this.writer?.releaseLock();
    } catch {
      // best-effort cleanup
    }
    if (this.readLoopPromise) {
      await this.readLoopPromise;
    }
    if (this.port) {
      await this.port.close();
    }
    this.port = null;
    this.reader = null;
    this.writer = null;
  }
}
