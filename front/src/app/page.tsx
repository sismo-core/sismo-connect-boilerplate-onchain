"use client";

import { useEffect, useState } from "react";
import { Account } from "../components/Account";
import { Connect } from "../components/Connect";
import { Connected } from "../components/Connected";
import { NetworkSwitcher } from "../components/NetworkSwitcher";
import {
  SismoConnectButton,
  SismoConnectConfig,
  AuthType,
  ClaimType,
  SismoConnectResponse,
  sismoConnectErrorsABI,
} from "@sismo-core/sismo-connect-react";

import {
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
  useContractWrite,
  useAccount,
} from "wagmi";
import { TransactionReceipt, encodeAbiParameters } from "viem";
import { mumbaiFork } from "../utils/wagmi";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { waitForTransaction } from "@wagmi/core";

const sismoConnectConfig: SismoConnectConfig = {
  appId: "0x32403ced4b65f2079eda77c84e7d2be6",
  vault: {
    // For development purposes insert the Data Sources that you want to impersonate
    // Never use this in production
    impersonate: [
      // EVM Data Sources
      "dhadrien.sismo.eth",
      "leo21.sismo.eth",
      "0xA4C94A6091545e40fc9c3E0982AEc8942E282F38",
      "vitalik.eth",
      // Github Data Source
      "github:dhadrien",
      // Twitter Data Source
      "twitter:dhadrien_",
      // Telegram Data Source
      "telegram:dhadrien",
    ],
  },
  // this enables you to get access directly to the
  // Sismo Connect Response in the vault instead of redirecting back to the app
  // displayRawResponse: true,
};

const CHAIN = mumbaiFork;

