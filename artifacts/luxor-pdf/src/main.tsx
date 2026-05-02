import { createRoot } from "react-dom/client";
import { LuxorClerkProvider } from "@workspace/luxor-auth-ui";
import { publishableKeyFromHost } from "@clerk/react/internal";
import App from "./App";
import "./index.css";

const clerkPubKey = publishableKeyFromHost(
  typeof window !== "undefined" ? window.location.hostname : "",
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

createRoot(document.getElementById("root")!).render(
  <LuxorClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
  >
    <App />
  </LuxorClerkProvider>,
);
