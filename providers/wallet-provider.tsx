"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import type React from "react";
import { type FC, useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: React.ReactNode;
}

export const WalletProvider: FC<Props> = ({ children }) => {
  const networkEnv = (process.env.NEXT_PUBLIC_NETWORK ?? "devnet") as
    | "devnet"
    | "testnet"
    | "mainnet-beta";

  const network =
    networkEnv === "mainnet-beta"
      ? WalletAdapterNetwork.Mainnet
      : networkEnv === "testnet"
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
