import { KVMerkleTree, MerkleTreeData, SNARK_FIELD, buildPoseidon } from "@sismo-core/hydra-s2";
import { devGroups } from "../../front/src/config";
import { exec } from "child_process";
import { encodePacked, stringToHex, toHex } from "viem";

export type OffchainGetAccountsTreeInputs = {
  groupId: string;
  timestamp: number | "latest";
  account: string;
};
export type DevGroup = {
  groupId: string;
  groupTimestamp?: number | "latest";
  data: DevAddresses;
};

export type DevAddresses = string[] | Record<string, Number | BigInt>;

export class DevRegistryTreeReader {
  private _devGroups: DevGroup[];
  constructor({ devGroups }: { devGroups: DevGroup[] }) {
    this._devGroups = devGroups;
  }

  public async getRegistryTree(): Promise<KVMerkleTree> {
    const poseidon = await buildPoseidon();
    const registryTreeData: { [key: string]: string } = {};
    for (const devGroup of this._devGroups) {
      if (!devGroup.groupTimestamp) {
        devGroup.groupTimestamp = "latest";
      }
      const accountsTree = await this.getAccountsTree({
        groupId: devGroup.groupId,
      } as OffchainGetAccountsTreeInputs);

      const accountsTreeValue = this.encodeAccountsTreeValue(
        devGroup.groupId,
        devGroup.groupTimestamp
      );

      registryTreeData[accountsTree.getRoot().toHexString()] = accountsTreeValue;
    }
    const registryTree = new KVMerkleTree(registryTreeData, poseidon, 20);
    return registryTree;
  }

  public async getAccountsTree({ groupId }: OffchainGetAccountsTreeInputs): Promise<KVMerkleTree> {
    const poseidon = await buildPoseidon();
    const devGroup = this._devGroups.find((devGroup) => devGroup.groupId === groupId);

    if (!devGroup) {
      throw new Error(`Dev group ${groupId} not found`);
    }
    let groupData = await this.getAccountsTreeData(devGroup);

    let _accountsTree = new KVMerkleTree(groupData, poseidon, 20);
    return _accountsTree;
  }

  protected async getAccountsTreeData(devGroup: DevGroup): Promise<MerkleTreeData> {
    let groupData: MerkleTreeData = {};

    const devAddresses: DevAddresses = devGroup?.data;

    if (devAddresses?.length) {
      for (const key of devAddresses as string[]) {
        groupData[key.toLowerCase()] = 1;
      }
    }

    if (!devAddresses?.length) {
      groupData = (Object.keys(devAddresses) as string[]).reduce((acc: any, key: any) => {
        acc[key.toLowerCase()] = devAddresses[key as keyof DevAddresses];
        return acc;
      }, {} as { [accountIdentifier: string]: number });
    }

    if (!devGroup.groupTimestamp) {
      devGroup.groupTimestamp = "latest";
    }

    // allow to make sure that each AccountsTree is unique
    const accountsTreeValue = this.encodeAccountsTreeValue(
      devGroup.groupId,
      devGroup.groupTimestamp
    );
    groupData[accountsTreeValue] = 0;

    return groupData;
  }

  protected encodeAccountsTreeValue = (groupId: string, timestamp: number | "latest"): string => {
    if (!timestamp) {
      timestamp = "latest";
    }

    const encodedTimestamp =
      timestamp === "latest"
        ? BigInt(stringToHex("latest", { size: 32 })) >> 128n
        : BigInt(timestamp);

    const groupSnapshotId = encodePacked(
      ["uint128", "uint128"],
      [BigInt(groupId), encodedTimestamp]
    );

    const accountsTreeValue = toHex(BigInt(groupSnapshotId) % BigInt(SNARK_FIELD.toHexString()));
    return accountsTreeValue;
  };
}

const registerRootForDevGroups = async (devGroups: DevGroup[]) => {
  const devRegistryTreeReader = new DevRegistryTreeReader({ devGroups });
  const registryTree = await devRegistryTreeReader.getRegistryTree();
  const registryTreeRoot = registryTree.getRoot().toHexString();
  exec("yarn register-root " + registryTreeRoot);
  process.stdout.write(
    "Successfully registered root " + registryTreeRoot + " on the local anvil fork\n"
  );
};

const main = async () => {
  const onChainDevGroups: DevGroup[] = [];
  // we first register the root for each dev group
  // it will allow us to use only one devGroup in a SismoConfig for example
  for (const devGroup of devGroups) {
    await registerRootForDevGroups([devGroup as DevGroup]);
    onChainDevGroups.push(devGroup as DevGroup);
  }
  // we then register the root for all the dev groups
  // it will allow us to use all the devGroups in a SismoConfig for example
  await registerRootForDevGroups(onChainDevGroups);

  // The best thing to do would be to register the roots for all the combinations of the dev groups
  // but it is quite overkill for this example app that should just work for three examples
  // this script file is really only useful for user that wants to try out this app, and does not reflect the reality
  // of how the registry tree should be used in a real app (since here we recreate it for UX purposes)
};

main();
