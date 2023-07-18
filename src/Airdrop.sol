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

  // these requests should be queried by the app frontend
  // Sismo Connect response's zk proofs will be checked against these requests.
  // check _setRequests function to see how these requests are built
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
    bool isImpersonationMode
  ) ERC20(name, symbol) SismoConnect(buildConfig(appId, isImpersonationMode)) {
    // defining requests
    // Request users to prove ownership of a Data Source (Wallet, Twitter, Github, Telegram, etc.)
    AuthRequest[] memory authRequests = new AuthRequest[](3);
    // Anonymous identifier of the vault for this app
    // vaultId = hash(vaultSecret, appId).
    // full docs: https://docs.sismo.io/sismo-docs/build-with-sismo-connect/technical-documentation/vault-and-proof-identifiers
    authRequests[0] = AuthRequest({
      authType: AuthType.VAULT,
      userId: 0,
      isAnon: false,
      isOptional: false,
      isSelectableByUser: true,
      extraData: ""
    });
    // Request users to prove ownership of an EVM account
    authRequests[1] = AuthRequest({
      authType: AuthType.EVM_ACCOUNT,
      userId: 0,
      isAnon: false,
      isOptional: false,
      isSelectableByUser: true,
      extraData: ""
    });
    // Request users to prove ownership of a Github account
    authRequests[2] = AuthRequest({
      authType: AuthType.GITHUB,
      userId: 0,
      isAnon: false,
      isOptional: true,
      isSelectableByUser: true,
      extraData: ""
    });

    // Request users to prove membership in a Data Group (e.g I own a wallet that is part of a DAO, owns an NFT, etc.)
    ClaimRequest[] memory claimRequests = new ClaimRequest[](3);
    // claim on Sismo Hub GitHub Contributors Data Group membership: https://factory.sismo.io/groups-explorer?search=0xda1c3726426d5639f4c6352c2c976b87
    // Data Group members          = contributors to sismo-core/sismo-hub
    // value for each group member = number of contributions
    // request user to prove membership in the group
    claimRequests[0] = ClaimRequest({
      groupId: bytes16(0xda1c3726426d5639f4c6352c2c976b87),
      groupTimestamp: bytes16("latest"),
      isOptional: false,
      value: 1,
      isSelectableByUser: true,
      claimType: ClaimType.GTE,
      extraData: ""
    });
    // claim ENS DAO Voters Data Group membership: https://factory.sismo.io/groups-explorer?search=0x85c7ee90829de70d0d51f52336ea4722
    // Data Group members          = voters in ENS DAO
    // value for each group member = number of votes in ENS DAO
    // request user to prove membership in the group with value >= 17
    claimRequests[1] = ClaimRequest({
      groupId: bytes16(0x85c7ee90829de70d0d51f52336ea4722),
      groupTimestamp: bytes16("latest"),
      isOptional: false,
      value: 4,
      isSelectableByUser: true,
      claimType: ClaimType.GTE,
      extraData: ""
    });
    // claim on Stand with Crypto NFT Minters Data Group membership: https://factory.sismo.io/groups-explorer?search=0xfae674b6cba3ff2f8ce2114defb200b1
    // Data Group members          = minters of the Stand with Crypto NFT
    // value for each group member = number of NFT minted
    // request user to prove membership in the group with value = 10
    claimRequests[2] = ClaimRequest({
      groupId: bytes16(0xfae674b6cba3ff2f8ce2114defb200b1),
      groupTimestamp: bytes16("latest"),
      isOptional: true,
      value: 10,
      isSelectableByUser: true,
      claimType: ClaimType.EQ,
      extraData: ""
    });

    // setting requests in storage
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

  function getClaimRequests() external view returns (ClaimRequest[] memory) {
    return _claimRequests;
  }

  function getAuthRequests() external view returns (AuthRequest[] memory) {
    return _authRequests;
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
