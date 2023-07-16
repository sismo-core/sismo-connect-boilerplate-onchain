import { useEffect, useState } from "react";
import { Chain, TransactionReceipt, formatEther } from "viem";
import {
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
} from "wagmi";
import { waitForTransaction, readContract } from "@wagmi/core";
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
  const contractCallInputs = {
    address: transactions[0].contractAddress as `0x${string}`,
    abi: [...AirdropABI, ...errorsABI],
    functionName: "claimWithSismo",
    args: [responseBytes],
    chain,
    enabled: Boolean(responseBytes),
  };
  const { config, error: wagmiSimulateError } = usePrepareContractWrite(contractCallInputs);
  const { writeAsync } = useContractWrite(config);

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
    if (!wagmiSimulateError) return;
    if (!isConnected) return;
    return setError(formatError(wagmiSimulateError));
  }, [wagmiSimulateError, isConnected]);

  /* ************  Handle the airdrop claim button click ******************* */
  async function claimAirdrop() {
    if (!address) return;
    setError("");
    try {
      if (currentChain?.id !== chain.id) await switchNetworkAsync?.(chain.id);
      setPageState("confirmingTransaction");
      const tx = await writeAsync?.();
      setPageState("verifying");
      let txReceipt: TransactionReceipt | undefined;
      if (chain.id === 5151111) {
        const timeout = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Local fork error: operation timed out after 15 seconds, if you are running a local fork on Anvil please make sure to reset your wallet nonce."
                )
              ),
            15000
          )
        );
        const txReceiptPromise = tx && waitForTransaction({ hash: tx.hash });
        const race = await Promise.race([txReceiptPromise, timeout]);
        txReceipt = race as TransactionReceipt;
      } else {
        txReceipt = tx && (await waitForTransaction({ hash: tx.hash }));
      }
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
