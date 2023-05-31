"use client";

import { useEffect, useState } from "react";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain, configureChains, createConfig } from "wagmi";
import { WagmiConfig } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { publicProvider } from "wagmi/providers/public";
import { fetchBalance } from "@wagmi/core";

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

export const publicWalletClient = createWalletClient({
  chain: mumbaiFork,
  transport: http(),
  // The private key of the second account of the local anvil network
  // This account is used for the app to allow the user to have fake tokens to call the contract
  account: privateKeyToAccount(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  ),
});

export const fundMyAccount = async (address: `0x${string}`) => {
  if (!address) return;
  const balance = await fetchBalance({ address });

  balance.value < parseEther("5") &&
    (await publicWalletClient.sendTransaction({
      to: address,
      value: parseEther("5"),
    }))
};
