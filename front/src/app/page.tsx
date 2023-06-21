"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import {
  AuthType,
  ClaimRequest,
  ClaimType,
  SismoConnectButton,
  SismoConnectConfig,
  SismoConnectResponse,
} from "@sismo-core/sismo-connect-react";
import { signMessage } from "@/utils/misc";
import { mumbaiFork } from "@/utils/wagmi";
import Header from "@/components/Header";
import Main, { StyledButton } from "@/components/Main";
import Navbar from "@/components/Navbar";
import useEthAccount from "@/utils/useEthAccount";
import getSismoSignature from "@/utils/getSismoSignature";
import { useAccount, useNetwork } from "wagmi";
import useClaimsEligibility from "@/utils/useClaimsEligibility";
import useContractClaim from "@/utils/useContractClaim";

/* ***********************  Sismo Connect Config *************************** */
export const sismoConnectConfig: SismoConnectConfig = {
  appId: "0xf4977993e52606cfd67b7a1cde717069",
  // vault: {
  //   // For development purposes insert the identifier that you want to impersonate any account here
  //   // Never use this in production
  //   impersonate: [
  //     "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
  //     "0xce2ef28c65e5db090d75630c98a807da003fb36f", // a Gitcoin Passport Holder
  //     "twitter:dhadrien_:2390703980", // the twitter account @dhadrien_
  //     "0x855193BCbdbD346B423FF830b507CBf90ecCc90B", // the address of a Sismo team member
  //   ],
  // },
};

/* ***********************  Sismo Connect *************************** */

export const AUTHS = [{ authType: AuthType.VAULT }];
export const CLAIMS: ClaimRequest[] = [
  {
    // Gitcoin Passport
    groupId: "0x1cde61966decb8600dfd0749bd371f12",
    claimType: ClaimType.GTE,
    value: 15,
  },
  {
    // Sismo Community Members
    groupId: "0xd630aa769278cacde879c5c0fe5d203c",
    isSelectableByUser: true,
  },
  {
    // Sismo Community Early Members
    groupId: "0xe4c011331d91b79639df349a93157a1b",
    isOptional: true,
  },
  {
    // Sismo Factory Users
    groupId: "0x05629c9a54e30d8c8aea911a48cd9e30",
    isOptional: true,
  },
];

/* *******************  Defines the chain and contrat to use **************** */
export const CHAIN = mumbaiFork;

export default function Home() {
  // component states
  const [userInput, setUserInput] = useState<string>(localStorage.getItem("userInput") || "");
  const [response, setResponse] = useState<SismoConnectResponse | null>(null);
  const [responseBytes, setResponseBytes] = useState<string | null>(null);

  // wagmi hooks
  const { chain } = useNetwork();
  const { isConnected } = useAccount();

  // custom hooks for contract read and write
  const claimsEligibility = useClaimsEligibility(response);
  const ethAccount = useEthAccount(response ? getSismoSignature(response) : userInput);
  const contractClaim = useContractClaim(responseBytes, ethAccount?.address, chain);

  // user input field function
  function onUserInput(value: string) {
    localStorage.setItem("userInput", value);
    setUserInput(value);
  }

  return (
    <>
      <Navbar />
      <Header />
      <Main
        onUserInput={onUserInput}
        userInput={userInput}
        ethAccount={ethAccount}
        contractClaim={contractClaim}
        claimsEligibilities={claimsEligibility}
      >
        {/* *************** SISMO CONNECT BUTTON *********************  */}

        {!response && (
          <SismoConnectButton
            config={sismoConnectConfig}
            auths={AUTHS}
            claims={CLAIMS}
            signature={{ message: signMessage(ethAccount?.address as `0x${string}`) }}
            onResponseBytes={(response: string) => setResponseBytes(response)}
            onResponse={(response: SismoConnectResponse) => setResponse(response)}
          />
        )}

        {/* ************************ CLAIM BUTTON *********************  */}
        {response && isConnected && (
          <StyledButton
            disabled={contractClaim?.isLoading || !claimsEligibility?.isEligible}
            onClick={contractClaim?.claimAirdrop}
          >
            {contractClaim.isLoading
              ? "Claiming..."
              : !claimsEligibility?.isEligible
              ? "Claim"
              : `Claim ${formatUnits(claimsEligibility?.totalEligibleAmount, 18)} AIR`}
          </StyledButton>
        )}
      </Main>
    </>
  );
}
