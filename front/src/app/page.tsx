"use client";

import { useEffect, useState } from "react";
import Header from "./components/Header";
import { useAccount, useNetwork } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import {
  formatError,
  getAuthRequestsAndClaimRequestsFromSismoConnectRequest,
  getProofDataForAuth,
  getProofDataForClaim,
  getUserIdFromHex,
  signMessage,
  fundMyAccountOnLocalFork,
  useContract,
  getResults,
  // chains
  mumbaiFork,
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
} from "@/utils";
import {
  AuthRequest,
  ClaimRequest,
  SismoConnectButton,
  VaultConfig,
  VerifiedAuth,
  VerifiedClaim, // the Sismo Connect React button displayed below
  AuthType,
  ClaimType,
  SismoConnectConfig,
} from "@sismo-core/sismo-connect-react";
import { AUTHS, CLAIMS, CONFIG } from "@/app/sismo-connect-config";

/* ********************  Defines the chain to use *************************** */
const CHAIN = mumbaiFork;

export default function Home() {
  const [pageState, setPageState] = useState<string>("init");
  const [sismoConnectVerifiedResult, setSismoConnectVerifiedResult] = useState<{
    verifiedClaims: VerifiedClaim[];
    verifiedAuths: VerifiedAuth[];
    verifiedSignedMessage: string;
    amountClaimed: string;
  } | null>(null);
  const [responseBytes, setResponseBytes] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const { isConnected, address } = useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });
  const { chain } = useNetwork();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { airdropContract, switchNetworkAsync, waitingForTransaction, error } = useContract({
    responseBytes,
    chain: CHAIN,
  });

  useEffect(() => {
    setClaimError(error);
    if (!responseBytes) return;
    setPageState("responseReceived");
  }, [responseBytes, error, claimError]);

  /* *************************  Reset state **************************** */
  function resetApp() {
    setPageState("init");
    setSismoConnectVerifiedResult(null);
    setClaimError(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("sismoConnectResponseCompressed");
    window.history.replaceState({}, "", url.toString());
    setResponseBytes("");
  }

  /* ************  Handle the airdrop claim button click ******************* */
  async function claimAirdrop() {
    if (!address) return;
    try {
      if (chain?.id !== CHAIN.id) await switchNetworkAsync?.(CHAIN.id);
      setPageState("confirmingTransaction");
      const hash = await airdropContract.write.claimWithSismo([responseBytes, address]);
      setPageState("verifying");
      let txReceipt = await waitingForTransaction(hash);
      if (txReceipt?.status === "success") {
        const sismoConnectVerifiedResult = getResults(
          (await airdropContract.read.getSismoConnectVerifiedResult()) as [
            VerifiedAuth[],
            VerifiedClaim[],
            string
          ]
        );
        setSismoConnectVerifiedResult({
          verifiedClaims: sismoConnectVerifiedResult.verifiedClaims,
          verifiedAuths: sismoConnectVerifiedResult.verifiedAuths,
          verifiedSignedMessage: sismoConnectVerifiedResult.verifiedSignedMessage,
          amountClaimed: formatEther((await airdropContract.read.balanceOf([address])) as bigint),
        });
        setPageState("verified");
      }
    } catch (e: any) {
      setClaimError(formatError(e));
    } finally {
      setPageState("responseReceived");
    }
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
              {pageState != "init" && <button onClick={() => resetApp()}>Reset</button>}
              <p>
                <b>{`Chain: ${chain?.name} [${chain?.id}]`}</b>
                <br />
                <b>Your airdrop destination address is: {address}</b>
              </p>
            </>
            {pageState == "init" && !claimError && (
              <>
                <SismoConnectButton
                  config={CONFIG}
                  // Auths = Data Source Ownership Requests
                  auths={AUTHS}
                  // Claims = prove groump membership of a Data Source in a specific Data Group.
                  // Data Groups = [{[dataSource1]: value1}, {[dataSource1]: value1}, .. {[dataSource]: value}]
                  // When doing so Data Source is not shared to the app.
                  claims={CLAIMS}
                  // Signature = user can sign a message embedded in their zk proof
                  signature={{ message: signMessage(address!) }}
                  // responseBytes = the response from Sismo Connect, will be sent onchain
                  onResponseBytes={(responseBytes: string) => {
                    setResponseBytes(responseBytes);
                  }}
                  // Some text to display on the button
                  text={"Claim with Sismo"}
                />
              </>
            )}
            {!claimError && (
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
            )}
            {isConnected && !sismoConnectVerifiedResult?.amountClaimed && claimError && (
              <>
                <p style={{ color: "#ff6347" }}>{claimError}</p>
                {claimError.slice(0, 50) ===
                  'The contract function "balanceOf" returned no data' && (
                  <p style={{ color: "#0BDA51" }}>
                    If you are developing on a local fork, please restart your frontend with "yarn
                    dev" command and try again, it will automatically deploy a new contract for you!
                  </p>
                )}
                {claimError.slice(0, 16) === "Please switch to" && (
                  <button onClick={() => switchNetworkAsync?.(CHAIN.id)}>Switch chain</button>
                )}
              </>
            )}
            {/* Table of the Sismo Connect requests and verified result */}
            {/* Table for Verified Auths */}
            {sismoConnectVerifiedResult?.verifiedAuths && (
              <>
                <p>
                  {sismoConnectVerifiedResult.amountClaimed} tokens were claimed in total on{" "}
                  {address}.
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
                    {sismoConnectVerifiedResult.verifiedAuths.map((auth, index) => (
                      <tr key={index}>
                        <td>{AuthType[auth.authType]}</td>
                        <td>
                          {getUserIdFromHex(
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
            {sismoConnectVerifiedResult?.verifiedClaims && (
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
                    {sismoConnectVerifiedResult.verifiedClaims.map((claim, index) => (
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
                    {sismoConnectVerifiedResult?.verifiedAuths ? (
                      <td>
                        {getProofDataForAuth(
                          sismoConnectVerifiedResult?.verifiedAuths,
                          auth.authType
                        )!.toString()}
                      </td>
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
                    {sismoConnectVerifiedResult?.verifiedClaims ? (
                      <td>
                        {
                          getProofDataForClaim(
                            sismoConnectVerifiedResult.verifiedClaims!,
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
                  <td>
                    {sismoConnectVerifiedResult?.verifiedSignedMessage
                      ? sismoConnectVerifiedResult.verifiedSignedMessage
                      : "ZK Proof not verified"}
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </main>
    </>
  );
}
