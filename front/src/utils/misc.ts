import { encodeAbiParameters } from "viem";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { errorsABI } from "./errorsABI";
import { AuthType, VerifiedAuth, VerifiedClaim } from "@/app/sismo-connect-config";

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

export function readibleHex(userId: string, startLength = 6, endLength = 4, separator = "...") {
  if (!userId.toString().startsWith("0x")) {
    return userId; // Return the original string if it doesn't start with "0x"
  }
  return userId.substring(0, startLength) + separator + userId.substring(userId.length - endLength);
}

export function getProofDataForAuth(
  verifiedAuths: VerifiedAuth[],
  authType: AuthType
): string | null {
  for (const auth of verifiedAuths) {
    if (auth.proofData && auth.authType === authType) {
      return readibleHex((auth.proofData as unknown as number).toString(16));
    }
  }

  return null; // returns null if no matching authType is found
}

export function getProofDataForClaim(
  verifiedClaims: VerifiedClaim[],
  claimType: number,
  groupId: string,
  value: number
): string | null {
  for (const claim of verifiedClaims) {
    if (claim.proofData && claim.claimType === claimType && claim.groupId === groupId) {
      return readibleHex((claim.proofData as unknown as number).toString(16));
    }
  }

  return null; // returns null if no matching authType is found
}

export function getuserIdFromHex(hexUserId: string) {
  const index = hexUserId.lastIndexOf("000000");
  if (index !== -1) {
    return hexUserId.substring(index + 6);
  } else {
    return hexUserId; // returns the original string if '00' is not found
  }
}
