import { db } from "../db";
import * as schema from "../db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { siws } from "./auth/siws";
import { anonymous } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema
    }
  }),
  user: {
    additionalFields: {
      messageCount: {
        type: "number",
        defaultValue: 0,
      },
      lastMessageAt: {
        type: "string", // Better Auth additionalFields types are limited, but it will be serialized
      }
    }
  },
  plugins: [
    anonymous(),
    siws({
      domain: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      statement: "Sign in with your Solana wallet",
    }),
  ],
});

export default auth;
