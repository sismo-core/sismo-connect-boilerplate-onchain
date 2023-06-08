// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "forge-std/src/console.sol";
import "sismo-connect-solidity/SismoLib.sol"; // <--- add a Sismo Connect import

/*
 * @title Airdrop
 * @author Sismo
 * @dev Simple Airdrop contract that mints a token to the msg.sender
 * This contract is used for tutorial purposes only
 * It will be used to demonstrate how to integrate Sismo Connect
 */
contract Airdrop is ERC20, SismoConnect {
  error AlreadyClaimed();
  event Verify(uint256 indexed vaultId, AuthRequest[] indexed auths, ClaimRequest[]);
  using SismoConnectHelper for SismoConnectVerifiedResult;
  mapping(uint256 => bool) public claimed;

  bytes16 public constant APP_ID = 0xf4977993e52606cfd67b7a1cde717069;
  bytes16 public constant GITCOIN_PASSPORT_GROUP_ID = 0x1cde61966decb8600dfd0749bd371f12;
  bytes16 public constant SISMO_CONTRIBUTORS_GROUP_ID = 0xe9ed316946d3d98dfcd829a53ec9822e;
  bytes16 public constant SISMO_SNAPSHOT_VOTERS = 0xabf3ea8c23ff96893ac5caf4d2fa7c1f;

  constructor(
    string memory name,
    string memory symbol
  )
    ERC20(name, symbol)
    SismoConnect(APP_ID) // <--- Sismo Connect constructor
  {}

  function _getRewardAmount(
    SismoConnectVerifiedResult memory result
  ) private pure returns (uint256) {
    // user will gain 100 tokens for each verified claim apart from the Sismo Contributor Claim where the user will gain 100 tokens per level of contribution in th Sismo community.

    uint256 airdropAmount = 20;
    VerifiedClaim memory sismoContributorClaim;

    // we first need to find the Sismo Contributor Claim in the list of claims
    for (uint i = 0; i < result.claims.length; i++) {
      if (result.claims[i].groupId == SISMO_CONTRIBUTORS_GROUP_ID) {
        sismoContributorClaim = result.claims[i];
        break;
      }
    }

    // if the user has a Sismo Contributor Claim, we add the airdrop amount based on the value of the claim
    if (sismoContributorClaim.value > 0) {
      airdropAmount += sismoContributorClaim.value * 100;
    }

    // for the other airdrops we just need to check the number of claims to calculate the remaining airdrop amount minus 1 (since the user already claimed the Sismo Contributor airdrop)
    airdropAmount += (result.claims.length - 1) * 100;
    return airdropAmount;
  }

  function claimWithSismo(bytes memory response) public {
    uint256 airdropAmount = 2000 * 10 ** decimals();

    ClaimRequest[] memory claims = new ClaimRequest[](3);
    claims[0] = buildClaim({groupId: GITCOIN_PASSPORT_GROUP_ID, claimType: ClaimType.GTE, value: 15});
    claims[1] = buildClaim({groupId: SISMO_CONTRIBUTORS_GROUP_ID, isSelectableByUser: true, isOptional: false});
    claims[2] = buildClaim({groupId: SISMO_SNAPSHOT_VOTERS, isSelectableByUser: false, isOptional: true});

    AuthRequest[] memory auths = new AuthRequest[](1);
    auths[0] = buildAuth({authType: AuthType.VAULT});


    SismoConnectVerifiedResult memory result = verify({
      responseBytes: response,
      // we want the user to prove that he owns a Sismo Vault
      // we are recreating the auth request made in the frontend to be sure that
      // the proofs provided in the response are valid with respect to this auth request
      auths: auths,
      claims: claims,
      // we also want to check if the signed message provided in the response is the signature of the user's address
      signature: buildSignature({message: abi.encode(msg.sender)})
    });

    // if the proofs and signed message are valid, we take the userId from the verified result
    // in this case the userId is the vaultId (since we used AuthType.VAULT in the auth request), the anonymous identifier of a user's vault for a specific app --> vaultId = hash(userVaultSecret, appId)
    //console.log(result);
    uint256 vaultId = result.getUserId(AuthType.VAULT);

    // we check if the user has already claimed the airdrop
    if (claimed[vaultId]) {
      revert AlreadyClaimed();
    }

    //we get the airdrop amount from the verified result based on the number of claims and auths that were verified
    //uint256 airdropAmount = _getRewardAmount(result);

    // we mark the user as claimed. We could also have stored more user airdrop information for a more complex airdrop system. But we keep it simple here.
    claimed[vaultId] = true;

    // we mint the token to the user
    _mint(msg.sender, airdropAmount);
  }
}
