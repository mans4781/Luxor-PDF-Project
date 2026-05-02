import { SignIn } from "@clerk/react";
import { AuthShell } from "@/components/auth-shell";

import { basePath } from "@/lib/base-path";

export default function SignInPage() {
  return (
    <AuthShell variant="sign-in">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={basePath || "/"}
      />
    </AuthShell>
  );
}
