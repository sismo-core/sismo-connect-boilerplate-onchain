import { useEffect, useState } from "react";
import { Chain, TransactionReceipt, decodeEventLog, formatEther } from "viem";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { waitForTransaction } from "@wagmi/core";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { errorsABI } from "./errorsABI";
import { CHAIN } from "@/app/page";
import { formatError } from "./misc";

export type ContractClaim = {
  claimAirdrop: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: string;
  amountClaimed: string;
};

export default function useContractClaim(
  responseBytes: string | null,
  ethAddress: `0x${string}` | null | undefined,
  chain: Chain | null | undefined
): ContractClaim {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [amountClaimed, setAmountClaimed] = useState("");
  const { isConnected } = useAccount();

  const prepareContractWrite = usePrepareContractWrite(
    responseBytes && ethAddress && chain?.id === CHAIN.id
      ? {
          address: transactions[0].contractAddress as `0x${string}}`,
          abi: [...AirdropABI, ...errorsABI],
          functionName: "claimWithSismo",
          args: [ethAddress, responseBytes],
          chainId: CHAIN.id,
        }
      : {}
  );

  useEffect(() => {
    if (prepareContractWrite?.error) {
      setError(formatError(prepareContractWrite?.error));
    } else {
      setError("");
    }
  }, [prepareContractWrite?.error]);

  const contractWrite = useContractWrite(prepareContractWrite?.config || {});

  async function claimAirdrop() {
    if (!isConnected) return;
    setError("");
    setIsLoading(true);
    try {
      const tx = await contractWrite?.writeAsync?.();

      // On mumbai fork, the if the wallet nounce is incorrect tx is not mined
      let txReceipt: TransactionReceipt | undefined;
      if (CHAIN.id === 5151111) {
        const timeout = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Local fork error: operation timed out after 15 seconds, if you are running a local fork on Anvil please make sure to reset your wallet nounce."
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

      if (txReceipt && txReceipt?.status === "success") {
        const mintEvent = decodeEventLog({
          abi: AirdropABI,
          data: txReceipt.logs[0]?.data,
          topics: txReceipt.logs[0]?.topics,
        });
        const args = mintEvent?.args as {
          value: string;
        };
        const ethAmount = formatEther(BigInt(args.value));
        setAmountClaimed(ethAmount);
      }
    } catch (e: any) {
      if (e?.message?.includes("User rejected the request")) {
        setError("");
        return;
      }
      setError(formatError(e));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    claimAirdrop,
    isLoading,
    isError: Boolean(error),
    error,
    amountClaimed,
  };
}
