"use client";

import { useEffect, useState } from "react";
import { Chain, configureChains, createConfig } from "wagmi";
import { WagmiConfig } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { publicProvider } from "wagmi/providers/public";

export const mumbaiFork = {
  id: 5151111,
  name: "Fork Mumbai - Tutorial Sismo",
  network: "forkMumbaiTutoSismo",
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

const { chains, publicClient } = configureChains([mumbaiFork], [publicProvider()]);

const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
});

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return <WagmiConfig config={config}>{mounted && children}</WagmiConfig>;
}

export const switchNetwork = async (userChain: Chain) => {
  if (typeof window === "undefined") return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${userChain.id.toString(16)}` }],
    });
  } catch (error: any) {
    // This error code means that the chain we want has not been added to MetaMask
    // In this case we ask the user to add it to their MetaMask
    if (error.code === 4902) {
      try {
        // add mumbai fork chain to metamask
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${userChain.id.toString(16)}`,
              chainName: userChain.name,
              rpcUrls: userChain.rpcUrls.default.http,
              nativeCurrency: {
                name: userChain.nativeCurrency.name,
                symbol: userChain.nativeCurrency.symbol,
                decimals: userChain.nativeCurrency.decimals,
              },
            },
          ],
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log(error);
    }
  }
};
