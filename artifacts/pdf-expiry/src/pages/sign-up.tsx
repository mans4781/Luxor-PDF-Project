import { SignUp } from "@clerk/react";
import { AuthShell } from "@/components/auth-shell";

import { basePath } from "@/lib/base-path";

export default function SignUpPage() {
  return (
    <AuthShell variant="sign-up">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={basePath || "/"}
      />
    </AuthShell>
  );
}