export function Page() {
  const [response, setResponse] = useState<SismoConnectResponse | null>(null);
  const [responseBytes, setResponseBytes] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const { isConnected } = useAccount();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // const { config, isError, error } = usePrepareAirdropVerifySismoConnectResponse({
  //   args: [responseBytes as `0x${string}`],
  // });

  const prepareContractWrite = usePrepareContractWrite(
    responseBytes && CHAIN.id
      ? {
          address: transactions[0].contractAddress as `0x${string}`,
          abi: [...AirdropABI, ...sismoConnectErrorsABI],
          functionName: "verifySismoConnectResponse",
          args: [responseBytes],
          chainId: CHAIN.id,
        }
      : {}
  );

  useEffect(() => {
    if (prepareContractWrite?.isError) {
      console.log(prepareContractWrite?.error?.message);
    }
  }, [prepareContractWrite.isError, prepareContractWrite.error]);

  const contractWrite = useContractWrite(prepareContractWrite?.config);

  async function signIn() {
    if (!isConnected) return;
    setError("");
    setIsLoading(true);

    try {
      const tx = await contractWrite?.writeAsync?.();

      // On mumbai fork, the if the wallet nounce is incorrect tx is not mined
      let txReceipt: TransactionReceipt | undefined;
      if (CHAIN.id === 5151111) {
        const timeout = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Local fork error: operation timed out after 15 seconds, if you are running a local fork on Anvil please make sure to reset your wallet nounce."
                )
              ),
            15000
          )
        );
        const txReceiptPromise = tx && waitForTransaction({ hash: tx.hash });
        const race = await Promise.race([txReceiptPromise, timeout]);
        txReceipt = race as TransactionReceipt;
      } else {
        txReceipt = tx && (await waitForTransaction({ hash: tx.hash }));
      }
    } catch (e: any) {
      if (e?.message?.includes("User rejected the request")) {
        setError("");
        return;
      }
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }

  function ProcessingMessage({ hash }: { hash?: `0x${string}` }) {
    const { chain } = useNetwork();
    const etherscan = chain?.blockExplorers?.etherscan;
    return (
      <span>
        Processing transaction...{" "}
        {etherscan && <a href={`${etherscan.url}/tx/${hash}`}>{etherscan.name}</a>}
      </span>
    );
  }

  useEffect(() => {
    console.log("config", prepareContractWrite.config);
    // console.log("signIn", signIn);
    console.log("isLoading", isLoading);
    console.log("response", response);
    console.log("responseBytes", responseBytes);
  }, [isLoading, response, responseBytes, prepareContractWrite]);

  return (
    <>
      <h2>Sismo Connect onchain boilerplate</h2>

      <Connect />

      <Connected>
        <Account />
        <SismoConnectButton
          config={sismoConnectConfig}
          // Auths = Data Source Ownership Requests
          auths={[
            // Anonymous identifier of the vault for this app
            // vaultId = hash(vaultSecret, appId).
            // full docs: https://docs.sismo.io/sismo-docs/build-with-sismo-connect/technical-documentation/vault-and-proof-identifiers
            // user is required to prove ownership of their vaultId for this appId
            { authType: AuthType.VAULT },
            // user is required to prove ownership of an EVM account from their vault
            { authType: AuthType.EVM_ACCOUNT },
            // user is required to prove ownership of 0xa4c94a6091545e40fc9c3e0982aec8942e282f38
            {
              authType: AuthType.EVM_ACCOUNT,
              userId: "0xa4c94a6091545e40fc9c3e0982aec8942e282f38", // impersonated
            },
            // user is required to prove ownership of a GitHub account
            { authType: AuthType.GITHUB },
            // user can prove ownership of a Twitter account, optional
            { authType: AuthType.TWITTER, isOptional: true },
            // user can prove ownership of @dhadrien Telegram account, optional
            //                                   telegram of @dhadrien
            { authType: AuthType.TELEGRAM, userId: "875608110", isOptional: true },
          ]}
          // Claims = prove groump membership of a Data Source in a specific Data Group.
          // Data Groups = [{[dataSource1]: value1}, {[dataSource1]: value1}, .. {[dataSource]: value}]
          // When doing so Data Source is not shared to the app.
          claims={[
            {
              // claim on Sismo Hub GitHub Contributors Data Group membership: https://factory.sismo.io/groups-explorer?search=0xda1c3726426d5639f4c6352c2c976b87
              // Data Group members          = contributors to sismo-core/sismo-hub
              // value for each group member = number of contributions
              // request user to prove membership in the group
              groupId: "0xda1c3726426d5639f4c6352c2c976b87", // impersonated github:dhadrien has 1 contribution, eligible
            },
            {
              // claim ENS DAO Voters Data Group membership: https://factory.sismo.io/groups-explorer?search=0x85c7ee90829de70d0d51f52336ea4722
              // Data Group members          = voters in ENS DAO
              // value for each group member = number of votes in ENS DAO
              // request user to prove membership in the group with value >= 17
              groupId: "0x85c7ee90829de70d0d51f52336ea4722",
              claimType: ClaimType.GTE,
              value: 4, // impersonated dhadrien.sismo.eth has 17 votes, eligible
            },
            {
              // claim on Stand with Crypto NFT Minters Data Group membership: https://factory.sismo.io/groups-explorer?search=0xfae674b6cba3ff2f8ce2114defb200b1
              // Data Group members          = minters of the Stand with Crypto NFT
              // value for each group member = number of NFT minted
              // request user to prove membership in the group with value = 10
              groupId: "0xfae674b6cba3ff2f8ce2114defb200b1",
              claimType: ClaimType.EQ,
              value: 10, // dhadrin.sismo.eth minted exactly 10, eligible
            },
            {
              // claim Gitcoin Passport Holders Data Group membership: https://factory.sismo.io/groups-explorer?search=0x1cde61966decb8600dfd0749bd371f12
              // Data Group members          = Gitcoin Passport Holders
              // value for each group member = Gitcoin Passport Score
              // request user to prove membership in the group with value > 15, user can reveal more if they want
              groupId: "0x1cde61966decb8600dfd0749bd371f12",
              claimType: ClaimType.GTE,
              value: 15, // dhadrien.sismo.eth has a score of 46, eligible. Can reveal more.
              isSelectableByUser: true, // can reveal more than 15 if they want
            },
            {
              // claim on Stand with Crypto NFT Minters Data Group membership: https://factory.sismo.io/groups-explorer?search=0xfae674b6cba3ff2f8ce2114defb200b1
              // optional request user to prove membership in the group with value >= 6
              groupId: "0xfae674b6cba3ff2f8ce2114defb200b1",
              claimType: ClaimType.GTE,
              value: 6, // dhadrien.sismo.eth minted 10 NFTs, eligible
              isOptional: true,
            },
            {
              // claim on Gitcoin Passport Holders Data Group membership: https://factory.sismo.io/groups-explorer?search=0x1cde61966decb8600dfd0749bd371f12
              // optional request user to prove membership in the group with value = 15
              groupId: "0x1cde61966decb8600dfd0749bd371f12",
              claimType: ClaimType.EQ,
              value: 15, // dhadrien.sismo.eth has a score of 46 != 15, not eligible.
              isOptional: true, // can chose not to reveal
            },
            {
              // claim on Sismo Hub GitHub Contributors Data Group membership: https://factory.sismo.io/groups-explorer?search=0xda1c3726426d5639f4c6352c2c976b87
              // optional request user to prove membership in the group and reveal any value they want
              groupId: "0xda1c3726426d5639f4c6352c2c976b87",
              claimType: ClaimType.GTE,
              value: 1,
              isSelectableByUser: true, // can selectively disclose more if user wants
              isOptional: true, // can chose not to reveal
            },
          ]}
          // we ask the user to sign a message
          signature={{
            message: encodeAbiParameters(
              [{ type: "string", name: "signature" }],
              ["I love Sismo!"]
            ),
            isSelectableByUser: true,
          }}
          // onResponseBytes calls a 'setResponse' function with the responseBytes returned by the Sismo Vault
          onResponse={async (response: SismoConnectResponse) => {
            setResponse(response);
          }}
          onResponseBytes={async (responseBytes: string) => {
            setResponseBytes(responseBytes);
          }}
        />
        {/* <Airdrop />  */}
        {responseBytes !== null && (
          <div>
            <button disabled={isLoading} onClick={() => signIn?.()}>
              Sign In
            </button>
          </div>
        )}
        <NetworkSwitcher />
      </Connected>
    </>
  );
}

export default Page;
