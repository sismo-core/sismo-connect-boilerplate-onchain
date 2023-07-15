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

  AuthRequest[] private _authRequests;
  ClaimRequest[] private _claimRequests;

  constructor(
    string memory name,
    string memory symbol,
    bytes16 appId,
    bool isImpersonationMode,
    AuthRequest[] memory authRequests,
    ClaimRequest[] memory claimRequests
  ) ERC20(name, symbol) SismoConnect(buildConfig(appId, isImpersonationMode)) {
    _setAuths(authRequests);
    _setClaims(claimRequests);
  }

  function claimWithSismo(bytes memory response) public {
    SismoConnectVerifiedResult memory result = verify({
      responseBytes: response,
      // we want the user to prove that he owns a Sismo Vault
      // we are recreating the auth request made in the frontend to be sure that
      // the proofs provided in the response are valid with respect to this auth request
      auths: _authRequests,
      claims: _claimRequests,
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

    // we mark the user as claimed. We could also have stored more user airdrop information for a more complex airdrop system. But we keep it simple here.
    claimed[vaultId] = true;

    uint256 airdropAmount = (result.auths.length + result.claims.length) * 10 ** 18;
    // we mint the tokens to the user
    _mint(msg.sender, airdropAmount);
  }

  function _setAuths(AuthRequest[] memory auths) private {
    for (uint256 i = 0; i < auths.length; i++) {
      _authRequests.push(auths[i]);
    }
  }

  function _setClaims(ClaimRequest[] memory claims) private {
    for (uint256 i = 0; i < claims.length; i++) {
      _claimRequests.push(claims[i]);
    }
  }
}
