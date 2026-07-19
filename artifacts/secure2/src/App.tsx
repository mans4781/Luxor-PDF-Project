import { Router, Route, Switch } from "wouter";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Encrypt } from "./pages/Encrypt";
import { Edit } from "./pages/Edit";
import { SecureShare } from "./pages/SecureShare";
import { Password } from "./pages/Password";
import { Redact } from "./pages/Redact";
import { Permissions } from "./pages/Permissions";
import { MergeSplit } from "./pages/MergeSplit";
import { BatchProcess } from "./pages/BatchProcess";
import { Storage } from "./pages/Storage";
import { Settings } from "./pages/Settings";
import { AppProvider } from "./store/useAppStore";

export default function App() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  
  return (
    <AppProvider>
      <Router base={base}>
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/encrypt" component={Encrypt} />
            <Route path="/edit" component={Edit} />
            <Route path="/password" component={Password} />
            <Route path="/redact" component={Redact} />
            <Route path="/permissions" component={Permissions} />
            <Route path="/merge-split" component={MergeSplit} />
            <Route path="/batch" component={BatchProcess} />
            <Route path="/share" component={SecureShare} />
            <Route path="/storage" component={Storage} />
            <Route path="/settings" component={Settings} />
            
            <Route>
              <div className="p-8 text-center text-red-500">404 - Not Found</div>
            </Route>
          </Switch>
        </AppLayout>
      </Router>
    </AppProvider>
  );
}