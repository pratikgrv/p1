import type { BetterAuthClientPlugin } from "better-auth";
import type { siws } from "./siws";

export const siwsClient = () =>
  ({
    id: "siws",
    $InferServerPlugin: {} as ReturnType<typeof siws>,
  }) satisfies BetterAuthClientPlugin;
