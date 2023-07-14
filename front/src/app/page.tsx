"use client";

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
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { decodeEventLog, formatEther } from "viem";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { formatError, signMessage } from "@/utils/misc";
import { mumbaiFork } from "@/utils/wagmi";
import {
  SismoConnectButton, // the Sismo Connect React button displayed below
  SismoConnectConfig, // the Sismo Connect config with your appId
  AuthType, // the authType enum, we will choose 'VAULT' in this tutorial
  ClaimType, // the claimType enum, we will choose 'GTE' in this tutorial, to check that the user has a value greater than a given threshold
} from "@sismo-core/sismo-connect-react";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { fundMyAccountOnLocalFork } from "@/utils/fundMyAccountOnLocalFork";
import { errorsABI } from "@/utils/errorsABI";

/* ***********************  Sismo Connect Config *************************** */

// you can create a new Sismo Connect app at https://factory.sismo.io
// The SismoConnectConfig is a configuration needed to connect to Sismo Connect and requests data from your users.

const sismoConnectConfig: SismoConnectConfig = {
  appId: "0xf4977993e52606cfd67b7a1cde717069",
  vault: {
    // For development purposes
    // insert any account that you want to impersonate  here
    // Never use this in production
    impersonate: ["dhadrien.sismo.eth", "twitter:dhadrien_", "github:dhadrien"],
  },
};

/* ********************  Defines the chain to use *************************** */
const CHAIN = mumbaiFork;

export default function Home() {
  /* ***********************  Application states *************************** */
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [amountClaimed, setAmountClaimed] = useState<string>("");
  const [responseBytes, setResponseBytes] = useState<string>("");

  /* ***************  Wagmi hooks for wallet connection ******************** */
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { isConnected, address } = useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });
  const { switchNetworkAsync, switchNetwork } = useSwitchNetwork();
  const { openConnectModal, connectModalOpen } = useConnectModal();

  /* *************  Wagmi hooks for contract interaction ******************* */
  const contractCallInputs =
    responseBytes && chain
      ? {
          address: transactions[0].contractAddress as `0x${string}}`,
          abi: [...AirdropABI, ...errorsABI],
          functionName: "claimWithSismo",
          args: [responseBytes],
          chain,
        }
      : {};

  const { config, error: wagmiSimulateError } = usePrepareContractWrite(contractCallInputs);
  const { writeAsync } = useContractWrite(config);

  /* *************  Handle simulateContract call & chain errors ************ */
  useEffect(() => {
    if (chain?.id !== CHAIN.id) return setError(`Please switch to ${CHAIN.name} network`);
    setError("");
  }, [chain]);

  useEffect(() => {
    if (!wagmiSimulateError) return;
    if (!isConnected) return;
    return setError(formatError(wagmiSimulateError));
  }, [wagmiSimulateError, isConnected]);

  /* ************  Handle the airdrop claim button click ******************* */
  async function claimAirdrop() {
    if (!address) return;
    setError("");
    setLoading(true);
    try {
      // Switch to the selected network if not already on it
      if (chain?.id !== CHAIN.id) await switchNetworkAsync?.(CHAIN.id);
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
      <main>
        <h1>
          <b> Tutorial</b>
          <br />
          Sismo Connect onchain
        </h1>

        {!isConnected && (
          <button
          onClick={() => openConnectModal?.()}
          disabled={connectModalOpen}
        >
          {connectModalOpen ? "Connecting wallet..." : "Connect wallet to claim"}
        </button>
        )}

        {isConnected && !responseBytes && (
          <>
            <p>
              <b>Chain: {chain?.name}</b>
              <br />
              <b>Your airdrop destination address is: {address}</b>
            </p>

            <SismoConnectButton
              // the client config created
              config={sismoConnectConfig}
              // the auth request we want to make
              // here we want the proof of a Sismo Vault ownership from our users
              auths={[{ authType: AuthType.VAULT }]}
              // we ask the user to sign a message
              // it will be used onchain to prevent frontrunning
              signature={{ message: signMessage(address!) }}
              // onResponseBytes calls a 'setResponse' function with the responseBytes returned by the Sismo Vault
              onResponseBytes={(responseBytes: string) => {
                setResponseBytes(responseBytes);
              }}
              // Some text to display on the button
              text={"Claim with Sismo"}
            />
          </>
        )}

        {isConnected && responseBytes && !amountClaimed && (
          <>
            <p>Chain: {chain?.name}</p>
            <p>Your airdrop destination address is: {address}</p>
            <button disabled={loading || Boolean(error)} onClick={() => claimAirdrop()}>
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
        {isConnected && !amountClaimed && error && (
          <>
            <p>{error}</p>
            {error.slice(0, 16) === "Please switch to" && (
              <button onClick={() => switchNetwork?.(CHAIN.id)}>Switch chain</button>
            )}
          </>
        )}
      </main>

      {isConnected && (
        <button onClick={() => resetApp()}>
          Reset
        </button>
      )}
    </>
  );
}