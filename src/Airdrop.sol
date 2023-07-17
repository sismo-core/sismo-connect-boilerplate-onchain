// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "forge-std/console.sol";
import "sismo-connect-solidity/SismoLib.sol";

/*
 * @title Airdrop
 * @author Sismo
 * @dev Simple Airdrop contract gated by Sismo Connect
 * Application requests multiple zk proofs (auths and claims) and verify them
 * The contract stores all verified results in storage
 */
contract Airdrop is ERC20, SismoConnect {
  event AuthVerified(VerifiedAuth verifiedAuth);
  event ClaimVerified(VerifiedClaim verifiedClaim);
  event SignedMessageVerified(bytes verifiedSignedMessage);
  using SismoConnectHelper for SismoConnectVerifiedResult;

  // must correspond to requests defined in the app frontend
  // Sismo Connect response's zk proofs will be checked against these requests.
  // check Airdrop.s.sol to see how these requests are built and passed to the constructor
  AuthRequest[] private _authRequests;
  ClaimRequest[] private _claimRequests;

  // Results of the verification of the Sismo Connect response.
  VerifiedAuth[] internal _verifiedAuths;
  VerifiedClaim[] internal _verifiedClaims;
  bytes internal _verifiedSignedMessage;

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

  function claimWithSismo(bytes memory response, address to) public {
    SismoConnectVerifiedResult memory result = verify({
      responseBytes: response,
      // checking response against requested auths
      auths: _authRequests,
      // checking response against requested claims
      claims: _claimRequests,
      // checking response against requested message signature
      signature: buildSignature({message: abi.encode(to)})
    });

    // airdrop amount = number of verified proofs
    uint256 airdropAmount = (result.auths.length + result.claims.length) * 10 ** 18;
    _mint(to, airdropAmount);

    // cleaning previous results of the verification
    _cleanVerifiedAuths();
    _cleanVerifiedClaims();

    // storing the result of the verification
    for (uint256 i = 0; i < result.auths.length; i++) {
      _verifiedAuths.push(result.auths[i]);
      emit AuthVerified(result.auths[i]);
    }
    for (uint256 i = 0; i < result.claims.length; i++) {
      _verifiedClaims.push(result.claims[i]);
      emit ClaimVerified(result.claims[i]);
    }
    _verifiedSignedMessage = result.signedMessage;
    emit SignedMessageVerified(result.signedMessage);
  }

  function getVerifiedClaims() external view returns (VerifiedClaim[] memory) {
    return _verifiedClaims;
  }

  function getVerifiedAuths() external view returns (VerifiedAuth[] memory) {
    return _verifiedAuths;
  }

  function getVerifiedSignedMessage() external view returns (bytes memory) {
    return _verifiedSignedMessage;
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

  function _cleanVerifiedAuths() private {
    uint256 verifiedAuthsLength = _verifiedAuths.length;
    if (verifiedAuthsLength != 0) {
      for (uint256 i = 0; i < verifiedAuthsLength; i++) {
        _verifiedAuths.pop();
      }
    }
  }

  function _cleanVerifiedClaims() private {
    uint256 verifiedClaimsLength = _verifiedClaims.length;
    if (verifiedClaimsLength != 0) {
      for (uint256 i = 0; i < verifiedClaimsLength; i++) {
        _verifiedClaims.pop();
      }
    }
  }
}
