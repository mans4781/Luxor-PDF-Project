import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import WebAppPage from "@/pages/web-app";
import PricingPage from "@/pages/pricing";
import PdfReaderPage from "@/pages/products/pdf-reader";
import PdfEditorPage from "@/pages/products/pdf-editor";
import ESignPage from "@/pages/products/esign";
import PdfSecurityPage from "@/pages/products/pdf-security";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/web-app" component={WebAppPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/products/pdf-reader" component={PdfReaderPage} />
      <Route path="/products/pdf-editor" component={PdfEditorPage} />
      <Route path="/products/esign" component={ESignPage} />
      <Route path="/products/pdf-security" component={PdfSecurityPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
