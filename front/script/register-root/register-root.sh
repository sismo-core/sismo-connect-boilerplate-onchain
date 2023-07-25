#!/bin/bash

availableRootsRegistryContractAddress=$1
lastRootOnGnosis=$2

# get the owner of the roots registry contract 
# first remove the 0x prefix, then remove the leading zeros with awk
rootsRegistryContractOwner=$(echo $(cast call "$availableRootsRegistryContractAddress" "owner()") | awk '{sub(/^0x*/,"");}1' | awk '{sub(/^0*/,"");}1')

# impersonate the owner of the roots registry contract
cast rpc anvil_impersonateAccount $rootsRegistryContractOwner

# register the root
cast send $availableRootsRegistryContractAddress 'registerRoot(uint256)' $lastRootOnGnosis --from $rootsRegistryContractOwner --unlocked