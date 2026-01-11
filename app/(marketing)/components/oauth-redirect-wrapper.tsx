import { Suspense } from "react";
import { OAuthRedirectHandler } from "./oauth-redirect-handler";

export function OAuthRedirectWrapper() {
  return (
    <Suspense fallback={null}>
      <OAuthRedirectHandler />
    </Suspense>
  );
}
