"use client";

import { useEffect, useState } from "react";
import Header from "./components/Header";
import {
  useAccount,
  useConnect,
  useContractWrite,
  useDisconnect,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
} from "wagmi";
import { waitForTransaction, readContract } from "@wagmi/core";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { decodeEventLog, formatEther } from "viem";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { formatError, signMessage } from "@/utils/misc";
import { mumbaiFork } from "@/utils/wagmi";
import {
  SismoConnectButton, // the Sismo Connect React button displayed below
} from "@sismo-core/sismo-connect-react";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { fundMyAccountOnLocalFork } from "@/utils/fundMyAccountOnLocalFork";
import { errorsABI } from "@/utils/errorsABI";
import {
  AUTHS,
  CLAIMS,
  CONFIG,
  VerifiedAuth,
  VerifiedClaim,
  AuthType,
  ClaimType,
} from "@/app/sismo-connect-config";

/* ********************  Defines the chain to use *************************** */
const CHAIN = mumbaiFork;

export default function Home() {
  /* ***********************  Application states *************************** */
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [pageState, setPageState] = useState<string>("init");
  const [amountClaimed, setAmountClaimed] = useState<string>("");
  const [responseBytes, setResponseBytes] = useState<string>("");
  const [verifiedClaims, setVerifiedClaims] = useState<VerifiedClaim[]>();
  const [verifiedAuths, setVerifiedAuths] = useState<VerifiedAuth[]>();
  const [verifiedSignedMessage, setVerifiedSignedMessage] = useState<string>();

  /* ***************  Wagmi hooks for wallet connection ******************** */
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
      setPageState("confirmingTransaction");
      const tx = await writeAsync?.();
      setPageState("verifying");
      const txReceipt = tx && (await waitForTransaction({ hash: tx.hash }));
      if (txReceipt?.status === "success") {
        setAmountClaimed(
          formatEther((await readAirdropContract("balanceOf", [address])) as unknown as bigint)
        );
        setVerifiedClaims((await readAirdropContract("getVerifiedClaims")) as VerifiedClaim[]);
        setVerifiedAuths((await readAirdropContract("getVerifiedAuths")) as VerifiedAuth[]);
        setVerifiedSignedMessage((await readAirdropContract("getVerifiedSignedMessage")) as string);
        setPageState("verified");
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
    setPageState("init");
    const url = new URL(window.location.href);
    url.searchParams.delete("sismoConnectResponseCompressed");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <>
      <main className="main">
        <Header />
        {!isConnected && (
          <button onClick={() => openConnectModal?.()} disabled={connectModalOpen}>
            {connectModalOpen ? "Connecting wallet..." : "Connect wallet"}
          </button>
        )}
        {isConnected && (
          <>
            <>
              {" "}
              <button onClick={() => resetApp()}>Reset</button>
              <p>
                <b>{`Chain: ${chain?.name} [${chain?.id}]`}</b>
                <br />
                <b>Your airdrop destination address is: {address}</b>
              </p>
            </>
            {pageState == "init" && (
              <>
                <SismoConnectButton
                  config={CONFIG}
                  // Auths = Data Source Ownership Requests
                  auths={AUTHS}
                  // Claims = prove groump membership of a Data Source in a specific Data Group.
                  // Data Groups = [{[dataSource1]: value1}, {[dataSource1]: value1}, .. {[dataSource]: value}]
                  // When doing so Data Source is not shared to the app.
                  claims={CLAIMS}
                  // we ask the user to sign a message
                  // it will be used onchain to prevent frontrunning
                  signature={{ message: signMessage(address!) }}
                  // onResponseBytes calls a 'setResponse' function with the responseBytes returned by the Sismo Vault
                  onResponseBytes={(responseBytes: string) => {
                    setResponseBytes(responseBytes);
                    setPageState("responseReceived");
                  }}
                  // Some text to display on the button
                  text={"Claim with Sismo"}
                />
                <p className="callout">
                  {" "}
                  Notes: <br />
                  1. First ZK Proof generation takes longer time, especially with bad internat as
                  there is a zkey file to download once in the data vault connection <br />
                  2. The more proofs you request, the longer it takes to generate them (about 2 secs
                  per proof)
                </p>
              </>
            )}
            <div className="status-wrapper">
              {pageState == "responseReceived" && (
                <button onClick={() => claimAirdrop()}>{"Claim"}</button>
              )}
              {pageState == "confirmingTransaction" && (
                <button disabled={true}>{"Confirm tx in wallet"}</button>
              )}
              {pageState == "verifying" && (
                <span className="verifying"> Verifying ZK Proofs onchain... </span>
              )}
              {pageState == "verified" && <span className="verified"> ZK Proofs Verified! </span>}
            </div>
            {isConnected && !amountClaimed && error && (
              <>
                <p>{error}</p>
                {error.slice(0, 16) === "Please switch to" && (
                  <button onClick={() => switchNetwork?.(CHAIN.id)}>Switch chain</button>
                )}
              </>
            )}
            {/* Table of the Sismo Connect requests and verified result */}
            {/* Table for Verified Auths */}
            {verifiedAuths && (
              <>
                <p>
                  {amountClaimed} tokens were claimd in total on {address}.
                </p>
                <h3>Verified Auths</h3>
                <table>
                  <thead>
                    <tr>
                      <th>AuthType</th>
                      <th>Verified UserId</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedAuths.map((auth, index) => (
                      <tr key={index}>
                        <td>{AuthType[auth.authType]}</td>
                        <td>
                          {getuserIdFromHex(
                            "0x" + (auth.userId! as unknown as number).toString(16)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <br />
            {/* Table for Verified Claims */}
            {verifiedClaims && (
              <>
                <h3>Verified Claims</h3>
                <table>
                  <thead>
                    <tr>
                      <th>groupId</th>
                      <th>ClaimType</th>
                      <th>Verified Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedClaims.map((claim, index) => (
                      <tr key={index}>
                        <td>
                          <a
                            target="_blank"
                            href={
                              "https://factory.sismo.io/groups-explorer?search=" + claim.groupId
                            }
                          >
                            {claim.groupId}
                          </a>
                        </td>
                        <td>{ClaimType[claim.claimType!]}</td>
                        <td>{claim.value!.toString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {/* Table of the Auths requests*/}
            <h3>Auths requested</h3>
            <table>
              <thead>
                <tr>
                  <th>AuthType</th>
                  <th>Requested UserId</th>
                  <th>Optional?</th>
                  <th>ZK proof</th>
                </tr>
              </thead>
              <tbody>
                {AUTHS.map((auth, index) => (
                  <tr key={index}>
                    <td>{AuthType[auth.authType]}</td>
                    <td>{auth.userId || "No userId requested"}</td>
                    <td>{auth.isOptional ? "optional" : "required"}</td>
                    {verifiedAuths ? (
                      <td>{getProofDataForAuth(verifiedAuths, auth.authType)!.toString()}</td>
                    ) : (
                      <td> ZK proof not generated yet </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <br />
            {/* Table of the Claims requests  and their results */}
            <h3>Claims requested</h3>
            <table>
              <thead>
                <tr>
                  <th>GroupId</th>
                  <th>ClaimType</th>
                  <th>Requested Value</th>
                  <th>Can User Select Value?</th>
                  <th>Optional?</th>
                  <th>ZK proof</th>
                </tr>
              </thead>
              <tbody>
                {CLAIMS.map((claim, index) => (
                  <tr key={index}>
                    <td>
                      <a
                        target="_blank"
                        href={"https://factory.sismo.io/groups-explorer?search=" + claim.groupId}
                      >
                        {claim.groupId}
                      </a>
                    </td>
                    <td>{ClaimType[claim.claimType || 0]}</td>
                    <td>{claim.value ? claim.value : "1"}</td>
                    <td>{claim.isSelectableByUser ? "yes" : "no"}</td>
                    <td>{claim.isOptional ? "optional" : "required"}</td>
                    {verifiedClaims ? (
                      <td>
                        {
                          getProofDataForClaim(
                            verifiedClaims!,
                            claim.claimType || 0,
                            claim.groupId!,
                            claim.value || 1
                          )!
                        }
                      </td>
                    ) : (
                      <td> ZK proof not generated yet </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Table of the Signature request and its result */}
            <h3>Signature requested and verified</h3>
            <table>
              <thead>
                <tr>
                  <th>Message Requested</th>
                  <th>Verified Signed Message</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ message: signMessage(address!) }.message}</td>
                  <td>{verifiedSignedMessage ? verifiedSignedMessage : "ZK Proof not verified"}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </main>
    </>
  );
}

function readibleHex(userId: string, startLength = 6, endLength = 4, separator = "...") {
  if (!userId.toString().startsWith("0x")) {
    return userId; // Return the original string if it doesn't start with "0x"
  }
  return userId.substring(0, startLength) + separator + userId.substring(userId.length - endLength);
}

function getProofDataForAuth(verifiedAuths: VerifiedAuth[], authType: AuthType): string | null {
  for (const auth of verifiedAuths) {
    if (auth.proofData && auth.authType === authType) {
      return readibleHex("0x" + (auth.proofData as unknown as number).toString(16));
    }
  }

  return null; // returns null if no matching authType is found
}

function getProofDataForClaim(
  verifiedClaims: VerifiedClaim[],
  claimType: number,
  groupId: string,
  value: number
): string | null {
  for (const claim of verifiedClaims) {
    if (claim.proofData && claim.claimType === claimType && claim.groupId === groupId) {
      return readibleHex("0x" + (claim.proofData as unknown as number).toString(16));
    }
  }

  return null; // returns null if no matching authType is found
}

function getuserIdFromHex(hexUserId: string) {
  const index = hexUserId.lastIndexOf("000000");
  if (index !== -1) {
    return hexUserId.substring(index + 6);
  } else {
    return hexUserId; // returns the original string if '00' is not found
  }
}

const readAirdropContract = async (functionName: string, args?: string[]) => {
  return readContract({
    address: transactions[0].contractAddress as `0x${string}}`,
    abi: AirdropABI,
    functionName,
    args: args || [],
  });
};
