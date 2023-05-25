import React from "react";
import styled from "styled-components";

const Spinner = styled.div<{ color?: string; size: number }>`
  height: ${(props) => props.size}px;
  width: ${(props) => props.size}px;
  border-radius: ${(props) => props.size}px;
  color: ${(props) => props.color};
  position: relative;
  display: inline-block;
  border: ${(props) => props.size / 6}px solid;
  border-top-color: transparent;
  animation: rotate 1s linear infinite;

  @keyframes rotate {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

type LoaderProps = {
  color?: string;
  style?: React.CSSProperties;
  size?: number;
};

export default function Loader({
  color,
  style,
  size = 13,
}: LoaderProps): JSX.Element {
  return <Spinner color={color} style={style} size={size} />;
}
