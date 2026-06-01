import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ComingSoon from "@/pages/ComingSoon";
// NOTE: The eSign app is in "coming soon" mode. The full app (router + pages
// below) is temporarily disabled. To re-enable, restore the original imports
// and render <Router /> inside <WouterRouter> in App() again.
// import { Switch, Route, Router as WouterRouter } from "wouter";
// import Dashboard from "@/pages/Dashboard";
// import Documents from "@/pages/Documents";
// import DocumentDetail from "@/pages/DocumentDetail";
// import UploadPage from "@/pages/Upload";
// import SignPage from "@/pages/SignPage";
// import Pending from "@/pages/Pending";
// import Templates from "@/pages/Templates";
// import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ComingSoon />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
