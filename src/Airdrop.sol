// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/console.sol";
import "sismo-connect-solidity/SismoLib.sol"; // <--- add a Sismo Connect import

/*
 * @title Airdrop
 * @author Sismo
 * @dev Simple Airdrop contract that mints ERC20 tokens to a receiver
 * This contract is used for tutorial purposes only
 * It will be used to demonstrate how to integrate Sismo Connect
 */
contract Airdrop is SismoConnect {
  using SismoConnectHelper for SismoConnectVerifiedResult;

  // reference your appId
  bytes16 private _appId = 0x32403ced4b65f2079eda77c84e7d2be6;

  // allow impersonation

  constructor()
    // use buildConfig helper to easily build a Sismo Connect config in Solidity
    SismoConnect(buildConfig({appId: _appId, isImpersonationMode: true}))
  {}

  uint256 public number = 0;

  event Transfer(address indexed from, address indexed to, uint256 value);

  function setNumber(uint256 newNumber) public {
    number = newNumber;
  }

  function increment() public {
    number++;
  }

  function verifySismoConnectResponse(bytes memory response) public {
    // Recreate the request made in the fontend to verify the proof
    // We will verify the Sismo Connect Response containing the ZK Proofs against it
    AuthRequest[] memory auths = new AuthRequest[](6);
    auths[0] = _authRequestBuilder.build({authType: AuthType.VAULT});
    auths[1] = _authRequestBuilder.build({authType: AuthType.EVM_ACCOUNT});
    auths[2] = _authRequestBuilder.build({
      authType: AuthType.EVM_ACCOUNT,
      userId: uint160(0xA4C94A6091545e40fc9c3E0982AEc8942E282F38)
    });
    auths[3] = _authRequestBuilder.build({authType: AuthType.GITHUB});
    auths[4] = _authRequestBuilder.build({
      authType: AuthType.TWITTER,
      userId: 295218901,
      isOptional: true,
      isSelectableByUser: false
    });
    auths[5] = _authRequestBuilder.build({
      authType: AuthType.TELEGRAM,
      userId: 875608110,
      isOptional: true,
      isSelectableByUser: false
    });

    ClaimRequest[] memory claims = new ClaimRequest[](7);
    claims[0] = _claimRequestBuilder.build({groupId: 0xda1c3726426d5639f4c6352c2c976b87});
    claims[1] = _claimRequestBuilder.build({
      groupId: 0x85c7ee90829de70d0d51f52336ea4722,
      claimType: ClaimType.GTE,
      value: 4
    });
    claims[2] = _claimRequestBuilder.build({
      groupId: 0xfae674b6cba3ff2f8ce2114defb200b1,
      claimType: ClaimType.EQ,
      value: 10
    });
    claims[3] = _claimRequestBuilder.build({
      groupId: 0x1cde61966decb8600dfd0749bd371f12,
      claimType: ClaimType.EQ,
      value: 15,
      isSelectableByUser: true,
      isOptional: true
    });
    claims[4] = _claimRequestBuilder.build({
      groupId: 0xfae674b6cba3ff2f8ce2114defb200b1,
      claimType: ClaimType.GTE,
      value: 6,
      isOptional: true,
      isSelectableByUser: true
    });
    claims[5] = _claimRequestBuilder.build({
      groupId: 0x1cde61966decb8600dfd0749bd371f12,
      claimType: ClaimType.EQ,
      value: 15,
      isOptional: true,
      isSelectableByUser: true
    });
    claims[6] = _claimRequestBuilder.build({
      groupId: 0xda1c3726426d5639f4c6352c2c976b87,
      claimType: ClaimType.GTE,
      value: 1,
      isSelectableByUser: true,
      isOptional: true
    });

    SismoConnectVerifiedResult memory result = verify({
      responseBytes: response,
      auths: auths,
      claims: claims,
      signature: _signatureBuilder.build({message: abi.encode("I love Sismo!")})
    });

    uint256 vaultId = SismoConnectHelper.getUserId(result, AuthType.VAULT);
    uint256 githubId = SismoConnectHelper.getUserId(result, AuthType.GITHUB);
    uint256 telegramId = SismoConnectHelper.getUserId(result, AuthType.TELEGRAM);
    uint256[] memory evmAccountIds = SismoConnectHelper.getUserIds(result, AuthType.EVM_ACCOUNT);

    console.logBytes16(result.appId);
    console.log("Vault ID: %s", vaultId);
    console.log("Github ID: %s", githubId);
    console.log("Telegram ID: %s", telegramId);
    console.log("First EVM Account ID: %s", evmAccountIds[0]);
    console.log("Second EVM Account ID: %s", evmAccountIds[1]);
  }
}
