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
        4. The smart contract verifies the proofs contained in the response and stores verified
        claims and auths <br />
        5. The frontend reads the verified claims and auths from the contract and displays them
      </p>
      <div>
        <p>
          <b className="code-snippet">front/src/app/page.tsx</b>: Frontend - Integrate Sismo Connect
          Button and make Sismo Connect request
        </p>
        <p>
          <b className="code-snippet">front/src/app/sismo-connect-config.ts</b>: Sismo Connect
          configuration and requests
        </p>
        <p>
          <b className="code-snippet">src/Airdrop.sol</b>: Contract - verifies Sismo Connect
          response and stores verified claims, auths and signed message
        </p>
        <p className="callout">
          {" "}
          Notes: <br />
          1. You should exactly have the same Configuration (AppId and impersonation), AuthRequests
          and ClaimsRequests in the frontend and in your contract <br />
          2. If you are using metamask and transactions hang. Go to settings &gt; advanced &gt;
          clear activity and nonce data <br />
          3. First ZK Proof generation takes longer time, especially with bad internet as there is a
          zkey file to download once in the data vault connection <br />
          4. The more proofs you request, the longer it takes to generate them (about 2 secs per
          proof)
        </p>
      </div>
    </>
  );
};

export default Header;
