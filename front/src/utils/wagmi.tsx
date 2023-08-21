"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { useEffect, useState } from "react";
import {
  mainnet,
  goerli,
  sepolia,
  optimism,
  optimismGoerli,
  arbitrum,
  arbitrumGoerli,
  scrollTestnet,
  gnosis,
  polygon,
  polygonMumbai,
  base,
  baseGoerli,
} from "wagmi/chains";
import { Chain, configureChains, createConfig } from "wagmi";
import { WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";

export {
  mainnet,
  goerli,
  sepolia,
  optimism,
  optimismGoerli,
  arbitrum,
  arbitrumGoerli,
  scrollTestnet,
  gnosis,
  polygon,
  polygonMumbai,
  base,
  baseGoerli,
};

export const mumbaiFork = {
  id: 5151111,
  name: "Local Fork Mumbai",
  network: "localForkMumbai",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
} as const satisfies Chain;

const { chains, publicClient } = configureChains(
  [
    mumbaiFork,
    mainnet,
    goerli,
    sepolia,
    optimism,
    optimismGoerli,
    arbitrum,
    arbitrumGoerli,
    scrollTestnet,
    gnosis,
    polygon,
    polygonMumbai,
    base,
    baseGoerli,
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "My RainbowKit App",
  projectId: "329179374477a9c2af7638995afd8db3",
  chains,
});

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains} modalSize="compact">
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
