import styled from "styled-components";
import Loader from "../Loader";

const Main = styled.div<{ $isDisabled: boolean }>`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #0e1528;
  border: 1px solid #64d7c0;
  border-radius: 10px;
  transition: all 0.15s ease-in-out;
  cursor: ${({ $isDisabled }) => ($isDisabled ? "default" : "pointer")};
`;

const Container = styled.button`
  position: relative;
  color: #e9ebf6;
  font-family: inherit;
  font-weight: 500;
  font-size: 20px;
  line-height: 22px;
  background-color: transparent;
  border: none;

  &:hover ${Main} {
    transform: translate(5px, 5px);
  }

  &:disabled {
    opacity: 0.5;

    &:hover ${Main} {
      transform: none;
    }
  }
`;

const Underline = styled.div`
  position: absolute;
  z-index: 0;
  top: 5px;
  left: 5px;
  width: 100%;
  height: 100%;
  border: 1px solid #1234f5;
  border-radius: 10px;
`;

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick: () => void;
};

export default function Button({
  children,
  style,
  className,
  disabled,
  isLoading,
  onClick,
}: Props) {
  return (
    <Container
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      style={style}
      className={className}
    >
      <Main $isDisabled={Boolean(disabled) || Boolean(isLoading)}>
        {isLoading && <Loader size={18} />}
        {children}
      </Main>
      <Underline />
    </Container>
  );
}
