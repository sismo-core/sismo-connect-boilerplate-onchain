import styled from "styled-components";
import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useSismoConnect } from "@sismo-core/sismo-connect-react";
import { useAccount } from "wagmi";
import { EthAccount } from "@/utils/useEthAccount";
import { AUTHS, CLAIMS, sismoConnectConfig } from "@/app/page";
import Button from "../Button";
import Loader from "../Loader";
import EligibilitySummary from "../EligibilitySummary";
import Congrats from "../Congrats";
import { ClaimsEligibilityHook } from "@/utils/useClaimsEligibility";
import { ContractClaim } from "@/utils/useContractClaim";
import { signMessage } from "@/utils/misc";

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

export const StyledButton = styled(Button)`
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
  ethAccount: EthAccount;
  contractClaim: ContractClaim;
  claimsEligibilities: ClaimsEligibilityHook;
  isResponse: boolean;
  userInput: string;
  onUserInput: (value: string) => void;
};

export default function Main({
  children,
  ethAccount,
  contractClaim,
  claimsEligibilities,
  isResponse,
  userInput,
  onUserInput,
}: Props) {
  /* ************************  component states ********************************** */
  const [error, setError] = useState<string>("");

  /* ************************  hooks ********************************************* */
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { isConnected } = useAccount();
  const { sismoConnect } = useSismoConnect({ config: sismoConnectConfig });

  const {
    claimsEligibility,
    error: claimsEligibilityError,
    isLoading: claimsEligibilityIsLoading,
  } = claimsEligibilities;

  const {
    error: contractClaimError,
    isLoading: contractClaimIsLoading,
    amountClaimed,
  } = contractClaim;

  /* ************************  effects ******************************************* */
  useEffect(() => {
    if (contractClaimError) {
      setError(contractClaimError);
    }
  }, [contractClaimError]);

  useEffect(() => {
    if (!claimsEligibilityError) return;
    setError(claimsEligibilityError);
  }, [claimsEligibilityError]);

  /* ************************  Return components ********************************* */
  if (claimsEligibilityIsLoading)
    return (
      <ContainerCentered>
        <Loader size={38} />
      </ContainerCentered>
    );

  if (amountClaimed && ethAccount)
    return <Congrats amountClaimed={amountClaimed} ethAccount={ethAccount} />;

  if (claimsEligibility)
    return (
      <Container>
        <Title>Claim your AIR tokens</Title>

        <EligibilitySummary
          claimsEligibility={claimsEligibility}
          userInput={userInput}
          ethAccount={ethAccount}
          onUserInput={onUserInput}
        />

        {error && <Error>{error}</Error>}

        <SismoWrapper $isError={Boolean(ethAccount?.isError) || !Boolean(ethAccount?.address)}>
          {children}
        </SismoWrapper>

        {isResponse && !isConnected && (
          <StyledButton onClick={() => openConnectModal?.()} disabled={connectModalOpen} isLoading={connectModalOpen}>
            {connectModalOpen ? "Connecting wallet..." : "Connect wallet to claim"}
          </StyledButton>
        )}

        {isResponse && !contractClaimIsLoading && (
          <MoreClaim
            onClick={() => {
              ethAccount?.address &&
                sismoConnect.request({
                  auths: AUTHS,
                  claims: CLAIMS,
                  signature: { message: signMessage(ethAccount.address) },
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
