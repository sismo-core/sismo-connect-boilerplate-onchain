import { AUTHS, CLAIMS, sismoConnectConfig } from "@/app/page";
import getMinifiedId from "@/utils/getMinifiedId";
import { EthAccount } from "@/utils/useEthAccount";
import { useSismoConnect } from "@sismo-core/sismo-connect-react";
import styled from "styled-components";
import Button from "../Button";

const Container = styled.main`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  width: 572px;
  align-items: center;
  justify-content: center;
  height: 50vh;
`;

const Title = styled.h2`
  font-weight: 600;
  font-size: 32px;
  line-height: 38px;
`;

const Subtitle = styled.h3`
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;
  margin-top: 16px;
  margin-bottom: 24px;
  color: #adb3d6;
`;

const StyledButton = styled(Button)`
  align-self: center;
  width: 145px;
`;

type Props = {
  amountClaimed: string;
  ethAccountSigned: EthAccount;
};

export default function Congrats({ amountClaimed, ethAccountSigned }: Props) {
  const { response, sismoConnect } = useSismoConnect({ config: sismoConnectConfig });

  return (
    <Container>
      <Title>Congratulations</Title>
      {ethAccountSigned && (
        <Subtitle>
          You have received {amountClaimed} AIR on{" "}
          {ethAccountSigned?.ens || getMinifiedId(ethAccountSigned?.address as string)}
        </Subtitle>
      )}
      {response && (
        <StyledButton
          onClick={() => {
            sismoConnect.request({
              auths: AUTHS,
              claims: CLAIMS,
              signature: { message: response.signedMessage as string },
            });
          }}
        >
          Claim more
        </StyledButton>
      )}
    </Container>
  );
}
