import { useEffect, useState } from "react";
import {
  Chain,
  TransactionReceipt,
  WalletClient,
  createWalletClient,
  custom,
  formatEther,
  getContract,
} from "viem";
import {
  useAccount,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
  useWalletClient,
} from "wagmi";
import { waitForTransaction, getPublicClient } from "@wagmi/core";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { errorsABI } from "./errorsABI";
import { formatError } from "./misc";
import { VerifiedAuth, VerifiedClaim } from "@/app/sismo-connect-config";
import { fundMyAccountOnLocalFork } from "./fundMyAccountOnLocalFork";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";

export type ContractClaim = {
  claimAirdrop: () => Promise<void>;
  reset: () => void;
  error: string;
  amountClaimed: string;
  pageState: string;
  verifiedClaims: VerifiedClaim[] | undefined;
  verifiedAuths: VerifiedAuth[] | undefined;
  verifiedSignedMessage: string | undefined;
};

export default function useContract({
  responseBytes,
  chain,
}: {
  responseBytes: string | null;
  chain: Chain;
}): ContractClaim {
  const [error, setError] = useState<string>("");
  const [pageState, setPageState] = useState<string>("init");
  const [amountClaimed, setAmountClaimed] = useState<string>("");
  const [verifiedClaims, setVerifiedClaims] = useState<VerifiedClaim[]>();
  const [verifiedAuths, setVerifiedAuths] = useState<VerifiedAuth[]>();
  const [verifiedSignedMessage, setVerifiedSignedMessage] = useState<string>();
  const { chain: currentChain } = useNetwork();
  const { isConnected, address } = useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });
  const { switchNetworkAsync } = useSwitchNetwork();
  const publicClient = getPublicClient();
  const { data: walletClient } = useWalletClient();

  const contract = getContract({
    address: transactions[0].contractAddress as `0x${string}`,
    abi: [...AirdropABI, ...errorsABI],
    publicClient,
    walletClient: walletClient as WalletClient,
  });

  useEffect(() => {
    if (!responseBytes) return;
    setPageState("responseReceived");
  }, [responseBytes]);

  /* *************  Handle simulateContract call & chain errors ************ */
  useEffect(() => {
    if (currentChain?.id !== chain.id) return setError(`Please switch to ${chain.name} network`);
    setError("");
  }, [currentChain]);

  useEffect(() => {
    if (!address) return;
    if (!responseBytes) return;
    async function simulate() {
      try {
        await contract.simulate.claimWithSismo([responseBytes, address]);
      } catch (e: any) {
        return setError(formatError(e));
      }
    }

    simulate();
  }, [address, responseBytes]);

  /* ************  Handle the airdrop claim button click ******************* */
  async function claimAirdrop() {
    if (!address) return;
    setError("");
    try {
      if (currentChain?.id !== chain.id) await switchNetworkAsync?.(chain.id);
      setPageState("confirmingTransaction");
      const hash = await contract.write.claimWithSismo([responseBytes, address]);
      setPageState("verifying");
      let txReceipt: TransactionReceipt | undefined;
      if (chain.id === 5151111) {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => {
            setPageState("responseReceived");
            reject(
              new Error(
                "Transaction timed-out: If you are running a local fork on Anvil please make sure to reset your wallet nonce. In metamask:  Go to settings > advanced > clear activity and nonce data"
              )
            );
          }, 10000)
        );
        const txReceiptPromise = hash && waitForTransaction({ hash: hash });
        const race = await Promise.race([txReceiptPromise, timeout]);
        txReceipt = race as TransactionReceipt;
      } else {
        txReceipt = hash && (await waitForTransaction({ hash: hash }));
      }
      if (txReceipt?.status === "success") {
        setAmountClaimed(
          formatEther((await contract.read.balanceOf([address])) as unknown as bigint)
        );
        setVerifiedClaims((await contract.read.getVerifiedClaims()) as VerifiedClaim[]);
        setVerifiedAuths((await contract.read.getVerifiedAuths()) as VerifiedAuth[]);
        setVerifiedSignedMessage((await contract.read.getVerifiedSignedMessage()) as string);
        setPageState("verified");
      }
    } catch (e: any) {
      console.error(e);
      setError(formatError(e));
    }
  }

  function reset() {
    setAmountClaimed("");
    setError("");
    setPageState("init");
    const url = new URL(window.location.href);
    url.searchParams.delete("sismoConnectResponseCompressed");
    window.history.replaceState({}, "", url.toString());
  }

  return {
    claimAirdrop,
    reset,
    error,
    pageState,
    amountClaimed,
    verifiedClaims,
    verifiedAuths,
    verifiedSignedMessage,
  };
}
