import { useEffect, useState } from "react";
import { Chain, formatEther } from "viem";
import {
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  usePublicClient,
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
  const [nonce, setNonce] = useState<number | null>(null);

  const publicClient = usePublicClient();
  const { chain: currentChain } = useNetwork();
  const { isConnected, address } = useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });
  const { switchNetworkAsync } = useSwitchNetwork();
  const contractCallInputs = {
    address: transactions[0].contractAddress as `0x${string}}`,
    abi: [...AirdropABI, ...errorsABI],
    functionName: "claimWithSismo",
    args: [responseBytes],
    chain,
    enabled: Boolean(responseBytes) && Boolean(typeof nonce === "number"),
  };
  const { config, error: wagmiSimulateError } = usePrepareContractWrite(contractCallInputs);
  const { writeAsync } = useContractWrite(config);

  useEffect(() => {
    if (!responseBytes) return;
    setPageState("responseReceived");
  }, [responseBytes]);

  useEffect(() => {
    if (!address) return;
    if (currentChain?.id !== chain?.id) return;

    const fetchNonce = async () => {
      const nonce = await publicClient.getTransactionCount({
        address: address || "0x00",
        blockTag: "latest",
      });
      setNonce(nonce);
    };

    fetchNonce();
  }, [address, chain, currentChain]);

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
      setNonce(null);
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
