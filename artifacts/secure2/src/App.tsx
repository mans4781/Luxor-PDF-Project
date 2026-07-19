import { Suspense, lazy, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { LuxorClerkProvider } from "@workspace/luxor-auth-ui";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";

// Everything except the landing dashboard is lazy-loaded so the initial
// bundle stays small — the heavy PDF/Office libraries only download when a
// page that needs them is opened.
const AccountDashboardPage = lazy(() => import("@/pages/account-dashboard"));
const History = lazy(() => import("@/pages/history"));
const PdfTool = lazy(() => import("@/pages/pdf-tool"));
const ConvertTool = lazy(() => import("@/pages/convert-tool"));
const OnlineTools = lazy(() => import("@/pages/online-tools"));
const ToolPage = lazy(() => import("@/pages/tool-page"));
const SecurePdf = lazy(() => import("@/pages/secure-pdf"));
const PdfViewer = lazy(() => import("@/pages/viewer"));
const SignInPage = lazy(() => import("@/pages/sign-in"));
const DesktopLinkPage = lazy(() => import("@/pages/desktop-link"));
const SignUpPage = lazy(() => import("@/pages/sign-up"));
const ActivateKeyPage = lazy(() => import("@/pages/activate-key"));
const CheckoutPage = lazy(() => import("@/pages/checkout"));
const TeamPage = lazy(() => import("@/pages/team"));
const AcceptInvitePage = lazy(() => import("@/pages/accept-invite"));
import { LicenseProvider } from "@/license/LicenseProvider";
import { LockOverlay } from "@/license/LockOverlay";
import { basePath, routerBase } from "@/lib/base-path";

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

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={AccountDashboardPage} />
      <Route path="/history" component={History} />
      <Route path="/pdf-tool" component={PdfTool} />
      <Route path="/convert" component={ConvertTool} />
      <Route path="/online-tools" component={OnlineTools} />
      <Route path="/tools/:slug" component={ToolPage} />
      <Route path="/secure-pdf" component={SecurePdf} />
      <Route path="/v/:id" component={PdfViewer} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/activate-key" component={ActivateKeyPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/accept-invite" component={AcceptInvitePage} />
      <Route path="/desktop-link" component={DesktopLinkPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  // On the clean-URL tool surface (routerBase === "") the wouter router runs at
  // the site root, but every account/auth route (history, activate-key,
  // checkout, sign-in, …) lives under the static /pdf-expiry base. Clerk drives
  // those via routerPush/replace to prefixed URLs, so from a clean-entry
  // session we must leave the SPA with a full-page navigation to the proxied
  // prefixed URL rather than SPA-pushing to an unproxied root path.
  const isCleanEntry = routerBase === "";
  const navigate = (to: string, replace: boolean) => {
    // A bare "/" from Clerk means the suite root (afterSignOutUrl → the
    // marketing landing page), NOT this app's home. Leave the SPA with a
    // full-page navigation so the wouter base doesn't re-prefix it.
    if (to === "/") {
      if (replace) window.location.replace("/");
      else window.location.assign("/");
      return;
    }
    if (isCleanEntry && basePath && to.startsWith(basePath)) {
      if (replace) window.location.replace(to);
      else window.location.assign(to);
      return;
    }
    setLocation(stripBase(to), replace ? { replace: true } : undefined);
  };

  return (
    <LuxorClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => navigate(to, false)}
      routerReplace={(to) => navigate(to, true)}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <LicenseProvider>
          <TooltipProvider>
            <Suspense fallback={<RouteFallback />}>
              <Router />
            </Suspense>
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
    <WouterRouter base={routerBase}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
