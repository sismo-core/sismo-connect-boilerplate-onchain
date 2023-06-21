import { SismoConnectResponse } from "@sismo-core/sismo-connect-react";
import { decodeAbiParameters } from "viem";


export default function getSismoSignature(response: SismoConnectResponse | null) {
  if (!response) return "";
  const address = response?.signedMessage
  if(!address) return "";

  const decodedAddress = decodeAbiParameters(
    [{ type: "address", name: "airdropAddress" }],
    address as `0x${string}`
  );
  if (!decodedAddress?.[0]) return "";
  return decodedAddress[0] as `0x${string}`;

}
