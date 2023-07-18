// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {IAddressesProvider} from "sismo-connect-solidity/SismoConnectLib.sol";

interface IAvailableRootsRegistry {
  event RegisteredRoot(uint256 root);

  function registerRoot(uint256 root) external;

  function owner() external view returns (address);
}

contract BaseTest is Test {
  IAddressesProvider sismoAddressesProvider =
    IAddressesProvider(0x3Cd5334eB64ebBd4003b72022CC25465f1BFcEe6);
  IAvailableRootsRegistry availableRootsRegistry;

  function _registerTreeRoot(uint256 root) internal {
    // get availableRootsRegistry from the sismoAddressesProvider
    availableRootsRegistry = IAvailableRootsRegistry(
      sismoAddressesProvider.get("sismoConnectAvailableRootsRegistry")
    );
    address rootsRegistryOwner = availableRootsRegistry.owner();
    // prank to the rootsRegistryOwner
    vm.startPrank(rootsRegistryOwner);
    availableRootsRegistry.registerRoot(root);
    vm.stopPrank();
  }
}
