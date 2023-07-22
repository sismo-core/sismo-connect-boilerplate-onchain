// Script used to fetch the latest root sent on Gnosis
// and register it in the local fork chain

const axios = require("axios");

const main = async () => {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const res = (await axios(
      " https://hub.sismo.io/available-data/gnosis/hydra-s2?latest=true&isOnChain=true"
    )) as { data: { items: [{ identifier: string }] } };
    const root = res.data?.items?.[0].identifier;
    console.log("Latest Gnosis root:", root);
  }
};

main();
