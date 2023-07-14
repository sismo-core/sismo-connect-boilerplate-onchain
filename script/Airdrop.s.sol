// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {Airdrop} from "src/Airdrop.sol";

contract DeployAirdrop is Script {
  // the appId from the Sismo Connect App we want to use
  bytes16 public constant APP_ID = 0xf4977993e52606cfd67b7a1cde717069;
  bool public constant IS_IMPERSONATION = true; // <--- set to true to allow verifying proofs from impersonated accounts

  function run() public {
    vm.startBroadcast();
    new Airdrop("my Airdrop", "AIR", APP_ID, IS_IMPERSONATION);
    vm.stopBroadcast();
  }
}
