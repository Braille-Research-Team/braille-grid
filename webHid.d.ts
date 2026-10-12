// Minimal ambient types for WebHID (not in TypeScript's default DOM lib).
export {};
declare global {
  interface HIDDevice {
    readonly opened: boolean;
    readonly productName: string;
    open(): Promise<void>;
    close(): Promise<void>;
    sendReport(reportId: number, data: BufferSource): Promise<void>;
  }
  interface HIDDeviceFilter {
    vendorId?: number;
    productId?: number;
    usagePage?: number;
    usage?: number;
  }
  interface HID {
    requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>;
  }
  interface Navigator {
    readonly hid: HID;
  }
}