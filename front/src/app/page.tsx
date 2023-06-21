"use client";

import { useRef, useState } from "react";
import { waitForTransaction } from "@wagmi/core";
import { decodeEventLog, formatEther } from "viem";
import {
  AuthType,
  ClaimRequest,
  ClaimType,
  SismoConnectButton,
  SismoConnectConfig,
  SismoConnectResponse,
} from "@sismo-core/sismo-connect-react";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { formatError, signMessage } from "@/utils/misc";
import { mumbaiFork } from "@/utils/wagmi";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { errorsABI } from "@/utils/errorsABI";
import useEthAccount from "@/utils/useEthAccount";
import getSismoSignature from "@/utils/getSismoSignature";

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

/* ***********************  Sismo Connect Claims *************************** */
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

export const AUTHS = [{ authType: AuthType.VAULT }];

/* *******************  Defines the chain and contrat to use **************** */
export const CHAIN = mumbaiFork;
export const CONTRACT_ADDRESS = transactions[0].contractAddress as `0x${string}}`;

export default function Home() {
  const [userInput, setUserInput] = useState<string>(localStorage.getItem("userInput") || "");

  function onUserInput(value: string) {
    localStorage.setItem("userInput", value);
    setUserInput(value);
  }
  const ethAccount = useEthAccount(userInput);

  return (
    <>
      <Navbar />
      <Header />
      <Main onUserInput={onUserInput} userInput={userInput} ethAccount={ethAccount}>
        <SismoConnectButton
          config={sismoConnectConfig}
          auths={AUTHS}
          claims={CLAIMS}
          signature={{ message: signMessage(ethAccount?.address as `0x${string}`) }}
          onResponseBytes={(response: string) => {
            // do something with the response
          }}
        />
      </Main>
    </>
  );
}
