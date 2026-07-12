import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
const Home2Page = lazy(() => import("@/pages/home-2"));
const Home3Page = lazy(() => import("@/pages/home-3"));
const WebAppPage = lazy(() => import("@/pages/web-app"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const AboutPage = lazy(() => import("@/pages/about"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const TermsPage = lazy(() => import("@/pages/terms"));
const CookiesPage = lazy(() => import("@/pages/cookies"));
const LicensingPage = lazy(() => import("@/pages/licensing"));
const RefundPage = lazy(() => import("@/pages/refund"));
const PdfReaderPage = lazy(() => import("@/pages/products/pdf-reader"));
const PdfEditorPage = lazy(() => import("@/pages/products/pdf-editor"));
const ESignPage = lazy(() => import("@/pages/products/esign"));
const PdfSecurityPage = lazy(() => import("@/pages/products/pdf-security"));
const AdminPage = lazy(() => import("@/pages/admin"));
const FeaturesPage = lazy(() => import("@/pages/features"));
const DownloadPage = lazy(() => import("@/pages/download"));
const BrandPage = lazy(() => import("@/pages/brand"));
const DeveloperLoginPage = lazy(() => import("@/pages/developer/login"));
const DeveloperDashboardPage = lazy(() => import("@/pages/developer/dashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));
// import { Chatbot } from "@/components/Chatbot"; // temporarily disabled
import { ScrollToTop } from "@/components/ScrollToTop";

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#DC2626]" />
    </div>
  );
}

function RouteScrollReset() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/home-2" component={Home2Page} />
      <Route path="/home-3" component={Home3Page} />
      <Route path="/web-app" component={WebAppPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/licensing" component={LicensingPage} />
      <Route path="/refund" component={RefundPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/products/pdf-reader" component={PdfReaderPage} />
      <Route path="/products/pdf-editor" component={PdfEditorPage} />
      <Route path="/products/esign" component={ESignPage} />
      <Route path="/products/pdf-security" component={PdfSecurityPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/download" component={DownloadPage} />
      <Route path="/thank-you" component={DownloadPage} />
      <Route path="/brand" component={BrandPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/developer/login" component={DeveloperLoginPage} />
      <Route path="/developer/dashboard" component={DeveloperDashboardPage} />
      <Route path="/developer" component={DeveloperLoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <RouteScrollReset />
          <Suspense fallback={<RouteFallback />}>
            <Router />
          </Suspense>
        </WouterRouter>
        {/* Chatbot temporarily disabled — re-enable by uncommenting */}
        {/* <Chatbot /> */}
        <ScrollToTop />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
