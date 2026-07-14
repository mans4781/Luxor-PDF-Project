import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/react";
import {
  useGetLicenseStatus,
  getGetLicenseStatusQueryKey,
  type LicenseStatus,
} from "@workspace/api-client-react";
import {
  deriveEffectiveState,
  readCachedStatus,
  writeCachedStatus,
  type ClientLockReason,
} from "./offline-cache";

interface LicenseContextValue {
  /** Effective status (live when available, cached snapshot when offline). */
  status: LicenseStatus | undefined;
  isLoading: boolean;
  isError: boolean;
  signedIn: boolean;
  /** True when we cannot reach the server / status is unknown. */
  offline: boolean;
  /** True when the rendered `status` came from the offline cache. */
  usingCache: boolean;
  /**
   * Client-only lock state for situations the server can't see: the user
   * has been offline beyond the grace window, or rolled the system clock.
   */
  clientLockReason: ClientLockReason | null;
  refetch: () => void;
  /**
   * Whether the dismissible "choose a plan" pop-up is open. For never-paid
   * (free) users the pop-up is NOT shown on login — it opens only when they
   * attempt a premium feature, and it can be closed with the X.
   */
  upgradeOpen: boolean;
  openUpgrade: () => void;
  closeUpgrade: () => void;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();

  const query = useGetLicenseStatus({
    query: {
      queryKey: getGetLicenseStatusQueryKey(),
      enabled: isLoaded && !!isSignedIn,
      refetchInterval: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 30 * 1000,
    },
  });

  // Persist every successful fetch so we have something to fall back on
  // when the device goes offline (Electron desktop app, flaky Wi-Fi, etc.).
  useEffect(() => {
    if (query.data) {
      writeCachedStatus(query.data);
    }
  }, [query.data]);

  // When signed out, clear the cached status so the next user doesn't
  // inherit the previous user's grace-period clock.
  useEffect(() => {
    if (isLoaded && !isSignedIn && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("luxor.lastLicenseStatus");
        window.localStorage.removeItem("luxor.lastServerTime");
      } catch {
        // ignore
      }
    }
  }, [isLoaded, isSignedIn]);

  // Re-evaluate the offline / grace-period state once a minute so a user
  // sitting on the lock screen sees it appear the moment their cached
  // subscription end date passes (or the grace window lapses).
  const [tick, setTick] = useState(0);
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const offline = !!isSignedIn && query.isError;

  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Reset the pop-up when the user signs out so the next session starts clean.
  useEffect(() => {
    if (isLoaded && !isSignedIn) setUpgradeOpen(false);
  }, [isLoaded, isSignedIn]);

  const effective = useMemo(() => {
    void tick; // re-derive each tick
    return deriveEffectiveState({
      liveStatus: query.data,
      cached: readCachedStatus(),
      offline,
    });
  }, [query.data, offline, tick]);

  const value = useMemo<LicenseContextValue>(
    () => ({
      status: effective.status,
      isLoading: !isLoaded || (query.isLoading && !effective.status),
      isError: query.isError,
      signedIn: !!isSignedIn,
      offline,
      usingCache: effective.usingCache,
      clientLockReason: effective.clientLockReason,
      refetch: () => {
        void query.refetch();
      },
      upgradeOpen,
      openUpgrade: () => setUpgradeOpen(true),
      closeUpgrade: () => setUpgradeOpen(false),
    }),
    [
      upgradeOpen,
      isLoaded,
      isSignedIn,
      query.isLoading,
      query.isError,
      query.refetch,
      offline,
      effective.status,
      effective.usingCache,
      effective.clientLockReason,
    ],
  );

  return (
    <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
  );
}

export function useLicense(): LicenseContextValue {
  const ctx = useContext(LicenseContext);
  if (!ctx) {
    throw new Error("useLicense must be used inside <LicenseProvider>");
  }
  return ctx;
}
