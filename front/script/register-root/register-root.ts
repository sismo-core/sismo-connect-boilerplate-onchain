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
  let root = fetchHubExports.getLatestRoot();
  console.log(`Registering root ${root} on the local fork...`);
  registerRoot(root === "" ? "0x" : root);
};

main();
