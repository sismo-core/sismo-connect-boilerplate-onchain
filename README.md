# Sismo Connect - Onchain Boilerplate Repository

This repository aims at providing a simple example on how to integrate Sismo Connect onchain while allowing you to test the integration locally as easily as possible.

## Usage

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) >= 18.15.0 (Latest LTS version)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Foundry](https://book.getfoundry.sh/)

### Clone the repository

```bash
git clone https://github.com/sismo-core/sismo-connect-boilerplate-onchain
cd sismo-connect-boilerplate-onchain
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

### Deploy your Airdrop contract

With a private key, a RPC url and an etherscan api key:

```bash
forge script DeployAirdrop \
--rpc-url $RPC_URL \
--private-key "$PRIVATE_KEY" \
--broadcast \
--slow \
--etherscan-api-key "$ETHERSCAN_API_KEY" \
--verify \
--watch
```

With a mnemonic and a sender:

```bash
forge script DeployAirdrop \
--rpc-url $RPC_URL \
--mnemonics "$MNEMONIC" \
--sender $SENDER \
--broadcast \
--slow \
--etherscan-api-key "$ETHERSCAN_API_KEY" \
--verify \
--watch
```

### Run contract tests

Sismo Connect contracts are currently deployed on several chains.
You can find the deployed addresses [here](https://docs.sismo.io/sismo-docs/knowledge-base/resources/sismo-101).
You can then run tests on a local fork network to test your contracts.

```bash
## Run fork tests with goerli
forge test --fork-url https://rpc.ankr.com/eth_goerli

## Run fork tests with mumbai
forge test --fork-url https://gateway.tenderly.co/public/polygon-mumbai

# you can aslo use the rpc url you want by passing an environment variable
forge test --fork-url $RPC_URL
```
