import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "wagmi";

export const isEthAddress = (input: string) => {
  const regex = new RegExp(/^0x[a-fA-F0-9]{40}$/);
  return regex.test(input);
};

export const isEns = (input: string) => {
  const regex = new RegExp(/^([a-z0-9]+(-[a-z0-9]+)*\.)+eth$/);
  return regex.test(input);
};

export type EthAccount = {
  isLoading: boolean;
  isError: boolean;
  address: `0x${string}` | null | undefined;
  ens: string | null | undefined;
};

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export default function useEthAccount(input: string | `0x${string}`): EthAccount {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [address, setAddress] = useState<`0x${string}` | null | undefined>(null);
  const [ens, setEns] = useState<string | null | undefined>(null);

  useEffect(() => {
    if (!input) {
      setIsLoading(false);
      setIsError(false);
      setAddress(null);
      setEns(null);
      return;
    }

    if (!isEthAddress(input) && !isEns(input)) {
      setIsLoading(false);
      setIsError(true);
      setAddress(null);
      setEns(null);
      return;
    }

    if (isEthAddress(input)) {
      setIsLoading(true);
      setIsError(false);
      setAddress(input as `0x${string}`);

      client
        .getEnsName({ address: input as `0x${string}` })
        .then((ens) => {
          setIsError(false);
          setEns(ens);
        })
        .catch(() => {
          setIsError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    if (isEns(input)) {
      setIsLoading(true);
      setIsError(false);
      setEns(input);
      
      client
        .getEnsAddress({ name: normalize(input) })
        .then((address) => {
          if (!address) throw new Error("No address found");
          setIsError(false);
          setAddress(address);
        })
        .catch(() => {
          setIsError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [input]);

  return {
    isLoading,
    isError,
    address,
    ens,
  };
}
