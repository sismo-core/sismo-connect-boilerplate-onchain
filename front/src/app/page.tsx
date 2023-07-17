"use client";

import { useState } from "react";
import Header from "./components/Header";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  getProofDataForAuth,
  getProofDataForClaim,
  getUserIdFromHex,
  signMessage,
} from "@/utils/misc";
import { mumbaiFork } from "@/utils/wagmi";
import {
  SismoConnectButton, // the Sismo Connect React button displayed below
} from "@sismo-core/sismo-connect-react";
import { fundMyAccountOnLocalFork } from "@/utils/fundMyAccountOnLocalFork";
import { AUTHS, CLAIMS, CONFIG, AuthType, ClaimType } from "@/app/sismo-connect-config";
import useContract from "@/utils/useContract";

/* ********************  Defines the chain to use *************************** */
const CHAIN = mumbaiFork;

export default function Home() {
  const [responseBytes, setResponseBytes] = useState<string | null>(null);
  const { isConnected, address } = useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { openConnectModal, connectModalOpen } = useConnectModal();

  const {
    claimAirdrop,
    reset,
    amountClaimed,
    error,
    pageState,
    verifiedAuths,
    verifiedClaims,
    verifiedSignedMessage,
  } = useContract({ responseBytes, chain: CHAIN });

  /* *************************  Reset state **************************** */
  function resetApp() {
    reset();
    setResponseBytes("");
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
            {pageState == "init" && (
              <>
                <SismoConnectButton
                  config={CONFIG}
                  // Auths = Data Source Ownership Requests. (e.g Wallets, Github, Twitter, Github)
                  auths={AUTHS}
                  // Claims = prove group membership of a Data Source in a specific Data Group.
                  // (e.g ENS DAO Voter, Minter of specific NFT, etc.)
                  // Data Groups = [{[dataSource1]: value1}, {[dataSource1]: value1}, .. {[dataSource]: value}]
                  // Existing Data Groups and how to create one: https://factory.sismo.io/groups-explorer
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
                <p style={{ color: "#ff6347" }}>{error}</p>
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
                  {amountClaimed} tokens were claimed in total on {address}.
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
