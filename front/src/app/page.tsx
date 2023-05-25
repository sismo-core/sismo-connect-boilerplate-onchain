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
import {
  mainnet,
  goerli,
  sepolia,
  optimism,
  optimismGoerli,
  arbitrum,
  arbitrumGoerli,
  scrollTestnet,
  gnosis,
  polygon,
  polygonMumbai,
} from "viem/chains";
import { waitForTransaction } from "@wagmi/core";
import { decodeEventLog, formatEther } from "viem";
import {
  AuthType,
  ClaimType,
  SismoConnectButton,
  SismoConnectConfig,
} from "@sismo-core/sismo-connect-react";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { errorsABI, formatError, fundMyAccountOnLocalFork, signMessage } from "@/utils/misc";
import { mumbaiFork } from "@/utils/wagmi";

/* ***********************  Sismo Connect Config *************************** */
const sismoConnectConfig: SismoConnectConfig = {
  appId: "0xf4977993e52606cfd67b7a1cde717069",
  vault: {
    // For development purposes insert the identifier that you want to impersonate any account here
    // Never use this in production
    impersonate: [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
      "0xce2ef28c65e5db090d75630c98a807da003fb36f", // a Gitcoin Passport Holder
      "twitter:dhadrien_:2390703980", // the twitter account @dhadrien_
      "0x855193BCbdbD346B423FF830b507CBf90ecCc90B", // the address of a Sismo team member
    ],
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
  const { switchNetworkAsync } = useSwitchNetwork();

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
      <main className={styles.main}>
        <h1>
          <b> Boilerplate</b>
          <br />
          Sismo Connect onchain
        </h1>

        {!isConnected && (
          <>
            <p>This is a simple ERC20 gated airdrop example using Sismo Connect.</p>
            {connectors.map((connector) => (
              <button
                disabled={!connector.ready || isLoading}
                key={connector.id}
                onClick={() => connect({ connector })}
              >
                {isLoading && pendingConnector?.id === connector.id
                  ? "Connecting..."
                  : "Connect wallet"}
              </button>
            ))}
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
              claims={[
                // we ask the user to prove that he has a gitcoin passport with a score above 15
                // https://factory.sismo.io/groups-explorer?search=0x1cde61966decb8600dfd0749bd371f12
                {
                  groupId: "0x1cde61966decb8600dfd0749bd371f12",
                  claimType: ClaimType.GTE,
                  value: 15,
                },
                // we ask the user to prove that he is part of the Sismo Community group and selectively prove its level
                // https://factory.sismo.io/groups-explorer?search=0xd630aa769278cacde879c5c0fe5d203c
                { groupId: "0xd630aa769278cacde879c5c0fe5d203c", isSelectableByUser: true },
                // we optionally ask the user to prove that he is following Sismo on Lens
                // https://factory.sismo.io/groups-explorer?search=0x29a90aaa3cf9431020c040a6c674efd3
                { groupId: "0x29a90aaa3cf9431020c040a6c674efd3", isOptional: true },
                // we optionally ask the user to prove that he has voted on the Sismo Snapshot Space
                // https://factory.sismo.io/groups-explorer?search=0x45418b1a35d370469c0338116fdc1001
                { groupId: "0x45418b1a35d370469c0338116fdc1001", isOptional: true },
              ]}
              // we ask the user to sign a message
              // it will be used onchain to prevent frontrunning
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
        {isConnected && !amountClaimed && error && <p className={styles.error}>{error}</p>}
      </main>

      {isConnected && (
        <button className={styles.disconnect} onClick={() => resetApp()}>
          Reset
        </button>
      )}
    </>
  );
}
