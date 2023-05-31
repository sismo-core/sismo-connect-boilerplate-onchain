import {
  Chain,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
} from "viem";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { privateKeyToAccount } from "viem/accounts";
import { mumbaiFork } from "./wagmi";

declare global {
  interface Window {
    ethereum?: any;
  }
}


export const signMessage = (address: `0x${string}` | undefined) => {
  return encodeAbiParameters(
    [{ type: "address", name: "airdropAddress" }],
    [address as `0x${string}`]
  );
};

export const getPublicClient = (userChain: Chain): PublicClient => {
  return createPublicClient({
    chain: userChain,
    transport: http(),
  });
};

export const publicWalletClient = createWalletClient({
  chain: mumbaiFork,
  transport: http(),
  // The private key of the second account of the local anvil network
  // This account is used for the app to allow the user to have fake tokens to call the contract
  account: privateKeyToAccount(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  ),
});


export function handleVerifyErrors(e: any): any {
  // else if the tx is invalid, we show an error message
  // it is either because the proof is invalid or because the user already claimed the airdrop
  console.log("error", { ...(e as object) });
  console.log("metaMessages", (e as { metaMessages: string[] }).metaMessages);
  console.log("e.shortMessage", (e as { shortMessage: string })?.shortMessage ?? "");
  let returnedError: string[] = (e as { metaMessages: string[] }).metaMessages;

  if ((e as { metaMessages: string[] }).metaMessages) {
    // isolate the name of the error
    const error = (e as { metaMessages: string[] }).metaMessages[0].split("(")[0];
    const args = (e as { metaMessages: string[] }).metaMessages[1]
      // take the arguments between the parentheses
      .split("(")[1]
      .split(")")[0]
      // take each argument separated by a comma
      .split(",");
    console.log("args", args);
    console.log("error", error);

    if (error === "Error: AppIdMismatch") {
      returnedError = [
        "AppId in the client config (" +
          args[0] +
          ") does not match the one in the contract (" +
          args[1] +
          ").",
      ];
    }
    if (error === "Error: RegistryRootNotAvailable") {
      returnedError = [
        "Registry root " +
          args[0] +
          " not available. Check that you did not forget to add the devGroup to the Sismo Connect client config.",
      ];
    }
  }

  if ((e as { shortMessage: string })?.shortMessage === "User rejected the request.") {
    returnedError = ["User rejected the request."];
  }

  if (
    (e as { shortMessage: string }).shortMessage ===
      'The contract function "claimWithSismo" reverted with the following reason:\nERC721: transfer caller is not owner nor approved' ||
    (e as { shortMessage: string }).shortMessage ===
      'The contract function "claimWithSismo" reverted with the following reason:\nERC721: token already minted'
  ) {
    returnedError = ["Airdrop already claimed!"];
  }

  if (returnedError?.length === 0) {
    returnedError = ["An error occured"];
  }

  // if the error is an array of strings, we return the first two elements of the array
  // else we return the error
  return returnedError.length === 1 ? returnedError[0] : returnedError.slice(0, 2);
}

