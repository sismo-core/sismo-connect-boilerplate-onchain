import { Fragment } from "react";
import styled from "styled-components";
import { SismoConnectResponse } from "@sismo-core/sismo-connect-react";
import { ClaimMetadata } from "@/utils/useClaimsMetadata";
import getMinifiedId from "@/utils/getMinifiedId";
import { EthAccount } from "@/utils/useEthAccount";
import GemTag from "../GemTag";
import ClaimTag from "../ClaimTag";
import Input from "../Input";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

const Subtitle = styled.h3`
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  margin-top: 24px;
  margin-bottom: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  margin-bottom: 8px;
  margin-top: 32px;
`;

const ElibilityLine = styled.div`
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Separator = styled.div`
  width: 100%;
  height: 1px;
  background: #262e45;
  margin: 8px 0;

  &:last-child {
    display: none;
  }
`;

const DestinationTag = styled.div`
  padding: 6px 12px;
  height: 34px;
  border: 1px solid #4f5b7e;
  color: #adb3d6;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  line-height: 22px;
  margin-bottom: 32px;
`;

type Props = {
  claimsMetadata: ClaimMetadata[];
  response: SismoConnectResponse | null;
  userInput: string;
  ethAccount: EthAccount;
  ethAccountSigned: EthAccount | null;
  onUserInput: (value: string) => void;
};

export default function EligibilitySummary({
  claimsMetadata,
  response,
  userInput,
  ethAccount,
  ethAccountSigned,
  onUserInput,
}: Props) {
  const requiredClaims = claimsMetadata?.filter((el) => !el?.isOptional);
  const optionalClaims = claimsMetadata?.filter((el) => el?.isOptional);

  return (
    <Container>
      {requiredClaims?.length > 0 && <Subtitle>Gated to members of:</Subtitle>}
      {requiredClaims?.map((claim, index) => (
        <Fragment key={claim.groupId}>
          <ElibilityLine>
            <GemTag
              label={claim.name}
              claimType={claim.claimType}
              value={claim.value}
              link={claim.link}
            />
            <ClaimTag
              isEligible={claim?.isEligible}
              isClaimed={claim.isClaimed}
              label={claim.airdropStatus}
            />
          </ElibilityLine>
          {index == 0 && <Separator />}
        </Fragment>
      ))}
      {optionalClaims?.length > 0 && <Subtitle>Optional:</Subtitle>}
      {optionalClaims?.map((claim, index) => (
        <Fragment key={claim.groupId}>
          <ElibilityLine>
            <GemTag
              label={claim.name}
              claimType={claim.claimType}
              value={claim.value}
              link={claim.link}
            />
            <ClaimTag
              isEligible={claim.isEligible}
              isClaimed={claim.isClaimed}
              label={claim.airdropStatus}
            />
          </ElibilityLine>
          {index == 0 && <Separator />}
        </Fragment>
      ))}

      <Label>Claim destination:</Label>

      {!response && <Input value={userInput} onChange={onUserInput} ethAccount={ethAccount} />}
      {response && (
        <DestinationTag>
          {ethAccountSigned?.ens
            ? ethAccountSigned?.ens
            : getMinifiedId(ethAccountSigned?.address as string)}
        </DestinationTag>
      )}
    </Container>
  );
}
