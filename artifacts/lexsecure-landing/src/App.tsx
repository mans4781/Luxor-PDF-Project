import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import WebAppPage from "@/pages/web-app";
import PricingPage from "@/pages/pricing";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import PdfReaderPage from "@/pages/products/pdf-reader";
import PdfEditorPage from "@/pages/products/pdf-editor";
import ESignPage from "@/pages/products/esign";
import PdfSecurityPage from "@/pages/products/pdf-security";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { Chatbot } from "@/components/Chatbot";
import { ScrollToTop } from "@/components/ScrollToTop";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/web-app" component={WebAppPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/products/pdf-reader" component={PdfReaderPage} />
      <Route path="/products/pdf-editor" component={PdfEditorPage} />
      <Route path="/products/esign" component={ESignPage} />
      <Route path="/products/pdf-security" component={PdfSecurityPage} />
      <Route path="/admin" component={AdminPage} />
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
        <Chatbot />
        <ScrollToTop />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
