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

export {};
