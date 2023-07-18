// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "sismo-connect-solidity/SismoLib.sol";
import {Airdrop} from "src/Airdrop.sol";

contract DeployAirdrop is Script {
  function run() public {
    console.log("Deploying Airdrop contract...");

    vm.startBroadcast();
    new Airdrop("my Airdrop", "AIR");
    vm.stopBroadcast();
  }
}
