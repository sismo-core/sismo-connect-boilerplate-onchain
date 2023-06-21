import styled from "styled-components";
import Link from "next/link";
import Image from "next/image";
import { ArrowSquareOut } from "phosphor-react";
import Gem from "../../assets/gem.svg";
import { ClaimType } from "@sismo-core/sismo-connect-react";
import { textShorten } from "@/utils/textShorten";

const Container = styled(Link)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 8px;
  width: 290px;
  gap: 8px;
  height: 24px;
  background: #1c243a;
  border-radius: 4px;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Label = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  ${textShorten(1)}
`;

const Comparator = styled.div`
padding: 0px 6px;
height: 18px;
background: #0A101F;
border-radius: 20px;
font-weight: 500;
font-size: 12px;
line-height: 18px;
`;



type Props = {
  label: string;
  link: string;
  claimType?: ClaimType;
  value?: number;
};

export default function GemTag({label, claimType, value, link}: Props) {
  const humanReadableClaim = claimType === ClaimType.GTE ? `>= ${value}`: null;

  return (
    <Container href={link} target="_blank">
      <Left>
        <Image src={Gem} width={16} height={16} alt="Gem" />
        <Label>{label}</Label>
        {humanReadableClaim  &&  <Comparator>{humanReadableClaim}</Comparator>}
      </Left>
      <ArrowSquareOut size={16} />
    </Container>
  );
}
