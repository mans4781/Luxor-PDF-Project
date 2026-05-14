import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import WebAppPage from "@/pages/web-app";
import PricingPage from "@/pages/pricing";
import AboutPage from "@/pages/about";
import PdfReaderPage from "@/pages/products/pdf-reader";
import PdfEditorPage from "@/pages/products/pdf-editor";
import ESignPage from "@/pages/products/esign";
import PdfSecurityPage from "@/pages/products/pdf-security";
import AdminPage from "@/pages/admin";
import FeaturesPage from "@/pages/features";
import OnlineToolsPage from "@/pages/online-tools";
import DownloadPage from "@/pages/download";
import BrandPage from "@/pages/brand";
import DeveloperLoginPage from "@/pages/developer/login";
import DeveloperDashboardPage from "@/pages/developer/dashboard";
import NotFound from "@/pages/not-found";
import { Chatbot } from "@/components/Chatbot";
import { ScrollToTop } from "@/components/ScrollToTop";

const queryClient = new QueryClient();

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
      <Route path="/web-app" component={WebAppPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/products/pdf-reader" component={PdfReaderPage} />
      <Route path="/products/pdf-editor" component={PdfEditorPage} />
      <Route path="/products/esign" component={ESignPage} />
      <Route path="/products/pdf-security" component={PdfSecurityPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/online-tools" component={OnlineToolsPage} />
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
          <Router />
        </WouterRouter>
        <Chatbot />
        <ScrollToTop />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
