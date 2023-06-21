import styled from "styled-components";
import Image from "next/image";
import logo from "../../assets/logo.svg";
import Link from "next/link";

const Container = styled.header`
  display: flex;
  gap: 24px;
  padding-bottom: 40px;
  margin-bottom: 40px;
  border-bottom: 1px solid #3a4161;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 600px;
`;

const Title = styled.h1`
  font-weight: 600;
  font-size: 24px;
  line-height: 30px;
`;

const Description = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;
  color: #828ab4;
`;

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const LinkItem = styled(Link)`
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;
  color: #c08aff;
`;

export default function Header() {
  return (
    <Container>
      <Image src={logo} alt="Sismo Connect" width={98} height={98} />
      <Content>
        <Title>SafeAirdrop: Sybil-resistant airdrop from privately-aggregated data</Title>
        <Description>
          SafeAirDrop is a Sybil-resistant and privacy-preserving ERC20 airdrop that distributes AIR
          tokens to users proportionally based on their reputation, aggregated from diverse sources
          of data (wallets, Telegram, Twitter and GitHub accounts).
        </Description>
        <LinkGroup>
          <LinkItem
            href="https://github.com/sismo-core/sismo-connect-boilerplate-onchain"
            target="_blank"
          >
            Code
          </LinkItem>
          <LinkItem
            href="https://docs.sismo.io/sismo-docs/build-with-sismo-connect/tutorials/onchain-tutorials/tuto"
            target="_blank"
          >
            Tutorial on how to built it
          </LinkItem>
          <LinkItem
            href="https://www.notion.so/sismo/SafeDrop-Sybil-resistant-airdrop-from-privately-aggregated-data-38d0dc265cb142b6baecbee863202558#4740f5b444f3433682ac30d6d0e0bf3c"
            target="_blank"
          >
            Full case study
          </LinkItem>
        </LinkGroup>
      </Content>
    </Container>
  );
}
