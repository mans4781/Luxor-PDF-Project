// Zod schemas (runtime values) for every endpoint.
export * from "./generated/api";

// TypeScript types for response/request schemas.
//
// Why this is an explicit list rather than `export *`:
// orval emits some schema names (e.g. `DeletePdfParams`, `UploadPdfBody`) as
// both a zod const in `generated/api.ts` AND a TS type in `generated/types/`.
// A wildcard re-export of both modules collides on those names (TS2308).
// For those colliding names, callers should derive the type from the zod
// schema instead: `z.infer<typeof DeletePdfParams>`.
export type {
  ErrorResponse,
  HealthStatus,
  LicenseStatus,
  PdfRecord,
  PdfStats,
  PdfUploadResult,
  RevokeOtpRequestResult,
  TodayUsage,
  UsageCheckBody,
  UsageCheckResult,
  UsageRecordBody,
  UsageRecordResult,
} from "./generated/types";

// String-literal "enums" — orval emits these as `const X = {...} as const`
// plus `type X = ...`, so they are exported as both value and type.
export {
  LicenseLockReason,
  LicenseStatusValue,
  PdfActionType,
  PdfRecordExpiryAction,
  PdfUploadResultExpiryAction,
  UploadPdfBodyExpiryAction,
} from "./generated/types";
