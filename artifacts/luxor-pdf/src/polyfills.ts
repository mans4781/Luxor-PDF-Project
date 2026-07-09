/**
 * Polyfill for `Map.prototype.getOrInsertComputed` (TC39 "upsert" proposal),
 * which pdfjs-dist ≥5.6 calls during page rendering. Browsers that haven't
 * shipped it yet would otherwise throw a TypeError and leave every page blank.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
for (const ctor of [Map, WeakMap] as any[]) {
  const proto = ctor.prototype as any;
  if (typeof proto.getOrInsertComputed !== "function") {
    Object.defineProperty(proto, "getOrInsertComputed", {
      value: function getOrInsertComputed(key: any, callback: (key: any) => any) {
        if (this.has(key)) return this.get(key);
        const value = callback(key);
        this.set(key, value);
        return value;
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
  if (typeof proto.getOrInsert !== "function") {
    Object.defineProperty(proto, "getOrInsert", {
      value: function getOrInsert(key: any, defaultValue: any) {
        if (this.has(key)) return this.get(key);
        this.set(key, defaultValue);
        return defaultValue;
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

/**
 * Polyfills for `Uint8Array.prototype.toBase64` / `Uint8Array.fromBase64`
 * (TC39 base64 proposal, Chrome 140+). pdfjs-dist ≥5.6 calls `toBase64()`
 * unguarded when embedding fonts, so older browsers (and older Electron
 * shells) would fail to open any PDF with embedded fonts.
 */
const u8proto = Uint8Array.prototype as any;
if (typeof u8proto.toBase64 !== "function") {
  Object.defineProperty(u8proto, "toBase64", {
    value: function toBase64(this: Uint8Array) {
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < this.length; i += chunk) {
        binary += String.fromCharCode(...this.subarray(i, i + chunk));
      }
      return btoa(binary);
    },
    writable: true,
    configurable: true,
    enumerable: false,
  });
}
if (typeof (Uint8Array as any).fromBase64 !== "function") {
  Object.defineProperty(Uint8Array, "fromBase64", {
    value: function fromBase64(str: string) {
      const binary = atob(str);
      const out = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
      return out;
    },
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

export {};
