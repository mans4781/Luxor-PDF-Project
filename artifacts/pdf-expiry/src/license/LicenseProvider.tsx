import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useUser } from "@clerk/react";
import {
  useGetLicenseStatus,
  getGetLicenseStatusQueryKey,
  type LicenseStatus,
} from "@workspace/api-client-react";

interface LicenseContextValue {
  status: LicenseStatus | undefined;
  isLoading: boolean;
  isError: boolean;
  signedIn: boolean;
  /** True when we cannot reach the server / status is unknown. */
  offline: boolean;
  refetch: () => void;
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

  const value = useMemo<LicenseContextValue>(
    () => ({
      status: query.data,
      isLoading: !isLoaded || query.isLoading,
      isError: query.isError,
      signedIn: !!isSignedIn,
      offline: !!isSignedIn && query.isError,
      refetch: () => {
        void query.refetch();
      },
    }),
    [isLoaded, isSignedIn, query.data, query.isLoading, query.isError, query.refetch],
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
