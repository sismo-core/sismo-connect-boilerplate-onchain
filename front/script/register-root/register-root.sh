#!/bin/bash

lastRoot=$1

# remove 0x prefix and leading zeros on a hex string
remove_zeros() {
    awk '{sub(/^0x*/, "");}1' | awk '{sub(/^0*/, "");}1'
}

# get the available roots registry contract address
# by calling the get function of the sismoConnectAddressesProvider contract
availableRootsRegistryContractAddress=0x$(echo $(cast call 0x3Cd5334eB64ebBd4003b72022CC25465f1BFcEe6 "get(string)" "sismoConnectAvailableRootsRegistry") | remove_zeros)

# get the owner of the roots registry contract 
# first remove the 0x prefix, then remove the leading zeros with awk
rootsRegistryContractOwner=0x$(echo $(cast call $availableRootsRegistryContractAddress "owner()") | remove_zeros)

# impersonate the owner of the roots registry contract
cast rpc anvil_impersonateAccount $rootsRegistryContractOwner

# register the root
cast send $availableRootsRegistryContractAddress 'registerRoot(uint256)' $lastRoot --from $rootsRegistryContractOwner --unlocked