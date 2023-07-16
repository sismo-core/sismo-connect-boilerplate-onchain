import "./globals.css";
import { Inter } from "next/font/google";
import { WagmiProvider } from "@/utils/wagmi";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sismo Connect Starter: onchain app with Next.js + Foundry",
  description: "Start developping an onchain application, with Next.js, Foundry and Sismo Connect",
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
