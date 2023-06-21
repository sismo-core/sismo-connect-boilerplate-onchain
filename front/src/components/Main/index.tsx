import styled from "styled-components";
import { useEffect, useState } from "react";
import { waitForTransaction } from "@wagmi/core";
import { decodeEventLog, formatEther, formatUnits } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useSismoConnect } from "@sismo-core/sismo-connect-react";
import { useAccount, useContractWrite, useNetwork, usePrepareContractWrite } from "wagmi";
import { formatError } from "@/utils/misc";
import useEthAccount, { EthAccount } from "@/utils/useEthAccount";
import getSismoSignature from "@/utils/getSismoSignature";
import { errorsABI } from "@/utils/errorsABI";
import useClaimsMetadata from "@/utils/useClaimsMetadata";
import { fundMyAccountOnLocalFork } from "@/utils/fundMyAccountOnLocalFork";
import { AUTHS, CHAIN, CLAIMS, sismoConnectConfig } from "@/app/page";
import Button from "../Button";
import Loader from "../Loader";
import { transactions } from "../../../../broadcast/Airdrop.s.sol/5151111/run-latest.json";
import { abi as AirdropABI } from "../../../../abi/Airdrop.json";
import EligibilitySummary from "../EligibilitySummary";
import getMinifiedId from "@/utils/getMinifiedId";
import Congrats from "../Congrats";

const Container = styled.main`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 572px;
`;

const ContainerCentered = styled(Container)`
  align-items: center;
  justify-content: center;
  height: 50vh;
`;

const Title = styled.h2`
  font-weight: 600;
  font-size: 24px;
  line-height: 30px;
`;

const StyledButton = styled(Button)`
  align-self: center;
  width: 300px;
`;

const SismoWrapper = styled.div<{ $isError: boolean }>`
  align-self: center;
  opacity: ${(props) => (props.$isError ? 0.5 : 1)};
  pointer-events: ${(props) => (props.$isError ? "none" : "auto")};
`;

const Error = styled.div`
  width: 100%;
  padding: 12px 8px;
  background: rgba(238, 82, 110, 0.1);
  border: 1px solid #ee526e;
  border-radius: 4px;
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;
  margin-bottom: 32px;
  word-break: break-word;
`;

const MoreClaim = styled.div`
  margin-top: 21px;
  align-self: center;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
`;

type Props = {
  children: React.ReactNode;
  userInput: string;
  ethAccount: EthAccount;
  onUserInput: (value: string) => void;
};

export default function Main({ children, userInput, ethAccount, onUserInput }: Props) {
  /* ************************  component states *********************************** */
  const [txIsLoading, setTxIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [amountClaimed, setAmountClaimed] = useState<string>("");

  /* ************************  hooks ********************************************* */
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { isConnected } = useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });
  const { chain } = useNetwork();
  const { response, responseBytes, sismoConnect } = useSismoConnect({ config: sismoConnectConfig });

  const ethAccountSigned = useEthAccount(getSismoSignature(response));
  const {
    claimsMetadata,
    isEligible,
    totalEligibleAmount,
    error: claimsMetadataError,
    isLoading: claimsMetadataIsLoading,
  } = useClaimsMetadata(response);

  /* ************************  effects ******************************************* */
  useEffect(() => {
    if (!claimsMetadataError) return;
    setError(claimsMetadataError);
  }, [claimsMetadataError]);

  const prepareContractWrite = usePrepareContractWrite(
    responseBytes && ethAccountSigned?.address && chain?.id === CHAIN.id
      ? {
          address: transactions[0].contractAddress as `0x${string}}`,
          abi: [...AirdropABI, ...errorsABI],
          functionName: "claimWithSismo",
          args: [ethAccountSigned?.address, responseBytes],
          chainId: CHAIN.id,
        }
      : {}
  );

  useEffect(() => {
    if (prepareContractWrite?.error) {
      setError(formatError(prepareContractWrite?.error));
    }
  }, [prepareContractWrite?.error]);

  const contractWrite = useContractWrite(prepareContractWrite?.config || {});

  /* ************************  functions ***************************************** */
  async function claimAirdrop() {
    if (!isConnected) return;
    setError("");
    setTxIsLoading(true);
    try {
      const tx = await contractWrite?.writeAsync?.();
      const txReceipt = tx && (await waitForTransaction({ hash: tx.hash }));
      if (txReceipt?.status === "success") {
        const mintEvent = decodeEventLog({
          abi: AirdropABI,
          data: txReceipt.logs[0]?.data,
          topics: txReceipt.logs[0]?.topics,
        });
        const args = mintEvent?.args as {
          value: string;
        };
        console.log("mintEvent", mintEvent);
        const ethAmount = formatEther(BigInt(args.value));
        setAmountClaimed(ethAmount);
      }
    } catch (e: any) {
      console.log("e", e);
      setError(formatError(e));
    } finally {
      setTxIsLoading(false);
    }
  }

  if (claimsMetadataIsLoading)
    return (
      <ContainerCentered>
        <Loader size={38} />
      </ContainerCentered>
    );

  if (amountClaimed && ethAccountSigned)
    return (
      <Congrats amountClaimed={amountClaimed} ethAccountSigned={ethAccountSigned}/>
      
    );

  if (claimsMetadata)
    return (
      <Container>
        <Title>Claim your AIR tokens</Title>

        <EligibilitySummary
          claimsMetadata={claimsMetadata}
          response={response}
          userInput={userInput}
          ethAccount={ethAccount}
          ethAccountSigned={ethAccountSigned}
          onUserInput={onUserInput}
        />

        {error && <Error>{error}</Error>}

        {!response && (
          <SismoWrapper
            $isError={
              Boolean(ethAccount?.isError) || !Boolean(ethAccount?.address) || !Boolean(userInput)
            }
          >
            {children}
          </SismoWrapper>
        )}

        {response && !isConnected && (
          <StyledButton onClick={() => openConnectModal?.()} disabled={connectModalOpen}>
            {connectModalOpen ? "Connecting wallet..." : "Connect wallet to claim"}
          </StyledButton>
        )}

        {response && isConnected && (
          <StyledButton disabled={txIsLoading || !isEligible} onClick={claimAirdrop}>
            {txIsLoading
              ? "Claiming..."
              : !isEligible
              ? "Claim"
              : `Claim ${formatUnits(totalEligibleAmount, 18)} AIR`}
          </StyledButton>
        )}

        {response && !txIsLoading && (
          <MoreClaim
            onClick={() => {
              sismoConnect.request({
                auths: AUTHS,
                claims: CLAIMS,
                signature: { message: response.signedMessage as string },
              });
            }}
          >
            Prove eligibility for more tokens
          </MoreClaim>
        )}
      </Container>
    );

  return null;
}
