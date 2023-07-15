import {
  ClaimType,
  AuthType,
  AuthRequest,
  ClaimRequest,
  SismoConnectConfig,
} from "@sismo-core/sismo-connect-client";

export { ClaimType, AuthType };

export const CONFIG: SismoConnectConfig = {
  appId: "0x32403ced4b65f2079eda77c84e7d2be6",
  vault: {
    // For development purposes insert the Data Sources that you want to impersonate
    // Never use this in production
    impersonate: [
      // EVM Data Sources
      "dhadrien.sismo.eth",
      "0xA4C94A6091545e40fc9c3E0982AEc8942E282F38",
      "0x6457c90dd48086b08e22288d6521a251e02d2617",
      // Github Data Source
      "github:dhadrien",
      // Twitter Data Source
      "twitter:dhadrien_",
      // Telegram Data Source
      "telegram:dhadrien",
    ],
  },
  // displayRawResponse: true, // this enables you to get access directly to the
  // Sismo Connect Response in the vault instead of redirecting back to the app
};

export const AUTHS: AuthRequest[] = [
  // Anonymous identifier of the vault for this app
  // vaultId = hash(vaultSecret, appId).
  // full docs: https://docs.sismo.io/sismo-docs/build-with-sismo-connect/technical-documentation/vault-and-proof-identifiers
  { authType: AuthType.VAULT },
  // {
  //   authType: AuthType.EVM_ACCOUNT,
  // },
  { authType: AuthType.GITHUB },
  // { authType: AuthType.TWITTER, isOptional: true },
  // { authType: AuthType.TELEGRAM, userId: "875608110", isOptional: true },
];

export const CLAIMS: ClaimRequest[] = [
  {
    // claim on Sismo Hub GitHub Contributors Data Group membership: https://factory.sismo.io/groups-explorer?search=0xda1c3726426d5639f4c6352c2c976b87
    // Data Group members          = contributors to sismo-core/sismo-hub
    // value for each group member = number of contributions
    // request user to prove membership in the group
    groupId: "0xda1c3726426d5639f4c6352c2c976b87", // impersonated github:dhadrien has 1 contribution, eligible
  },
  {
    // claim ENS DAO Voters Data Group membership: https://factory.sismo.io/groups-explorer?search=0x85c7ee90829de70d0d51f52336ea4722
    // Data Group members          = voters in ENS DAO
    // value for each group member = number of votes in ENS DAO
    // request user to prove membership in the group with value >= 17
    groupId: "0x85c7ee90829de70d0d51f52336ea4722",
    claimType: ClaimType.GTE,
    value: 4, // impersonated dhadrien.sismo.eth has 17 votes, eligible
  },
  {
    // claim on Stand with Crypto NFT Minters Data Group membership: https://factory.sismo.io/groups-explorer?search=0xfae674b6cba3ff2f8ce2114defb200b1
    // Data Group members          = minters of the Stand with Crypto NFT
    // value for each group member = number of NFT minted
    // request user to prove membership in the group with value = 10
    groupId: "0xfae674b6cba3ff2f8ce2114defb200b1",
    claimType: ClaimType.EQ,
    value: 10, // dhadrin.sismo.eth minted exactly 10, eligible
  },
  // {
  //   // claim Gitcoin Passport Holders Data Group membership: https://factory.sismo.io/groups-explorer?search=0x1cde61966decb8600dfd0749bd371f12
  //   // Data Group members          = Gitcoin Passport Holders
  //   // value for each group member = Gitcoin Passport Score
  //   // request user to prove membership in the group with value > 15, user can reveal more if they want
  //   groupId: "0x1cde61966decb8600dfd0749bd371f12",
  //   claimType: ClaimType.GTE,
  //   value: 15, // dhadrien.sismo.eth has a score of 46, eligible. Can reveal more.
  //   isSelectableByUser: true, // can reveal more than 15 if they want
  // },
  // {
  //   // claim on Stand with Crypto NFT Minters Data Group membership: https://factory.sismo.io/groups-explorer?search=0xfae674b6cba3ff2f8ce2114defb200b1
  //   // optional request user to prove membership in the group with value >= 6
  //   groupId: "0xfae674b6cba3ff2f8ce2114defb200b1",
  //   claimType: ClaimType.GTE,
  //   value: 6, // dhadrien.sismo.eth minted 10 NFTs, eligible
  //   isOptional: true,
  // },
  // {
  //   // claim on Gitcoin Passport Holders Data Group membership: https://factory.sismo.io/groups-explorer?search=0x1cde61966decb8600dfd0749bd371f12
  //   // optional request user to prove membership in the group with value = 15
  //   groupId: "0x1cde61966decb8600dfd0749bd371f12",
  //   claimType: ClaimType.EQ,
  //   value: 15, // dhadrien.sismo.eth has a score of 46 != 15, not eligible.
  //   isOptional: true, // can chose not to reveal
  // },
  // {
  //   // claim on Sismo Hub GitHub Contributors Data Group membership: https://factory.sismo.io/groups-explorer?search=0xda1c3726426d5639f4c6352c2c976b87
  //   // optional request user to prove membership in the group and reveal any value they want
  //   groupId: "0xda1c3726426d5639f4c6352c2c976b87",
  //   claimType: ClaimType.GTE,
  //   value: 1,
  //   isSelectableByUser: true, // can selectively discloe more if user wants
  //   isOptional: true, // can chose not to reveal
  // },
];
