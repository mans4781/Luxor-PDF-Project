import { ShieldCheck } from "lucide-react";

const RULES = [
  { label: "At least one lowercase letter", hint: "a–z" },
  { label: "At least one uppercase letter", hint: "A–Z" },
  { label: "At least one number", hint: "0–9" },
  { label: "At least one special character", hint: "! @ # $ % & * _" },
];

export function PasswordRules() {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-5 py-3">
        <ShieldCheck
          className="h-4 w-4 text-[#1e3a8a]"
          strokeWidth={2.4}
        />
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-700">
          Password requirements
        </h3>
      </div>
      <ul className="px-5 py-4 space-y-2.5">
        {RULES.map(({ label, hint }) => (
          <li key={label} className="flex items-start gap-3">
            <span
              className="mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-2.5 w-2.5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.296a1 1 0 010 1.408l-7.997 7.997a1 1 0 01-1.408 0L3.296 10.7a1 1 0 011.408-1.408l3.296 3.296 7.296-7.296a1 1 0 011.408.004z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-800 leading-tight">
                {label}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {hint}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
