import "./globals.css";
import { Inter } from "next/font/google";
import { WagmiProvider } from "@/utils/wagmi";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SafeAirdrop: Sybil-resistant airdrop from privately-aggregated data",
  description:
    "SafeAirDrop is a Sybil-resistant and privacy-preserving ERC20 airdrop that distributes AIR tokens to users proportionally based on their reputation, aggregated from diverse sources of data (wallets, Telegram, Twitter and GitHub accounts).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider>{children}</WagmiProvider>
      </body>
    </html>
  );
}
