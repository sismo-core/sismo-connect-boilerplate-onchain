import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import useClickOutside from "../../utils/useClickOutside";
import { X } from "phosphor-react";

const Disabled = styled.div<{ zIndex?: number }>`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: ${(props) => (props.zIndex ? props.zIndex + 10 : 1010)};
  background: rgba(28, 40, 71, 0);
  overflow-y: hidden;
  overflow-x: hidden;
`;

//We separate the background from the content in order to display illustration or confetti between them
const Background = styled.div<{
  displayNone: boolean;
  opacity: number;
  blur: boolean;
  animated: boolean;
  zIndex?: number;
}>`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: ${(props) => (props.zIndex ? props.zIndex + 7 : 1007)};
  background: rgba(7, 11, 20, 0.5);
  overflow-y: hidden;
  overflow-x: hidden;

  ${(props) => props.animated && "transition: all 0.3s;"};

  ${(props) => props.blur && `backdrop-filter: blur(15px);`}

  ${(props) => props.displayNone && "display: none;"}

  ${(props) =>
    props.opacity === 1 &&
    !props.displayNone &&
    `
    opacity: 1;
  `}

  ${(props) =>
    props.opacity === 0 &&
    !props.displayNone &&
    `  
    opacity: 0;
  `}
`;

const Container = styled.div<{
  displayNone: boolean;
  opacity: number;
  animated: boolean;
  zIndex: number;
}>`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: ${(props) => (props.zIndex ? props.zIndex + 9 : 1009)};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  overflow: auto;
  overflow-y: scroll;
  overflow-x: hidden;

  ${(props) => props.displayNone && "display: none;"}

  ${(props) => props.animated && "transition: all 0.3s;"};

  ${(props) =>
    props.opacity === 1 &&
    !props.displayNone &&
    `
    opacity: 1;
    transform: translate3d(0, 0, 0);
  `}

  ${(props) =>
    props.opacity === 0 &&
    !props.displayNone &&
    `  
    opacity: 0;
    transform: translate3d(0, 5%, 0);
  `}

@media (max-width: 900px) {
    align-items: center;
    padding-top: 40px;
    padding-bottom: 20px;
    margin-bottom: 20px;
    overflow-y: auto;
    height: 100vh;
  }
`;

const Content = styled.div`
  background: #0a101f;
  border: 1px solid #4f5b7e;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  position: relative;
  margin: auto 10px;
`;

const Close = styled.div<{ zIndex?: number }>`
  cursor: pointer;
  position: absolute;
  top: -30px;
  right: 0px;
 // z-index: ${(props) => (props.zIndex ? props.zIndex + 7 : 1007)};
`;

type ModalProps = {
  children?: React.ReactNode;
  onClose?: () => void;
  disabled?: boolean;
  isOpen?: boolean;
  blur?: boolean;
  animated?: boolean;
  outsideClosable?: boolean;
  zIndex?: number;
};

export default function Modal({
  children,
  disabled,
  onClose,
  isOpen,
  blur = true,
  animated = true,
  outsideClosable = true,
  zIndex = 1000,
}: ModalProps): JSX.Element {
  const [displayNone, setDisplayNone] = useState(true);
  const [opacity, setOpacity] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => {
    if (!disabled && outsideClosable) isOpen && onClose && onClose();
  });

  useEffect(() => {
    const html: any = document.getElementsByTagName("HTML")[0];
    html.style.overflowX = "hidden";
    if (!isOpen) {
      html.style.overflowY = "initial";
    } else {
      html.style.overflowY = "hidden";
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setDisplayNone(false);
      setTimeout(() => {
        setOpacity(true);
      }, 20);
    } else {
      setOpacity(false);
      setTimeout(() => {
        setDisplayNone(true);
      }, 300);
    }
  }, [isOpen]);

  return (
    <>
      {disabled && <Disabled zIndex={zIndex}></Disabled>}
      <Background
        blur={blur}
        animated={animated}
        displayNone={displayNone}
        opacity={opacity ? 1 : 0}
        zIndex={zIndex}
      />
      <Container
        displayNone={displayNone}
        opacity={opacity ? 1 : 0}
        animated={animated}
        zIndex={zIndex}
      >
        <Content ref={ref}>
          {onClose && (
            <Close onClick={onClose}>
              <X size={24} color={"white"} weight="bold" />
            </Close>
          )}
          {children}
        </Content>
      </Container>
    </>
  );
}
