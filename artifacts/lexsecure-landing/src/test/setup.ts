import { vi } from "vitest";

// jsdom lacks these browser APIs used by shell/layout components.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom's window.location.assign throws "navigation not implemented".
// Replace location with a mockable stand-in so tests can assert on the
// sign-in redirect target.
export const locationAssignMock = vi.fn();
Object.defineProperty(window, "location", {
  writable: true,
  value: {
    ...window.location,
    assign: locationAssignMock,
    replace: vi.fn(),
    href: "http://localhost/lx-console",
    search: "",
    origin: "http://localhost",
    pathname: "/lx-console",
  },
});
