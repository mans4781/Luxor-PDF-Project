import "./polyfills";
import { createRoot } from "react-dom/client";
import { LuxorClerkProvider } from "@workspace/luxor-auth-ui";
import { publishableKeyFromHost } from "@clerk/react/internal";
import App from "./App";
// pdf.js styles for the interactive AcroForm widgets (renderForms). Imported
// BEFORE index.css so our more-specific `.pdf-page-wrapper .textLayer` rules
// still win — this only supplies the `.annotationLayer` form-widget styling.
import "pdfjs-dist/web/pdf_viewer.css";
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
