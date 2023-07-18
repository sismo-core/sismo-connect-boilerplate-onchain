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
  const [pageState, setPageState] = useState<string>("init");
  const [sismoConnectConfig, setSismoConnectConfig] = useState<SismoConnectConfig>({
    appId: "",
  });
  const [sismoConnectRequest, setSismoConnectRequest] = useState<{
    auths: AuthRequest[];
    claims: ClaimRequest[];
  } | null>(null);
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

  // Get the SismoConnectConfig and Sismo Connect Request from the contract
  // Set react state accordingly to display the Sismo Connect Button
  useEffect(() => {
    if (!isConnected) return;
    if (chain?.id !== CHAIN.id) {
      setSismoConnectRequest(null);
      return;
    }
    async function getRequests() {
      const appId = (await airdropContract.read.APP_ID()) as string;
      const isImpersonationMode = (await airdropContract.read.IS_IMPERSONATION_MODE()) as boolean;
      const sismoConnectRequest = (await airdropContract.read.getSismoConnectRequest()) as [
        AuthRequest[],
        ClaimRequest[]
      ];
      const { authRequests, claimRequests } =
        getAuthRequestsAndClaimRequestsFromSismoConnectRequest(sismoConnectRequest);

      setSismoConnectConfig({
        appId,
        // we impersonate accounts if the impersonation mode is set to true in the contract
        vault: (isImpersonationMode === true ? CONFIG.vault : {}) as VaultConfig,
      });
      setSismoConnectRequest({
        auths: authRequests,
        claims: claimRequests,
      });
    }
    getRequests();
  }, [pageState, chain]);

  useEffect(() => {
    setClaimError(error);
    if (!responseBytes) return;
    setPageState("responseReceived");
  }, [responseBytes, error, claimError]);

  /* *************************  Reset state **************************** */
  function resetApp() {
    setPageState("init");
    setSismoConnectConfig({ appId: "" });
    setSismoConnectRequest(null);
    setSismoConnectVerifiedResult(null);
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
            {pageState == "init" && sismoConnectRequest && (
              <>
                <SismoConnectButton
                  // the setup of the Sismo Connect Config and Sismo Connect Request
                  // can be seen in the contract Airdrop.sol
                  // the frontend queries the contract to get the information needed
                  // to setup the Sismo Connect Button
                  config={sismoConnectConfig as SismoConnectConfig}
                  auths={sismoConnectRequest.auths}
                  claims={sismoConnectRequest.claims}
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
                {sismoConnectRequest?.auths?.map((auth, index) => (
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
                {sismoConnectRequest?.claims?.map((claim, index) => (
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
