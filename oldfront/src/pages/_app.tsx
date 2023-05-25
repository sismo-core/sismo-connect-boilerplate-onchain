import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { mumbaiFork } from "@/utils";
import { configureChains } from "@wagmi/core";
import { publicProvider } from "wagmi/providers/public";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { WagmiConfig, createConfig } from "wagmi";

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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <img
        style={{ position: "absolute", right: 0, zIndex: -1 }}
        src="/assets/sismo-landing-art.svg"
        alt="sismo art"
      />
      <WagmiConfig config={config}>
        <Component {...pageProps} />
      </WagmiConfig>
    </>
  );
}
