import { useEffect, useRef, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { LuxorClerkProvider } from "@workspace/luxor-auth-ui";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import History from "@/pages/history";
import PdfTool from "@/pages/pdf-tool";
import ConvertTool from "@/pages/convert-tool";
import SecurePdf from "@/pages/secure-pdf";
import PdfViewer from "@/pages/viewer";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import ActivateKeyPage from "@/pages/activate-key";
import CheckoutPage from "@/pages/checkout";
import { LicenseProvider } from "@/license/LicenseProvider";
import { LockOverlay } from "@/license/LockOverlay";
import { basePath } from "@/lib/base-path";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  typeof window !== "undefined" ? window.location.hostname : "",
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

/**
 * Wraps a tool route so that anonymous visitors are bounced to /sign-in
 * with a `redirect_url` back to the tool. Requirement: "Without login,
 * user can't access online tools."
 */
function RequireAuth<P extends object>(
  Inner: ComponentType<P>,
): ComponentType<P> {
  return function Guarded(props: P) {
    const { isLoaded, isSignedIn } = useUser();
    const [location, setLocation] = useLocation();

    useEffect(() => {
      if (isLoaded && !isSignedIn) {
        const target = `${basePath}${location}`;
        setLocation(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
      }
    }, [isLoaded, isSignedIn, location, setLocation]);

    if (!isLoaded || !isSignedIn) return null;
    return <Inner {...props} />;
  };
}

const PdfToolGuarded = RequireAuth(PdfTool);
const ConvertToolGuarded = RequireAuth(ConvertTool);
const SecurePdfGuarded = RequireAuth(SecurePdf);
const HistoryGuarded = RequireAuth(History);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/history" component={HistoryGuarded} />
      <Route path="/pdf-tool" component={PdfToolGuarded} />
      <Route path="/convert" component={ConvertToolGuarded} />
      <Route path="/secure-pdf" component={SecurePdfGuarded} />
      <Route path="/v/:id" component={PdfViewer} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/activate-key" component={ActivateKeyPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <LuxorClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <LicenseProvider>
          <TooltipProvider>
            <Router />
            <LockOverlay />
            <Toaster />
          </TooltipProvider>
        </LicenseProvider>
      </QueryClientProvider>
    </LuxorClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
