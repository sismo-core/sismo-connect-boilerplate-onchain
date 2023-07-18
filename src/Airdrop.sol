// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "forge-std/console2.sol";
import "sismo-connect-solidity/SismoConnectLib.sol";

/*
 * @title Airdrop
 * @author Sismo
 * @dev Simple Airdrop contract gated by Sismo Connect
 * Application requests multiple zk proofs (with auths and claims requests) and verify them
 * The contract stores all requests and verified results in storage
 */
contract Airdrop is ERC20, SismoConnect {
  event AuthVerified(VerifiedAuth verifiedAuth);
  event ClaimVerified(VerifiedClaim verifiedClaim);
  event SignedMessageVerified(bytes verifiedSignedMessage);
  using SismoConnectHelper for SismoConnectVerifiedResult;

  // appId of the Sismo Connect app
  bytes16 private _appId = 0x32403ced4b65f2079eda77c84e7d2be6;
  // allow proofs made from impersonating accounts to be verified
  // it should be set to false for production
  bool private _isImpersonationMode = true;

  // Results of the verification of the Sismo Connect response.
  VerifiedAuth[] internal _verifiedAuths;
  VerifiedClaim[] internal _verifiedClaims;
  bytes internal _verifiedSignedMessage;

  constructor(
    string memory name,
    string memory symbol
  ) ERC20(name, symbol) SismoConnect(buildConfig(_appId, _isImpersonationMode)) {
    // Defining requests that will be queried by the app frontend to allow users to generate a Sismo Connect response in their Sismo Vault
    // The Sismo Connect Response holding the zk proofs will be checked against these requests in the claimWithSismo function below
  }

  /**
   * @dev Claim the airdrop with a Sismo Connect response
   * Sismo Connect response's zk proofs will be checked against the requests defined in the constructor above
   * @param response Sismo Connect response
   * @param to address to mint the airdrop to
   */
  function claimWithSismo(bytes memory response, address to) public {
    // Request users to prove ownership of a Data Source (Wallet, Twitter, Github, Telegram, etc.)
    AuthRequest[] memory authRequests = new AuthRequest[](3);
    // Anonymous identifier of the vault for this app
    // vaultId = hash(vaultSecret, appId).
    // full docs: https://docs.sismo.io/sismo-docs/build-with-sismo-connect/technical-documentation/vault-and-proof-identifiers
    authRequests[0] = buildAuth({authType: AuthType.VAULT});
    // Request users to prove ownership of an EVM account
    authRequests[1] = buildAuth({authType: AuthType.EVM_ACCOUNT});
    // Request users to prove ownership of a Github account
    // this request is optional
    authRequests[2] = buildAuth({
      authType: AuthType.GITHUB,
      isOptional: true,
      isSelectableByUser: true
    });

    // Request users to prove membership in a Data Group (e.g I own a wallet that is part of a DAO, owns an NFT, etc.)
    ClaimRequest[] memory claimRequests = new ClaimRequest[](3);
    // claim on Sismo Hub GitHub Contributors Data Group membership: https://factory.sismo.io/groups-explorer?search=0xda1c3726426d5639f4c6352c2c976b87
    // Data Group members          = contributors to sismo-core/sismo-hub
    // value for each group member = number of contributions
    // request user to prove membership in the group
    claimRequests[0] = buildClaim({groupId: 0xda1c3726426d5639f4c6352c2c976b87});
    // claim ENS DAO Voters Data Group membership: https://factory.sismo.io/groups-explorer?search=0x85c7ee90829de70d0d51f52336ea4722
    // Data Group members          = voters in ENS DAO
    // value for each group member = number of votes in ENS DAO
    // request user to prove membership in the group with value >= 4
    claimRequests[1] = buildClaim({
      groupId: 0x85c7ee90829de70d0d51f52336ea4722,
      value: 4,
      claimType: ClaimType.GTE
    });
    // claim on Stand with Crypto NFT Minters Data Group membership: https://factory.sismo.io/groups-explorer?search=0xfae674b6cba3ff2f8ce2114defb200b1
    // Data Group members          = minters of the Stand with Crypto NFT
    // value for each group member = number of NFT minted
    // request user to prove membership in the group with value = 10
    claimRequests[2] = buildClaim({
      groupId: 0xfae674b6cba3ff2f8ce2114defb200b1,
      value: 10,
      claimType: ClaimType.EQ,
      isOptional: true,
      isSelectableByUser: true
    });

    SismoConnectVerifiedResult memory result = verify({
      responseBytes: response,
      // checking response against requested auths
      auths: authRequests,
      // checking response against requested claims
      claims: claimRequests,
      // checking response against a message signature
      // the message is the address to mint the airdrop to
      // this signature prevents front-running attacks
      signature: buildSignature({message: abi.encode(to)})
    });

    // airdrop amount = number of verified proofs
    uint256 airdropAmount = (result.auths.length + result.claims.length) * 10 ** 18;
    _mint(to, airdropAmount);

    // remove previous verified results from the verification
    _removePreviousVerifiedResults();

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

  /**
   * @dev Get the verified auths, claims and the verified signature that was verified in the claimWithSismo function
   */
  function getSismoConnectVerifiedResult()
    external
    view
    returns (VerifiedAuth[] memory, VerifiedClaim[] memory, bytes memory)
  {
    return (_verifiedAuths, _verifiedClaims, _verifiedSignedMessage);
  }

  // helpers

  function _removePreviousVerifiedResults() private {
    _cleanVerifiedAuths();
    _cleanVerifiedClaims();
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
