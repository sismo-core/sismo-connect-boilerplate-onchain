const axios = require("axios");
const fs = require("fs");
const path = require("path");

const latestRootFilePath = path.join(__dirname, "latest-root.txt");

const fetchHub = async () => {
  while (true) {
    try {
      const res = (await axios(
        " https://hub.sismo.io/available-data/gnosis/hydra-s2?latest=true&isOnChain=true"
      )) as { data: { items: [{ identifier: string }] } };
      const root = res.data?.items?.[0].identifier;
      const latestRootSaved = fs.readFileSync(latestRootFilePath, "utf-8") as string;
      if (latestRootSaved !== root) {
        fs.writeFileSync(latestRootFilePath, root);
        console.log(`New latest root ${root} on Gnosis`);
      }
    } catch (e) {
      console.error(
        "Error while fetching the latest root on Gnosis network, you seem to have lost your internet connection."
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
};

fetchHub();

module.exports = { latestRootFilePath, path };
