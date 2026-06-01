import React from "react";
import { Minimal } from "./Minimal";
import { BoldBranded } from "./BoldBranded";
import { ClassicProfessional } from "./ClassicProfessional";
import { Obsidian } from "./Obsidian";
import { Aurora } from "./Aurora";
import { Editorial } from "./Editorial";
import { MidnightRoyal } from "./MidnightRoyal";

const sheets: { label: string; Component: React.ComponentType }[] = [
  { label: "Minimal", Component: Minimal },
  { label: "Bold Branded", Component: BoldBranded },
  { label: "Classic Professional", Component: ClassicProfessional },
  { label: "Obsidian (Dark Luxury)", Component: Obsidian },
  { label: "Aurora (Gradient Glass)", Component: Aurora },
  { label: "Editorial (Ivory Luxe)", Component: Editorial },
  { label: "Midnight Royal (Fintech)", Component: MidnightRoyal },
];

export function AllInvoices() {
  return (
    <div className="all-invoices-print">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .all-invoices-print * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .all-invoices-toolbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 24px;
          background: #312E81;
          color: #fff;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
        .all-invoices-toolbar button {
          background: #FB7185;
          color: #1f1147;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          cursor: pointer;
          font-size: 14px;
        }
        .all-invoices-sheet { break-after: page; page-break-after: always; }
        .all-invoices-sheet:last-child { break-after: auto; page-break-after: auto; }
        .all-invoices-label {
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          padding: 10px 24px 0;
          background: #f1f5f9;
        }
        @media print {
          .all-invoices-toolbar { display: none !important; }
          .all-invoices-label { display: none !important; }
        }
      `,
        }}
      />

      <div className="all-invoices-toolbar">
        <span style={{ fontWeight: 600 }}>Luxor PDF — All 7 Invoice Templates</span>
        <button onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      {sheets.map(({ label, Component }) => (
        <div className="all-invoices-sheet" key={label}>
          <div className="all-invoices-label">{label}</div>
          <Component />
        </div>
      ))}
    </div>
  );
}
