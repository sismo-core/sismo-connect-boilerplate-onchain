"use client";

import styles from "./page.module.css";
import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useContractWrite,
  useDisconnect,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
} from "wagmi";
import { waitForTransaction } from "@wagmi/core";
import { decodeEventLog, formatEther } from "viem";
import {
  AuthType,
  ClaimType,
  SismoConnectButton,
  SismoConnectClientConfig,
} from "@sismo-core/sismo-connect-react";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { errorsABI, formatError, fundMyAccount, signMessage } from "@/utils/misc";

/* ***********************  Sismo Connect Config *************************** */
const sismoConnectConfig: SismoConnectClientConfig & {
  vault?: {
    impersonate: string[];
  };
} = {
  appId: "0xf4977993e52606cfd67b7a1cde717069",
  devMode: {
    enabled: true,
    displayRawResponse: false,
  },
  // vault: {
  //   impersonate: ["0x5fd15ef419c907717362fa82b8c364a3959f2bac", "github:leosayous21"],
  // },
  vaultAppBaseUrl: "https://staging.dev.vault-beta.sismo.io",
};

const CHAIN_ID = 5151111;

export default function Home() {
  /* ***********************  Application states *************************** */
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [amountClaimed, setAmountClaimed] = useState<string>("");
  const [responseBytes, setResponseBytes] = useState<string>("");

  /* ***************  Wagmi hooks for wallet connection ******************** */
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetworkAsync } = useSwitchNetwork();

  /* *************  Wagmi hooks for contract interaction ******************* */
  const { config, error: wagmiSimulateError } = usePrepareContractWrite({
    address: transactions[0].contractAddress as `0x${string}}`,
    abi: [...AirdropABI, ...errorsABI],
    functionName: "claimWithSismo",
    args: [responseBytes],
  });
  const { writeAsync } = useContractWrite(config);

  /* *************  Handle simulateContract call errors ******************** */
  useEffect(() => {
    if (!wagmiSimulateError) return;
    if (!isConnected) return;
    return setError(formatError(wagmiSimulateError));
  }, [wagmiSimulateError, isConnected]);

  /* ************  Handle the airdrop claim button click ******************* */
  async function claimAirdrop() {
    setError("");
    setLoading(true);
    try {
      // Switch to mumbai fork if not already on it
      if (chain?.id !== CHAIN_ID) await switchNetworkAsync?.(CHAIN_ID);
      const tx = await writeAsync?.();
      const txReceipt = tx && (await waitForTransaction({ hash: tx.hash }));
      if (txReceipt?.status === "success") {
        const mintEvent = decodeEventLog({
          abi: AirdropABI,
          data: txReceipt.logs[0]?.data,
          topics: txReceipt.logs[0]?.topics,
        });
        const args = mintEvent?.args as {
          value: string;
        };
        const ethAmount = formatEther(BigInt(args.value));
        setAmountClaimed(ethAmount);
      }
    } catch (e: any) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }

  /* ***********  Fund my connected account on mumbai fork ******************* */
  useEffect(() => {
    if (!address) return;
    fundMyAccount(address);
  }, [address]);

  /* *************************  Reset state **************************** */
  function resetApp() {
    disconnect();
    setAmountClaimed("");
    setResponseBytes("");
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("sismoConnectResponseCompressed");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <>
      <main className={styles.main}>
        <h1>
          <b> Boilerplate</b>
          <br />
          Sismo Connect onchain
        </h1>

        {!isConnected && (
          <>
            <p>This is a simple ERC20 gated airdrop example using Sismo Connect.</p>
            <button
              disabled={!connectors[0].ready || isLoading}
              onClick={() => connect({ connector: connectors[0] })}
            >
              {!isLoading ? "Connect wallet" : "Connecting..."}
            </button>
          </>
        )}

        {isConnected && !responseBytes && (
          <>
            <p>Using Sismo Connect we will protect our airdrop from:</p>
            <br />
            <ul>
              <li>Double-spending: each user has a unique Vault id derived from your app id.</li>
              <li>Front-running: the airdrop destination address is sent as signature request</li>
              <li>
                Sybil-resistance attack: proving a unique gitcoin passport with a score above 15
              </li>
              <li>Gated: airdrop is only available for Sismo Contributors</li>
            </ul>
            <br />
            <p>
              <b>Chain: Local Fork Mumbai</b>
              <br />
              <b>Your airdrop destination address is: {address}</b>
            </p>

            <SismoConnectButton
              // the client config created
              config={sismoConnectConfig}
              // the auth request we want to make
              // here we want the proof of a Sismo Vault ownership from our users
              auths={[{ authType: AuthType.VAULT }]}
              claims={[
                // we ask the user to prove that he has a gitcoin passport with a score above 15
                // https://factory.sismo.io/groups-explorer?search=0x1cde61966decb8600dfd0749bd371f12
                {
                  groupId: "0x1cde61966decb8600dfd0749bd371f12",
                  claimType: ClaimType.GTE,
                  value: 15,
                },
                // we ask the user to prove that he is part of the Sismo Contributors group and selectively prove its level
                // https://factory.sismo.io/groups-explorer?search=0xe9ed316946d3d98dfcd829a53ec9822e
                { groupId: "0xe9ed316946d3d98dfcd829a53ec9822e", isSelectableByUser: true},
                // we optionally ask the user to prove that he is following Sismo on Lens
                // https://factory.sismo.io/groups-explorer?search=0xabf3ea8c23ff96893ac5caf4d2fa7c1f
                { groupId: "0xabf3ea8c23ff96893ac5caf4d2fa7c1f", isOptional: true},
              ]}
              // we ask the user to sign a message
              // it will be used onchain to prevent front running
              signature={{ message: signMessage(address) }}
              // onResponseBytes calls a 'setResponse' function with the responseBytes returned by the Sismo Vault
              onResponseBytes={(responseBytes: string) => {
                console.log("responseBytes", responseBytes);
                setResponseBytes(responseBytes);
              }}
              // Some text to display on the button
              text={"Claim with Sismo"}
            />
          </>
        )}

        {isConnected && responseBytes && !amountClaimed && (
          <>
            <p>Chain: Local Fork Mumbai</p>
            <p>Your airdrop destination address is: {address}</p>
            <button
              disabled={loading || Boolean(wagmiSimulateError)}
              onClick={() => claimAirdrop()}
            >
              {!loading ? "Claim" : "Claiming..."}
            </button>
          </>
        )}

        {isConnected && responseBytes && amountClaimed && (
          <>
            <p>Congratulations!</p>
            <p>
              You have claimed {amountClaimed} tokens on {address}.
            </p>
          </>
        )}
        {isConnected && responseBytes && !amountClaimed && error && (
          <p className={styles.error}>{error}</p>
        )}
      </main>

      {isConnected && (
        <button className={styles.disconnect} onClick={() => resetApp()}>
          Reset
        </button>
      )}
    </>
  );
}
