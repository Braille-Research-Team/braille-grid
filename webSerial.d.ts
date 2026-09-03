// webSerial.d.ts
//
// Minimal ambient types for the Web Serial API, since TypeScript's default
// DOM lib doesn't include it. If the main DotQuest project later installs
// an official types package for this (e.g. `@types/w3c-web-serial`), this
// file can be deleted -- these are intentionally narrow, covering only
// what brailleGridWebSerialTransport.ts actually uses.

export {};

declare global {
  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
  }

  interface SerialPortRequestOptions {
    filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
  }

  interface Serial extends EventTarget {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  }

  interface Navigator {
    serial: Serial;
  }
}
