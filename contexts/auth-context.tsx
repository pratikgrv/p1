"use client";

import React, { createContext, useContext, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useWalletSignIn } from "@/hooks/use-wallet-sign-in";

interface AuthContextValue {
  user: { id: string; name: string; email: string; isAnonymous: boolean } | null;
  isAuth: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  walletStatus: ReturnType<typeof useWalletSignIn>["status"];
  walletError: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuth: false,
  isLoading: true,
  signOut: async () => {},
  walletStatus: "idle",
  walletError: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  // The hook manages the wallet sign-in flow; it reads session internally
  // so no duplicate fetch — authClient caches the session.
  const { signOut, status: walletStatus, error: walletError } = useWalletSignIn();

  useEffect(() => {
    if (!isPending && !session) {
      authClient.signIn.anonymous();
    }
  }, [isPending, session]);

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        isAnonymous: session.user.isAnonymous || false,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuth: !!user && !user.isAnonymous,
        isLoading: isPending,
        signOut,
        walletStatus,
        walletError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
