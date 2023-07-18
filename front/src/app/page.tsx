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

/* **********************  Sismo Connect Config *************************** */
// For development purposes insert the Data Sources that you want to impersonate
// Never use this in production
// the appId is not referenced here as it is set directly in the contract
export const CONFIG: Omit<SismoConnectConfig, "appId"> = {
  vault: {
    // For development purposes insert the Data Sources that you want to impersonate
    // Never use this in production
    impersonate: [
      // EVM Data Sources
      "dhadrien.sismo.eth",
      "0xA4C94A6091545e40fc9c3E0982AEc8942E282F38",
      "0x1b9424ed517f7700e7368e34a9743295a225d889",
      "0x82fbed074f62386ed43bb816f748e8817bf46ff7",
      "0xc281bd4db5bf94f02a8525dca954db3895685700",
      // Github Data Source
      "github:dhadrien",
      // Twitter Data Source
      "twitter:dhadrien_",
      // Telegram Data Source
      "telegram:dhadrien",
    ],
  },
  // displayRawResponse: true, // this enables you to get access directly to the
  // Sismo Connect Response in the vault instead of redirecting back to the app
};

/* ********************  Defines the chain to use *************************** */
const CHAIN = mumbaiFork;

export default function Home() {
  const [appState, setAppState] = useState<{
    pageState: string;
    amountClaimed: string;
    sismoConnectConfig: { appId: string | undefined; vault: VaultConfig | {} };
    claimRequests: ClaimRequest[] | undefined;
    authRequests: AuthRequest[] | undefined;
    verifiedClaims: VerifiedClaim[] | undefined;
    verifiedAuths: VerifiedAuth[] | undefined;
    verifiedSignedMessage: string | undefined;
  }>({
    pageState: "init",
    amountClaimed: "",
    sismoConnectConfig: {
      appId: undefined,
      vault: {},
    },
    claimRequests: undefined,
    authRequests: undefined,
    verifiedClaims: undefined,
    verifiedAuths: undefined,
    verifiedSignedMessage: undefined,
  });
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

  // Get the SismoConnectConfig and Sismo Connect Request from the contract
  // Set react state accordingly to display the Sismo Connect Button
  useEffect(() => {
    if (!isConnected) return;
    async function getRequests() {
      const appId = (await airdropContract.read.APP_ID()) as string;
      const isImpersonationMode = (await airdropContract.read.IS_IMPERSONATION_MODE()) as boolean;
      const sismoConnectRequest = (await airdropContract.read.getSismoConnectRequest()) as [
        AuthRequest[],
        ClaimRequest[]
      ];
      const { authRequests, claimRequests } =
        getAuthRequestsAndClaimRequestsFromSismoConnectRequest(sismoConnectRequest);

      setAppState((prev) => {
        return {
          ...prev,
          // we impersonate accounts if the impersonation mode is set to true in the contract
          sismoConnectConfig: {
            appId,
            vault: (isImpersonationMode === true ? CONFIG.vault : {}) as VaultConfig,
          },
          authRequests,
          claimRequests,
        };
      });
    }

    getRequests();
  }, [appState.pageState]);

  useEffect(() => {
    if (!responseBytes) return;
    setAppState((prev) => {
      return { ...prev, pageState: "responseReceived" };
    });
    setClaimError(error);
  }, [responseBytes, error, claimError]);

  /* *************************  Reset state **************************** */
  function resetApp() {
    setAppState({
      pageState: "init",
      amountClaimed: "",
      sismoConnectConfig: {
        appId: undefined,
        vault: {},
      },
      claimRequests: undefined,
      authRequests: undefined,
      verifiedClaims: undefined,
      verifiedAuths: undefined,
      verifiedSignedMessage: undefined,
    });
    setClaimError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("sismoConnectResponseCompressed");
    window.history.replaceState({}, "", url.toString());
    setResponseBytes("");
  }

  /* ************  Handle the airdrop claim button click ******************* */
  async function claimAirdrop() {
    if (!address) return;
    setClaimError("");
    try {
      if (chain?.id !== CHAIN.id) await switchNetworkAsync?.(CHAIN.id);
      setAppState((prev) => {
        return { ...prev, pageState: "confirmingTransaction" };
      });
      const hash = await airdropContract.write.claimWithSismo([responseBytes, address]);
      setAppState((prev) => {
        return { ...prev, pageState: "verifying" };
      });
      let txReceipt = await waitingForTransaction(hash);
      if (txReceipt?.status === "success") {
        const amountClaimed = formatEther(
          (await airdropContract.read.balanceOf([address])) as bigint
        );
        const verifiedClaims = (await airdropContract.read.getVerifiedClaims()) as VerifiedClaim[];
        const verifiedAuths = (await airdropContract.read.getVerifiedAuths()) as VerifiedAuth[];
        const verifiedSignedMessage =
          (await airdropContract.read.getVerifiedSignedMessage()) as string;
        setAppState((prev) => {
          return {
            ...prev,
            amountClaimed,
            verifiedClaims,
            verifiedAuths,
            verifiedSignedMessage,
            pageState: "verified",
          };
        });
      }
    } catch (e: any) {
      setClaimError(formatError(e));
    } finally {
      setAppState((prev) => {
        return { ...prev, pageState: "responseReceived" };
      });
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
              {appState.pageState != "init" && <button onClick={() => resetApp()}>Reset</button>}
              <p>
                <b>{`Chain: ${chain?.name} [${chain?.id}]`}</b>
                <br />
                <b>Your airdrop destination address is: {address}</b>
              </p>
            </>
            {appState.pageState == "init" && (
              <>
                <SismoConnectButton
                  config={{
                    ...(appState.sismoConnectConfig as { appId: string; vault: VaultConfig }),
                  }}
                  // Auths = Data Source Ownership Requests. (e.g Wallets, Github, Twitter, Github)
                  auths={appState.authRequests}
                  // Claims = prove group membership of a Data Source in a specific Data Group.
                  // (e.g ENS DAO Voter, Minter of specific NFT, etc.)
                  // Data Groups = [{[dataSource1]: value1}, {[dataSource1]: value1}, .. {[dataSource]: value}]
                  // Existing Data Groups and how to create one: https://factory.sismo.io/groups-explorer
                  claims={appState.claimRequests}
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
            {claimError !== null && (
              <div className="status-wrapper">
                {appState.pageState == "responseReceived" && (
                  <button onClick={() => claimAirdrop()}>{"Claim"}</button>
                )}
                {appState.pageState == "confirmingTransaction" && (
                  <button disabled={true}>{"Confirm tx in wallet"}</button>
                )}
                {appState.pageState == "verifying" && (
                  <span className="verifying"> Verifying ZK Proofs onchain... </span>
                )}
                {appState.pageState == "verified" && (
                  <span className="verified"> ZK Proofs Verified! </span>
                )}
              </div>
            )}
            {isConnected && !appState.amountClaimed && claimError && (
              <>
                <p style={{ color: "#ff6347" }}>{claimError}</p>
                {claimError.slice(0, 50) ===
                  'The contract function "balanceOf" returned no data' && (
                  <p style={{ color: "#0BDA51" }}>
                    Please restart your frontend with "yarn dev" command and try again, it will
                    automatically deploy a new contract for you!
                  </p>
                )}
                {claimError.slice(0, 16) === "Please switch to" && (
                  <button onClick={() => switchNetworkAsync?.(CHAIN.id)}>Switch chain</button>
                )}
              </>
            )}
            {/* Table of the Sismo Connect requests and verified result */}
            {/* Table for Verified Auths */}
            {appState.verifiedAuths && (
              <>
                <p>
                  {appState.amountClaimed} tokens were claimed in total on {address}.
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
                    {appState.verifiedAuths.map((auth, index) => (
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
            {appState.verifiedClaims && (
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
                    {appState.verifiedClaims.map((claim, index) => (
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
                {appState?.authRequests?.map((auth, index) => (
                  <tr key={index}>
                    <td>{AuthType[auth.authType]}</td>
                    <td>{auth.userId || "No userId requested"}</td>
                    <td>{auth.isOptional ? "optional" : "required"}</td>
                    {appState.verifiedAuths ? (
                      <td>
                        {getProofDataForAuth(appState.verifiedAuths, auth.authType)!.toString()}
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
                {appState?.claimRequests?.map((claim, index) => (
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
                    {appState.verifiedClaims ? (
                      <td>
                        {
                          getProofDataForClaim(
                            appState.verifiedClaims!,
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
                    {appState.verifiedSignedMessage
                      ? appState.verifiedSignedMessage
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
