// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "sismo-connect-solidity/SismoLib.sol"; // <--- add a Sismo Connect import

/*
 * @title Airdrop
 * @dev Simple Airdrop contract that mints a token to the msg.sender
 * This contract is used for tutorial purposes only
 * It will be used to demonstrate how to integrate Sismo Connect
 */
contract Airdrop is
  ERC20,
  SismoConnect // <--- add a Sismo Connect inheritance
{
  using SismoConnectHelper for SismoConnectVerifiedResult;

  bytes16 public constant APP_ID = 0xf4977993e52606cfd67b7a1cde717069; // <--- add your appId as a constant

  constructor(
    string memory name,
    string memory symbol
  )
    ERC20(name, symbol)
    SismoConnect(APP_ID) // <--- Sismo Connect constructor
  {}

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
    // in this case the userId is the vaultId (since we used AuthType.VAULT in the auth request), the anonymous identifier of a user's vault for a specific app --> vaultId = hash(userVaultSecret, appId)
    // In this contract, we use this vaultId as the tokenId of the NFT we mint to the user
    // This way, all proofs that are generated from the same vault will try to mint the same tokenId
    // So if a user tries to claim twice with a proof from the same vault, the vaultId will be the same and the contract will revert
    uint256 tokenId = SismoConnectHelper.getUserId(result, AuthType.VAULT);
    _mint(msg.sender, tokenId);
  }
}
