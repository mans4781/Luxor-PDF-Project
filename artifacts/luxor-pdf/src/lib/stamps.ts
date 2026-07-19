/**
 * Rubber-stamp library for the Stamps menu.
 *
 * Stamps are generated on a canvas so they look like a real ink stamp:
 * double rounded-rect border, bold condensed uppercase lettering, a
 * subtle uneven-ink speckle, and a very slight rotation. The result is
 * a transparent PNG data URL that is inserted as a regular image
 * annotation, so it can be moved/resized and is burned into exports.
 */

export type StampInk = "red" | "green" | "blue" | "gray";

export interface StampDef {
  text: string;
  ink: StampInk;
}

export interface StampCategory {
  label: string;
  items: StampDef[];
}

const GREEN: StampInk = "green";
const RED: StampInk = "red";
const BLUE: StampInk = "blue";
const GRAY: StampInk = "gray";

export const STAMP_CATEGORIES: StampCategory[] = [
  {
    label: "Approval & Status",
    items: [
      { text: "APPROVED", ink: GREEN },
      { text: "REJECTED", ink: RED },
      { text: "ACCEPTED", ink: GREEN },
      { text: "DECLINED", ink: RED },
      { text: "PENDING", ink: BLUE },
      { text: "COMPLETED", ink: GREEN },
      { text: "VERIFIED", ink: GREEN },
      { text: "CONFIRMED", ink: GREEN },
      { text: "CANCELLED", ink: RED },
      { text: "ON HOLD", ink: BLUE },
      { text: "IN PROGRESS", ink: BLUE },
      { text: "FINAL", ink: BLUE },
      { text: "DRAFT", ink: GRAY },
    ],
  },
  {
    label: "Review & Action",
    items: [
      { text: "REVIEWED", ink: GREEN },
      { text: "PLEASE REVIEW", ink: BLUE },
      { text: "REVISED", ink: BLUE },
      { text: "CORRECTED", ink: BLUE },
      { text: "NEEDS REVISION", ink: RED },
      { text: "ACTION REQUIRED", ink: RED },
      { text: "FOR APPROVAL", ink: BLUE },
      { text: "FOR REVIEW", ink: BLUE },
      { text: "FOR COMMENT", ink: BLUE },
      { text: "FOR INFORMATION", ink: BLUE },
      { text: "RETURNED", ink: RED },
      { text: "RESUBMIT", ink: RED },
    ],
  },
  {
    label: "Document Handling",
    items: [
      { text: "CONFIDENTIAL", ink: RED },
      { text: "PRIVATE", ink: RED },
      { text: "RESTRICTED", ink: RED },
      { text: "INTERNAL USE ONLY", ink: RED },
      { text: "DO NOT COPY", ink: RED },
      { text: "DO NOT DISTRIBUTE", ink: RED },
      { text: "CONTROLLED COPY", ink: BLUE },
      { text: "UNCONTROLLED COPY", ink: GRAY },
      { text: "ORIGINAL", ink: BLUE },
      { text: "COPY", ink: GRAY },
      { text: "DUPLICATE", ink: GRAY },
      { text: "VOID", ink: RED },
      { text: "ARCHIVED", ink: GRAY },
    ],
  },
  {
    label: "Payment & Accounts",
    items: [
      { text: "PAID", ink: GREEN },
      { text: "UNPAID", ink: RED },
      { text: "PAYMENT DUE", ink: RED },
      { text: "OVERDUE", ink: RED },
      { text: "RECEIVED", ink: GREEN },
      { text: "INVOICED", ink: BLUE },
      { text: "REFUNDED", ink: BLUE },
      { text: "PARTIALLY PAID", ink: BLUE },
      { text: "PAYMENT PENDING", ink: BLUE },
      { text: "PROCESSED", ink: GREEN },
    ],
  },
  {
    label: "Signature & Legal",
    items: [
      { text: "SIGNED", ink: GREEN },
      { text: "DIGITALLY SIGNED", ink: GREEN },
      { text: "SIGNATURE REQUIRED", ink: RED },
      { text: "NOTARIZED", ink: BLUE },
      { text: "CERTIFIED", ink: BLUE },
      { text: "LEGALLY BINDING", ink: BLUE },
      { text: "EXECUTED", ink: GREEN },
      { text: "WITNESSED", ink: BLUE },
      { text: "TRUE COPY", ink: BLUE },
      { text: "INVALID", ink: RED },
    ],
  },
  {
    label: "Dates & Delivery",
    items: [
      { text: "RECEIVED", ink: GREEN },
      { text: "SENT", ink: BLUE },
      { text: "SUBMITTED", ink: BLUE },
      { text: "DELIVERED", ink: GREEN },
      { text: "FILED", ink: BLUE },
      { text: "ISSUED", ink: BLUE },
      { text: "EXPIRED", ink: RED },
      { text: "VALID UNTIL", ink: BLUE },
      { text: "URGENT", ink: RED },
      { text: "PRIORITY", ink: RED },
    ],
  },
  {
    label: "Useful Custom Stamps",
    items: [
      { text: "APPROVED BY", ink: GREEN },
      { text: "REVIEWED BY", ink: BLUE },
      { text: "RECEIVED BY", ink: BLUE },
      { text: "SIGNED BY", ink: BLUE },
      { text: "DATE RECEIVED", ink: BLUE },
      { text: "DATE APPROVED", ink: GREEN },
      { text: "DOCUMENT ID", ink: GRAY },
      { text: "CASE CLOSED", ink: GREEN },
      { text: "SUPERSEDED", ink: RED },
      { text: "NOT FOR CONSTRUCTION", ink: RED },
      { text: "FOR CONSTRUCTION", ink: GREEN },
      { text: "PRELIMINARY", ink: GRAY },
      { text: "AS BUILT", ink: BLUE },
    ],
  },
];

