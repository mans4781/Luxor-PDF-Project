import { toast } from "@/hooks/use-toast";

const REFRESH_DELAY_MS = 5000;
let scheduled = false;

export function scheduleAutoRefresh() {
  if (scheduled || typeof window === "undefined") return;
  scheduled = true;
  toast({
    title: "Job complete",
    description: "Refreshing the app in 5 seconds…",
  });
  window.setTimeout(() => {
    window.location.reload();
  }, REFRESH_DELAY_MS);
}
