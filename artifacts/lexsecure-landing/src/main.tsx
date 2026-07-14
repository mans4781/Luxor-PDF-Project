import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initPageTracking } from "./lib/pageTracking";

initPageTracking();

createRoot(document.getElementById("root")!).render(<App />);