// ABI of all the errors that can be thrown by the contract inheriting Sismo Connect
export const errorsABI = [
  {
    // SismoConnectVerifier errors

    inputs: [
      {
        internalType: "bytes16",
        name: "receivedAppId",
        type: "bytes16",
      },
      {
        internalType: "bytes16",
        name: "expectedAppId",
        type: "bytes16",
      },
    ],
    name: "AppIdMismatch",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes16",
        name: "receivedNamespace",
        type: "bytes16",
      },
      {
        internalType: "bytes16",
        name: "expectedNamespace",
        type: "bytes16",
      },
    ],
    name: "NamespaceMismatch",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "requestVersion",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "responseVersion",
        type: "bytes32",
      },
    ],
    name: "VersionMismatch",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "requestMessageSignature",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "responseMessageSignature",
        type: "bytes",
      },
    ],
    type: "error",
    name: "SignatureMessageMismatch",
  },

  // HydraS2Verifier errors

  {
    inputs: [
      {
        internalType: "uint256",
        name: "claimTypeFromProof",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedClaimType",
        type: "uint256",
      },
    ],
    name: "ClaimTypeMismatch",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "claimTypeFromProof",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedClaimType",
        type: "uint256",
      },
    ],
    name: "ClaimTypeMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "ClaimValueMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlyOneAuthAndOneClaimIsSupported",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "version",
        type: "bytes32",
      },
    ],
    name: "InvalidVersion",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "userIdFromProof",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedUserId",
        type: "uint256",
      },
    ],
    name: "UserIdMismatch",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "inputRoot",
        type: "uint256",
      },
    ],
    name: "RegistryRootNotAvailable",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "vaultNamespaceFromProof",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedVaultNamespace",
        type: "uint256",
      },
    ],
    name: "VaultNamespaceMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "DestinationVerificationNotEnabled",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "extraDataFromProof",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedExtraData",
        type: "uint256",
      },
    ],
    name: "InvalidExtraData",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestIdentifierFromProof",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedRequestIdentifier",
        type: "uint256",
      },
    ],
    name: "RequestIdentifierMismatch",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "expectedX",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "expectedY",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "inputX",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "inputY",
        type: "bytes32",
      },
    ],
    name: "CommitmentMapperPubKeyMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "SourceVerificationNotEnabled",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "destinationFromProof",
        type: "address",
      },
      {
        internalType: "address",
        name: "expectedDestination",
        type: "address",
      },
    ],
    name: "DestinationMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidProof",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "accountsTreeValueFromProof",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedAccountsTreeValue",
        type: "uint256",
      },
    ],
    name: "AccountsTreeValueMismatch",
    type: "error",
  },

  // ClaimMatching errors

  {
    inputs: [
      {
        internalType: "bytes16",
        name: "requestClaimGroupId",
        type: "bytes16",
      },
      {
        internalType: "bytes16",
        name: "requestClaimGroupTimestamp",
        type: "bytes16",
      },
    ],
    name: "ClaimGroupIdAndGroupTimestampNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes16",
        name: "requestClaimGroupId",
        type: "bytes16",
      },
    ],
    name: "ClaimGroupIdNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes16",
        name: "requestClaimGroupTimestamp",
        type: "bytes16",
      },
    ],
    name: "ClaimGroupTimestampNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "responseClaimType",
        type: "uint8",
      },
      {
        internalType: "bytes16",
        name: "responseClaimGroupId",
        type: "bytes16",
      },
      {
        internalType: "bytes16",
        name: "responseClaimGroupTimestamp",
        type: "bytes16",
      },
      {
        internalType: "uint256",
        name: "responseClaimValue",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "responseExtraData",
        type: "bytes",
      },
    ],
    name: "ClaimInRequestNotFoundInResponse",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "requestClaimType",
        type: "uint8",
      },
      {
        internalType: "bytes16",
        name: "requestClaimGroupId",
        type: "bytes16",
      },
    ],
    name: "ClaimTypeAndGroupIdNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "requestClaimType",
        type: "uint8",
      },
      {
        internalType: "bytes16",
        name: "requestClaimGroupTimestamp",
        type: "bytes16",
      },
    ],
    name: "ClaimTypeAndGroupTimestampNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "requestClaimType",
        type: "uint8",
      },
    ],
    name: "ClaimTypeNotFound",
    type: "error",
  },

  // AuthMatchingLib errors

  {
    inputs: [
      {
        internalType: "uint8",
        name: "requestAuthType",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "requestIsAnon",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "requestUserId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "requestExtraData",
        type: "bytes",
      },
    ],
    name: "AuthInRequestNotFoundInResponse",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "requestIsAnon",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "requestUserId",
        type: "uint256",
      },
    ],
    name: "AuthIsAnonAndUserIdNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "requestIsAnon",
        type: "bool",
      },
    ],
    name: "AuthIsAnonNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "requestAuthType",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "requestIsAnon",
        type: "bool",
      },
    ],
    name: "AuthTypeAndIsAnonNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "requestAuthType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "requestUserId",
        type: "uint256",
      },
    ],
    name: "AuthTypeAndUserIdNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "requestAuthType",
        type: "uint8",
      },
    ],
    name: "AuthTypeNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestUserId",
        type: "uint256",
      },
    ],
    name: "AuthUserIdNotFound",
    type: "error",
  },
];
