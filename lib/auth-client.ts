import { createAuthClient } from "better-auth/react";
import { siwsClient } from "./auth/siws-client";
import { anonymousClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [
    anonymousClient(),
    siwsClient()
  ],
});