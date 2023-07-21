import { useEffect, useState } from "react";
import {
  Chain,
  GetContractReturnType,
  PublicClient,
  TransactionReceipt,
  WalletClient,
  getContract,
} from "viem";
import { useAccount, useNetwork, useSwitchNetwork, useWalletClient } from "wagmi";
import { waitForTransaction, getPublicClient } from "@wagmi/core";
import { abi as AirdropABI } from "../../../abi/Airdrop.json";
import { errorsABI } from "./errorsABI";
import { formatError } from "./misc";
import { fundMyAccountOnLocalFork } from "./fundMyAccountOnLocalFork";
import { transactions } from "../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";

export type ContractClaim = {
  airdropContract: GetContractReturnType<typeof AirdropABI, PublicClient, WalletClient>;
  switchNetworkAsync: ((chainId?: number | undefined) => Promise<Chain>) | undefined;
  waitingForTransaction: (hash: `0x${string}`) => Promise<TransactionReceipt | undefined>;
  error: string;
};

export default function useContract({
  responseBytes,
  chain,
}: {
  responseBytes: string | null;
  chain: Chain;
}): ContractClaim {
  const [error, setError] = useState<string>("");
  const { chain: currentChain } = useNetwork();
  const { switchNetworkAsync } = useSwitchNetwork();
  const publicClient = getPublicClient();
  const { data: walletClient } = useWalletClient();
  const { isConnected, address } = useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });

  const airdropContract = getContract({
    address: transactions[0].contractAddress as `0x${string}`,
    abi: [...AirdropABI, ...errorsABI],
    publicClient,
    walletClient: walletClient as WalletClient,
  });

  /* *************  Handle simulateContract call & chain errors ************ */
  useEffect(() => {
    if (currentChain?.id !== chain.id) {
      return setError(`Please switch to ${chain.name} network`);
    }
    setError("");
  }, [currentChain]);

  useEffect(() => {
    if (!isConnected) return;
    if (!responseBytes) return;
    if (currentChain?.id !== chain.id) {
      return setError(`Please switch to ${chain.name} network`);
    }
    async function simulate() {
      try {
        await airdropContract.simulate.claimWithSismo([responseBytes, address]);
        await airdropContract.simulate.balanceOf([address]);
      } catch (e: any) {
        return setError(formatError(e));
      }
    }

    simulate();
  }, [address, isConnected, responseBytes, currentChain]);

  async function waitingForTransaction(
    hash: `0x${string}`
  ): Promise<TransactionReceipt | undefined> {
    let txReceipt: TransactionReceipt | undefined;
    if (chain.id === 5151111) {
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Transaction timed-out: If you are running a local fork on Anvil please make sure to reset your wallet nonce. In metamask:  Go to settings > advanced > clear activity and nonce data"
              )
            ),
          10000
        )
      );
      const txReceiptPromise = hash && waitForTransaction({ hash: hash });
      const race = await Promise.race([txReceiptPromise, timeout]);
      txReceipt = race as TransactionReceipt;
    } else {
      txReceipt = hash && (await waitForTransaction({ hash: hash }));
    }
    return txReceipt;
  }

  return {
    airdropContract,
    switchNetworkAsync,
    waitingForTransaction,
    error,
  };
}
