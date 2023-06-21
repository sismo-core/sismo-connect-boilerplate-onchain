import styled from "styled-components";

const Container = styled.div<{ $isEligible?: boolean; $isClaimed?: boolean }>`
  padding: 5px 8px;
  height: 32px;
  border: 1px solid
    ${(props) => (props.$isClaimed ? "#C08AFF" : props.$isEligible ? "#64D7C0" : "#3a4161")};
  color: ${(props) => (props.$isClaimed ? "#C08AFF" : props.$isEligible ? "#64D7C0" : "#828AB4")};
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  line-height: 22px;
`;

type Props = {
  label: string;
  isEligible?: boolean;
  isClaimed?: boolean;
};

export default function ClaimTag({ label, isEligible, isClaimed }: Props) {
  return (
    <Container $isEligible={isEligible} $isClaimed={isClaimed}>
      {label}
    </Container>
  );
}
