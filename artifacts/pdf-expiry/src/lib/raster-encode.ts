// Client-side raster encoders for image formats the HTML canvas cannot
// produce on its own. Browsers only expose PNG / JPEG / WEBP through
// canvas.toBlob(); BMP and GIF are encoded here so the "PDF to BMP" and
// "PDF to GIF" tools can run fully offline.

import { GIFEncoder, quantize, applyPalette } from "gifenc";

/**
 * Encode a canvas as an uncompressed 24-bit BMP (BI_RGB, bottom-up rows).
 * Alpha is flattened onto a white background so the output is fully opaque.
 */
export function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const width = canvas.width;
  const height = canvas.height;
  const { data } = ctx.getImageData(0, 0, width, height);

  // Each row must be padded to a multiple of 4 bytes.
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileHeaderSize = 14;
  const dibHeaderSize = 40;
  const offset = fileHeaderSize + dibHeaderSize;
  const fileSize = offset + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true); // reserved
  view.setUint32(10, offset, true);

  // BITMAPINFOHEADER
  view.setUint32(14, dibHeaderSize, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // positive => bottom-up
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(30, 0, true); // BI_RGB, no compression
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // ~72 DPI horizontal
  view.setInt32(42, 2835, true); // ~72 DPI vertical
  view.setUint32(46, 0, true); // colors in palette
  view.setUint32(50, 0, true); // important colors

  const bytes = new Uint8Array(buffer);
  for (let y = 0; y < height; y++) {
    // BMP rows are stored bottom-to-top.
    const srcRow = (height - 1 - y) * width * 4;
    let dst = offset + y * rowSize;
    for (let x = 0; x < width; x++) {
      const s = srcRow + x * 4;
      const a = data[s + 3] / 255;
      // Flatten alpha over white.
      const r = Math.round(data[s] * a + 255 * (1 - a));
      const g = Math.round(data[s + 1] * a + 255 * (1 - a));
      const b = Math.round(data[s + 2] * a + 255 * (1 - a));
      // BMP stores pixels as BGR.
      bytes[dst++] = b;
      bytes[dst++] = g;
      bytes[dst++] = r;
    }
  }

  return new Blob([buffer], { type: "image/bmp" });
}

/**
 * Encode a canvas as a single-frame GIF. GIF is limited to a 256-color
 * palette, so the image is quantized before encoding.
 */
export function canvasToGifBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const width = canvas.width;
  const height = canvas.height;
  const { data } = ctx.getImageData(0, 0, width, height);

  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);

  const gif = GIFEncoder();
  gif.writeFrame(index, width, height, { palette });
  gif.finish();

  const bytes = new Uint8Array(gif.bytes()).buffer;
  return new Blob([bytes], { type: "image/gif" });
}
