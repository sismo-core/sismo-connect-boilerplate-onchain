import { decodeAbiParameters, encodeAbiParameters } from "viem";
import {
  AuthRequest,
  AuthType,
  ClaimRequest,
  VerifiedAuth,
  VerifiedClaim,
} from "@sismo-core/sismo-connect-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function removeDashAndCapitalizeFirstLetter(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

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

export function getUserIdFromHex(hexUserId: string) {
  const index = hexUserId.lastIndexOf("000000");
  if (index !== -1) {
    return hexUserId.substring(index + 6);
  } else {
    return hexUserId; // returns the original string if '00' is not found
  }
}

export function getAuthRequestsAndClaimRequestsFromSismoConnectRequest(
  sismoConnectRequest: [AuthRequest[], ClaimRequest[]]
): { authRequests: AuthRequest[]; claimRequests: ClaimRequest[] } {
  const authRequests = (sismoConnectRequest[0] as AuthRequest[]).map((authRequest: AuthRequest) => {
    return {
      ...authRequest,
      userId: authRequest.userId?.toString() ?? "0",
    };
  }) as AuthRequest[];
  const claimRequests = (sismoConnectRequest[1] as ClaimRequest[]).map(
    (claimRequest: ClaimRequest) => {
      return {
        ...claimRequest,
        groupTimestamp:
          (claimRequest.groupTimestamp as string) === "0x6c617465737400000000000000000000"
            ? "latest"
            : (decodeAbiParameters(
                ["bytes16"],
                claimRequest.groupTimestamp as `0x${string}`
              )[0] as number),
        value: parseInt(claimRequest.value?.toString() ?? "1"),
      };
    }
  ) as ClaimRequest[];

  return { authRequests, claimRequests };
}

export function getResults(sismoConnectVerifiedResult: [VerifiedAuth[], VerifiedClaim[], string]): {
  verifiedAuths: VerifiedAuth[];
  verifiedClaims: VerifiedClaim[];
  verifiedSignedMessage: string;
} {
  return {
    verifiedAuths: sismoConnectVerifiedResult[0] as VerifiedAuth[],
    verifiedClaims: sismoConnectVerifiedResult[1] as VerifiedClaim[],
    verifiedSignedMessage: sismoConnectVerifiedResult[2] as string,
  };
}