export const STAMP_INK_COLORS: Record<StampInk, string> = {
  red: "#C2242B",
  green: "#1E7E34",
  blue: "#1F4FA3",
  gray: "#5A5F66",
};

/**
 * Render a stamp to a transparent PNG data URL at 3x scale so it stays
 * crisp when resized on the page. Returns the data URL plus the natural
 * aspect ratio (height / width) for sizing the annotation.
 */
export function renderStampDataUrl(def: StampDef): { dataUrl: string; aspect: number } {
  const color = STAMP_INK_COLORS[def.ink];
  const scale = 3;
  const fontSize = 34;
  const font = `800 ${fontSize}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`;

  // Measure text first.
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const textW = measure.measureText(def.text).width;

  const padX = 26;
  const padY = 16;
  const w = Math.ceil(textW + padX * 2);
  const h = Math.ceil(fontSize + padY * 2);

  const cv = document.createElement("canvas");
  cv.width = w * scale;
  cv.height = h * scale;
  const ctx = cv.getContext("2d")!;
  ctx.scale(scale, scale);

  // Slight stamp tilt for realism.
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-1.6 * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  // Outer heavy border.
  ctx.lineWidth = 4;
  roundRect(ctx, 4, 4, w - 8, h - 8, 8);
  ctx.stroke();
  // Inner thin border.
  ctx.lineWidth = 1.5;
  roundRect(ctx, 10, 10, w - 20, h - 20, 5);
  ctx.stroke();

  // Lettering with a touch of tracking.
  ctx.font = font;
  ctx.textBaseline = "middle";
  const letterSpacing = 2;
  let totalW = 0;
  for (const ch of def.text) totalW += ctx.measureText(ch).width + letterSpacing;
  totalW -= letterSpacing;
  let x = (w - totalW) / 2;
  const yMid = h / 2 + 1;
  for (const ch of def.text) {
    ctx.fillText(ch, x, yMid);
    x += ctx.measureText(ch).width + letterSpacing;
  }

  // Uneven-ink effect: punch small random transparent speckles out of
  // the drawing so it reads like a hand-pressed rubber stamp.
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalCompositeOperation = "destination-out";
  const speckles = Math.round((w * h) / 55);
  for (let i = 0; i < speckles; i++) {
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    const r = 0.4 + Math.random() * 1.1;
    ctx.globalAlpha = 0.25 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  return { dataUrl: cv.toDataURL("image/png"), aspect: h / w };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
