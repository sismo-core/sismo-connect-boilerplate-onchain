import { EthAccount, isEns, isEthAddress } from "@/utils/useEthAccount";
import styled from "styled-components";
import Loader from "../Loader";
import { useRef, useState } from "react";

const Container = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 32px;
`;

const InputEl = styled.input`
  padding: 8px 10px;
  height: 36px;
  width: 100%;
  border: 1px solid #3a4161;
  background: transparent;
  border-radius: 5px;
  color: #e9ebf6;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;

  &:focus {
    outline: none;
    border: 1px solid #e9ebf6;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
  }

  &::placeholder {
    color: #4f5b7e;
  }
`;

const Status = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  bottom: -20px;
  font-weight: 500;
  font-size: 12px;
  line-height: 18px;
  color: #4f5b7e;
  margin-top: 4px;
`;

type Props = {
  value: string;
  ethAccount: EthAccount | undefined;
  onChange: (value: string) => void;
};

export default function Input({ value, onChange, ethAccount }: Props) {
  const [userInput, setUserInput] = useState(value || "");
  const timeoutRef = useRef<NodeJS.Timeout>();

  function onUserInput(event: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timeoutRef.current);
    setUserInput(event.target.value);

    timeoutRef.current = setTimeout(() => {
      onChange(event.target.value ? event.target.value.toLowerCase().trim() : "");
    }, 320);
  }

  return (
    <Container>
      <InputEl type="text" placeholder="0x123... or ENS" value={userInput} onChange={onUserInput} />
      {value && ethAccount?.isError && !ethAccount?.isLoading && (
        <Status>✘ Invalid ethereum address or ENS name</Status>
      )}
      {value && ethAccount?.isLoading && (
        <Status>
          <Loader size={12} />
          Resolving EVM account
        </Status>
      )}
      {value && !ethAccount?.isLoading && !ethAccount?.isError && (
        <Status>
          {isEthAddress(value) && ethAccount?.ens
            ? `✓ ${ethAccount?.ens}`
            : isEns(value) && ethAccount?.address
            ? `✓ ${ethAccount?.address}`
            : ``}
        </Status>
      )}
    </Container>
  );
}
