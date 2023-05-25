import { AuthType, SismoConnectResponse } from "@sismo-core/sismo-connect-react";
import getMinifiedId from "./getMinifiedId";

export type SismoUserId = {
  id: string;
  minifiedId: string;
};

export default function getSismoUserId(response: SismoConnectResponse | null) {
  if (!response) return null;

  const userId = response?.proofs?.find(
    (proof) => proof.auths && proof?.auths[0]?.authType === AuthType.VAULT
  )?.auths?.[0]?.userId;

  if (!userId) return null;

  return {
    id: userId,
    minifiedId: getMinifiedId(userId),
  };
}
