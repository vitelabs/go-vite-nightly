import { expect } from "chai";
const vuilder = require("@vite/vuilder");
import config from "./vite.config.json";
import resultMeta from "./result.json";

async function run(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 10000); //10s
  });

  const provider = vuilder.newProvider(config.networks.local.http);
  console.log('current snapshotChainHeight', await provider.request("ledger_getSnapshotChainHeight"));
  const deployer = vuilder.newAccount(config.networks.local.mnemonic, 0, provider);
  console.log('deployer', deployer.address);
  const balance = await deployer.balance();
  console.log(balance.toString());

  let cnt = 0;
  while (cnt < 180) {
    const currentHeight = await provider.request(
      "ledger_getSnapshotChainHeight"
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    if (+currentHeight >= resultMeta.height) {
      console.log("result: ", JSON.stringify({ success: true }));
      break;
    }

    cnt++;
  }

  if (cnt >= 180) {
    console.log("result: ", JSON.stringify({ success: false }));
  }

  return;
}

run().then(() => {
  console.log("done");
});
