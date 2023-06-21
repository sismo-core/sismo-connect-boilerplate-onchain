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
    using SismoConnectHelper for SismoConnectVerifiedResult;
    error UserNotEligibleForAirdrop();

    struct StoredClaim {
        bytes16 groupId;
        uint256 value;
        bool claimed;
    }
// hello man
    mapping(uint256 user => mapping(bytes16 groupId => StoredClaim)) public userClaims;
    
    bytes16 public constant GITCOIN_PASSPORT_GROUP_ID = 0x1cde61966decb8600dfd0749bd371f12;
    bytes16 public constant SISMO_COMMUNITY_MEMBERS_GROUP_ID = 0xd630aa769278cacde879c5c0fe5d203c;
    bytes16 public constant SISMO_COMMUNITY_EARLY_MEMBERS = 0xe4c011331d91b79639df349a93157a1b;
    bytes16 public constant SISMO_FACTORY_USERS = 0x05629c9a54e30d8c8aea911a48cd9e30;

    uint256 public constant REWARD_BASE_VALUE = 100 * 10 ** 18;

    constructor(
        string memory name,
        string memory symbol,
        bytes16 appId,
        bool isImpersonationMode
    ) ERC20(name, symbol) SismoConnect(buildConfig(appId, isImpersonationMode)) {}

    function _getRewardAmount(
        SismoConnectVerifiedResult memory result,
        uint256 userId
    ) private returns (uint256) {
        uint256 airdropAmount = 0;

        for (uint i = 0; i < result.claims.length; i++) {
            VerifiedClaim memory verifiedClaim = result.claims[i];
            bytes16 groupId = verifiedClaim.groupId;

            StoredClaim storage userClaim = userClaims[userId][groupId];
            userClaim.groupId = groupId;

            if (groupId == SISMO_COMMUNITY_MEMBERS_GROUP_ID) {
                bool isClaimable = verifiedClaim.value > userClaim.value;
                if (isClaimable) {
                    airdropAmount += (verifiedClaim.value - userClaim.value) * REWARD_BASE_VALUE;
                    userClaim.claimed = true;
                    userClaim.value = verifiedClaim.value;
                    // store airdrop value
                }
            } else {
                if (!userClaim.claimed) {
                    airdropAmount += REWARD_BASE_VALUE;
                    userClaim.claimed = true;
                    userClaim.value = verifiedClaim.value;
                    // store airdrop value
                }
            }
        }
        return airdropAmount;
    }

  function claimWithSismo(address receiver, bytes memory response) public {

    ClaimRequest[] memory claims = new ClaimRequest[](4);
    claims[0] = buildClaim({
      groupId: GITCOIN_PASSPORT_GROUP_ID,
      claimType: ClaimType.GTE,
      value: 15
    });
    claims[1] = buildClaim({
      groupId: SISMO_COMMUNITY_MEMBERS_GROUP_ID,
      isSelectableByUser: true,
      isOptional: false
    });
    claims[2] = buildClaim({
      groupId: SISMO_COMMUNITY_EARLY_MEMBERS,
      isSelectableByUser: false,
      isOptional: true
    });
    claims[3] = buildClaim({
      groupId: SISMO_FACTORY_USERS,
      isSelectableByUser: false,
      isOptional: true
    });

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
      signature: buildSignature({message: abi.encode(receiver)})
    });

    // if the proofs and signed message are valid, we take the userId from the verified result
    // in this case the userId is the vaultId (since we used AuthType.VAULT in the auth request), the anonymous identifier of a user's vault for a specific app --> vaultId = hash(userVaultSecret, appId)
    uint256 userId = result.getUserId(AuthType.VAULT);

    //we get the airdrop amount from the verified result based on the number of claims and auths that were verified
    uint256 airdropAmount = _getRewardAmount(result, userId);
  
    if (airdropAmount == 0) revert UserNotEligibleForAirdrop();

    // we mint the tokens to the user
    _mint(receiver, airdropAmount);
  }
}
