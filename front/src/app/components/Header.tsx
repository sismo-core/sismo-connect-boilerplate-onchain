import React from "react";

const Header: React.FC = () => {
  return (
    <>
      <h1>
        <b> Sismo Connect Starter: onchain app with Next.js + Foundry</b>
      </h1>
      <h3>
        <a href="https://docs.sismo.io"> Read the docs | </a>
        <a href="https://builders.sismo.io"> Join the Telegram Builders Group </a>
      </h3>
      <p>
        1. The frontend requests ZK Proofs via Sismo Connect Button <br />
        2. The user generates ZK Proofs in their Data Vault and sends the Sismo Connect response to
        the frontend <br />
        3. The frontend forwards the response to ERC20 smart contract via claimWithSismo function{" "}
        <br />
        4. The smart contract the proofs contained in the response, mints ERC20 tokens and stores
        verified claims and auths <br />
        5. The frontend reads the verified claims and auths from the contract and displays them
      </p>
      <div>
        <p>
          <b className="code-snippet">src/front/app/sismo-connect-config.ts</b>: Sismo Connect
          configuration and requests
        </p>
        <p>
          <b className="code-snippet">src/front/app/page.tsx</b>: Frontend - make Sismo Connect
          request
        </p>
        <p>
          <b className="code-snippet">src/Airdrop.sol</b>: Contract - verify Sismo Connect request,
          mint tokens and stores verified claims and auths
        </p>
      </div>
    </>
  );
};

export default Header;
