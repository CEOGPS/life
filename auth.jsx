import { HerculesAuthProvider } from "@usehercules/auth/react";

export function AuthProvider({ children }) {
  const redirectUri = import.meta.env.VITE_HERCULES_OIDC_REDIRECT_URI ?? 
    (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "/auth/callback");

  return (
    <HerculesAuthProvider
      authority={import.meta.env.VITE_HERCULES_OIDC_AUTHORITY}
      client_id={import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID}
      userManagerSettings={{
        prompt: import.meta.env.VITE_HERCULES_OIDC_PROMPT ?? "select_account",
        response_type: import.meta.env.VITE_HERCULES_OIDC_RESPONSE_TYPE ?? "code",
        scope: import.meta.env.VITE_HERCULES_OIDC_SCOPE ?? 
          "openid profile email offline_access",
        redirect_uri: redirectUri,
      }}
    >
      {children}
    </HerculesAuthProvider>
  );
}