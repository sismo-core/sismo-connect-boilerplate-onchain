import { encodeAbiParameters } from "viem";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { errorsABI } from "./errorsABI";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function removeDashAndCapitalizeFirstLetter(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const baseContractInputs = {
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
