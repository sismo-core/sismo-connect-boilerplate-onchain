// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "forge-std/console.sol";
import "sismo-connect-solidity/SismoLib.sol"; // <--- add a Sismo Connect import

/*
 * @title Airdrop
 * @author Sismo
 * @dev Simple Airdrop contract that mints ERC20 tokens to the msg.sender
 * This contract is used for tutorial purposes only
 * It will be used to demonstrate how to integrate Sismo Connect
 */
contract Airdrop is ERC20, SismoConnect {
  error AlreadyClaimed();
  using SismoConnectHelper for SismoConnectVerifiedResult;
  mapping(uint256 => bool) public claimed;

  constructor(
    string memory name,
    string memory symbol,
    bytes16 appId,
    bool isImpersonationMode
  ) ERC20(name, symbol) SismoConnect(buildConfig(appId, isImpersonationMode)) {}

  function claimWithSismo(bytes memory response) public {
    SismoConnectVerifiedResult memory result = verify({
      responseBytes: response,
      // we want the user to prove that he owns a Sismo Vault
      // we are recreating the auth request made in the frontend to be sure that
      // the proofs provided in the response are valid with respect to this auth request
      auth: buildAuth({authType: AuthType.VAULT}),
      // we also want to check if the signed message provided in the response is the signature of the user's address
      signature: buildSignature({message: abi.encode(msg.sender)})
    });

    // if the proofs and signed message are valid, we take the userId from the verified result
    // in this case the userId is the vaultId (since we used AuthType.VAULT in the auth request),
    // it is the anonymous identifier of a user's vault for a specific app
    // --> vaultId = hash(userVaultSecret, appId)
    uint256 vaultId = result.getUserId(AuthType.VAULT);

    // we check if the user has already claimed the airdrop
    if (claimed[vaultId]) {
      revert AlreadyClaimed();
    }
    // each vaultId can claim 100 tokens
    uint256 airdropAmount = 100 * 10 ** 18;

    // we mark the user as claimed. We could also have stored more user airdrop information for a more complex airdrop system. But we keep it simple here.
    claimed[vaultId] = true;

    // we mint the tokens to the user
    _mint(msg.sender, airdropAmount);
  }
}
