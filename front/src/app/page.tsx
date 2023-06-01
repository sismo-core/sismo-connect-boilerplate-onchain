"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { use, useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useContractEvent,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
} from "wagmi";
import {
  AuthType,
  ClaimType,
  SismoConnectButton,
  SismoConnectClientConfig,
} from "@sismo-core/sismo-connect-react";
import { errorsABI, signMessage } from "@/utils/misc";
import { sismoConnectConfig } from "@/utils/sismo";
import { fundMyAccount, mumbaiFork } from "@/utils/wagmi";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { waitForTransaction } from "@wagmi/core";
import { decodeEventLog } from "viem";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { chain } = useNetwork();
  const { switchNetworkAsync } = useSwitchNetwork();

  const [responseBytes, setResponseBytes] = useState<string>("");
  const [claimsStatus, setClaimsStatus] = useState<
    "idle" | "loading" | "success" | "error" | "already-claimed"
  >("idle");

  const [txSummary, setTxSummary] = useState({
    txHash: "",
    destinationAddress: "",
    amount: "",
  });

  const { config, error: prepareContractWriteError } = usePrepareContractWrite({
    address: transactions[0].contractAddress as `0x${string}}`,
    abi: [...AirdropABI, ...errorsABI],
    functionName: "claimWithSismo",
    args: [],
  });

  const { writeAsync } = useContractWrite(config);

  // Check if user has already claimed the airdrop using viem simulate call on usePrepareContractWrite
  useEffect(() => {
    if (!prepareContractWriteError) return;
    if (prepareContractWriteError?.message?.includes("AlreadyClaimed()")) {
      setClaimsStatus("already-claimed");
    }
  }, [prepareContractWriteError]);

  // Fund my connected account on mumbai fork
  useEffect(() => {
    if (!address) return;
    fundMyAccount(address);
  }, [address]);

  async function onAirdropClaim() {
    setClaimsStatus("loading");

    try {
      // Switch to mumbai fork if not already on it
      if (chain?.id !== mumbaiFork.id) {
        await switchNetworkAsync?.(mumbaiFork.id);
      }

      // Send the transaction
      const tx = await writeAsync?.();

      // Wait for the transaction to be mined
      const txReceipt = tx && (await waitForTransaction({ hash: tx.hash }));

      // If the transaction was successful, decode the event log to get the airdrop summary
      if (txReceipt?.status === "success") {

        const event = decodeEventLog({
          abi: [...AirdropABI, ...errorsABI],
          data: txReceipt.logs[0]?.data,
          topics: txReceipt.logs[0]?.topics,
        });

        if (event?.args) {
          setTxSummary({
            txHash: txReceipt.transactionHash,
            destinationAddress: (event.args as any).to,
            amount: (event.args as any).value,
          });
        }

        setClaimsStatus("success");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (e) {
      console.log(e);
      setClaimsStatus("error");
    }
  }

  return (
    <main className={styles.main}>
      <h1>
        <b> Boilerplate</b>
        <br />
        Sismo Connect onchain
      </h1>

      {!isConnected && (
        <>
          <p>This is a simple ERC20 gated airdrop example using Sismo Connect.</p>
          <br />
          <p>
            To be eligible to the airdrop, you will prove in a privacy preserving manner that you:
          </p>
          <br />
          <ul>
            <li>have gitcoin passport with a score above 15,</li>
            <li>are part of the Sismo Contributors group.</li>
          </ul>
          <br />
          <p>
            Additionally, if you are following Sismo on Lens or that you have voted on the Sismo DAO
            on Snapshot, you will get an additional airdrop of 100 tokens per claim.
          </p>

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
              { groupId: "0xe9ed316946d3d98dfcd829a53ec9822e", isSelectableByUser: true },
              // we optionally ask the user to prove that he is following Sismo on Lens
              // https://factory.sismo.io/groups-explorer?search=0xabf3ea8c23ff96893ac5caf4d2fa7c1f
              { groupId: "0xabf3ea8c23ff96893ac5caf4d2fa7c1f", isOptional: true },
            ]}
            // we ask the user to sign a message
            // it will be used onchain to prevent front running
            signature={{ message: signMessage(address) }}
            // onResponseBytes calls a 'setResponse' function with the responseBytes returned by the Sismo Vault
            onResponseBytes={(responseBytes: string) => setResponseBytes(responseBytes)}
            // Some text to display on the button
            text={"Claim with Sismo"}
          />
        </>
      )}

      {isConnected &&
        responseBytes &&
        (claimsStatus === "idle" || claimsStatus === "loading" || claimsStatus === "error") && (
          <>
            <p>Using Sismo Connect we will protect our airdrop from:</p>
            <br />
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

            <button
              disabled={claimsStatus === "loading"}
              onClick={() => {
                onAirdropClaim();
              }}
            >
              {claimsStatus !== "loading" ? "Claim" : "Claiming..."}
            </button>
            {claimsStatus === "error" && <p>An error has occurred during your transaction</p>}
          </>
        )}

      {isConnected && responseBytes && claimsStatus === "success" && (
        <>
          <p>Congratulations!</p>
        </>
      )}

      {isConnected && responseBytes && claimsStatus === "already-claimed" && (
        <>
          <p>Already claimed</p>
        </>
      )}
    </main>
  );
}
