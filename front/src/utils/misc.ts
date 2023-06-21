import { encodeAbiParameters } from "viem";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { errorsABI } from "./errorsABI";
import { CHAIN } from "@/app/page";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function removeDashAndCapitalizeFirstLetter(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const baseContractInputs = {
  address: transactions[0].contractAddress as `0x${string}}`,
  abi: [...AirdropABI, ...errorsABI],
};

export const signMessage = (address: `0x${string}`) => {
  if (!address) return "";

  return encodeAbiParameters(
    [{ type: "address", name: "airdropAddress" }],
    [address as `0x${string}`]
  );
};

export const formatError = (error: Error | null) => {
  if (!error) return "";
  return error?.message?.split("args:")?.[0]?.split("data:")?.[0]?.trim() || "";
};

