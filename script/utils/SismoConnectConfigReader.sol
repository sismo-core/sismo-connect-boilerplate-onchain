// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";
import "sismo-connect-solidity/SismoLib.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract SismoConnectConfigReader is Script {
  using stdJson for string;
  AuthRequestBuilder public authrequestBuilder = new AuthRequestBuilder();
  ClaimRequestBuilder public claimrequestBuilder = new ClaimRequestBuilder();

  address public constant PROXY_ADMIN = 0x2110475dfbB8d331b300178A867372991ff35fA3;

  function readSismoConnectRequest(
    string memory json
  ) public returns (bytes16, AuthRequest[] memory, ClaimRequest[] memory, bool) {
    bytes16 appId = bytes16(json.readBytes(string.concat(".appId")));
    AuthRequest[] memory authRequests = readAuthRequests(json);
    ClaimRequest[] memory claimRequests = readClaimRequests(json);
    bool isImpersonationMode = _tryReadBool(json, ".isImpersonationMode");

    return (appId, authRequests, claimRequests, isImpersonationMode);
  }

  function readAuthRequests(string memory json) public virtual returns (AuthRequest[] memory) {
    uint256 nbOfAuthRequests = json.readStringArray(".authRequests").length;
    AuthRequest[] memory authRequests = new AuthRequest[](nbOfAuthRequests);
    for (uint256 i = 0; i < nbOfAuthRequests; i++) {
      string memory baseKey = string.concat(".authRequests[", Strings.toString(i), "].");
      AuthType authType = AuthType(_tryReadUint8(json, string.concat(baseKey, "authType")));
      uint256 userId = _tryReadUint(json, string.concat(baseKey, "userId"));
      authRequests[i] = authrequestBuilder.build({
        authType: authType,
        userId: userId,
        isAnon: _tryReadBool(json, string.concat(baseKey, "isAnon")),
        isOptional: _tryReadBool(json, string.concat(baseKey, "isOptional")),
        isSelectableByUser: _tryIsSelectableByUserForAuthRequest(
          json,
          string.concat(baseKey, "isSelectableByUser"),
          authType,
          userId
        ),
        extraData: _tryReadBytes(json, string.concat(baseKey, "extraData"))
      });
    }
    return authRequests;
  }

  function readClaimRequests(string memory json) public returns (ClaimRequest[] memory) {
    uint256 nbOfClaims = json.readStringArray(".claimRequests").length;
    ClaimRequest[] memory claimRequests = new ClaimRequest[](nbOfClaims);
    for (uint256 i = 0; i < nbOfClaims; i++) {
      string memory baseKey = string.concat(".claimRequests[", Strings.toString(i), "].");
      claimRequests[i] = claimrequestBuilder.build({
        groupId: bytes16(json.readBytes(string.concat(baseKey, "groupId"))),
        claimType: ClaimType(_tryReadUint8(json, string.concat(baseKey, "claimType"))),
        groupTimestamp: _tryReadUint(json, string.concat(baseKey, "groupTimestamp")) == 0
          ? bytes16("latest")
          : bytes16(uint128(_tryReadUint(json, string.concat(baseKey, "groupTimestamp")))),
        // default value to 1 if not specified
        value: _tryReadUint(json, string.concat(baseKey, "value")) == 0
          ? 1
          : _tryReadUint(json, string.concat(baseKey, "value")),
        isOptional: _tryReadBool(json, string.concat(baseKey, "isOptional")),
        isSelectableByUser: _tryIsSelectableByUserForClaimRequest(
          json,
          string.concat(baseKey, "isSelectableByUser")
        ),
        extraData: _tryReadBytes(json, string.concat(baseKey, "extraData"))
      });
    }
    return claimRequests;
  }

  // default value is true for isSelectableByUser field in ClaimRequest, that is why we need this fucntion instead of using _tryReadBool
  function _tryIsSelectableByUserForClaimRequest(
    string memory json,
    string memory key
  ) internal returns (bool) {
    try vm.parseJsonBool(json, key) returns (bool boolean) {
      return boolean;
    } catch {
      return true;
    }
  }

  function _tryIsSelectableByUserForAuthRequest(
    string memory json,
    string memory key,
    AuthType authType,
    uint256 requestedUserId
  ) internal returns (bool) {
    try vm.parseJsonBool(json, key) returns (bool boolean) {
      return boolean;
    } catch {
      return _defaultIsSelectableByUserForAuthRequest(authType, requestedUserId);
    }
  }

  function _defaultIsSelectableByUserForAuthRequest(
    AuthType authType,
    uint256 requestedUserId
  ) internal pure returns (bool) {
    // isSelectableByUser value should always be false in case of VAULT authType.
    // This is because the user can't select the account they want to use for the app.
    // the userId = Hash(VaultSecret, AppId) in the case of VAULT authType.
    if (authType == AuthType.VAULT) {
      return false;
    }
    // When `requestedUserId` is 0, it means no specific auth account is requested by the app,
    // so we want the default value for `isSelectableByUser` to be `true`.
    if (requestedUserId == 0) {
      return true;
    }
    // When `requestedUserId` is not 0, it means a specific auth account is requested by the app,
    // so we want the default value for `isSelectableByUser` to be `false`.
    else {
      return false;
    }
    // However, the dev can still override this default value by setting `isSelectableByUser` to `true`.
  }

  function _tryReadUint8(string memory json, string memory key) internal returns (uint8) {
    try vm.parseJsonUint(json, key) returns (uint256 value) {
      return uint8(value);
    } catch {
      return 0;
    }
  }

  function _tryReadUint(string memory json, string memory key) internal returns (uint256) {
    try vm.parseJsonUint(json, key) returns (uint256 value) {
      return value;
    } catch {
      return 0;
    }
  }

  function _tryReadBool(string memory json, string memory key) internal returns (bool) {
    try vm.parseJsonBool(json, key) returns (bool boolean) {
      return boolean;
    } catch {
      return false;
    }
  }

  function _tryReadString(string memory json, string memory key) internal returns (string memory) {
    try vm.parseJsonString(json, key) returns (string memory value) {
      return value;
    } catch {
      return "";
    }
  }

  function _tryReadBytes(string memory json, string memory key) internal returns (bytes memory) {
    try vm.parseJsonBytes(json, key) returns (bytes memory extraData) {
      return extraData;
    } catch {
      return "";
    }
  }

  function _compareStrings(string memory a, string memory b) internal pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }
}
