import { CHAIN, CLAIMS } from "@/app/page";
import { ClaimRequest, SismoConnectResponse } from "@sismo-core/sismo-connect-react";
import { useEffect, useState } from "react";
import { Chain, PublicClient, usePublicClient } from "wagmi";
import getSismoUserId from "./getSismoUserId";
import { formatUnits } from "viem";
import { baseContractInputs, removeDashAndCapitalizeFirstLetter } from "./misc";

export type ClaimMetadata = ClaimRequest & {
  name: string;
  isEligible: boolean;
  isClaimed: boolean;
  link: string;
  airdropStatus: string;
  airdropEligibleValue: string;
};

type StoredUserClaims = {
  groupId: string;
  value: bigint;
  isClaimed: boolean;
};

/* ************************************************************** */
/* ***************** GET BASE VALUES **************************** */
/* ************************************************************** */

async function getGroupsMetadataBaseValue(rewardBaseValue: bigint) {
  // 1 - Read local storage claims metadata
  let _claimsMetadata = JSON.parse(
    localStorage.getItem("claimsMetadata") || "null"
  ) as ClaimMetadata[];

  if (_claimsMetadata) return _claimsMetadata;

  // 2 - Fetch the claim group name from hub.sismo.io
  const groupsMetadata = await Promise.all(
    CLAIMS.map(async (claim) =>
      fetch(`https://hub.sismo.io/groups/${claim.groupId}?latest=true`).then(
        (res) => res.json() as Promise<{ items: any[] }>
      )
    )
  );

  // 3 - Build the claims metadata
  _claimsMetadata = groupsMetadata.map((res) => {
    const claim = CLAIMS.find((claim) => claim.groupId === res.items[0].id);
    if (!claim) throw new Error(`Claim not found ${res.items[0].name}`);

    return {
      ...claim,
      name: removeDashAndCapitalizeFirstLetter(res.items[0].name),
      isEligible: false,
      isClaimed: false,
      link: `https://factory.sismo.io/groups-explorer?search=${claim.groupId}}`,
      airdropStatus: `${formatUnits(rewardBaseValue, 18)} AIR ${
        claim.isSelectableByUser ? "per community level" : ""
      }`,
      airdropEligibleValue: BigInt(0).toString(),
    } as ClaimMetadata;
  });

  localStorage.setItem("claimsMetadata", JSON.stringify(_claimsMetadata));
  return _claimsMetadata;
}

/* ************************************************************** */
/* ***************** GET USER VALUES **************************** */
/* ************************************************************** */

async function getStoredUserClaims(
  publicClient: PublicClient,
  claimsMetadata: ClaimMetadata[],
  sismoUserId: string
) {
  return await Promise.all(
    claimsMetadata.map(async (claim) => {
      const contractRes = (await publicClient.readContract({
        ...baseContractInputs,
        functionName: "userClaims",
        args: [sismoUserId, claim.groupId],
      })) as [string, bigint, boolean];

      return {
        groupId: claim.groupId as string,
        value: contractRes[1],
        isClaimed: contractRes[2],
      } as StoredUserClaims;
    })
  );
}

/* ************************************************************** */
/* ***************** GET ELIGIBILITY **************************** */
/* ************************************************************** */

async function getGroupsMetadataEligibilty(
  claimsMetadata: ClaimMetadata[],
  storedUserClaims: StoredUserClaims[],
  response: SismoConnectResponse,
  rewardBaseValue: bigint
) {
  const claimsResponse = response?.proofs?.map((proof) => proof.claims?.[0]);

  return claimsMetadata.map((claim, index) => {
    const storedClaim = storedUserClaims.find(
      (storedClaim) => storedClaim.groupId === claim.groupId
    );

    // If the user has already claimed the maximum amount of tokens for this claim
    if (claim.isSelectableByUser ? storedClaim?.value === BigInt(3) : storedClaim?.isClaimed) {
      const alreadyClaimedValue = claim.isSelectableByUser
        ? BigInt(3) * rewardBaseValue
        : BigInt(1) * rewardBaseValue;
      return {
        ...claim,
        isEligible: false,
        isClaimed: true,
        airdropStatus: `${formatUnits(alreadyClaimedValue, 18)} AIR claimed`,
        airdropEligibleValue: BigInt(0).toString(),
      };
    }

    const responseClaim = claimsResponse?.find(
      (responseClaim) => responseClaim?.groupId === claim.groupId
    );

    // If the user has not provided a proof for this claim
    if (!responseClaim)
      return {
        ...claim,
        isEligible: false,
        airdropEligibleValue: BigInt(0).toString(),
      };

    // Else, the user is eligible for this claim
    const availableAmount = claim.isSelectableByUser
      ? (BigInt(responseClaim.value as number) - BigInt(storedClaim?.value as bigint)) *
        BigInt(rewardBaseValue)
      : BigInt(rewardBaseValue);

    const isEligible = availableAmount > BigInt(0);
    return {
      ...claim,
      isEligible,
      airdropStatus: isEligible ? `${formatUnits(availableAmount, 18)} AIR` : claim.airdropStatus,
      airdropEligibleValue: availableAmount.toString(),
    };
  });
}

/* ************************************************************** */
/* ************************* HOOK ******************************* */
/* ************************************************************** */

export default function useClaimsMetadata(response: SismoConnectResponse | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimsMetadata, setClaimsMetadata] = useState<ClaimMetadata[] | null>();
  const [totalEligibleAmount, setTotalEligibleAmount] = useState<bigint>(BigInt(0));
  const [isEligible, setIsEligible] = useState(false);
  const publicClient = usePublicClient({chainId: CHAIN?.id});
  const sismoUserId = getSismoUserId(response);

  useEffect(() => {
    if (!publicClient) return;

    async function getClaimsMetadata() {
      try {
        setError("");
        setIsLoading(true);
        // 1 read the contract airdrop base reward value
        const _rewardBaseValue = (await publicClient.readContract({
          ...baseContractInputs,
          functionName: "REWARD_BASE_VALUE",
        })) as bigint;

        // 2 - Get the claims metadata
        const _claimsMetadata = await getGroupsMetadataBaseValue(_rewardBaseValue);

        if (!_claimsMetadata) return;
        // 3 - If the user is not connected, set the claims metadata and return
        if (!sismoUserId?.id) {
          setClaimsMetadata(_claimsMetadata);
          return;
        }
        if (!response) return;

        // 4 - Read the stored user claims from the contract
        const storedUserClaims = await getStoredUserClaims(
          publicClient,
          _claimsMetadata,
          sismoUserId.id
        );

        // 5 - Check the eligibility of the user for each claim
        const _claimsMetadataEligibilty = await getGroupsMetadataEligibilty(
          _claimsMetadata,
          storedUserClaims,
          response,
          _rewardBaseValue
        );

        // 6 - Set the total eligible amount and the eligibility status
        const _totalEligibleAmount = _claimsMetadataEligibilty.reduce(
          (acc, claim) => acc + BigInt(claim.airdropEligibleValue),
          BigInt(0)
        );
        setTotalEligibleAmount(_totalEligibleAmount);
        setIsEligible(_totalEligibleAmount > BigInt(0));
        setClaimsMetadata(_claimsMetadataEligibilty);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    getClaimsMetadata();
  }, [sismoUserId?.id, publicClient, response]);

  return { claimsMetadata, totalEligibleAmount, isEligible, isLoading, error };
}
