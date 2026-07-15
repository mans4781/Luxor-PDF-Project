// ── Real API shapes ───────────────────────────────────────────────────────────

export interface AdminStats {
  overview: {
    totalUsers: number;
    paidUsers: number;
    freeUsers: number;
    totalRevenue: Record<string, number>;
    monthRevenue: Record<string, number>;
    pageViews: number;
    totalPdfs: number;
    activePdfs: number;
    expiredPdfs: number;
    totalStorageBytes: number;
  };
  plans: Record<string, number>;
  monthlyData: { month: string; revenue: Record<string, number>; signups: number }[];
  topPages: { path: string; views: number }[];
  dailyViews: { day: string; views: number }[];
  recentActivity: { id: number; type: string; user: string; message: string; time: string }[];
}

export interface VisitorAnalytics {
  days: { day: string; visitors: number }[];
  locations: { country: string; city: string; visitors: number }[];
}

export interface AdminCustomer {
  userId: string;
  planName: string | null;
  tier: string | null;
  isPaid: boolean;
  accountStatus: string;
  lockReason: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  quotaOverrideSecure: number | null;
  monthlyUsed: number;
  monthlyLimit: number | null;
  monthlyRemaining: number | null;
  passwordProtectUsed: number;
  securePdfUsed: number;
  resetDate: string | null;
  createdAt: string;
}

export interface ProductKey {
  id: number;
  keyPrefix: string;
  planName: string;
  durationDays: number;
  maxActivations: number;
  currentActivations: number;
  status: string;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface MintedKey {
  id: number;
  rawKey: string;
  keyPrefix: string;
  planName: string;
  durationDays: number;
  maxActivations: number;
  expiresAt: string | null;
}

export type ProductPlan = "monthly" | "quarterly" | "yearly" | "lifetime";
export const PRODUCT_PLANS: ProductPlan[] = ["monthly", "quarterly", "yearly", "lifetime"];

// ── Mock-layer shapes (no backend yet) ────────────────────────────────────────

export type OfferStatus = "Draft" | "Scheduled" | "Active" | "Paused" | "Expired" | "Cancelled";

export interface Offer {
  id: string;
  name: string;
  code: string;
  description: string;
  occasion: string;
  discountType: "percent" | "fixed" | "extension";
  discountValue: number;
  products: string[];
  plans: string[];
  eligibleUsers: "everyone" | "new" | "existing" | "selected";
  countries: string[];
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  perUserLimit: number | null;
  timesUsed: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  autoApply: boolean;
  isPublic: boolean;
  status: OfferStatus;
}

export type ReferralStatus =
  | "Clicked"
  | "Registered"
  | "Payment Pending"
  | "Successful"
  | "Reward Granted"
  | "Rejected"
  | "Fraud Review";

export interface Referral {
  id: string;
  referrer: string;
  code: string;
  link: string;
  clicks: number;
  signups: number;
  paidConversions: number;
  revenue: number;
  discountGiven: number;
  rewardGranted: boolean;
  status: ReferralStatus;
}

export interface AppNotification {
  id: string;
  kind: "success" | "warning" | "error" | "info";
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  admin: string;
  action: string;
  target: string;
  prev: string;
  next: string;
  time: string;
  ip: string;
}

export interface SystemService {
  name: string;
  status: "operational" | "degraded" | "down";
}
