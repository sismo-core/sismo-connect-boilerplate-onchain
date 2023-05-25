# Sismo Connect - Onchain Sample Project Repository

This repository aims at providing simple examples on how to integrate Sismo Connect onchain while allowing you to test the integration locally as easily as possible.

## Usage

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) >= 18.15.0 (Latest LTS version)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Foundry](https://book.getfoundry.sh/)

### Clone the repository

```bash
git clone https://github.com/sismo-core/sismo-connect-onchain-tutorial
cd sismo-connect-onchain-tutorial
yarn
```

### Install contract dependencies

```bash
# updates foundry
foundryup
# install smart contract dependencies
forge install
```

### Launch a local fork chain

```bash
# in another terminal
# starts a local fork of Mumbai
yarn anvil
```

### Launch the local application

You can now launch your local dapp with the commands:

```bash
# in another terminal

# install frontend dependencies
cd front
yarn

# launch local application
yarn dev
```

The frontend is now available on http://localhost:3000/ and the contracts have been deployed on your local blockchain.
You can now experiment the user flow by going to your local frontend http://localhost:3000/.

As you will see, the app showcase simple examples on how to create gated airdrops with Sismo Connect.
To be eligible for the airdrops, you just need to add your address in [`./config.ts`](./config.ts):

```ts
// Replace with your address to become eligible for the airdrops
export const yourAddress = "0x855193BCbdbD346B423FF830b507CBf90ecCc90B"; // <--- Replace with your address

...
```

ℹ️ You will be able to mint each airdrop only once with the same eligible address. If you wish to test the airdrop flow multiple times, you will need to change your eligible address or deploy again the contracts with the following command:

```bash
# this will deploy the contracts again on your local blockchain
yarn deploy-local
```

### Run contract tests

sismoConnectVerifier contracts are currently deployed on Goerli and Mumbai.
You can find the deployed addresses [here](https://docs.sismo.io/sismo-docs/knowledge-base/resources/sismo-101).
You can then run tests on a local fork network to test your contracts.

```bash
## Run fork tests with goerli
forge test --fork-url https://rpc.ankr.com/eth_goerli

## Run fork tests with mumbai
forge test --fork-url https://rpc.ankr.com/polygon_mumbai

# you can aslo use the rpc url you want by passing an environment variable
forge test --fork-url $RPC_URL
```

⚠️ Important note

If you deployed your contracts on testnets (Goerli or Mumbai) and want to test it, you need to **keep the devMode enabled** but **remove the devGroups**.

DevMode allows Sismo Connect to redirect you to the Developer Data Vault (a special Data Vault used only for development)
