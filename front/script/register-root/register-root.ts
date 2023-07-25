// Script used to fetch the latest root sent on Gnosis
// and register it in the local fork chain

const { readFileSync } = require("fs");
const { spawnSync } = require("child_process");
const fetchHubExports = require("./fetch-hub");

const registerRoot = (root: string) => {
  const registerRootScriptPath = fetchHubExports.path.join(__dirname, "register-root.sh");
  const child = spawnSync(`${registerRootScriptPath} ${root}`, {
    shell: true,
  });

  if (child.status !== 0) {
    console.error(child.stderr.toString());
    throw new Error("Error while registering root on the local fork");
  }

  console.group(`Root ${root} successfully registered on the local fork`);
};

const main = async () => {
  const root = readFileSync(fetchHubExports.latestRootFilePath, "utf-8") as string;
  console.log(`Registering root ${root} on the local fork...`);
  registerRoot(root === "" ? "0x" : root);
};

main();
