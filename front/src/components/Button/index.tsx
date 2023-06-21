import styled from "styled-components";

const Main = styled.div`
  padding: 12px 16px;
  background-color: #0e1528;
  border: 1px solid #64d7c0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
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
  z-index: -1;
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
  style?: React.CSSProperties;
  className?: string;
  onClick: () => void;
};

export default function Button({ children, style, className, disabled, onClick }: Props) {
  return (
    <Container
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      style={style}
      className={className}
    >
      <Main>{children}</Main>
      <Underline />
    </Container>
  );
}
