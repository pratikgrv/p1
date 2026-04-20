"use client";

import { authClient } from "@/lib/auth-client";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { useCallback, useEffect, useRef, useState } from "react";

export type WalletSignInStatus =
  | "idle"
  | "signing"
  | "authenticated"
  | "linked"
  | "error";

export function useWalletSignIn() {
  const { publicKey, signMessage, signIn, disconnect } = useWallet();
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const [status, setStatus] = useState<WalletSignInStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const isSigningRef = useRef(false);

  const signInWithWallet = useCallback(async () => {
    if (!publicKey || isSigningRef.current) return;

    isSigningRef.current = true;
    setStatus("signing");
    setError(null);

    try {
      const address = publicKey.toBase58();
      const chainId =
        (process.env.NEXT_PUBLIC_NETWORK as string) || "devnet";

      // 1. Get nonce
      const nonceRes = await authClient.siws.nonce({ address, chainId });
      if (nonceRes.error || !nonceRes.data) {
        throw new Error(nonceRes.error?.message ?? "Failed to get nonce");
      }
      const { nonce } = nonceRes.data as { nonce: string };

      // 2. Sign
      let message: string;
      let signature: string;

      if (signIn) {
        // Modern SIWS one-click (Phantom, Solflare)
        const signInInput = {
          domain: window.location.host,
          address,
          statement: "Sign in with your Solana wallet",
          uri: window.location.origin,
          version: "1",
          chainId,
          nonce,
        };
        let output: Awaited<ReturnType<NonNullable<typeof signIn>>>;
        try {
          output = await signIn(signInInput);
        } catch {
          throw new Error("Sign-in request declined by user.");
        }
        message = new TextDecoder().decode(output.signedMessage);
        signature = bs58.encode(output.signature);
      } else if (signMessage) {
        // Legacy fallback — nonce embedded so server can validate it
        const structured = [
          "Sign in with your Solana wallet",
          `Domain: ${window.location.host}`,
          `Address: ${address}`,
          `Nonce: ${nonce}`,
          `Issued At: ${new Date().toISOString()}`,
        ].join("\n");
        let signedBytes: Uint8Array;
        try {
          signedBytes = await signMessage(new TextEncoder().encode(structured));
        } catch {
          throw new Error("Message signing declined by user.");
        }
        message = structured;
        signature = bs58.encode(signedBytes);
      } else {
        throw new Error("Wallet does not support message signing.");
      }

      // 3. Verify
      const verifyRes = await authClient.siws.verify({
        message,
        signature,
        address,
        chainId,
      });
      if (verifyRes.error) {
        throw new Error(verifyRes.error.message ?? "Verification failed");
      }

      const result = verifyRes.data as { linked?: boolean } | undefined;
      if (result?.linked) {
        setStatus("linked");
      } else {
        setStatus("authenticated");
      }

      await refetchSession();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStatus("error");
      if (!session?.user) await disconnect();
    } finally {
      isSigningRef.current = false;
    }
  }, [publicKey, signIn, signMessage, disconnect, session?.user, refetchSession]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    await disconnect();
    setStatus("idle");
    setError(null);
  }, [disconnect]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  // Auto-trigger sign-in when wallet connects and no session exists
  useEffect(() => {
    if (publicKey && !session?.user && status === "idle" && !isSigningRef.current) {
      signInWithWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  return {
    status,
    error,
    isLoading: status === "signing",
    isAuthenticated: status === "authenticated" || status === "linked",
    signInWithWallet,
    signOut,
    reset,
  };
}
