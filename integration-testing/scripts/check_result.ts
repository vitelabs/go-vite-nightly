import { expect } from "chai";
import * as vuilder from "@vite/vuilder";
import config from "./vite.config.json";
import resultMeta from "./result.json";

async function run(): Promise<void> {
  const provider = vuilder.newProvider(config.networks.local.http);
  console.log(
    "current snapshotChainHeight",
    await provider.request("ledger_getSnapshotChainHeight")
  );
  const deployer = vuilder.newAccount(
    config.networks.local.mnemonic,
    0,
    provider
  );
  console.log("deployer", deployer.address);
  const balance = await deployer.balance();
  console.log(balance.toString());

  let cnt = 0;
  let result = false;
  while (cnt < 180) {
    const currentHeight = await provider.request(
      "ledger_getSnapshotChainHeight"
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    console.log(
      `snapshot chain height: ${currentHeight}, target height:${resultMeta.height}`
    );
    if (+currentHeight >= resultMeta.height) {
      console.log("result: ", JSON.stringify({ success: true }));
      result = true;
      break;
    }

    cnt++;
  }

  expect(result).to.be.equal(true);
  return;
}

run().then(() => {
  console.log("done");
});
