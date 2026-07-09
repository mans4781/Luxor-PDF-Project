/**
 * Custom pdf.js worker entry: loads the Map/WeakMap upsert polyfills before
 * the pdf.js worker code, since the worker runs in its own global scope and
 * pdfjs-dist ≥5.6 calls `getOrInsertComputed` there too.
 */
import "./polyfills";
import "pdfjs-dist/build/pdf.worker.min.mjs";
