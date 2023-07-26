const axios = require("axios");
const fs = require("fs");
const path = require("path");

const latestRootFilePath = path.join(__dirname, "latest-root.txt");

const getLatestRoot = (): string => {
  try {
    return fs.readFileSync(latestRootFilePath, "utf-8") as string;
  } catch (e: any) {
    return "";
  }
};

const fetchHub = async () => {
  while (true) {
    try {
      const res = (await axios(
        " https://hub.sismo.io/available-data/gnosis/hydra-s2?latest=true&isOnChain=true"
      )) as { data: { items: [{ identifier: string }] } };
      const root = res.data?.items?.[0].identifier;

      const latestRootSaved = getLatestRoot();

      if (latestRootSaved !== root) {
        fs.writeFileSync(latestRootFilePath, root, { flag: "w" });
        console.log(`New latest root ${root} fetched.`);
      }
    } catch (e) {
      console.error(
        "Error while fetching the latest root for Sismo Connect, you seem to have lost your internet connection."
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
};

fetchHub();

module.exports = { latestRootFilePath, path, getLatestRoot };
