import { APIError, getSessionFromCtx } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { createAuthEndpoint } from "better-auth/api";
import { generateRandomString } from "better-auth/crypto";
import type { User } from "better-auth/types";
import { z } from "zod";

export interface SIWSPluginOptions {
  domain: string;
  emailDomainName?: string;
  statement?: string;
}

const nonceSchema = z.object({
  address: z.string().min(1),
  chainId: z.string().optional(),
});

const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  address: z.string().min(1),
  chainId: z.string().optional(),
});

async function verifySolanaSignature(
  message: string,
  signature: string,
  address: string,
  nonce: string,
): Promise<boolean> {
  if (!message.includes(nonce)) return false;
  const { default: bs58 } = await import("bs58");
  const { default: nacl } = await import("tweetnacl");
  return nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    bs58.decode(signature),
    bs58.decode(address),
  );
}

async function resolveUserForWallet({
  ctx,
  accountId,
  currentlyLoggedInUser,
}: {
  ctx: any;
  accountId: string;
  currentlyLoggedInUser: User | null;
}): Promise<{ user: User; linked: boolean }> {
  const adapter = ctx.context.internalAdapter;
  const existingAccount = await adapter.findAccountByProviderId(accountId, "siws");

  if (existingAccount) {
    const owner = await adapter.findUserById(existingAccount.userId);
    if (!owner) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Wallet owner not found." });

    if (currentlyLoggedInUser && currentlyLoggedInUser.id !== owner.id) {
      throw new APIError("BAD_REQUEST", { message: "This wallet is already linked to another account." });
    }
    return { user: owner, linked: false };
  }

  if (currentlyLoggedInUser) {
    const accounts = await adapter.findAccountByUserId(currentlyLoggedInUser.id);
    if (accounts.find((a: any) => a.providerId === "siws")) {
      throw new APIError("BAD_REQUEST", { message: "You already have a wallet linked." });
    }
    await adapter.createAccount({
      userId: currentlyLoggedInUser.id,
      providerId: "siws",
      accountId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { user: currentlyLoggedInUser, linked: true };
  }

  throw new Error("NEW_USER_REQUIRED");
}

async function createWalletUser({
  ctx,
  address,
  chainType,
  chainId,
  accountId,
  options,
}: any): Promise<User> {
  const adapter = ctx.context.internalAdapter;
  const domain = options.emailDomainName ?? new URL(ctx.context.baseURL).hostname;
  const email = `solana.${address}@${domain}`;
  const name = `${address.slice(0, 4)}...${address.slice(-4)}`;
  const newUser = await adapter.createUser({ name, email, image: "" });
  await adapter.createAccount({
    userId: newUser.id,
    providerId: "siws",
    accountId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return newUser;
}

export const siws = (options: SIWSPluginOptions) => {
  const statement = options.statement ?? "Sign in with your Solana wallet";

  return {
    id: "siws",
    endpoints: {
      nonce: createAuthEndpoint(
        "/siws/nonce",
        { method: "POST", body: nonceSchema },
        async (ctx) => {
          const { address, chainId } = ctx.body;
          const resolvedChainId = chainId ?? "devnet";
          const nonce = generateRandomString(32);
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

          await ctx.context.internalAdapter.createVerificationValue({
            identifier: `siws:solana:${resolvedChainId}:${address}`,
            value: nonce,
            expiresAt,
          });

          return ctx.json({ nonce, expiresAt: expiresAt.toISOString(), statement, chainId: resolvedChainId });
        },
      ),

      verify: createAuthEndpoint(
        "/siws/verify",
        { method: "POST", body: verifySchema },
        async (ctx) => {
          const { message, signature, address, chainId } = ctx.body;
          const chainType = "solana";
          const resolvedChainId = chainId ?? "devnet";
          const accountId = `${chainType}:${resolvedChainId}:${address}`;
          const identifier = `siws:${chainType}:${resolvedChainId}:${address}`;
          const adapter = ctx.context.internalAdapter;

          const verification = await adapter.findVerificationValue(identifier);
          if (!verification || new Date() > verification.expiresAt) {
            throw new APIError("UNAUTHORIZED", { message: "Invalid or expired nonce." });
          }
          await adapter.deleteVerificationByIdentifier(identifier);

          const verified = await verifySolanaSignature(
            message, signature, address, verification.value,
          );
          if (!verified) {
            throw new APIError("UNAUTHORIZED", { message: "Invalid signature." });
          }

          const existingSession = await getSessionFromCtx(ctx);
          const currentlyLoggedInUser = existingSession?.user ?? null;

          let user: User;
          let linked = false;
          try {
            const result = await resolveUserForWallet({ ctx, accountId, currentlyLoggedInUser });
            user = result.user;
            linked = result.linked;
          } catch (err: any) {
            if (err.message === "NEW_USER_REQUIRED") {
              user = await createWalletUser({ ctx, address, chainType, chainId: resolvedChainId, accountId, options });
            } else {
              throw err;
            }
          }

          const session = await adapter.createSession(user.id);
          if (!session) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Failed to create session." });

          await setSessionCookie(ctx, { session, user });

          return ctx.json({
            success: true,
            linked,
            token: session.token,
            user: { id: user.id, address, chainType, chainId: resolvedChainId },
          });
        },
      ),
    },
  };
};
