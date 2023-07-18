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
        1. A contract is deployed with a Sismo Connect Configuration and a Sismo Connect Request <br />
        2. The frontend queries the Sismo Connect Configuration and Request from the contract <br />
        3. The frontend requests ZK Proofs via Sismo Connect Button <br />
        4. The user generates ZK Proofs in their Data Vault and sends the Sismo Connect response to
        the frontend <br />
        5. The frontend forwards the response to ERC20 smart contract via claimWithSismo function{" "}
        <br />
        6. The smart contract verifies the proofs contained in the response, mints ERC20 tokens and stores
        verified claims and auths <br />
        7. The frontend reads the verified claims and auths from the contract and displays them
      </p>
      <div>
        <p>
          <b className="code-snippet">src/front/app/page.tsx</b>: Frontend - Queries contract to know Sismo Connect Configuration and Request, requests ZK Proofs from users via Sismo Connect Button
        </p>
        <p>
          <b className="code-snippet">src/Airdrop.sol</b>: Contract - Sets up the Sismo Connect Configuration and Request, verifies Sismo Connect response,
          mints tokens and stores verified claims, auths and signed message
        </p>
        <p className="callout">
          {" "}
          Notes: <br />
          1. If you are using metamask and transactions hang. Go to settings > advanced > clear activity and nonce data <br />
          2. First ZK Proof generation takes longer time, especially with bad internet as there is a
          zkey file to download once in the data vault connection <br />
          3. The more proofs you request, the longer it takes to generate them (about 2 secs per
          proof)
        </p>
      </div>
    </>
  );
};

export default Header;
