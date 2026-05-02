import { createRoot } from "react-dom/client";
import { setDeviceIdGetter } from "@workspace/api-client-react";
import App from "./App";
import {
  getOrCreateDeviceId,
  initDeviceIdFromBridge,
} from "./license/device-id";
import "./index.css";

// When running inside the Electron desktop wrapper, replace the localStorage
// device id with the stable per-install UUID from the preload bridge BEFORE
// the React tree (and any licensing requests) mount.
async function bootstrap() {
  await initDeviceIdFromBridge();

  // Attach an X-Device-Id header to every API request so the licensing system
  // can enforce per-device activations.
  setDeviceIdGetter(() => getOrCreateDeviceId());

  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
