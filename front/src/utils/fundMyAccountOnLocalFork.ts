import { createWalletClient, parseEther, custom, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { fetchBalance } from "@wagmi/core";
import { mumbaiFork } from "./wagmi";

export const publicWalletClient = createWalletClient({
  chain: mumbaiFork,
  transport: window.ethereum ? custom(window.ethereum) : http(),
  // The private key of the second account of the local anvil network
  // This account is used for the app to allow the user to have fake tokens to call the contract
  account: privateKeyToAccount(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  ),
});

export const fundMyAccountOnLocalFork = async (address: `0x${string}` | null) => {
  if (!address) return;
  try {
    const balance = await fetchBalance({ address, chainId: mumbaiFork.id });
    if (balance?.value < parseEther("5")) {
      await publicWalletClient.sendTransaction({
        chain: mumbaiFork,
        to: address,
        value: parseEther("5"),
      });
      console.log("Account funded on mumbai local fork");
    }
  } catch (e) {
    console.log(e);
  }
};
