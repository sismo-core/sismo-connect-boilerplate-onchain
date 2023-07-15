// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "sismo-connect-solidity/SismoLib.sol";
import {SismoConnectConfigReader} from "./utils/SismoConnectConfigReader.sol";
import {Airdrop} from "src/Airdrop.sol";

contract DeployAirdrop is Script, SismoConnectConfigReader {
  using stdJson for string;

  function run() public {
    console.log("Deploying Airdrop contract");
    string memory json = vm.readFile(string.concat(vm.projectRoot(), "/sismo-connect-config.json"));
    (
      bytes16 appId,
      AuthRequest[] memory authRequests,
      ClaimRequest[] memory claimRequests,
      bool isImpersonationMode
    ) = readSismoConnectRequest(json);

    vm.startBroadcast();
    new Airdrop("my Airdrop", "AIR", appId, isImpersonationMode, authRequests, claimRequests);
    vm.stopBroadcast();
  }
}
