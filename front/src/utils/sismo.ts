import { DevGroup } from "@sismo-core/sismo-connect-react";

///////////////////

// Replace with your address to become eligible for the airdrops
export const yourAddress = "0x855193BCbdbD346B423FF830b507CBf90ecCc90B"; // <--- Replace with your address

///////////////////

export const devGroups = [
  {
    // Gitcoin Passport group : https://factory.sismo.io/groups-explorer?search=0x1cde61966decb8600dfd0749bd371f12
    groupId: "0x1cde61966decb8600dfd0749bd371f12",
    // data can also be an object with the address as key and the score as value
    // here we give a score to 15 to all addresses to be eligible in the tutorial
    data: {
      // your address is added here so you can test the airdrops
      [yourAddress]: 15,
      "0x2b9b9846d7298e0272c61669a54f0e602aba6290": 15,
      "0xb01ee322c4f028b8a6bfcd2a5d48107dc5bc99ec": 15,
      "0x938f169352008d35e065F153be53b3D3C07Bcd90": 15,
    },
  },
  {
    // Sismo Contributors group : https://factory.sismo.io/groups-explorer?search=0xe9ed316946d3d98dfcd829a53ec9822e
    groupId: "0xe9ed316946d3d98dfcd829a53ec9822e",
    // data can also be an object with the address as key and the score as value
    data: {
      // your address is added here so you can test the airdrops
      [yourAddress]: 3,
      "0x2b9b9846d7298e0272c61669a54f0e602aba6290": 1,
      "0xb01ee322c4f028b8a6bfcd2a5d48107dc5bc99ec": 2,
      "0x938f169352008d35e065F153be53b3D3C07Bcd90": 3,
    },
  },
  {
    // Sismo Lens Followers group : https://factory.sismo.io/groups-explorer?search=0xabf3ea8c23ff96893ac5caf4d2fa7c1f
    groupId: "0xabf3ea8c23ff96893ac5caf4d2fa7c1f",
    // data can also be an object with the address as key and the score as value
    data: {
      // your address is added here so you can test the airdrops
      [yourAddress]: 1,
      "0x2b9b9846d7298e0272c61669a54f0e602aba6290": 1,
      "0xb01ee322c4f028b8a6bfcd2a5d48107dc5bc99ec": 1,
      "0x938f169352008d35e065F153be53b3D3C07Bcd90": 1,
    },
  },
] as DevGroup[];

