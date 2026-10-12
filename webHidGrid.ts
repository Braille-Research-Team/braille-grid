// webHidGrid.ts
//
// Drives the grid over WebHID: the same USB HID Braille Display interface
// that VoiceOver/NVDA use. The board's firmware (hid_braille_test.py)
// decodes each 8-byte report and pulses only the dots that changed, so
// DotQuest just sends the whole 8x8 shape as 8 cell bytes -- no REPL, no
// serial. Requires the autostart firmware to be running on the board.
//
// Note: a screen reader writes to the same display. Whoever sends last
// wins; DotQuest should only draw while a lesson is on screen.

/// <reference path="./webHid.d.ts" />

import { Bitmap, bitmapToCellBytes } from './mapping';
import type { GridDevice } from './gridDevice';

const BRAILLE_USAGE_PAGE = 0x41;
const BRAILLE_USAGE = 0x01;
const REPORT_ID = 1;
// Raspberry Pi Pico running MicroPython's USB stack (as seen on our board).
const PICO_VENDOR_ID = 0x2e8a;

export class WebHidGrid implements GridDevice {
  private device: HIDDevice | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  /** Must be called from a user gesture (button click). */
  async requestDevice(): Promise<void> {
    const devices = await navigator.hid.requestDevice({
      filters: [
        { vendorId: PICO_VENDOR_ID, usagePage: BRAILLE_USAGE_PAGE, usage: BRAILLE_USAGE },
      ],
    });
    if (devices.length === 0) throw new Error('No braille grid device selected.');
    this.device = devices[0];
  }

  async connect(): Promise<void> {
    if (!this.device) throw new Error('Call requestDevice() first, from a button click.');
    if (!this.device.opened) await this.device.open();
  }

  async disconnect(): Promise<void> {
    if (this.device?.opened) await this.device.close();
    this.device = null;
  }

  private sendCells(bytes: number[]): Promise<void> {
    const run = async () => {
      if (!this.device?.opened) throw new Error('Braille grid is not connected.');
      await this.device.sendReport(REPORT_ID, new Uint8Array(bytes));
    };
    const result = this.queue.then(run, run) as Promise<void>;
    this.queue = result.catch(() => undefined);
    return result;
  }

  async drawShape(bitmap: Bitmap): Promise<void> {
    await this.sendCells(bitmapToCellBytes(bitmap));
  }

  async allDown(): Promise<void> {
    await this.sendCells(Array(8).fill(0));
  }

  async allUp(): Promise<void> {
    await this.sendCells(Array(8).fill(0xff));
  }
}