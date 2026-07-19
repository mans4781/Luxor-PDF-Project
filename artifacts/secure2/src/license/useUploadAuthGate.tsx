import { useCallback, useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { Lock, LogIn, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { basePath } from "@/lib/base-path";

/**
 * Gates the file-upload step of every online tool behind sign-in.
 *
 * UX: anonymous users CAN navigate into a tool page and read its
 * controls, but the moment they try to upload a file (drop, click the
 * dropzone, or change the hidden <input type="file">) we pop a modal
 * explaining sign-in is required and offer Sign in / Create account
 * buttons that round-trip back to the tool via `redirect_url`.
 *
 * Usage in a FileDropZone:
 *   const upload = useUploadAuthGate();
 *   ...
 *   <div onClick={() => upload.requireAuth(() => inputRef.current?.click())}
 *        onDrop={(e) => upload.requireAuth(() => handleDrop(e))} ... />
 *   <input onChange={(e) => upload.requireAuth(() => handleChange(e))} />
 *   {upload.modal}
 */
export function useUploadAuthGate(options: { bypass?: boolean } = {}) {
  const { bypass = false } = options;
  const { isLoaded, isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  const requireAuth = useCallback(
    (fn: () => void) => {
      // Free tools opt out of the sign-in gate entirely.
      if (bypass) {
        fn();
        return;
      }
      // While Clerk loads we treat the user as anon — safer to show
      // the modal than to allow an unauthenticated upload to slip
      // through.
      if (!isLoaded || !isSignedIn) {
        setOpen(true);
        return;
      }
      fn();
    },
    [isLoaded, isSignedIn, bypass],
  );

  const redirectUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(`${basePath}${location}${window.location.search}`)
      : "";

  const modal = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" data-testid="upload-auth-gate">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Sign in to use this feature
          </DialogTitle>
          <DialogDescription className="text-center">
            To upload and process files with Luxor PDF online tools you
            need an account and an active plan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
          <Button
            asChild
            className="w-full bg-[#312E81] hover:bg-[#3730A3] text-white"
            data-testid="upload-auth-gate-sign-in"
          >
            <a href={`${basePath}/sign-in?redirect_url=${redirectUrl}`}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign in
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full"
            data-testid="upload-auth-gate-sign-up"
          >
            <a href={`${basePath}/sign-up?redirect_url=${redirectUrl}`}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create free account
            </a>
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-700 mt-1"
          >
            Maybe later
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { requireAuth, modal, isSignedIn: !!isSignedIn };
}
