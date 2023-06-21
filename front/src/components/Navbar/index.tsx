import styled from "styled-components";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSismoConnect } from "@sismo-core/sismo-connect-react";
import { CHAIN, sismoConnectConfig } from "@/app/page";
import getSismoUserId, { SismoUserId } from "@/utils/getSismoUserId";
import SismoRoundedIcon from "../../assets/sismo-rounded-icon.svg";
import { CaretDown, LinkBreak, SignOut, Wall, Wallet } from "phosphor-react";
import { useAccount, useDisconnect, useNetwork, useSwitchNetwork } from "wagmi";
import getMinifiedId from "@/utils/getMinifiedId";
import useEthAccount from "@/utils/useEthAccount";
import Modal from "../Modal";
import Button from "../Button";
import { fundMyAccountOnLocalFork } from "@/utils/fundMyAccountOnLocalFork";

const Container = styled.div`
  position: absolute;
  width: 194px;
  top: 32px;
  right: 60px;
  padding: 6px 12px;
  background: #0a101f;
  border: 1px solid #3a4161;
  border-radius: 8px;
  cursor: pointer;
`;

const WrongChainModal = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  gap: 40px;
  padding: 32px;
  width: 305px;
`;

const ModalTitle = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 22px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: 16px;
  line-height: 22px;
  color: #adb3d6;
`;

const ChainStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: 12px;
  line-height: 18px;
  color: white;
  margin-left: 20px;

  &:before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #64d7c0;
  }
`;

const Separator = styled.div`
  width: 100%;
  height: 1px;
  background: #3a4161;
  margin: 8px 0;
`;

const StyledCaretDown = styled(CaretDown)<{ $isOpen: boolean }>`
  transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0deg)")};
`;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sismoUserId, setSismoUserId] = useState<SismoUserId | null>(null);
  const { response } = useSismoConnect({ config: sismoConnectConfig });
  const { chain } = useNetwork();
  const { address } = useAccount();
  const { switchNetwork } = useSwitchNetwork();

  useAccount({
    onConnect: async ({ address }) => address && (await fundMyAccountOnLocalFork(address)),
  });

  const ethAccount = useEthAccount(address as string);
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!response) return;
    const sismoUserId = getSismoUserId(response);
    setSismoUserId(sismoUserId);
  }, [response]);

  function onLogOut() {
    disconnect();
    setSismoUserId(null);
    const url = new URL(window.location.href);
    localStorage.clear();
    url.searchParams.delete("sismoConnectResponseCompressed");
    window.history.replaceState({}, "", url.toString());
    window.location.reload();
  }

  useEffect(() => {
    if (!chain) return;
    if (chain.id === CHAIN.id) {
      setIsModalOpen(false);
      return;
    }
    setIsModalOpen(true);
  }, [chain]);

  if (!response || !sismoUserId) return <></>;

  return (
    <>
      <Modal $isOpen={isModalOpen}>
        <WrongChainModal>
          <ModalTitle>Switch to {CHAIN.name} to continue</ModalTitle>
          <Button onClick={() => switchNetwork?.(CHAIN.id)}>Switch chain</Button>
        </WrongChainModal>
      </Modal>

      <Container onClick={() => setIsOpen(!isOpen)}>
        <Item>
          <ItemLeft>
            <Image src={SismoRoundedIcon} width={16} height={16} alt="Sismo rounded icon" />
            {sismoUserId?.minifiedId}
          </ItemLeft>
          <StyledCaretDown size={16} color={"#E9EBF6"} $isOpen={isOpen} />
        </Item>

        {chain && <ChainStatus>{chain.name}</ChainStatus>}

        {isOpen && (
          <>
            {address && (
              <>
                <Separator />
                <Item onClick={() => disconnect()}>
                  <ItemLeft>
                    <Wallet size={16} color={"#adb3d6"} />
                    <div>{ethAccount?.ens ? ethAccount?.ens : getMinifiedId(address)}</div>
                  </ItemLeft>
                  <LinkBreak size={16} color={"#adb3d6"} />
                </Item>
              </>
            )}
            <Separator />
            <Item onClick={() => onLogOut()}>
              <ItemLeft>
                <SignOut size={16} color={"#adb3d6"} />
                <div>Log out</div>
              </ItemLeft>
            </Item>
          </>
        )}
      </Container>
    </>
  );
}
